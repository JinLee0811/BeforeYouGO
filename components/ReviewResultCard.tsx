import React, { useState } from "react";
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
  SparklesIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/router";

interface ReviewResultCardProps {
  result: AnalysisResult | BasicSummaryResult;
  selectedRestaurant?: {
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
  /** When false (e.g. analysis admin), hide pricing upsell under “Get detailed analysis”. */
  showMembershipUpsell?: boolean;
  onWishlistClick?: () => void;
  onReviewClick?: () => void;
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
    <h3 className='byg-title text-base font-medium'>{text}</h3>
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
  selectedRestaurant = null,
  isWishlistView = false,
  isBasicSummary = false,
  onGetDetailedAnalysis,
  isDetailedAnalysisLoading,
  detailedAnalysisError,
  showMembershipUpsell = true,
}: ReviewResultCardProps) {
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // 기본 요약인지 확인
  const isBasic = isBasicSummary || ("fromCache" in result && result.fromCache);
  // Type guard for detailed result properties
  const isDetailed = !isBasic && "positive_keywords" in result;
  // Cast result to DetailedAnalysisResult for type safety when accessing detailed fields in JSX
  const detailedResultData = isDetailed ? (result as DetailedAnalysisResult) : null;

  // Determine which photo URLs to use based on the view state
  const photoUrlsToDisplay = isDetailed
    ? detailedResultData?.photo_urls
    : selectedRestaurant?.photos?.slice(0, 1);

  return (
    <div className='byg-panel flex h-full flex-col overflow-hidden rounded-2xl'>
      {/* Header Section - Add Address */}
      <div className='border-b border-indigo-100 p-4 sm:p-6'>
        <div className='flex flex-col sm:flex-row justify-between sm:items-start'>
          <div className='mb-3 sm:mb-0'>
            <h2 className='byg-title mb-1 text-xl font-bold text-slate-900 sm:text-2xl'>
              {selectedRestaurant?.name ?? "Restaurant Analysis"}
            </h2>
            {/* Display Address */}
            {selectedRestaurant?.address && (
              <div className='mt-1 flex items-center text-sm text-slate-500'>
                <MapPinIcon className='w-4 h-4 mr-1.5 flex-shrink-0' />
                <span>{selectedRestaurant.address}</span>
              </div>
            )}
            <p className='mt-2 text-xs font-medium uppercase tracking-wider text-slate-500'>
              AI ANALYSIS REPORT
            </p>
          </div>
          {isBasic && (
            <div className='self-start rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600 sm:self-center'>
              <SparklesIcon className='w-4 h-4 mr-1.5' />
              <span>Basic Summary</span>
            </div>
          )}
        </div>
      </div>

      {/* Card Body Content Sections - Reverted padding and spacing */}
      <div className='flex-grow space-y-4 overflow-y-auto bg-slate-50/70 p-4 sm:p-6'>
        {/* --- Grid Layout for Key Info (Rating, Sentiment) --- */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          {/* Average Rating Section */}
          <SectionWrapper className='bg-yellow-50 text-yellow-900'>
            <SectionTitle
              icon={StarIcon}
              text='Average Rating'
              className='text-yellow-700'
            />
            {renderStars(result?.average_rating)}
          </SectionWrapper>

          {/* Overall Sentiment Section - Updated to show tag */}
          <SectionWrapper className='bg-indigo-50 text-indigo-900'>
            <SectionTitle
              icon={ChatBubbleLeftRightIcon}
              text='Overall Sentiment'
              className='text-indigo-700'
            />
            {/* Render sentiment as a tag like in the image */}
            <Tag
              className={`border-none ${getSentimentBgClass(result.sentiment)} ${getSentimentTextClass(result.sentiment)}`}>
              {formatSentimentText(result.sentiment)}
            </Tag>
          </SectionWrapper>
        </div>

        {/* Summary Section - Reverted styling */}
        <SectionWrapper className='bg-white text-slate-900'>
          <SectionTitle
            icon={DocumentTextIcon}
            text='Summary'
            className='text-slate-700'
          />
          <p className='text-sm leading-relaxed text-slate-700'>
            {result.summary}
          </p>
        </SectionWrapper>

        {/* --- Photos Section (RESTORED Layout from old code) --- */}
        {photoUrlsToDisplay && photoUrlsToDisplay.length > 0 && (
          <SectionWrapper className='bg-white'>
            <SectionTitle
              icon={PhotoIcon}
              text='Photos'
              className='text-slate-700'
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
              <p className='mt-3 text-center text-xs text-slate-500'>
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
              <SectionWrapper className='bg-green-50 text-green-900'>
                <SectionTitle
                  icon={HandThumbUpIcon}
                  text='Positive Keywords'
                  className='text-green-700'
                />
                <div className='flex flex-wrap gap-2'>
                  {detailedResultData.positive_keywords.length > 0 ? (
                    detailedResultData.positive_keywords.map((keyword: string, index: number) => (
                      <Tag
                        key={index}
                        className='border-green-300 text-green-800'>
                        {keyword}
                      </Tag>
                    ))
                  ) : (
                    <p className='text-sm text-slate-500'>
                      No specific positive keywords identified.
                    </p>
                  )}
                </div>
              </SectionWrapper>
            )}
            {/* Negative Keywords Section */}
            {detailedResultData.negative_keywords && (
              <SectionWrapper className='bg-red-50 text-red-900'>
                <SectionTitle
                  icon={HandThumbDownIcon}
                  text='Negative Keywords'
                  className='text-red-700'
                />
                <div className='flex flex-wrap gap-2'>
                  {detailedResultData.negative_keywords.length > 0 ? (
                    detailedResultData.negative_keywords.map((keyword: string, index: number) => (
                      <Tag
                        key={index}
                        className='border-red-300 text-red-800'>
                        {keyword}
                      </Tag>
                    ))
                  ) : (
                    <p className='text-sm text-slate-500'>
                      No specific negative keywords identified.
                    </p>
                  )}
                </div>
              </SectionWrapper>
            )}
            {/* Mentioned Menu Items Section */}
            {detailedResultData.mentioned_menu_items &&
              detailedResultData.mentioned_menu_items.length > 0 && (
                <SectionWrapper className='bg-blue-50 text-blue-900'>
                  <SectionTitle
                    icon={ListBulletIcon}
                    text='Mentioned Menu Items'
                    className='text-blue-700'
                  />
                  <div className='flex flex-wrap gap-2'>
                    {detailedResultData.mentioned_menu_items.map((item: string, index: number) => (
                      <Tag
                        key={index}
                        className='border-blue-300 text-blue-800'>
                        {item}
                      </Tag>
                    ))}
                  </div>
                </SectionWrapper>
              )}
            {/* Recommended Dishes Section */}
            {detailedResultData.recommended_dishes &&
              detailedResultData.recommended_dishes.length > 0 && (
                <SectionWrapper className='bg-orange-50 text-orange-900'>
                  <SectionTitle
                    icon={FireIcon}
                    text='Recommended Dishes'
                    className='text-orange-700'
                  />
                  <div className='flex flex-wrap gap-2'>
                    {detailedResultData.recommended_dishes.map((dish: string, index: number) => (
                      <Tag
                        key={index}
                        className='border-orange-300 text-orange-800'>
                        {dish}
                      </Tag>
                    ))}
                  </div>
                </SectionWrapper>
              )}
          </div>
        ) : (
          // --- Detailed analysis CTA (runs /api/analyze) or membership upsell if no handler ---
          <div className='mt-4 flex flex-col items-center justify-center rounded-xl bg-indigo-50 p-6'>
            <SparklesIcon className='mb-3 h-8 w-8 text-indigo-600' />
            <h4 className='byg-title mb-2 text-lg font-semibold text-indigo-900'>
              {onGetDetailedAnalysis ? "Detailed analysis" : "Unlock detailed analysis"}
            </h4>
            <p className='mb-4 text-center text-sm text-indigo-700'>
              {onGetDetailedAnalysis
                ? "Run AI keyword, menu mention, and recommended-dish breakdown for this place."
                : "Upgrade to see keyword breakdowns, dishes reviewers mention, and recommendations. Basic summaries stay free."}
            </p>
            {onGetDetailedAnalysis ? (
              <>
                <button
                  type='button'
                  onClick={() => onGetDetailedAnalysis()}
                  disabled={isDetailedAnalysisLoading}
                  className='byg-btn-primary disabled:cursor-not-allowed disabled:opacity-60'>
                  {isDetailedAnalysisLoading ? "Running detailed analysis…" : "Get detailed analysis"}
                </button>
                {detailedAnalysisError && (
                  <p className='mt-3 text-center text-sm text-red-600' role='alert'>
                    {detailedAnalysisError}
                  </p>
                )}
                {showMembershipUpsell && (
                  <button
                    type='button'
                    onClick={() => router.push("/pricing")}
                    className='mt-4 text-sm text-indigo-600 underline hover:text-indigo-800'>
                    View plans & pricing
                  </button>
                )}
              </>
            ) : (
              <button
                type='button'
                onClick={() => router.push("/pricing")}
                className='byg-btn-primary'>
                View plans & pricing
              </button>
            )}
          </div>
        )}
      </div>

      {/* Footer actions removed for now (wishlist & write review) */}
    </div>
  );
}
