import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import {
  XMarkIcon,
  StarIcon,
  ChatBubbleLeftRightIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
  ListBulletIcon,
  FireIcon,
  PencilSquareIcon,
  PhotoIcon,
  SparklesIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import { AnalysisResult, DetailedAnalysisResult } from "@/types";
import { supabase } from "@/lib/supabaseClient";
import { useUser } from "@/hooks/useUser";
import AuthModal from "@/components/auth/AuthModal";

interface AnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: AnalysisResult;
  restaurantName: string;
  placeId: string;
  onReviewClick: () => void;
  isProAnalysis?: boolean;
  onUpdate?: () => void;
}

const renderStarsModal = (rating: number) => {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
  return (
    <div className='flex items-center'>
      {[...Array(fullStars)].map((_, i) => (
        <StarIcon key={`modal-full-${i}`} className='w-5 h-5 text-yellow-400' />
      ))}
      {halfStar && <StarIcon key='modal-half' className='w-5 h-5 text-yellow-400 opacity-50' />}
      {[...Array(emptyStars)].map((_, i) => (
        <StarIcon key={`modal-empty-${i}`} className='w-5 h-5 text-gray-300' />
      ))}
      <span className='ml-2 text-sm font-medium text-gray-600 dark:text-gray-400'>
        ({rating.toFixed(1)})
      </span>
    </div>
  );
};

const formatSentimentText = (sentiment: string | undefined | null) => {
  if (typeof sentiment !== "string" || sentiment.length === 0) {
    return "N/A";
  }
  return sentiment.charAt(0).toUpperCase() + sentiment.slice(1);
};

const ModalSectionWrapper: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = "",
}) => <div className={`rounded-xl p-4 ${className}`}>{children}</div>;

const ModalSectionTitle: React.FC<{
  icon: React.ElementType;
  text: string;
  className?: string;
}> = ({ icon: Icon, text, className = "" }) => (
  <div className={`flex items-center gap-2 mb-3 ${className}`}>
    <Icon className='w-5 h-5 flex-shrink-0' />
    <h4 className='text-base font-semibold'>{text}</h4>
  </div>
);

const Tag: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = "",
}) => (
  <span
    className={`inline-block px-3 py-1 rounded-full text-sm border bg-white dark:bg-gray-700 ${className}`}>
    {children}
  </span>
);

