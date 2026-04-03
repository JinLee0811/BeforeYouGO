-- 일일 분석 쿼터: analysis_requests 는 analysis_quota_day 당일에만 유효, 날짜가 바뀌면 카운트는 0부터
alter table public.user_api_usage
  add column if not exists analysis_quota_day date;

comment on column public.user_api_usage.analysis_requests is
  'analysis_quota_day 가 오늘(쿼터 기준일)일 때만 유효한 당일 호출 수';
comment on column public.user_api_usage.analysis_quota_day is
  '쿼터 기준 달력 날짜(앱은 UTC 또는 ANALYSIS_QUOTA_TIMEZONE). 전날이면 클라이언트/서버에서 당일 사용량 0으로 간주';

-- 기존 누적 카운트는 일일제로 전환하면서 초기화(한 번만)
update public.user_api_usage
set
  analysis_requests = 0,
  analysis_quota_day = null
where analysis_quota_day is null;
