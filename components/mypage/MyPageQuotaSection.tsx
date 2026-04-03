import { memo } from "react";
import type { AnalysisQuotaState } from "@/hooks/useAnalysisQuota";
import { isAnalysisQuotaUnavailable } from "@/lib/analysisQuotaUi";

type Props = {
  quota: AnalysisQuotaState;
  analysisAdmin: boolean;
};

/**
 * Daily analysis quota summary for My page (English copy).
 */
function MyPageQuotaSectionComponent({ quota, analysisAdmin }: Props) {
  if (analysisAdmin) {
    return (
      <div className='byg-panel-soft mb-8 rounded-2xl border border-indigo-100/80 p-6'>
        <h2 className='byg-title text-lg font-semibold text-slate-900'>Analysis quota</h2>
        <p className='mt-2 text-sm text-slate-600'>Unlimited analysis (admin account).</p>
      </div>
    );
  }

  if (quota.loading) {
    return (
      <div className='byg-panel-soft mb-8 rounded-2xl border border-slate-200 p-6'>
        <p className='text-sm text-slate-500'>Loading quota…</p>
      </div>
    );
  }

  if (quota.unlimited === true) {
    return (
      <div className='byg-panel-soft mb-8 rounded-2xl border border-slate-200 p-6'>
        <h2 className='byg-title text-lg font-semibold text-slate-900'>Analysis quota</h2>
        <p className='mt-2 text-sm text-slate-600'>Quota check skipped (demo or unlimited).</p>
      </div>
    );
  }

  if (quota.unlimited === false) {
    const { limit, used, remaining } = quota;
    if (isAnalysisQuotaUnavailable(quota)) {
      return (
        <div className='byg-panel-soft mb-8 rounded-2xl border border-amber-100/80 p-6'>
          <h2 className='byg-title text-lg font-semibold text-slate-900'>Today&apos;s analysis quota</h2>
          <p className='mt-2 text-sm text-amber-900'>
            We couldn&apos;t load your usage. Try refreshing the page, or sign out and back in. Contact support if this
            continues.
          </p>
        </div>
      );
    }
    return (
      <div className='byg-panel-soft mb-8 rounded-2xl border border-indigo-100/80 p-6'>
        <h2 className='byg-title text-lg font-semibold text-slate-900'>Today&apos;s analysis quota</h2>
        <p className='mt-3 text-2xl font-bold text-indigo-700'>
          {remaining} <span className='text-base font-medium text-slate-600'>of {limit} left</span>
        </p>
        <p className='mt-2 text-sm text-slate-600'>
          You have used {used} of {limit} free analyses today. Resets at the start of the next day (UTC or your
          configured timezone).
        </p>
        {remaining === 0 && (
          <a
            href='/pricing'
            className='mt-4 inline-block text-sm font-medium text-indigo-600 underline hover:text-indigo-800'>
            View plans & pricing
          </a>
        )}
      </div>
    );
  }

  return null;
}

export const MyPageQuotaSection = memo(MyPageQuotaSectionComponent);
