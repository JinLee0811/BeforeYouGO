import { memo } from "react";
import ReviewResultCard from "@/components/ReviewResultCard";
import type { AnalysisResult, BasicSummaryResult, DetailedAnalysisResult } from "@/types";

type SelectedRestaurant = {
  placeId: string;
  name: string;
  address?: string;
  photos?: string[];
  rating?: number;
};

type Props = {
  analysisAdmin: boolean;
  isAnalyzing: boolean;
  analysisError: string | null;
  needsAuthForAnalysis: boolean;
  analysisResult: AnalysisResult | DetailedAnalysisResult | null;
  basicSummaryLoading: boolean;
  basicSummaryError: string | null;
  basicSummaryResult: BasicSummaryResult | null;
  selectedRestaurant: SelectedRestaurant | null;
  onOpenAuth: () => void;
  onWishlistClick: () => void;
  onReviewClick: () => void;
};

/**
 * AI 분석: 어드민은 Pro(/api/analyze), 일반 유저는 기본 요약(crawl + summary-basic) + 카드 하단 업그레이드 CTA
 */
function RestaurantDetailAnalysisSectionComponent({
  analysisAdmin,
  isAnalyzing,
  analysisError,
  needsAuthForAnalysis,
  analysisResult,
  basicSummaryLoading,
  basicSummaryError,
  basicSummaryResult,
  selectedRestaurant,
  onOpenAuth,
  onWishlistClick,
  onReviewClick,
}: Props) {
  return (
    <div className='byg-panel-soft mb-6 p-6'>
      <h2 className='byg-title mb-4 text-2xl font-semibold'>AI Review Analysis</h2>

      {analysisAdmin ? (
        <>
          {isAnalyzing && <p className='text-center text-slate-600'>Analyzing reviews...</p>}

          {needsAuthForAnalysis && !isAnalyzing && (
            <div className='rounded-xl border border-indigo-100 bg-indigo-50/80 p-4 text-center text-sm text-slate-700'>
              <p className='mb-3'>Sign in to run AI analysis for this restaurant.</p>
              <button
                type='button'
                onClick={onOpenAuth}
                className='rounded-xl bg-indigo-600 px-4 py-2 text-white transition hover:bg-indigo-700'>
                Sign in
              </button>
            </div>
          )}

          {!isAnalyzing && analysisError && (
            <p className='text-center text-red-600' role='alert'>
              Analysis: {analysisError}
            </p>
          )}

          {analysisResult && (
            <ReviewResultCard
              result={analysisResult}
              selectedRestaurant={selectedRestaurant ?? undefined}
              onWishlistClick={onWishlistClick}
              onReviewClick={onReviewClick}
            />
          )}
        </>
      ) : (
        <>
          {needsAuthForAnalysis && !basicSummaryLoading && (
            <div className='rounded-xl border border-indigo-100 bg-indigo-50/80 p-4 text-center text-sm text-slate-700'>
              <p className='mb-3'>Sign in to see a free review summary for this restaurant.</p>
              <button
                type='button'
                onClick={onOpenAuth}
                className='rounded-xl bg-indigo-600 px-4 py-2 text-white transition hover:bg-indigo-700'>
                Sign in
              </button>
            </div>
          )}

          {basicSummaryLoading && (
            <p className='text-center text-slate-600'>Loading review summary...</p>
          )}

          {!basicSummaryLoading && basicSummaryError && (
            <p className='text-center text-red-600' role='alert'>
              {basicSummaryError}
            </p>
          )}

          {!basicSummaryLoading && !basicSummaryError && basicSummaryResult && selectedRestaurant && (
            <ReviewResultCard
              result={basicSummaryResult}
              selectedRestaurant={selectedRestaurant}
              isBasicSummary
              showMembershipUpsell
              onWishlistClick={onWishlistClick}
              onReviewClick={onReviewClick}
            />
          )}
        </>
      )}
    </div>
  );
}

export const RestaurantDetailAnalysisSection = memo(RestaurantDetailAnalysisSectionComponent);
