import React, { useState, useEffect } from "react";
import { AnalysisResult, BasicSummaryResult, DetailedAnalysisResult, Review } from "@/types";
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
  SparklesIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";
import { BookmarkIcon as BookmarkIconSolid } from "@heroicons/react/24/solid";
import { supabase } from "@/lib/supabaseClient";
import ReviewForm from "./review/ReviewForm";
import { useUser } from "@/hooks/useUser";

interface ReviewResultCardProps {
  result: AnalysisResult | BasicSummaryResult;
  selectedRestaurant: {
    placeId: string;
    name: string;
    address?: string;
    photos?: string[];
    rating?: number;
  } | null;
  isWishlistView?: boolean;
  isBasicSummary?: boolean;
  onGetDetailedAnalysis?: () => void;
  isDetailedAnalysisLoading?: boolean;
  detailedAnalysisError?: string | null;
}

// Helper function to generate star icons based on rating
const renderStars = (rating: number | undefined | null) => {
  // Provide a default rating of 0 if the input is undefined or null
  const validRating = rating ?? 0;
  const fullStars = Math.floor(validRating);
  const halfStar = validRating % 1 >= 0.5;
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
        ({validRating.toFixed(1)})
      </span>
    </div>
  );
};

// Restore original SectionWrapper padding, maybe slightly adjust background opacity later if needed
const SectionWrapper: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = "",
}) => <div className={`rounded-xl p-4 ${className}`}>{children}</div>;

// Restore original SectionTitle styling
const SectionTitle: React.FC<{ icon: React.ElementType; text: string; className?: string }> = ({
  icon: Icon,
  text,
  className = "",
}) => (
  <div className={`flex items-center gap-2 mb-3 ${className}`}>
    <Icon className='w-5 h-5 flex-shrink-0' />
    <h3 className='text-base font-medium'>{text}</h3>
  </div>
);

// --- Restore original Keyword/Item Tag Styling (Oval with Border) ---
const Tag: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = "",
}) => (
  <span className={`inline-block px-3 py-1 rounded-full text-sm border ${className}`}>
    {" "}
    {/* Ensure padding/rounding matches Roll House image */}
    {children}
  </span>
);
// --- End Keyword/Item Tag Styling ---

// Restore original sentiment style functions (will apply style directly in JSX)
const getSentimentBgClass = (sentiment: string) => {
  switch (sentiment) {
    case "positive":
      return "bg-green-100 dark:bg-green-900/30";
    case "negative":
      return "bg-red-100 dark:bg-red-900/30";
    case "mixed":
      return "bg-yellow-100 dark:bg-yellow-900/30";
    default:
      return "bg-gray-100 dark:bg-gray-800";
  }
};

const getSentimentTextClass = (sentiment: string) => {
  switch (sentiment) {
    case "positive":
      return "text-green-800 dark:text-green-300";
    case "negative":
      return "text-red-800 dark:text-red-300";
    case "mixed":
      return "text-yellow-800 dark:text-yellow-300";
    default:
      return "text-gray-800 dark:text-gray-300";
  }
};

const formatSentimentText = (sentiment: string | undefined | null) => {
  // Check if sentiment is a valid string before processing
  if (typeof sentiment !== "string" || sentiment.length === 0) {
    return "Unknown"; // Or return an empty string: ""
  }

  switch (sentiment) {
    case "positive":
      return "Positive";
    case "negative":
      return "Negative";
    case "mixed":
      return "Mixed";
    default:
      // Only process if it's a non-empty string
      return sentiment.charAt(0).toUpperCase() + sentiment.slice(1);
  }
};

