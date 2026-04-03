-- Applied via Supabase (analysis quota). Matches lib/apiUsageQuota expectations.
create table if not exists public.user_api_usage (
  user_id uuid not null primary key references auth.users (id) on delete cascade,
  analysis_requests integer not null default 0,
  updated_at timestamptz not null default now()
);

create index if not exists user_api_usage_user_id_idx on public.user_api_usage (user_id);

alter table public.user_api_usage enable row level security;

comment on table public.user_api_usage is 'Per-user analysis API call count (apiUsageQuota)';