export default function AnalysisModal({
  isOpen,
  onClose,
  result: initialResult,
  restaurantName,
  placeId,
  onReviewClick,
  isProAnalysis: initialIsProAnalysis = false,
  onUpdate,
}: AnalysisModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DetailedAnalysisResult | AnalysisResult>(initialResult);
  const [isProAnalysis, setIsProAnalysis] = useState(
    initialIsProAnalysis || "positive_keywords" in initialResult
  );
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { user } = useUser();

  useEffect(() => {
    setResult(initialResult);
    setIsProAnalysis(initialIsProAnalysis || "positive_keywords" in initialResult);
  }, [initialResult, initialIsProAnalysis]);

  if (!isOpen) return null;

  const handleReviewClickLocal = (e: React.MouseEvent) => {
    e.stopPropagation();
    onReviewClick();
    onClose();
  };

  const handleCancelAnalysis = () => {
    setShowCancelConfirm(true);
  };

  const handleConfirmCancel = () => {
    onClose();
    setShowCancelConfirm(false);
  };

  const handleGetDetailedAnalysis = async () => {
    if (typeof window !== "undefined") {
      const demoUsed = localStorage.getItem("demo_free_analysis_used") === "true";
      if (demoUsed) {
        router.push("/pricing");
        return;
      }
    }
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      if (!accessToken) {
        throw new Error("Login required to analyze reviews.");
      }

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          placeId,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          router.push("/pricing");
          return;
        }
        throw new Error(
          responseData.error || `Analysis request failed with status ${response.status}.`
        );
      }

      if (!responseData || !responseData.data || !responseData.data.sentiment) {
        console.error("Invalid data structure received from /api/analyze:", responseData);
        throw new Error("Received invalid analysis data from the server.");
      }

      const detailedData = responseData.data as DetailedAnalysisResult;

      const { error: updateError } = await supabase
        .from("bookmarks")
        .update({
          positive_keywords: detailedData.positive_keywords,
          negative_keywords: detailedData.negative_keywords,
          mentioned_menu_items: detailedData.mentioned_menu_items,
          recommended_dishes: detailedData.recommended_dishes,
          summary: detailedData.summary,
          photo_urls: detailedData.photo_urls,
          average_rating: detailedData.average_rating,
          sentiment: detailedData.sentiment,
          is_pro_analysis: true,
        })
        .eq("user_id", user.id)
        .eq("place_id", placeId);

      if (updateError) {
        console.error("Error updating bookmark after analysis:", updateError);
      }

      setResult(detailedData);
      setIsProAnalysis(true);

      if (onUpdate) {
        onUpdate();
      }
    } catch (err: any) {
      if (!String(err.message).includes("Subscription required")) {
        setError(err.message || "An error occurred during analysis.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    handleGetDetailedAnalysis();
  };

  const getSentimentBgClass = (sentiment: string | undefined | null) => {
    switch (sentiment) {
      case "positive":
        return "bg-green-100 dark:bg-green-900/30";
      case "negative":
        return "bg-red-100 dark:bg-red-900/30";
      case "mixed":
        return "bg-yellow-100 dark:bg-yellow-900/30";
      default:
        return "bg-gray-100 dark:bg-gray-700/50";
    }
  };

  const getSentimentTextClass = (sentiment: string | undefined | null) => {
    switch (sentiment) {
      case "positive":
        return "text-green-800 dark:text-green-300";
      case "negative":
        return "text-red-800 dark:text-red-300";
      case "mixed":
        return "text-yellow-800 dark:text-yellow-300";
      default:
        return "text-gray-700 dark:text-gray-300";
    }
  };

  return (
    <>
      <div className='fixed inset-0 z-50 overflow-y-auto'>
        <div className='flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0'>
          <div
            className='fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75'
            onClick={onClose}
            aria-hidden='true'
          />

          <div className='relative inline-block w-full max-w-3xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white/95 dark:bg-gray-950/90 shadow-2xl rounded-2xl border border-slate-200/70 dark:border-slate-800/80 backdrop-blur-xl'>
            <div className='flex justify-between items-center mb-6'>
              <h3 className='text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white'>
                {restaurantName}
              </h3>
              <div className='flex items-center gap-2'>
                {!isProAnalysis && loading && (
                  <button
                    onClick={handleCancelAnalysis}
                    className='p-1 text-gray-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-500 dark:hover:text-gray-300 transition-colors'
                    title='Cancel Analysis'>
                    <span className='sr-only'>Cancel Analysis</span>
                    <XMarkIcon className='w-6 h-6' />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className='p-1 text-gray-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-500 dark:hover:text-gray-300 transition-colors'
                  title='Close Modal'>
                  <span className='sr-only'>Close</span>
                  <XMarkIcon className='w-6 h-6' />
                </button>
              </div>
            </div>

            <div className='space-y-4 max-h-[70vh] overflow-y-auto pr-2'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <ModalSectionWrapper className='bg-yellow-50 dark:bg-yellow-900/20 text-yellow-900 dark:text-yellow-200'>
                  <ModalSectionTitle
                    icon={StarIcon}
                    text='Average Rating'
                    className='text-yellow-700 dark:text-yellow-200'
                  />
                  {renderStarsModal(result?.average_rating || 0)}
                </ModalSectionWrapper>
                <ModalSectionWrapper className='bg-indigo-50 dark:bg-indigo-900/20 text-indigo-900 dark:text-indigo-200'>
                  <ModalSectionTitle
                    icon={ChatBubbleLeftRightIcon}
                    text='Overall Sentiment'
                    className='text-indigo-700 dark:text-indigo-200'
                  />
                  <Tag
                    className={`border-none ${getSentimentBgClass(result?.sentiment)} ${getSentimentTextClass(result?.sentiment)}`}>
                    {formatSentimentText(result?.sentiment)}
                  </Tag>
                </ModalSectionWrapper>
              </div>

              <ModalSectionWrapper className='bg-gray-100 dark:bg-gray-700/50'>
                <ModalSectionTitle
                  icon={DocumentTextIcon}
                  text='Summary'
                  className='text-gray-700 dark:text-gray-200'
                />
                <p className='text-sm text-gray-700 dark:text-gray-300 leading-relaxed'>
                  {result?.summary || "Summary not available."}
                </p>
              </ModalSectionWrapper>

              {isProAnalysis && "positive_keywords" in result ? (
                <>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    {(result as DetailedAnalysisResult).positive_keywords && (
                      <ModalSectionWrapper className='bg-green-50 dark:bg-green-900/20 text-green-900 dark:text-green-200'>
                        <ModalSectionTitle
                          icon={HandThumbUpIcon}
                          text='Positive Keywords'
                          className='text-green-700 dark:text-green-200'
                        />
                        <div className='flex flex-wrap gap-2'>
                          {(result as DetailedAnalysisResult).positive_keywords.length > 0 ? (
                            (result as DetailedAnalysisResult).positive_keywords.map(
                              (keyword, index) => (
                                <Tag
                                  key={index}
                                  className='border-green-300 dark:border-green-700 text-green-800 dark:text-green-200'>
                                  {keyword}
                                </Tag>
                              )
                            )
                          ) : (
                            <p className='text-sm text-gray-500 dark:text-gray-400'>
                              No specific positive keywords identified.
                            </p>
                          )}
                        </div>
                      </ModalSectionWrapper>
                    )}
                    {(result as DetailedAnalysisResult).negative_keywords && (
                      <ModalSectionWrapper className='bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-200'>
                        <ModalSectionTitle
                          icon={HandThumbDownIcon}
                          text='Negative Keywords'
                          className='text-red-700 dark:text-red-200'
                        />
                        <div className='flex flex-wrap gap-2'>
                          {(result as DetailedAnalysisResult).negative_keywords.length > 0 ? (
                            (result as DetailedAnalysisResult).negative_keywords.map(
                              (keyword, index) => (
                                <Tag
                                  key={index}
                                  className='border-red-300 dark:border-red-700 text-red-800 dark:text-red-200'>
                                  {keyword}
                                </Tag>
                              )
                            )
                          ) : (
                            <p className='text-sm text-gray-500 dark:text-gray-400'>
                              No specific negative keywords identified.
                            </p>
                          )}
                        </div>
                      </ModalSectionWrapper>
                    )}
                    {(result as DetailedAnalysisResult).mentioned_menu_items &&
                      (result as DetailedAnalysisResult).mentioned_menu_items.length > 0 && (
                        <ModalSectionWrapper className='bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-200'>
                          <ModalSectionTitle
                            icon={ListBulletIcon}
                            text='Mentioned Menu Items'
                            className='text-blue-700 dark:text-blue-200'
                          />
                          <div className='flex flex-wrap gap-2'>
                            {(result as DetailedAnalysisResult).mentioned_menu_items.map(
                              (item, index) => (
                                <Tag
                                  key={index}
                                  className='border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-200'>
                                  {item}
                                </Tag>
                              )
                            )}
                          </div>
                        </ModalSectionWrapper>
                      )}
                    {(result as DetailedAnalysisResult).recommended_dishes &&
                      (result as DetailedAnalysisResult).recommended_dishes.length > 0 && (
                        <ModalSectionWrapper className='bg-orange-50 dark:bg-orange-900/20 text-orange-900 dark:text-orange-200'>
                          <ModalSectionTitle
                            icon={FireIcon}
                            text='Recommended Dishes'
                            className='text-orange-700 dark:text-orange-200'
                          />
                          <div className='flex flex-wrap gap-2'>
                            {(result as DetailedAnalysisResult).recommended_dishes.map(
                              (dish, index) => (
                                <Tag
                                  key={index}
                                  className='border-orange-300 dark:border-orange-700 text-orange-800 dark:text-orange-200'>
                                  {dish}
                                </Tag>
                              )
                            )}
                          </div>
                        </ModalSectionWrapper>
                      )}
                  </div>

                  {(result as DetailedAnalysisResult).photo_urls &&
                    (result as DetailedAnalysisResult).photo_urls!.length > 0 && (
                      <ModalSectionWrapper className='bg-gray-100 dark:bg-gray-700/50'>
                        <ModalSectionTitle
                          icon={PhotoIcon}
                          text='Photos'
                          className='text-gray-700 dark:text-gray-200'
                        />
                        <div className='grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3'>
                          {(result as DetailedAnalysisResult).photo_urls!.map(
                            (url, index) =>
                              url && (
                                <div
                                  key={`photo-${index}`}
                                  className='aspect-w-1 aspect-h-1 rounded-lg overflow-hidden shadow-sm'>
                                  <img
                                    src={url}
                                    alt={`Restaurant photo ${index + 1}`}
                                    className='w-full h-full object-cover'
                                    loading='lazy'
                                    onError={(e) => {
                                      console.error("Image failed to load:", url);
                                      (e.target as HTMLImageElement).style.display = "none";
                                    }}
                                  />
                                </div>
                              )
                          )}
                        </div>
                      </ModalSectionWrapper>
                    )}
                </>
              ) : (
                <div className='flex flex-col items-center justify-center bg-indigo-50 dark:bg-indigo-900/30 rounded-xl p-6 mt-4'>
                  <SparklesIcon className='w-8 h-8 text-indigo-600 dark:text-indigo-400 mb-3' />
                  <h4 className='text-lg font-semibold text-indigo-900 dark:text-indigo-200 mb-2'>
                    View Detailed Analysis
                  </h4>
                  <p className='text-sm text-indigo-700 dark:text-indigo-300 text-center mb-4'>
                    Get detailed insights including keywords, menu items, and recommended dishes.
                  </p>
                  {loading ? (
                    <div className='flex flex-col items-center'>
                      <div className='w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2'></div>
                      <p className='text-sm text-indigo-600 dark:text-indigo-400'>Analyzing...</p>
                    </div>
                  ) : error ? (
                    <div className='text-center'>
                      <p className='text-sm text-red-600 dark:text-red-400 mb-2'>{error}</p>
                      <button
                        onClick={handleGetDetailedAnalysis}
                        className='px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium'>
                        Retry Analysis
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleGetDetailedAnalysis}
                      className='px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium'>
                      Get Detailed Analysis
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className='mt-6 flex justify-end gap-3'>
              <button
                onClick={handleReviewClickLocal}
                className='flex items-center gap-2 px-4 py-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors text-sm font-medium'>
                <PencilSquareIcon className='w-5 h-5' />
                <span>Write Review</span>
              </button>
            </div>
          </div>
        </div>

        {showCancelConfirm && (
          <div className='fixed inset-0 z-50 overflow-y-auto'>
            <div className='flex items-center justify-center min-h-screen'>
              <div
                className='fixed inset-0 bg-black bg-opacity-50 transition-opacity'
                aria-hidden='true'></div>
              <div className='relative bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm mx-4 shadow-xl'>
                <h3 className='text-lg font-medium text-gray-900 dark:text-white mb-4'>
                  Cancel Analysis?
                </h3>
                <p className='text-sm text-gray-500 dark:text-gray-400 mb-6'>
                  If you cancel, the current analysis progress will not be saved.
                </p>
                <div className='flex justify-end gap-3'>
                  <button
                    onClick={() => setShowCancelConfirm(false)}
                    className='px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors'>
                    Keep Analyzing
                  </button>
                  <button
                    onClick={handleConfirmCancel}
                    className='px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium'>
                    Cancel Analysis
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </>
  );
}