export default function ReviewResultCard({
  result,
  selectedRestaurant,
  isWishlistView = false,
  isBasicSummary = false,
  onGetDetailedAnalysis,
  isDetailedAnalysisLoading,
  detailedAnalysisError,
}: ReviewResultCardProps) {
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const { user } = useUser();

  // Check initial bookmark status when component mounts or restaurant changes
  useEffect(() => {
    const checkBookmarkStatus = async () => {
      if (!selectedRestaurant || isWishlistView) return;
      setIsLoading(true); // Show loading indicator while checking
      setError(null);
      try {
        if (!user) {
          setIsBookmarked(false); // Not logged in, cannot be bookmarked
          return;
        }
        const { data, error: fetchError } = await supabase
          .from("bookmarks")
          .select("id")
          .eq("user_id", user.id)
          .eq("place_id", selectedRestaurant.placeId)
          .maybeSingle();

        if (fetchError) throw fetchError;
        setIsBookmarked(!!data); // Set true if data exists, false otherwise
      } catch (err: any) {
        console.error("Error checking bookmark status:", err);
        setError("Could not check bookmark status."); // Inform user
        setIsBookmarked(false);
      } finally {
        setIsLoading(false);
      }
    };
    checkBookmarkStatus();
  }, [selectedRestaurant, isWishlistView, user]);

  const handleWishlistClick = async () => {
    if (!selectedRestaurant || isWishlistView) return;
    setError(null);
    setIsLoading(true);
    setUpdateSuccess(false);
    try {
      if (!user) {
        setError("Please log in to save to wishlist");
        setIsLoading(false);
        return;
      }

      const isDetailed = "positive_keywords" in result;
      const bookmarkData: any = {
        user_id: user.id,
        place_id: selectedRestaurant.placeId,
        restaurant_name: selectedRestaurant.name,
        restaurant_address: selectedRestaurant.address || "",
        image_url: selectedRestaurant.photos?.[0] || "",
        average_rating: result.average_rating,
        sentiment: result.sentiment,
        summary: result.summary,
        is_pro_analysis: isDetailed,
        positive_keywords: isDetailed ? (result as DetailedAnalysisResult).positive_keywords : [],
        negative_keywords: isDetailed ? (result as DetailedAnalysisResult).negative_keywords : [],
        mentioned_menu_items: isDetailed
          ? (result as DetailedAnalysisResult).mentioned_menu_items
          : [],
        recommended_dishes: isDetailed ? (result as DetailedAnalysisResult).recommended_dishes : [],
        photo_urls: isDetailed ? (result as DetailedAnalysisResult).photo_urls : [],
      };

      const wasAlreadyBookmarked = isBookmarked;

      const { error: upsertError } = await supabase
        .from("bookmarks")
        .upsert(bookmarkData, { onConflict: "user_id, place_id" });

      if (upsertError) throw upsertError;

      setIsBookmarked(true);

      if (wasAlreadyBookmarked) {
        setUpdateSuccess(true);
        setTimeout(() => setUpdateSuccess(false), 2000);
      }

      console.log("Bookmark upsert successful");
    } catch (err: any) {
      console.error("Error upserting bookmark:", err);
      setError(err.message || "Failed to save wishlist item.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReviewClick = () => {
    setIsReviewModalOpen(true);
  };

  // 기본 요약인지 확인
  const isBasic = isBasicSummary || ("fromCache" in result && result.fromCache);
  // Type guard for detailed result properties
  const isDetailed = !isBasic && "positive_keywords" in result;
  // Cast result to DetailedAnalysisResult for type safety when accessing detailed fields in JSX
  const detailedResultData = isDetailed ? (result as DetailedAnalysisResult) : null;

  // Determine if the button should show the update state
  const showUpdateState = isBookmarked && isDetailed && !updateSuccess && !isLoading;
  // Determine if the button should show the saved state
  const showSavedState = isBookmarked && !isDetailed && !updateSuccess && !isLoading;
  // Determine if the button should show the add state
  const showAddState = !isBookmarked && !updateSuccess && !isLoading;

  // Determine which photo URLs to use based on the view state
  const photoUrlsToDisplay = isDetailed
    ? detailedResultData?.photo_urls
    : selectedRestaurant?.photos?.slice(0, 1);

  return (
    <div className='bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden flex flex-col h-full'>
      {/* Header Section - Add Address */}
      <div className='p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700'>
        <div className='flex flex-col sm:flex-row justify-between sm:items-start'>
          <div className='mb-3 sm:mb-0'>
            <h2 className='text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1'>
              {selectedRestaurant?.name ?? "Restaurant Analysis"}
            </h2>
            {/* Display Address */}
            {selectedRestaurant?.address && (
              <div className='flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1'>
                <MapPinIcon className='w-4 h-4 mr-1.5 flex-shrink-0' />
                <span>{selectedRestaurant.address}</span>
              </div>
            )}
            <p className='text-xs font-medium text-gray-500 dark:text-gray-400 mt-2 uppercase tracking-wider'>
              AI ANALYSIS REPORT
            </p>
          </div>
          {isBasic && (
            <div className='flex items-center text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-full text-xs font-medium self-start sm:self-center'>
              <SparklesIcon className='w-4 h-4 mr-1.5' />
              <span>Basic Summary</span>
            </div>
          )}
        </div>
      </div>

      {/* Card Body Content Sections - Reverted padding and spacing */}
      <div className='p-4 sm:p-6 space-y-4 flex-grow overflow-y-auto bg-gray-50 dark:bg-gray-800/50'>
        {/* --- Grid Layout for Key Info (Rating, Sentiment) --- */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          {/* Average Rating Section */}
          <SectionWrapper className='bg-yellow-50 dark:bg-yellow-900/20 text-yellow-900 dark:text-yellow-200'>
            <SectionTitle
              icon={StarIcon}
              text='Average Rating'
              className='text-yellow-700 dark:text-yellow-200'
            />
            {renderStars(result?.average_rating)}
          </SectionWrapper>

          {/* Overall Sentiment Section - Updated to show tag */}
          <SectionWrapper className='bg-indigo-50 dark:bg-indigo-900/20 text-indigo-900 dark:text-indigo-200'>
            <SectionTitle
              icon={ChatBubbleLeftRightIcon}
              text='Overall Sentiment'
              className='text-indigo-700 dark:text-indigo-200'
            />
            {/* Render sentiment as a tag like in the image */}
            <Tag
              className={`border-none ${getSentimentBgClass(result.sentiment)} ${getSentimentTextClass(result.sentiment)}`}>
              {formatSentimentText(result.sentiment)}
            </Tag>
          </SectionWrapper>
        </div>

        {/* Summary Section - Reverted styling */}
        <SectionWrapper className='bg-gray-100 dark:bg-gray-700/50 text-gray-900 dark:text-gray-200'>
          <SectionTitle
            icon={DocumentTextIcon}
            text='Summary'
            className='text-gray-700 dark:text-gray-200'
          />
          <p className='text-sm text-gray-700 dark:text-gray-300 leading-relaxed'>
            {result.summary}
          </p>
        </SectionWrapper>

        {/* --- Photos Section (RESTORED Layout from old code) --- */}
        {photoUrlsToDisplay && photoUrlsToDisplay.length > 0 && (
          <SectionWrapper className='bg-gray-100 dark:bg-gray-700/50'>
            <SectionTitle
              icon={PhotoIcon}
              text='Photos'
              className='text-gray-700 dark:text-gray-200'
            />
            {/* Use flexbox with horizontal scroll like old code */}
            <div className='flex overflow-x-auto space-x-3 pb-2 -mb-2'>
              {photoUrlsToDisplay.map(
                (url: string, index: number) =>
                  // Make sure URL is valid before rendering img
                  url ? (
                    <div
                      key={`photo-${url}-${index}`}
                      className='flex-shrink-0 w-40 h-32 sm:w-48 sm:h-40 rounded-lg overflow-hidden shadow-md'>
                      <img
                        src={url}
                        alt={`Restaurant photo ${index + 1}`}
                        className='w-full h-full object-cover'
                        loading='lazy'
                        onError={(e) => {
                          console.error("Image failed to load:", url, e);
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </div>
                  ) : null // Skip rendering if URL is invalid/null/empty
              )}
            </div>
            {/* Optional: Add scroll hint like old code if many photos */}
            {photoUrlsToDisplay.length > 3 && (
              <p className='text-xs text-gray-500 mt-3 text-center'>
                Scroll horizontally to view more photos
              </p>
            )}
          </SectionWrapper>
        )}

        {/* Conditional Rendering: Detailed Analysis or CTA */}
        {isDetailed && detailedResultData ? (
          // --- Detailed Analysis Sections (Roll House Style 2x2 Grid) ---
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-4'>
            {/* Positive Keywords Section */}
            {detailedResultData.positive_keywords && (
              <SectionWrapper className='bg-green-50 dark:bg-green-900/20 text-green-900 dark:text-green-200'>
                <SectionTitle
                  icon={HandThumbUpIcon}
                  text='Positive Keywords'
                  className='text-green-700 dark:text-green-200'
                />
                <div className='flex flex-wrap gap-2'>
                  {detailedResultData.positive_keywords.length > 0 ? (
                    detailedResultData.positive_keywords.map((keyword: string, index: number) => (
                      <Tag
                        key={index}
                        className='border-green-300 dark:border-green-700 text-green-800 dark:text-green-200'>
                        {keyword}
                      </Tag>
                    ))
                  ) : (
                    <p className='text-sm text-gray-500 dark:text-gray-400'>
                      No specific positive keywords identified.
                    </p>
                  )}
                </div>
              </SectionWrapper>
            )}
            {/* Negative Keywords Section */}
            {detailedResultData.negative_keywords && (
              <SectionWrapper className='bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-200'>
                <SectionTitle
                  icon={HandThumbDownIcon}
                  text='Negative Keywords'
                  className='text-red-700 dark:text-red-200'
                />
                <div className='flex flex-wrap gap-2'>
                  {detailedResultData.negative_keywords.length > 0 ? (
                    detailedResultData.negative_keywords.map((keyword: string, index: number) => (
                      <Tag
                        key={index}
                        className='border-red-300 dark:border-red-700 text-red-800 dark:text-red-200'>
                        {keyword}
                      </Tag>
                    ))
                  ) : (
                    <p className='text-sm text-gray-500 dark:text-gray-400'>
                      No specific negative keywords identified.
                    </p>
                  )}
                </div>
              </SectionWrapper>
            )}
            {/* Mentioned Menu Items Section */}
            {detailedResultData.mentioned_menu_items &&
              detailedResultData.mentioned_menu_items.length > 0 && (
                <SectionWrapper className='bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-200'>
                  <SectionTitle
                    icon={ListBulletIcon}
                    text='Mentioned Menu Items'
                    className='text-blue-700 dark:text-blue-200'
                  />
                  <div className='flex flex-wrap gap-2'>
                    {detailedResultData.mentioned_menu_items.map((item: string, index: number) => (
                      <Tag
                        key={index}
                        className='border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-200'>
                        {item}
                      </Tag>
                    ))}
                  </div>
                </SectionWrapper>
              )}
            {/* Recommended Dishes Section */}
            {detailedResultData.recommended_dishes &&
              detailedResultData.recommended_dishes.length > 0 && (
                <SectionWrapper className='bg-orange-50 dark:bg-orange-900/20 text-orange-900 dark:text-orange-200'>
                  <SectionTitle
                    icon={FireIcon}
                    text='Recommended Dishes'
                    className='text-orange-700 dark:text-orange-200'
                  />
                  <div className='flex flex-wrap gap-2'>
                    {detailedResultData.recommended_dishes.map((dish: string, index: number) => (
                      <Tag
                        key={index}
                        className='border-orange-300 dark:border-orange-700 text-orange-800 dark:text-orange-200'>
                        {dish}
                      </Tag>
                    ))}
                  </div>
                </SectionWrapper>
              )}
          </div>
        ) : (
          // --- CTA for Detailed Analysis --- (KEEP Current Style)
          <div className='flex flex-col items-center justify-center bg-indigo-50 dark:bg-indigo-900/30 rounded-xl p-6 mt-4'>
            <SparklesIcon className='w-8 h-8 text-indigo-600 dark:text-indigo-400 mb-3' />
            <h4 className='text-lg font-semibold text-indigo-900 dark:text-indigo-200 mb-2'>
              View Detailed Analysis
            </h4>
            <p className='text-sm text-indigo-700 dark:text-indigo-300 text-center mb-4'>
              Get detailed insights including keywords, menu items, and recommended dishes.
            </p>
            {isDetailedAnalysisLoading ? (
              <div className='flex flex-col items-center'>
                <div className='w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2'></div>
                <p className='text-sm text-indigo-600 dark:text-indigo-400'>Analyzing...</p>
              </div>
            ) : detailedAnalysisError ? (
              <div className='text-center'>
                <p className='text-sm text-red-600 dark:text-red-400 mb-2'>
                  {detailedAnalysisError}
                </p>
                {onGetDetailedAnalysis && (
                  <button
                    onClick={onGetDetailedAnalysis}
                    className='px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium'>
                    Retry Analysis
                  </button>
                )}
              </div>
            ) : (
              onGetDetailedAnalysis && (
                <button
                  onClick={onGetDetailedAnalysis}
                  className='px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium'>
                  Get Detailed Analysis
                </button>
              )
            )}
          </div>
        )}
      </div>

      {/* Footer Section - Reverted padding and background */}
      <div className='p-4 sm:p-6 bg-gray-100 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 mt-auto'>
        {!isWishlistView && (
          <div className='flex flex-col sm:flex-row gap-3 justify-center mb-4'>
            <button
              onClick={handleWishlistClick}
              disabled={isLoading}
              className={`flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900 w-full sm:w-auto ${
                isLoading
                  ? "opacity-50 cursor-wait bg-gray-200 dark:bg-gray-700 text-gray-500"
                  : updateSuccess
                    ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                    : showUpdateState // Condition for update style
                      ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 focus:ring-indigo-500"
                      : showSavedState // Condition for saved style
                        ? "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600"
                        : showAddState // Condition for add style (default)
                          ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50 focus:ring-red-500"
                          : "bg-gray-200 dark:bg-gray-700 text-gray-500" // Fallback style
              }`}>
              {/* Icon Logic */}
              {isLoading ? (
                <svg
                  className='animate-spin -ml-1 mr-2 h-5 w-5'
                  xmlns='http://www.w3.org/2000/svg'
                  fill='none'
                  viewBox='0 0 24 24'>
                  <circle
                    className='opacity-25'
                    cx='12'
                    cy='12'
                    r='10'
                    stroke='currentColor'
                    strokeWidth='4'></circle>
                  <path
                    className='opacity-75'
                    fill='currentColor'
                    d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'></path>
                </svg>
              ) : updateSuccess ? (
                <CheckCircleIcon className='w-5 h-5' /> // Keep check for success
              ) : showUpdateState ? (
                <ArrowPathIcon className='w-5 h-5' /> // Update icon
              ) : isBookmarked ? (
                <BookmarkIconSolid className='w-5 h-5' /> // Saved icon
              ) : (
                <BookmarkIconOutline className='w-5 h-5' /> // Add icon
              )}

              {/* Text Logic */}
              <span>
                {isLoading
                  ? "Saving..."
                  : updateSuccess
                    ? "Updated!"
                    : showUpdateState
                      ? "Update Wishlist" // Update text
                      : isBookmarked
                        ? "Saved to Wishlist" // Saved text
                        : "Add to Wishlist"}{" "}
                {/* Add text */}
              </span>
            </button>

            {/* Write Review Button */}
            <button
              onClick={handleReviewClick}
              className='flex items-center justify-center gap-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 px-5 py-2.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 w-full sm:w-auto'>
              <PencilSquareIcon className='w-5 h-5' />
              <span>Write Review</span>
            </button>
          </div>
        )}
        {error && (
          <div className='mt-3 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md text-center text-sm'>
            {error}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {isReviewModalOpen && selectedRestaurant && (
        <ReviewForm
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          restaurantId={selectedRestaurant.placeId}
          restaurantName={selectedRestaurant.name}
        />
      )}
    </div>
  );
}
