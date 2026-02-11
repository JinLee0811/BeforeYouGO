import React, { useState } from "react";
import { StarIcon } from "@heroicons/react/24/solid";
import {
  TrashIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  EyeIcon,
  PencilSquareIcon,
  PhotoIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { DetailedAnalysisResult } from "@/types";
import AnalysisModal from "./AnalysisModal";
import ReviewForm from "../review/ReviewForm";

interface WishlistCardProps {
  id: string;
  placeId: string;
  restaurantName: string;
  address: string;
  imageUrl: string | null;
  averageRating?: number;
  sentiment?: "positive" | "negative" | "mixed";
  positiveKeywords: string[];
  negativeKeywords: string[];
  mentionedMenuItems: string[];
  recommendedDishes: string[];
  summary: string;
  photoUrls: string[];
  isProAnalysis?: boolean;
  onDelete: (id: string) => void;
  onUpdate?: () => void;
}

export default function WishlistCard({
  id,
  placeId,
  restaurantName,
  address,
  imageUrl,
  averageRating,
  sentiment,
  positiveKeywords,
  negativeKeywords,
  mentionedMenuItems,
  recommendedDishes,
  summary,
  photoUrls,
  isProAnalysis = false,
  onDelete,
  onUpdate,
}: WishlistCardProps) {
  const [showModal, setShowModal] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  const analysisResult: DetailedAnalysisResult = {
    average_rating: averageRating || 0,
    sentiment: sentiment || "mixed",
    positive_keywords: positiveKeywords || [],
    negative_keywords: negativeKeywords || [],
    mentioned_menu_items: mentionedMenuItems || [],
    recommended_dishes: recommendedDishes || [],
    summary: summary || "",
    photo_urls: photoUrls || [],
    is_pro_analysis: isProAnalysis,
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to remove this restaurant from your wishlist?")) {
      onDelete(id);
    }
  };

  const handleReviewClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowReviewForm(true);
  };

  const handleAnalysisUpdate = () => {
    if (onUpdate) {
      onUpdate();
    }
  };

  const displayImageUrl = photoUrls && photoUrls.length > 0 ? photoUrls[0] : imageUrl;

  return (
    <>
      <div
        onClick={() => setShowModal(true)}
        className='group flex cursor-pointer overflow-hidden rounded-2xl border border-indigo-100/80 bg-white/90 shadow-sm transition-all duration-300 hover:shadow-lg'>
        <div className='w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 relative'>
          {displayImageUrl ? (
            <img
              src={displayImageUrl}
              alt={restaurantName}
              className='w-full h-full object-cover'
            />
          ) : (
            <div className='flex h-full w-full items-center justify-center bg-slate-100'>
              <PhotoIcon className='h-10 w-10 text-slate-400' />
            </div>
          )}
        </div>

        <div className='flex-1 p-3 sm:p-4 flex flex-col justify-between min-w-0'>
          <div>
            <h3 className='byg-title mb-1 line-clamp-2 text-base font-semibold text-slate-900 transition-colors group-hover:text-indigo-600 sm:text-lg'>
              {restaurantName}
            </h3>
            <p className='mb-2 line-clamp-1 text-xs text-slate-500 sm:text-sm'>
              {address}
            </p>
          </div>

          <div className='flex items-center justify-between mt-1'>
            <div className='flex items-center space-x-2 flex-wrap gap-y-1'>
              {averageRating && (
                <div className='flex items-center'>
                  <div className='flex'>
                    {[...Array(5)].map((_, i) => (
                      <StarIcon
                        key={i}
                        className={`w-4 h-4 ${i < Math.floor(averageRating) ? "text-yellow-400" : "text-gray-300"}`}
                      />
                    ))}
                  </div>
                  <span className='ml-1.5 text-xs text-slate-600 sm:text-sm'>
                    {averageRating.toFixed(1)}
                  </span>
                </div>
              )}
              {sentiment && (
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${sentiment === "positive" ? "bg-green-100 text-green-800" : sentiment === "negative" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}`}>
                  {sentiment.charAt(0).toUpperCase() + sentiment.slice(1)}
                </span>
              )}
              {isProAnalysis && (
                <span className='inline-flex items-center gap-1 rounded-full bg-fuchsia-100 px-2 py-0.5 text-xs font-medium text-fuchsia-800'>
                  <SparklesIcon className='w-3 h-3' />
                  Pro
                </span>
              )}
            </div>
            <div className='flex items-center space-x-1 sm:space-x-1.5 flex-shrink-0'>
              <button
                onClick={handleReviewClick}
                className='rounded-full p-1.5 text-slate-400 transition-colors hover:bg-indigo-100 hover:text-indigo-600'
                title='Write a review'>
                <PencilSquareIcon className='w-4 h-4 sm:w-5 sm:h-5' />
              </button>
              <button
                onClick={handleDelete}
                className='rounded-full p-1.5 text-slate-400 transition-colors hover:bg-red-100 hover:text-red-600'
                title='Remove from wishlist'>
                <TrashIcon className='w-4 h-4 sm:w-5 sm:h-5' />
              </button>
            </div>
          </div>
        </div>
      </div>

      <AnalysisModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        result={analysisResult}
        restaurantName={restaurantName}
        placeId={placeId}
        onReviewClick={() => setShowReviewForm(true)}
        isProAnalysis={isProAnalysis}
        onUpdate={handleAnalysisUpdate}
      />

      <ReviewForm
        isOpen={showReviewForm}
        onClose={() => setShowReviewForm(false)}
        restaurantId={placeId}
        restaurantName={restaurantName}
      />
    </>
  );
}
