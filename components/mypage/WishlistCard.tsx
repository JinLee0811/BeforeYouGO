import React, { useState } from "react";
import { StarIcon } from "@heroicons/react/24/solid";
import {
  TrashIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  EyeIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";
import { AnalysisResult } from "@/types";
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
  onDelete: (id: string) => void;
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
  onDelete,
}: WishlistCardProps) {
  const [showModal, setShowModal] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  const analysisResult: AnalysisResult = {
    average_rating: averageRating || 0,
    sentiment: sentiment || "mixed",
    positive_keywords: positiveKeywords || [],
    negative_keywords: negativeKeywords || [],
    mentioned_menu_items: mentionedMenuItems || [],
    recommended_dishes: recommendedDishes || [],
    summary: summary || "",
    photoUrls: photoUrls || [],
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

  return (
    <>
      <div
        onClick={() => setShowModal(true)}
        className='bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-xl overflow-hidden shadow hover:shadow-md transition-all duration-300 cursor-pointer'>
        <div className='flex'>
          {/* Image Section */}
          <div className='w-32 h-32 flex-shrink-0 relative'>
            {imageUrl ? (
              <img src={imageUrl} alt={restaurantName} className='w-full h-full object-cover' />
            ) : (
              <div className='w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center'>
                <span className='text-gray-400 dark:text-gray-500 text-xs'>No image</span>
              </div>
            )}
          </div>

          {/* Content Section */}
          <div className='flex-1 p-4'>
            <div className='flex justify-between items-start'>
              <div>
                <h3 className='text-lg font-medium text-gray-900 dark:text-white mb-1'>
                  {restaurantName}
                </h3>
                <p className='text-sm text-gray-600 dark:text-gray-300 mb-2 line-clamp-1'>
                  {address}
                </p>
                {averageRating && (
                  <div className='flex items-center mb-2'>
                    <div className='flex'>
                      {[...Array(5)].map((_, i) => (
                        <StarIcon
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.floor(averageRating) ? "text-yellow-400" : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <span className='ml-2 text-sm text-gray-600 dark:text-gray-400'>
                      {averageRating.toFixed(1)}
                    </span>
                  </div>
                )}
                {sentiment && (
                  <div
                    className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                      sentiment === "positive"
                        ? "bg-green-100 text-green-800"
                        : sentiment === "negative"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                    }`}>
                    {sentiment.charAt(0).toUpperCase() + sentiment.slice(1)}
                  </div>
                )}
              </div>
              <div className='flex items-center space-x-2'>
                <button
                  onClick={handleReviewClick}
                  className='p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors'
                  title='Write a review'>
                  <PencilSquareIcon className='w-4 h-4' />
                </button>
                <button
                  onClick={handleDelete}
                  className='p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors'
                  title='Remove from wishlist'>
                  <TrashIcon className='w-4 h-4' />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AnalysisModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        result={analysisResult}
        restaurantName={restaurantName}
        onReviewClick={() => setShowReviewForm(true)}
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
