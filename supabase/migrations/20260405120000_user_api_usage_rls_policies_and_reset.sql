-- user_api_usage had RLS on with no policies for end users. Requests using the anon key + user JWT
-- then failed the SELECT, and the app interpreted that as "fully used" for every non-admin (incl. new signups).
-- Service role still bypasses RLS; this fixes JWT-only server setups.

-- App expects daily quota columns (may be missing if only older migrations ran)
alter table public.user_api_usage
  add column if not exists analysis_quota_day date;

alter table public.user_api_usage
  add column if not exists updated_at timestamptz not null default now();

comment on column public.user_api_usage.analysis_requests is
  'analysis_quota_day 가 오늘(쿼터 기준일)일 때만 유효한 당일 호출 수';
comment on column public.user_api_usage.analysis_quota_day is
  '쿼터 기준 달력 날짜(앱은 UTC 또는 ANALYSIS_QUOTA_TIMEZONE). 전날이면 당일 사용량 0으로 간주';

grant select, insert, update on public.user_api_usage to authenticated;

drop policy if exists "user_api_usage_select_own" on public.user_api_usage;
drop policy if exists "user_api_usage_insert_own" on public.user_api_usage;
drop policy if exists "user_api_usage_update_own" on public.user_api_usage;

create policy "user_api_usage_select_own"
  on public.user_api_usage for select to authenticated
  using (auth.uid() = user_id);

create policy "user_api_usage_insert_own"
  on public.user_api_usage for insert to authenticated
  with check (auth.uid() = user_id);

create policy "user_api_usage_update_own"
  on public.user_api_usage for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Everyone starts with a full daily allowance again
update public.user_api_usage
set
  analysis_requests = 0,
  analysis_quota_day = null,
  updated_at = now();
