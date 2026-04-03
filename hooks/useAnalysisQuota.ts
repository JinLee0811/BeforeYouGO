import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";

export type AnalysisQuotaState =
  | { loading: true; unlimited?: undefined; limit?: undefined; used?: undefined; remaining?: undefined }
  | { loading: false; unlimited: true }
  | {
      loading: false;
      unlimited: false;
      limit: number;
      used: number;
      remaining: number;
      quotaUnavailable?: boolean;
    }
  | { loading: false; unlimited: undefined };

/**
 * 무료 분석 한도 표시용. 성공 시 `byg:analysis-quota-refresh` 이벤트로 갱신
 */
export function useAnalysisQuota(
  user: User | null,
  analysisAdmin: boolean,
  isUserLoading: boolean
) {
  const [state, setState] = useState<AnalysisQuotaState>({ loading: true });

  const refresh = useCallback(async () => {
    if (isUserLoading) return;
    if (!user) {
      setState({ loading: false, unlimited: undefined });
      return;
    }
    if (analysisAdmin) {
      setState({ loading: false, unlimited: true });
      return;
    }
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setState({ loading: false, unlimited: undefined });
        return;
      }
      const res = await fetch("/api/me/analysis-quota", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setState({ loading: false, unlimited: undefined });
        return;
      }
      const data = (await res.json()) as
        | { unlimited: true }
        | {
            unlimited: false;
            limit: number;
            used: number;
            remaining: number;
            quotaUnavailable?: boolean;
          };
      if (data.unlimited) {
        setState({ loading: false, unlimited: true });
      } else {
        setState({
          loading: false,
          unlimited: false,
          limit: data.limit,
          used: data.used,
          remaining: data.remaining,
          ...(data.quotaUnavailable ? { quotaUnavailable: true } : {}),
        });
      }
    } catch {
      setState({ loading: false, unlimited: undefined });
    }
  }, [user, analysisAdmin, isUserLoading]);

  useEffect(() => {
    if (isUserLoading) {
      setState({ loading: true });
      return;
    }
    void refresh();
  }, [refresh, isUserLoading, user?.id]);

  useEffect(() => {
    const onRefresh = () => void refresh();
    window.addEventListener("byg:analysis-quota-refresh", onRefresh);
    return () => window.removeEventListener("byg:analysis-quota-refresh", onRefresh);
  }, [refresh]);

  return { quota: state, refresh };
}
