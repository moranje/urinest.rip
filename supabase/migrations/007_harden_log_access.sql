-- Harden app log access and ingestion.
-- Admin reads are restricted to an explicit allowlist or JWT admin claim.
-- Anonymous clients can no longer insert directly; they call a validated RPC.

create table if not exists app_admins (
  email text primary key,
  created_at timestamptz not null default now()
);

alter table app_admins enable row level security;

create or replace function is_app_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce(auth.jwt() ->> 'role', '') = 'service_role'
    or lower(coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '')) = 'admin'
    or lower(coalesce(auth.jwt() -> 'app_metadata' ->> 'admin', '')) in ('true', '1', 'yes')
    or exists (
      select 1
      from app_admins
      where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    );
$$;

drop policy if exists "Admins can manage admin allowlist" on app_admins;
create policy "Admins can manage admin allowlist"
  on app_admins for all
  using (is_app_admin())
  with check (is_app_admin());

create table if not exists app_log_ingest_limits (
  bucket text primary key,
  window_start timestamptz not null,
  event_count int not null
);

alter table app_log_ingest_limits enable row level security;
revoke all on app_log_ingest_limits from anon, authenticated;

drop policy if exists "Anyone can insert logs" on app_logs;
drop policy if exists "Authenticated users can read logs" on app_logs;
drop policy if exists "Admins can read logs" on app_logs;
drop policy if exists "Service role can insert logs" on app_logs;

create policy "Admins can read logs"
  on app_logs for select
  using (is_app_admin());

create policy "Service role can insert logs"
  on app_logs for insert
  with check (coalesce(auth.jwt() ->> 'role', '') = 'service_role');

drop policy if exists "Authenticated users can manage resolutions" on log_resolutions;
drop policy if exists "Admins can manage resolutions" on log_resolutions;

create policy "Admins can manage resolutions"
  on log_resolutions for all
  using (is_app_admin())
  with check (is_app_admin());

drop function if exists get_grouped_logs(int, text, text);
drop function if exists get_recent_logs(text, int);

create or replace function insert_app_logs(p_logs jsonb)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
  v_headers jsonb := '{}'::jsonb;
  v_client_key text;
  v_bucket text;
  v_limit app_log_ingest_limits%rowtype;
  v_entry jsonb;
  v_level text;
  v_module text;
  v_message text;
  v_source text;
  v_fingerprint text;
begin
  if p_logs is null or jsonb_typeof(p_logs) <> 'array' then
    raise exception 'p_logs must be a json array' using errcode = '22023';
  end if;

  v_count := jsonb_array_length(p_logs);
  if v_count = 0 then
    return 0;
  end if;
  if v_count > 20 then
    raise exception 'log batch too large' using errcode = '22023';
  end if;

  begin
    v_headers := nullif(current_setting('request.headers', true), '')::jsonb;
  exception when others then
    v_headers := '{}'::jsonb;
  end;

  v_client_key := coalesce(
    v_headers ->> 'cf-connecting-ip',
    split_part(coalesce(v_headers ->> 'x-forwarded-for', ''), ',', 1),
    auth.uid()::text,
    'anonymous'
  );
  v_bucket := md5('urinestrip:' || v_client_key);

  insert into app_log_ingest_limits (bucket, window_start, event_count)
  values (v_bucket, date_trunc('minute', now()), v_count)
  on conflict (bucket) do update
    set
      window_start = case
        when app_log_ingest_limits.window_start < now() - interval '1 minute'
          then date_trunc('minute', now())
        else app_log_ingest_limits.window_start
      end,
      event_count = case
        when app_log_ingest_limits.window_start < now() - interval '1 minute'
          then excluded.event_count
        else app_log_ingest_limits.event_count + excluded.event_count
      end
  returning * into v_limit;

  if v_limit.event_count > 120 then
    raise exception 'log ingest rate limit exceeded' using errcode = '57014';
  end if;

  for v_entry in select value from jsonb_array_elements(p_logs)
  loop
    if jsonb_typeof(v_entry) <> 'object' then
      raise exception 'log entry must be an object' using errcode = '22023';
    end if;
    if octet_length(v_entry::text) > 32768 then
      raise exception 'log entry too large' using errcode = '22023';
    end if;

    v_level := v_entry ->> 'level';
    v_module := v_entry ->> 'module';
    v_message := v_entry ->> 'message';
    v_source := coalesce(v_entry ->> 'source', 'urinestrip');
    v_fingerprint := v_entry ->> 'fingerprint';

    if v_level not in ('info', 'warn', 'error') then
      raise exception 'invalid log level' using errcode = '22023';
    end if;
    if v_source <> 'urinestrip' then
      raise exception 'invalid log source' using errcode = '22023';
    end if;
    if coalesce(length(v_module), 0) = 0 or length(v_module) > 128 then
      raise exception 'invalid log module' using errcode = '22023';
    end if;
    if coalesce(length(v_message), 0) = 0 or length(v_message) > 512 then
      raise exception 'invalid log message' using errcode = '22023';
    end if;
    if coalesce(length(v_fingerprint), 0) = 0 or length(v_fingerprint) > 128 then
      raise exception 'invalid log fingerprint' using errcode = '22023';
    end if;

    insert into app_logs (
      level,
      module,
      message,
      detail,
      context,
      source,
      session_id,
      url,
      fingerprint,
      created_at
    )
    values (
      v_level,
      v_module,
      v_message,
      v_entry -> 'detail',
      v_entry -> 'context',
      v_source,
      nullif(left(coalesce(v_entry ->> 'session_id', ''), 128), ''),
      nullif(left(coalesce(v_entry ->> 'url', ''), 2048), ''),
      v_fingerprint,
      now()
    );
  end loop;

  return v_count;
end;
$$;

revoke execute on function insert_app_logs(jsonb) from public;
grant execute on function insert_app_logs(jsonb) to anon, authenticated;

revoke execute on function get_grouped_logs_by_source(text, int, text, text) from public, anon;
revoke execute on function get_recent_logs_by_source(text, text, int) from public, anon;
grant execute on function get_grouped_logs_by_source(text, int, text, text) to authenticated;
grant execute on function get_recent_logs_by_source(text, text, int) to authenticated;
