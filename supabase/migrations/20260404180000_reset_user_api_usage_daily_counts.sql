-- One-time reset: daily counters to zero (redundant if you already ran 20260405120000_user_api_usage_rls_policies_and_reset.sql).
UPDATE public.user_api_usage
SET
  analysis_requests = 0,
  analysis_quota_day = NULL,
  updated_at = now();
