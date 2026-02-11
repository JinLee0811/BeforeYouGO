import React, { useState } from "react";
import { useRouter } from "next/router";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
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
  const router = useRouter();

  const handleGetDetailedAnalysis = async () => {
    if (!selectedRestaurant) {
      console.warn("Selected restaurant is missing.");
      return;
    }

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

      console.log("Fetching detailed analysis...");
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

      const data = await response.json();
      console.log("Detailed analysis raw response:", data);

      if (!response.ok) {
        if (response.status === 429) {
          router.push("/pricing");
          return;
        }
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      if (data && data.data) {
        setDetailedResult(data.data);
      } else {
        console.warn(
          "API response structure might have changed or returned unexpected format. Received:",
          data
        );
        if (data && data.sentiment && data.summary) {
          setDetailedResult(data);
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
          className='flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-5 py-2 text-sm font-medium text-white shadow-md transition hover:brightness-105'>
          <MagnifyingGlassIcon className='h-5 w-5' />
          New Search
        </button>
      </div>
    </div>
  );
}
