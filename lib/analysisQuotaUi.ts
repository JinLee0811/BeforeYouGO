import type { AnalysisQuotaState } from "@/hooks/useAnalysisQuota";

/** Search / my page: show free-tier quota strips (not admin, not loading, has a finite quota). */
export function shouldShowFreeTierQuotaBanners(
  user: unknown,
  isUserLoading: boolean,
  analysisAdmin: boolean,
  quota: AnalysisQuotaState
): boolean {
  return (
    !!user &&
    !isUserLoading &&
    !analysisAdmin &&
    !quota.loading &&
    quota.unlimited === false
  );
}

/** Snapshot read failed (e.g. RLS) — not “used all free analyses”. */
export function isAnalysisQuotaUnavailable(quota: AnalysisQuotaState): boolean {
  return (
    !quota.loading &&
    quota.unlimited === false &&
    "quotaUnavailable" in quota &&
    quota.quotaUnavailable === true
  );
}

/** Free-tier quota with a readable snapshot (remaining/used are meaningful). */
export function isAnalysisQuotaNormal(
  quota: AnalysisQuotaState
): quota is Extract<AnalysisQuotaState, { unlimited: false }> {
  return !quota.loading && quota.unlimited === false && !isAnalysisQuotaUnavailable(quota);
}
