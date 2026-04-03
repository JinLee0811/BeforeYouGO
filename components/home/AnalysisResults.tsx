import React, { useState } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import ReviewResultCard from "../ReviewResultCard";
import { AnalysisResult, BasicSummaryResult, DetailedAnalysisResult, Review } from "@/types";
import { supabase } from "../../lib/supabaseClient";
import { parseApiJsonResponse } from "@/utils/parseApiJson";


interface AnalysisResultsProps {
  /** Hides pricing link under detailed-analysis CTA for analysis admins */
  analysisAdmin?: boolean;
  result: AnalysisResult | BasicSummaryResult | null;
  selectedRestaurant: {
    placeId: string;
    name: string;
    address?: string;
    photos?: string[];
    rating?: number;
  } | null;
  onNewSearch: () => void;
  reviewResultRef: React.RefObject<HTMLDivElement>;
  reviews: Review[];
}

export default function AnalysisResults({
  analysisAdmin = false,
  result,
  selectedRestaurant,
  onNewSearch,
  reviewResultRef,
  reviews,
}: AnalysisResultsProps) {
  const [isDetailedLoading, setIsDetailedLoading] = useState(false);
  const [detailedError, setDetailedError] = useState<string | null>(null);
  const [detailedResult, setDetailedResult] = useState<DetailedAnalysisResult | null>(null);

  const handleGetDetailedAnalysis = async () => {
    if (!selectedRestaurant) return;

    setIsDetailedLoading(true);
    setDetailedError(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      if (!accessToken) {
        throw new Error("Login required to view detailed analysis.");
      }

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          placeId: selectedRestaurant.placeId,
        }),
      });

      const data = (await parseApiJsonResponse(response)) as {
        success?: boolean;
        data?: DetailedAnalysisResult;
        error?: string;
        sentiment?: string;
        summary?: string;
      };
      if (!response.ok) {
        if (response.status === 429) {
          setDetailedError(
            "Usage limit reached for detailed analysis today. View plans & pricing to continue."
          );
          return;
        }
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      if (data && data.data) {
        setDetailedResult(data.data);
      } else {
        if (data && data.sentiment && data.summary) {
          setDetailedResult(data as DetailedAnalysisResult);
        } else {
          throw new Error("Invalid data structure received from analysis API.");
        }
      }
    } catch (err: any) {
      console.error("Detailed analysis error:", err);
      setDetailedError(err.message || "An error occurred while fetching detailed analysis.");
    } finally {
      setIsDetailedLoading(false);
    }
  };

  const displayResult = detailedResult || result;

  if (!displayResult) return null;

  /** 기본 요약 행에도 빈 keyword 배열이 있어 `positive_keywords` 존재만으로는 Pro 여부를 판단하면 안 됨 */
  const resultIsProRow =
    result != null &&
    "is_pro_analysis" in result &&
    (result as { is_pro_analysis?: boolean }).is_pro_analysis === true;
  const isBasicSummary = !detailedResult && !!result && !resultIsProRow;

  return (
    <div ref={reviewResultRef} className='mt-8 space-y-6 w-full max-w-4xl mx-auto'>
      <ReviewResultCard
        result={displayResult}
        selectedRestaurant={selectedRestaurant}
        isBasicSummary={isBasicSummary}
        onGetDetailedAnalysis={analysisAdmin ? handleGetDetailedAnalysis : undefined}
        isDetailedAnalysisLoading={analysisAdmin ? isDetailedLoading : false}
        detailedAnalysisError={analysisAdmin ? detailedError : null}
        showMembershipUpsell
      />

      <div className='flex justify-center pt-4'>
        <button
          onClick={onNewSearch}
          className='flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-5 py-2 text-sm font-medium text-white shadow-md transition hover:brightness-105'>
          <MagnifyingGlassIcon className='h-5 w-5' />
          New Search
        </button>
      </div>
    </div>
  );
}
