import React, { useState, useEffect } from "react";
import { ArrowLeftIcon, MagnifyingGlassIcon, SparklesIcon } from "@heroicons/react/24/outline";
import ReviewResultCard from "../ReviewResultCard";
import { AnalysisResult, BasicSummaryResult, DetailedAnalysisResult, Review } from "@/types";
import { supabase } from "../../lib/supabaseClient";

interface AnalysisResultsProps {
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
    if (!selectedRestaurant || !Array.isArray(reviews) || reviews.length === 0) {
      console.warn("Detailed analysis prerequisites not met", { selectedRestaurant, reviews });
      return;
    }

    setIsDetailedLoading(true);
    setDetailedError(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setDetailedError("Login required. Please log in to view detailed analysis.");
        setIsDetailedLoading(false);
        return;
      }

      console.log("Fetching detailed analysis...");
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviews,
          placeId: selectedRestaurant.placeId,
          userId: session.user.id,
        }),
      });

      const data = await response.json();
      console.log("Detailed analysis raw response:", data);

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      if (data && data.data) {
        setDetailedResult(data.data);
      } else if (data && !data.data && response.ok) {
        console.warn(
          "API response structure might have changed. Expected 'data.data' but received:",
          data
        );
        setDetailedResult(data);
      } else {
        throw new Error("Invalid data structure received from analysis API.");
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

  const isBasicSummary = !detailedResult && !!result;

  return (
    <div ref={reviewResultRef} className='mt-8 space-y-6 w-full max-w-4xl mx-auto'>
      <ReviewResultCard
        result={displayResult}
        selectedRestaurant={selectedRestaurant}
        isBasicSummary={isBasicSummary}
        onGetDetailedAnalysis={handleGetDetailedAnalysis}
        isDetailedAnalysisLoading={isDetailedLoading}
        detailedAnalysisError={detailedError}
      />

      <div className='flex justify-center pt-4'>
        <button
          onClick={onNewSearch}
          className='flex items-center gap-2 rounded-md bg-white dark:bg-gray-700 px-4 py-2 text-sm font-semibold text-gray-900 dark:text-gray-200 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors'>
          <MagnifyingGlassIcon className='h-5 w-5' />
          New Search
        </button>
      </div>
    </div>
  );
}
