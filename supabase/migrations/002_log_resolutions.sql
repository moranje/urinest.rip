-- Log resolutions table for tracking error group status
create table if not exists log_resolutions (
  fingerprint text primary key,
  status text not null default 'open' check (status in ('open', 'resolved', 'suppressed')),
  resolved_in_version text,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS: admin-only CRUD
alter table log_resolutions enable row level security;

create policy "Authenticated users can manage resolutions"
  on log_resolutions for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
