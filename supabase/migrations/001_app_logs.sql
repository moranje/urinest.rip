-- App logs table for persisting client-side errors
create table if not exists app_logs (
  id bigint generated always as identity primary key,
  level text not null check (level in ('warn', 'error')),
  module text not null,
  message text not null,
  detail jsonb,
  context jsonb,
  session_id text,
  url text,
  fingerprint text not null,
  created_at timestamptz not null default now()
);

-- Indexes for dashboard queries
create index idx_app_logs_created_at on app_logs (created_at desc);
create index idx_app_logs_level_created on app_logs (level, created_at desc);
create index idx_app_logs_fingerprint_created on app_logs (fingerprint, created_at desc);

-- RLS: anyone can INSERT (anonymous users), only admin can SELECT
alter table app_logs enable row level security;

create policy "Anyone can insert logs"
  on app_logs for insert
  with check (true);

create policy "Authenticated users can read logs"
  on app_logs for select
  using (auth.role() = 'authenticated');

-- Auto-cleanup: delete rows older than 30 days (1% probability per insert)
create or replace function cleanup_old_logs()
returns trigger as $$
begin
  if random() < 0.01 then
    delete from app_logs where created_at < now() - interval '30 days';
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_cleanup_old_logs
  after insert on app_logs
  for each row execute function cleanup_old_logs();
