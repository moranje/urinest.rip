-- Backfill source discriminator for existing app_logs tables.
alter table app_logs
  add column if not exists source text not null default 'urinestrip';

create index if not exists idx_app_logs_source_created
  on app_logs (source, created_at desc);

alter table app_logs
  drop constraint if exists app_logs_level_check;

alter table app_logs
  add constraint app_logs_level_check check (level in ('info', 'warn', 'error'));
