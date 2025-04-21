import React, { useState } from "react";
import { AnalysisResult } from "@/types";
import { StarIcon } from "@heroicons/react/24/solid";
import {
  HandThumbUpIcon,
  HandThumbDownIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  FireIcon,
  ListBulletIcon,
  PhotoIcon,
  HeartIcon,
  PencilSquareIcon,
  BookmarkIcon as BookmarkIconOutline,
} from "@heroicons/react/24/outline";
import { BookmarkIcon as BookmarkIconSolid } from "@heroicons/react/24/solid";
import { supabase } from "@/lib/supabaseClient";
import ReviewForm from "./review/ReviewForm";

interface ReviewResultCardProps {
  result: AnalysisResult;
  selectedRestaurant: {
    placeId: string;
    name: string;
    address?: string;
    photos?: string[];
    rating?: number;
  } | null;
  isWishlistView?: boolean;
}

// Helper function to generate star icons based on rating
const renderStars = (rating: number) => {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

  return (
    <div className='flex items-center'>
      {[...Array(fullStars)].map((_, i) => (
        <StarIcon key={`full-${i}`} className='w-5 h-5 text-yellow-400' />
      ))}
      {/* Render half star if applicable */}
      {halfStar && <StarIcon key='half' className='w-5 h-5 text-yellow-400 opacity-50' />}
      {[...Array(emptyStars)].map((_, i) => (
        <StarIcon key={`empty-${i}`} className='w-5 h-5 text-gray-300' />
      ))}
      <span className='ml-2 text-sm font-medium text-gray-600 dark:text-gray-400'>
        ({rating.toFixed(1)})
      </span>
    </div>
  );
};

