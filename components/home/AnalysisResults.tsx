import React from "react";
import { ArrowLeftIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import ReviewResultCard from "../ReviewResultCard";
import { AnalysisResult } from "@/types";

interface AnalysisResultsProps {
  result: AnalysisResult | null;
  selectedRestaurant: {
    placeId: string;
    name: string;
    address?: string;
    photos?: string[];
    rating?: number;
  } | null;
  onNewSearch: () => void;
  reviewResultRef: React.RefObject<HTMLDivElement>;
}

export default function AnalysisResults({
  result,
  selectedRestaurant,
  onNewSearch,
  reviewResultRef,
}: AnalysisResultsProps) {
  console.log("AnalysisResults rendered with:", { result, selectedRestaurant }); // 디버깅용

  if (!result) return null;

  return (
    <div ref={reviewResultRef} className='mt-8 space-y-6 w-full max-w-4xl mx-auto'>
      <ReviewResultCard result={result} selectedRestaurant={selectedRestaurant} />
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
