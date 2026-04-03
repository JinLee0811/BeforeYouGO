-- Supabase SQL Editor에서 한 번 실행 (분석 쿼터용)
-- 실패 메시지 "Failed to read quota usage." 는 보통 이 테이블이 없을 때 납니다.

create table if not exists public.user_api_usage (
  user_id uuid not null primary key references auth.users (id) on delete cascade,
  analysis_requests integer not null default 0,
  analysis_quota_day date,
  updated_at timestamptz not null default now()
);

create index if not exists user_api_usage_user_id_idx on public.user_api_usage (user_id);

alter table public.user_api_usage enable row level security;

-- 서버는 SUPABASE_SERVICE_ROLE_KEY 로 접근하므로 RLS 우회.
-- 클라이언트(anon)에서 직접 쓸 경우에만 아래 정책을 추가하면 됩니다.

comment on table public.user_api_usage is '사용자별 분석 API 일일 호출 횟수 (apiUsageQuota; analysis_quota_day 기준 자정 갱신)';
comment on column public.user_api_usage.analysis_quota_day is '이 행의 analysis_requests 가 적용되는 달력 날짜(서버: UTC 또는 ANALYSIS_QUOTA_TIMEZONE)';

-- JWT(anon + 사용자 세션)만 쓸 때 필수: RLS만 켜 두면 조회/upsert가 막혀 신규 유저도 "한도 소진"처럼 보일 수 있음
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
