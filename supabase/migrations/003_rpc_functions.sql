-- RPC: Get grouped logs with counts, first/last seen
create or replace function get_grouped_logs(
  p_hours int default 24,
  p_level text default null,
  p_status text default 'open'
)
returns table (
  fingerprint text,
  level text,
  module text,
  message text,
  count bigint,
  first_seen timestamptz,
  last_seen timestamptz,
  status text,
  resolved_in_version text,
  note text
)
language sql stable
as $$
  select
    l.fingerprint,
    l.level,
    l.module,
    l.message,
    count(*)::bigint as count,
    min(l.created_at) as first_seen,
    max(l.created_at) as last_seen,
    coalesce(r.status, 'open') as status,
    r.resolved_in_version,
    r.note
  from app_logs l
  left join log_resolutions r on r.fingerprint = l.fingerprint
  where l.created_at > now() - make_interval(hours => p_hours)
    and (p_level is null or l.level = p_level)
    and coalesce(r.status, 'open') = p_status
  group by l.fingerprint, l.level, l.module, l.message,
           r.status, r.resolved_in_version, r.note
  order by max(l.created_at) desc;
$$;

-- RPC: Get recent individual log events for a fingerprint
create or replace function get_recent_logs(
  p_fingerprint text,
  p_limit int default 20
)
returns table (
  id bigint,
  level text,
  module text,
  message text,
  detail jsonb,
  context jsonb,
  session_id text,
  url text,
  created_at timestamptz
)
language sql stable
as $$
  select
    id, level, module, message, detail, context,
    session_id, url, created_at
  from app_logs
  where fingerprint = p_fingerprint
  order by created_at desc
  limit p_limit;
$$;