export default function ReviewResultCard({
  result,
  selectedRestaurant,
  isWishlistView = false,
}: ReviewResultCardProps) {
  console.log("ReviewResultCard rendered with:", { result, selectedRestaurant }); // 디버깅용

  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleWishlistClick = async () => {
    if (!selectedRestaurant || isWishlistView) return;

    try {
      setIsLoading(true);
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Please log in to save to wishlist");
        return;
      }

      // 1. 기존 북마크 체크
      const { data: existingBookmark } = await supabase
        .from("bookmarks")
        .select("id")
        .eq("user_id", user.id)
        .eq("place_id", selectedRestaurant.placeId)
        .single();

      if (existingBookmark) {
        setError("This restaurant is already in your wishlist!");
        return;
      }

      // 2. 북마크 데이터 준비
      const bookmarkData = {
        user_id: user.id,
        place_id: selectedRestaurant.placeId,
        restaurant_name: selectedRestaurant.name,
        restaurant_address: selectedRestaurant.address || "",
        image_url: selectedRestaurant.photos?.[0] || null,
        average_rating: result.average_rating || 0,
        sentiment: result.sentiment || "mixed",
        positive_keywords: result.positive_keywords || [],
        negative_keywords: result.negative_keywords || [],
        mentioned_menu_items: result.mentioned_menu_items || [],
        recommended_dishes: result.recommended_dishes || [],
        summary: result.summary || "",
        photo_urls: result.photoUrls || [],
        created_at: new Date().toISOString(),
      };

      // 3. 북마크 저장
      const { error: insertError } = await supabase.from("bookmarks").insert([bookmarkData]);

      if (insertError) {
        console.error("Error saving to wishlist:", insertError);
        setError("Failed to save to wishlist");
        return;
      }

      setIsBookmarked(true);
      alert("Successfully saved to wishlist!");
    } catch (error) {
      console.error("Error in handleWishlistClick:", error);
      setError("An error occurred while saving to wishlist");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReviewClick = () => {
    setIsReviewModalOpen(true);
  };

  const getSentimentClasses = (sentiment: string) => {
    switch (sentiment?.toLowerCase()) {
      case "positive":
        return "bg-green-100 text-green-800 border-green-300";
      case "negative":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
    }
  };

  const formatSentimentText = (sentiment: string) => {
    switch (sentiment?.toLowerCase()) {
      case "positive":
        return "Positive";
      case "negative":
        return "Negative";
      case "mixed":
        return "Mixed";
      default:
        return "Neutral";
    }
  };

  return (
    <>
      <div className='bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700'>
        <div className='p-4 sm:p-6 md:p-10'>
          {/* Added Restaurant Name */}
          {selectedRestaurant && (
            <h1 className='text-xl sm:text-2xl font-bold text-gray-700 dark:text-gray-200 mb-4 text-center'>
              {selectedRestaurant.name}
            </h1>
          )}

          <h2 className='text-lg sm:text-xl font-semibold text-gray-600 dark:text-gray-400 mb-6 sm:mb-8 text-center uppercase tracking-wider'>
            AI Analysis Report
          </h2>

          <div className='space-y-6 sm:space-y-8'>
            {/* Average Rating */}
            {result.average_rating !== undefined && (
              <div className='p-4 sm:p-5 rounded-lg bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 dark:bg-gradient-to-r dark:from-gray-700 dark:to-gray-750 dark:border-gray-600 flex items-center justify-between'>
                <h3 className='text-lg sm:text-xl font-semibold text-gray-700 dark:text-gray-200 flex items-center'>
                  <StarIcon className='w-5 h-5 sm:w-6 sm:h-6 mr-2 text-yellow-500' />
                  Average Rating
                </h3>
                {renderStars(result.average_rating)}
              </div>
            )}

            {/* Sentiment Analysis */}
            <div className='p-4 sm:p-5 rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 dark:bg-gradient-to-r dark:from-gray-700 dark:to-gray-750 dark:border-gray-600 flex items-center justify-between'>
              <h3 className='text-lg sm:text-xl font-semibold text-gray-700 dark:text-gray-200 flex items-center'>
                <ChatBubbleLeftRightIcon className='w-5 h-5 sm:w-6 sm:h-6 mr-2 text-indigo-500 dark:text-indigo-400' />
                Overall Sentiment
              </h3>
              <span
                className={`inline-flex items-center px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-sm sm:text-md font-bold border shadow-sm ${getSentimentClasses(result.sentiment)}`}>
                {formatSentimentText(result.sentiment)}
              </span>
            </div>

            {/* Keywords */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6'>
              {/* Positive Keywords */}
              <div className='p-4 sm:p-5 rounded-lg bg-green-50 dark:bg-gray-700 border border-green-200 dark:border-gray-600'>
                <h3 className='text-lg sm:text-xl font-semibold text-green-800 dark:text-green-300 mb-3 sm:mb-4 flex items-center'>
                  <HandThumbUpIcon className='w-5 h-5 sm:w-6 sm:h-6 mr-2' />
                  Positive Keywords
                </h3>
                {result.positive_keywords && result.positive_keywords.length > 0 ? (
                  <div className='flex flex-wrap gap-2 sm:gap-2.5'>
                    {result.positive_keywords.map((keyword, index) => (
                      <span
                        key={index}
                        className='px-2.5 py-1 bg-white dark:bg-gray-600 text-green-800 dark:text-green-200 rounded-full text-xs sm:text-sm font-medium border border-green-200 dark:border-green-500'>
                        {keyword}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className='text-sm text-gray-500 dark:text-gray-400'>
                    No specific positive keywords found.
                  </p>
                )}
              </div>
              {/* Negative Keywords */}
              <div className='p-4 sm:p-5 rounded-lg bg-red-50 border border-red-200'>
                <h3 className='text-lg sm:text-xl font-semibold text-red-800 mb-3 sm:mb-4 flex items-center'>
                  <HandThumbDownIcon className='w-5 h-5 sm:w-6 sm:h-6 mr-2' />
                  Negative Keywords
                </h3>
                {result.negative_keywords && result.negative_keywords.length > 0 ? (
                  <div className='flex flex-wrap gap-2 sm:gap-2.5'>
                    {result.negative_keywords.map((keyword, index) => (
                      <span
                        key={`neg-${index}`}
                        className='px-3 py-1 sm:px-3.5 sm:py-1.5 bg-white text-red-800 rounded-full text-xs sm:text-sm font-medium border border-red-300 shadow-sm hover:bg-red-100 transition-colors'>
                        {keyword}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className='text-xs sm:text-sm text-gray-500 italic'>
                    No specific negative keywords identified.
                  </p>
                )}
              </div>
            </div>

            {/* Menu Items */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6'>
              {/* Mentioned Menu Items */}
              <div className='p-4 sm:p-5 rounded-lg bg-blue-50 border border-blue-200'>
                <h3 className='text-lg sm:text-xl font-semibold text-blue-800 mb-3 sm:mb-4 flex items-center'>
                  <ListBulletIcon className='w-5 h-5 sm:w-6 sm:h-6 mr-2' />
                  Mentioned Menu Items
                </h3>
                {result.mentioned_menu_items && result.mentioned_menu_items.length > 0 ? (
                  <div className='flex flex-wrap gap-2 sm:gap-2.5'>
                    {result.mentioned_menu_items.map((item, index) => (
                      <span
                        key={`menu-${index}`}
                        className='px-3 py-1 sm:px-3.5 sm:py-1.5 bg-white text-blue-800 rounded-full text-xs sm:text-sm font-medium border border-blue-300 shadow-sm hover:bg-blue-100 transition-colors'>
                        {item}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className='text-xs sm:text-sm text-gray-500 italic'>
                    No specific menu items mentioned in reviews.
                  </p>
                )}
              </div>
              {/* Recommended Dishes */}
              <div className='p-4 sm:p-5 rounded-lg bg-amber-50 border border-amber-200'>
                <h3 className='text-lg sm:text-xl font-semibold text-amber-800 mb-3 sm:mb-4 flex items-center'>
                  <FireIcon className='w-5 h-5 sm:w-6 sm:h-6 mr-2' />
                  Recommended Dishes
                </h3>
                {result.recommended_dishes && result.recommended_dishes.length > 0 ? (
                  <div className='flex flex-wrap gap-2 sm:gap-2.5'>
                    {result.recommended_dishes.map((dish, index) => (
                      <span
                        key={`dish-${index}`}
                        className='px-3 py-1 sm:px-3.5 sm:py-1.5 bg-white text-amber-800 rounded-full text-xs sm:text-sm font-medium border border-amber-300 shadow-sm hover:bg-amber-100 transition-colors'>
                        {dish}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className='text-xs sm:text-sm text-gray-500 italic'>
                    No specific dishes recommended in reviews.
                  </p>
                )}
              </div>
            </div>

            {/* Summary */}
            <div className='p-4 sm:p-5 rounded-lg bg-gray-50 border border-gray-200'>
              <h3 className='text-lg sm:text-xl font-semibold text-gray-700 mb-3 sm:mb-4 flex items-center'>
                <DocumentTextIcon className='w-5 h-5 sm:w-6 sm:h-6 mr-2 text-gray-500' />
                Summary
              </h3>
              <p className='text-sm sm:text-base text-gray-700 whitespace-pre-line'>
                {result.summary}
              </p>
            </div>

            {/* Restaurant Photos */}
            {result.photoUrls && result.photoUrls.length > 0 && (
              <div className='p-4 sm:p-5 rounded-lg bg-gray-50 border border-gray-200'>
                <h3 className='text-lg sm:text-xl font-semibold text-gray-700 mb-3 sm:mb-4 flex items-center'>
                  <PhotoIcon className='w-5 h-5 sm:w-6 sm:h-6 mr-2 text-gray-500' />
                  Restaurant Photos
                </h3>
                <div className='flex overflow-x-auto space-x-3 pb-2 -mb-2'>
                  {result.photoUrls.map((url, index) => (
                    <div
                      key={`photo-${index}`}
                      className='flex-shrink-0 w-40 h-32 sm:w-48 sm:h-40 rounded-lg overflow-hidden shadow-md'>
                      <img
                        src={url}
                        alt={`Restaurant photo ${index + 1}`}
                        className='w-full h-full object-cover'
                        loading='lazy' // Lazy load images
                      />
                    </div>
                  ))}
                </div>
                <p className='text-xs text-gray-500 mt-3 text-center'>
                  Scroll horizontally to view more photos
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className='mt-8 flex flex-col sm:flex-row gap-4 justify-center'>
            {!isWishlistView && (
              <button
                onClick={handleWishlistClick}
                disabled={isLoading}
                className={`flex-1 sm:flex-initial sm:min-w-[200px] flex items-center justify-center gap-2 px-6 py-3 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors font-medium ${
                  isBookmarked ? "text-blue-600" : "text-gray-400 hover:text-blue-600"
                }`}>
                {isBookmarked ? (
                  <BookmarkIconSolid className='w-5 h-5' />
                ) : (
                  <BookmarkIconOutline className='w-5 h-5' />
                )}
                Add to Wishlist
              </button>
            )}
            <button
              onClick={handleReviewClick}
              className='flex-1 sm:flex-initial sm:min-w-[200px] flex items-center justify-center gap-2 px-6 py-3 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium'>
              <PencilSquareIcon className='w-5 h-5' />
              Write Review
            </button>
          </div>

          {error && (
            <div className='mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm text-center'>
              {error}
            </div>
          )}
        </div>
      </div>

      {selectedRestaurant && (
        <ReviewForm
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          restaurantId={selectedRestaurant.placeId}
          restaurantName={selectedRestaurant.name}
        />
      )}
    </>
  );
}
