import React from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { AnalysisResult } from "@/types";
import {
  StarIcon,
  ChatBubbleLeftRightIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
  ListBulletIcon,
  FireIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";

interface AnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: AnalysisResult;
  restaurantName: string;
  onReviewClick: () => void;
}

export default function AnalysisModal({
  isOpen,
  onClose,
  result,
  restaurantName,
  onReviewClick,
}: AnalysisModalProps) {
  if (!isOpen) return null;

  const handleReviewClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onReviewClick();
    onClose(); // Close the analysis modal when opening review form
  };

  return (
    <div className='fixed inset-0 z-50 overflow-y-auto'>
      <div className='flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0'>
        <div
          className='fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75'
          onClick={onClose}
        />

        <div className='relative inline-block w-full max-w-3xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl'>
          {/* Header */}
          <div className='flex justify-between items-center mb-6'>
            <h3 className='text-2xl font-semibold text-gray-900'>{restaurantName}</h3>
            <button
              onClick={onClose}
              className='p-1 text-gray-400 hover:text-gray-500 transition-colors'>
              <XMarkIcon className='w-6 h-6' />
            </button>
          </div>

          <div className='space-y-6'>
            {/* Rating & Sentiment */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='bg-yellow-50 rounded-xl p-4'>
                <div className='flex items-center gap-2 mb-2'>
                  <StarIcon className='w-5 h-5 text-yellow-500' />
                  <h4 className='font-medium text-gray-900'>Average Rating</h4>
                </div>
                <div className='flex items-center'>
                  <div className='flex'>
                    {[...Array(5)].map((_, i) => (
                      <StarIcon
                        key={i}
                        className={`w-5 h-5 ${
                          i < Math.floor(result.average_rating)
                            ? "text-yellow-400 fill-current"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className='ml-2 text-sm font-medium text-gray-600'>
                    ({result.average_rating.toFixed(1)})
                  </span>
                </div>
              </div>

              <div className='bg-blue-50 rounded-xl p-4'>
                <div className='flex items-center gap-2 mb-2'>
                  <ChatBubbleLeftRightIcon className='w-5 h-5 text-blue-500' />
                  <h4 className='font-medium text-gray-900'>Overall Sentiment</h4>
                </div>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    result.sentiment === "positive"
                      ? "bg-green-100 text-green-800"
                      : result.sentiment === "negative"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                  }`}>
                  {result.sentiment.charAt(0).toUpperCase() + result.sentiment.slice(1)}
                </span>
              </div>
            </div>

            {/* Keywords */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='bg-green-50 rounded-xl p-4'>
                <div className='flex items-center gap-2 mb-3'>
                  <HandThumbUpIcon className='w-5 h-5 text-green-600' />
                  <h4 className='font-medium text-gray-900'>Positive Keywords</h4>
                </div>
                <div className='flex flex-wrap gap-2'>
                  {result.positive_keywords.map((keyword, index) => (
                    <span
                      key={index}
                      className='px-2 py-1 bg-white text-green-800 rounded-full text-sm font-medium border border-green-200'>
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>

              <div className='bg-red-50 rounded-xl p-4'>
                <div className='flex items-center gap-2 mb-3'>
                  <HandThumbDownIcon className='w-5 h-5 text-red-600' />
                  <h4 className='font-medium text-gray-900'>Negative Keywords</h4>
                </div>
                <div className='flex flex-wrap gap-2'>
                  {result.negative_keywords.map((keyword, index) => (
                    <span
                      key={index}
                      className='px-2 py-1 bg-white text-red-800 rounded-full text-sm font-medium border border-red-200'>
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='bg-indigo-50 rounded-xl p-4'>
                <div className='flex items-center gap-2 mb-3'>
                  <ListBulletIcon className='w-5 h-5 text-indigo-600' />
                  <h4 className='font-medium text-gray-900'>Mentioned Menu Items</h4>
                </div>
                <div className='flex flex-wrap gap-2'>
                  {result.mentioned_menu_items.map((item, index) => (
                    <span
                      key={index}
                      className='px-2 py-1 bg-white text-indigo-800 rounded-full text-sm font-medium border border-indigo-200'>
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className='bg-orange-50 rounded-xl p-4'>
                <div className='flex items-center gap-2 mb-3'>
                  <FireIcon className='w-5 h-5 text-orange-600' />
                  <h4 className='font-medium text-gray-900'>Recommended Dishes</h4>
                </div>
                <div className='flex flex-wrap gap-2'>
                  {result.recommended_dishes.map((dish, index) => (
                    <span
                      key={index}
                      className='px-2 py-1 bg-white text-orange-800 rounded-full text-sm font-medium border border-orange-200'>
                      {dish}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className='bg-gray-50 rounded-xl p-4'>
              <h4 className='font-medium text-gray-900 mb-2'>Summary</h4>
              <p className='text-gray-600 text-sm whitespace-pre-line'>{result.summary}</p>
            </div>

            {/* Review Button */}
            <div className='flex justify-center pt-4'>
              <button
                onClick={handleReviewClick}
                className='flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'>
                <PencilSquareIcon className='w-5 h-5' />
                Write a Review
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
