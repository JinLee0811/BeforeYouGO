import { useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { useUser } from "@/hooks/useUser";
import { useMyPageData } from "@/hooks/useMyPageData";
import { useAnalysisQuota } from "@/hooks/useAnalysisQuota";
import { MyPageProfileHeader } from "@/components/mypage/MyPageProfileHeader";
import { MyPageQuotaSection } from "@/components/mypage/MyPageQuotaSection";
import { MyPagePlaceHistoryPanel } from "@/components/mypage/MyPagePlaceHistoryPanel";

/**
 * Logged-in user: profile, daily analysis quota, and restaurants they opened.
 */
export default function MyPage() {
  const router = useRouter();
  const { user, isLoading, analysisAdmin } = useUser();
  const { quota } = useAnalysisQuota(user, analysisAdmin, isLoading);

  const { profile, setProfile, placeClicks, loading, error: loadError, fetchUserData } = useMyPageData(user);

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      void router.replace("/search");
      return;
    }
    void fetchUserData();
  }, [user, isLoading, router, fetchUserData]);

  const onHistoryRefresh = useCallback(() => {
    if (user) void fetchUserData();
  }, [user, fetchUserData]);

  useEffect(() => {
    window.addEventListener("byg:place-history-refresh", onHistoryRefresh);
    return () => window.removeEventListener("byg:place-history-refresh", onHistoryRefresh);
  }, [onHistoryRefresh]);

  if (isLoading) {
    return (
      <div className='flex min-h-screen items-center justify-center' role='status' aria-label='Loading'>
        <div className='h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent' />
      </div>
    );
  }

  return (
    <div className='min-h-screen transition-colors'>
      {profile && (
        <div className='mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8'>
          {loadError && (
            <p className='mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700' role='alert'>
              {loadError}
            </p>
          )}
          <MyPageProfileHeader profile={profile} onProfileUpdate={setProfile} />
          <MyPageQuotaSection quota={quota} analysisAdmin={analysisAdmin} />
          <MyPagePlaceHistoryPanel items={placeClicks} />
        </div>
      )}

      {loading && profile && (
        <p className='sr-only' aria-live='polite'>
          Refreshing your data
        </p>
      )}
    </div>
  );
}
