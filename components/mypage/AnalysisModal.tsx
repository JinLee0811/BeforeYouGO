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
      <span className='ml-2 text-sm font-medium text-gray-600'>({rating.toFixed(1)})</span>
    </div>
  );
};

export default function AnalysisModal({
  isOpen,
  onClose,
  result: initialResult,
  restaurantName,
  placeId,
  onReviewClick,
  isProAnalysis: initialIsProAnalysis,
  onUpdate,
}: AnalysisModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DetailedAnalysisResult | null>(null);
  const [isProAnalysis, setIsProAnalysis] = useState(initialIsProAnalysis);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const { user, isProUser } = useUser();

  useEffect(() => {
    setResult(initialResult as DetailedAnalysisResult);
  }, [initialResult]);

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
    setLoading(true);
    setError(null);

    try {
      if (!user) {
        setError("로그인이 필요합니다.");
        return;
      }

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          placeId,
          userId: user.id,
        }),
      });

      if (!response.ok) {
        throw new Error("분석 중 오류가 발생했습니다.");
      }

      const data = await response.json();

      // Update bookmark with new analysis
      const { error: updateError } = await supabase
        .from("bookmarks")
        .update({
          positive_keywords: data.positive_keywords,
          negative_keywords: data.negative_keywords,
          mentioned_menu_items: data.mentioned_menu_items,
          recommended_dishes: data.recommended_dishes,
          summary: data.summary,
          photo_urls: data.photo_urls,
          is_pro_analysis: true,
        })
        .eq("user_id", user.id)
        .eq("place_id", placeId);

      if (updateError) {
        throw updateError;
      }

      setResult(data);
      setIsProAnalysis(true);
      if (onUpdate) {
        onUpdate();
      }
    } catch (err: any) {
      setError(err.message || "분석 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const getSentimentBgClass = (sentiment: string) => {
    // Implement sentiment background logic here
    return "bg-gray-100";
  };

  const getSentimentTextClass = (sentiment: string) => {
    // Implement sentiment text logic here
    return "text-gray-800";
  };

  const formatSentimentText = (sentiment: string) => {
    // Implement sentiment format logic here
    return sentiment;
  };

  return (
    <div className='fixed inset-0 z-50 overflow-y-auto'>
      <div className='flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0'>
        <div
          className='fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75'
          onClick={onClose}
          aria-hidden='true'
        />

        <div className='relative inline-block w-full max-w-3xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-2xl'>
          <div className='flex justify-between items-center mb-6'>
            <h3 className='text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white'>
              {restaurantName}
            </h3>
            <div className='flex items-center gap-2'>
              {!isProAnalysis && (
                <button
                  onClick={handleCancelAnalysis}
                  className='p-1 text-gray-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-500 dark:hover:text-gray-300 transition-colors'>
                  <span className='sr-only'>Cancel Analysis</span>
                  <XMarkIcon className='w-6 h-6' />
                </button>
              )}
              <button
                onClick={onClose}
                className='p-1 text-gray-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-500 dark:hover:text-gray-300 transition-colors'>
                <span className='sr-only'>Close</span>
                <XMarkIcon className='w-6 h-6' />
              </button>
            </div>
          </div>

          <div className='space-y-4 max-h-[70vh] overflow-y-auto pr-2'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='bg-yellow-50 dark:bg-yellow-900/30 rounded-xl p-4'>
                <div className='flex items-center gap-2 mb-2 text-yellow-700 dark:text-yellow-200'>
                  <StarIcon className='w-5 h-5' />
                  <h4 className='text-base font-semibold'>Average Rating</h4>
                </div>
                {renderStarsModal(result?.average_rating || 0)}
              </div>
              <div className='bg-indigo-50 dark:bg-indigo-900/40 rounded-xl p-4'>
                <div className='flex items-center gap-2 mb-2 text-indigo-700 dark:text-indigo-200'>
                  <ChatBubbleLeftRightIcon className='w-5 h-5' />
                  <h4 className='text-base font-semibold'>Overall Sentiment</h4>
                </div>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getSentimentBgClass(result?.sentiment || "")} ${getSentimentTextClass(result?.sentiment || "")}`}>
                  {formatSentimentText(result?.sentiment || "")}
                </span>
              </div>
            </div>

            <div className='bg-gray-100 dark:bg-gray-700/50 rounded-xl p-4'>
              <div className='flex items-center gap-2 mb-3 text-gray-700 dark:text-gray-200'>
                <DocumentTextIcon className='w-5 h-5' />
                <h4 className='text-base font-semibold'>Summary</h4>
              </div>
              <p className='text-sm text-gray-700 dark:text-gray-300'>{result?.summary || ""}</p>
            </div>

            {isProAnalysis ? (
              <>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  {result?.positive_keywords && (
                    <div className='bg-green-50 dark:bg-green-900/30 rounded-xl p-4'>
                      <div className='flex items-center gap-2 mb-3 text-green-700 dark:text-green-200'>
                        <HandThumbUpIcon className='w-5 h-5' />
                        <h4 className='text-base font-semibold'>Positive Keywords</h4>
                      </div>
                      <div className='flex flex-wrap gap-2'>
                        {result.positive_keywords.length > 0 ? (
                          result.positive_keywords.map((keyword, index) => (
                            <span
                              key={index}
                              className='px-3 py-1 bg-white dark:bg-gray-700 border border-green-200 dark:border-green-600/50 rounded-full text-sm text-green-800 dark:text-green-200'>
                              {keyword}
                            </span>
                          ))
                        ) : (
                          <p className='text-sm text-gray-500 dark:text-gray-400'>
                            No specific positive keywords identified.
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {result?.negative_keywords && (
                    <div className='bg-red-50 dark:bg-red-900/30 rounded-xl p-4'>
                      <div className='flex items-center gap-2 mb-3 text-red-700 dark:text-red-200'>
                        <HandThumbDownIcon className='w-5 h-5' />
                        <h4 className='text-base font-semibold'>Negative Keywords</h4>
                      </div>
                      <div className='flex flex-wrap gap-2'>
                        {result.negative_keywords.length > 0 ? (
                          result.negative_keywords.map((keyword, index) => (
                            <span
                              key={index}
                              className='px-3 py-1 bg-white dark:bg-gray-700 border border-red-200 dark:border-red-600/50 rounded-full text-sm text-red-800 dark:text-red-200'>
                              {keyword}
                            </span>
                          ))
                        ) : (
                          <p className='text-sm text-gray-500 dark:text-gray-400'>
                            No specific negative keywords identified.
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {result?.mentioned_menu_items && (
                    <div className='bg-blue-50 dark:bg-blue-900/30 rounded-xl p-4'>
                      <div className='flex items-center gap-2 mb-3 text-blue-700 dark:text-blue-200'>
                        <ListBulletIcon className='w-5 h-5' />
                        <h4 className='text-base font-semibold'>Mentioned Menu Items</h4>
                      </div>
                      <div className='flex flex-wrap gap-2'>
                        {result.mentioned_menu_items.length > 0 ? (
                          result.mentioned_menu_items.map((item, index) => (
                            <span
                              key={index}
                              className='px-3 py-1 bg-white dark:bg-gray-700 border border-blue-200 dark:border-blue-600/50 rounded-full text-sm text-blue-800 dark:text-blue-200'>
                              {item}
                            </span>
                          ))
                        ) : (
                          <p className='text-sm text-gray-500 dark:text-gray-400'>
                            No specific menu items mentioned.
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {result?.recommended_dishes && (
                    <div className='bg-orange-50 dark:bg-orange-900/30 rounded-xl p-4'>
                      <div className='flex items-center gap-2 mb-3 text-orange-700 dark:text-orange-200'>
                        <FireIcon className='w-5 h-5' />
                        <h4 className='text-base font-semibold'>Recommended Dishes</h4>
                      </div>
                      <div className='flex flex-wrap gap-2'>
                        {result.recommended_dishes.length > 0 ? (
                          result.recommended_dishes.map((dish, index) => (
                            <span
                              key={index}
                              className='px-3 py-1 bg-white dark:bg-gray-700 border border-orange-200 dark:border-orange-600/50 rounded-full text-sm text-orange-800 dark:text-orange-200'>
                              {dish}
                            </span>
                          ))
                        ) : (
                          <p className='text-sm text-gray-500 dark:text-gray-400'>
                            No specific dishes recommended.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {result?.photo_urls && result.photo_urls.length > 0 && (
                  <div className='bg-gray-100 dark:bg-gray-700/50 rounded-xl p-4'>
                    <div className='flex items-center gap-2 mb-3 text-gray-700 dark:text-gray-200'>
                      <PhotoIcon className='w-5 h-5' />
                      <h4 className='text-base font-semibold'>Photos</h4>
                    </div>
                    <div className='grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3'>
                      {result.photo_urls.map((url, index) => (
                        <div
                          key={index}
                          className='aspect-w-1 aspect-h-1 rounded-lg overflow-hidden shadow-sm'>
                          <img
                            src={url}
                            alt={`Restaurant photo ${index + 1}`}
                            className='w-full h-full object-cover'
                          />
                        </div>
                      ))}
                    </div>
                  </div>
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
                    <p className='text-sm text-indigo-600 dark:text-indigo-400'>분석 중...</p>
                  </div>
                ) : error ? (
                  <div className='text-center'>
                    <p className='text-sm text-red-600 dark:text-red-400 mb-2'>{error}</p>
                    <button
                      onClick={handleGetDetailedAnalysis}
                      className='px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors'>
                      다시 시도
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleGetDetailedAnalysis}
                    className='px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors'>
                    Get Detailed Analysis
                  </button>
                )}
              </div>
            )}
          </div>

          <div className='mt-6 flex justify-end gap-3'>
            <button
              onClick={handleReviewClickLocal}
              className='flex items-center gap-2 px-4 py-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors'>
              <PencilSquareIcon className='w-5 h-5' />
              <span>Write Review</span>
            </button>
          </div>
        </div>
      </div>

      {showCancelConfirm && (
        <div className='fixed inset-0 z-50 overflow-y-auto'>
          <div className='flex items-center justify-center min-h-screen'>
            <div className='fixed inset-0 bg-black bg-opacity-50 transition-opacity'></div>
            <div className='relative bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm mx-4'>
              <h3 className='text-lg font-medium text-gray-900 dark:text-white mb-4'>
                취소하시겠습니까?
              </h3>
              <p className='text-sm text-gray-500 dark:text-gray-400 mb-6'>
                분석을 취소하시면 현재까지의 진행 상황이 저장되지 않습니다.
              </p>
              <div className='flex justify-end gap-3'>
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  className='px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors'>
                  계속하기
                </button>
                <button
                  onClick={handleConfirmCancel}
                  className='px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors'>
                  취소하기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
