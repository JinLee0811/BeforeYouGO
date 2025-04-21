import React, { useState, useEffect } from "react";
import { StarIcon } from "@heroicons/react/24/solid";
import {
  StarIcon as StarOutlineIcon,
  XMarkIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import { supabase } from "@/lib/supabaseClient";

interface EditReviewFormProps {
  isOpen: boolean;
  onClose: () => void;
  reviewId: string;
  restaurantName: string;
  initialRating: number;
  initialContent: string;
  initialUserSentiment: "positive" | "negative" | "mixed" | null;
  initialMentionedMenuItems: string[];
  initialRecommendedDishes: string[];
  onReviewUpdate: () => void;
}

export default function EditReviewForm({
  isOpen,
  onClose,
  reviewId,
  restaurantName,
  initialRating,
  initialContent,
  initialUserSentiment,
  initialMentionedMenuItems,
  initialRecommendedDishes,
  onReviewUpdate,
}: EditReviewFormProps) {
  const [rating, setRating] = useState(initialRating);
  const [content, setContent] = useState(initialContent);
  const [userSentiment, setUserSentiment] = useState(initialUserSentiment);
  const [mentionedMenuItemsInput, setMentionedMenuItemsInput] = useState(
    initialMentionedMenuItems.join(", ")
  );
  const [recommendedDishesInput, setRecommendedDishesInput] = useState(
    initialRecommendedDishes.join(", ")
  );
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update state if initial props change (e.g., editing a different review)
  useEffect(() => {
    setRating(initialRating);
    setContent(initialContent);
    setUserSentiment(initialUserSentiment);
    setMentionedMenuItemsInput(initialMentionedMenuItems.join(", "));
    setRecommendedDishesInput(initialRecommendedDishes.join(", "));
  }, [
    reviewId,
    initialRating,
    initialContent,
    initialUserSentiment,
    initialMentionedMenuItems,
    initialRecommendedDishes,
  ]);

  const parseTags = (input: string): string[] => {
    return input
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!userSentiment) {
      setError("Please select your overall sentiment about the experience.");
      setIsSubmitting(false);
      return;
    }

    const mentionedMenuItems = parseTags(mentionedMenuItemsInput);
    const recommendedDishes = parseTags(recommendedDishesInput);

    try {
      const { error: updateError } = await supabase
        .from("reviews")
        .update({
          rating: rating,
          content: content.trim(),
          user_sentiment: userSentiment,
          mentioned_menu_items: mentionedMenuItems,
          recommended_dishes: recommendedDishes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", reviewId);

      if (updateError) {
        throw new Error(updateError.message);
      }

      onReviewUpdate(); // Refresh the reviews list in the parent component
      onClose(); // Close the modal
    } catch (err: any) {
      console.error("Error updating review:", err);
      setError(err.message || "Failed to update review. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto py-10'>
      <div className='bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg mx-4 my-auto overflow-hidden shadow-xl transform transition-all'>
        <div className='flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700'>
          <h2 className='text-xl font-semibold text-gray-900 dark:text-white'>
            Edit Review for {restaurantName}
          </h2>
          <button
            onClick={onClose} // Changed to handleClose to reset state?
            className='text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors'>
            <XMarkIcon className='w-6 h-6' />
          </button>
        </div>

        <form onSubmit={handleSubmit} className='p-6 space-y-6'>
          {/* Rating */}
          <div className='space-y-2'>
            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
              Your Rating *
            </label>
            <div className='flex gap-1'>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type='button'
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className='p-1 transition-transform hover:scale-110 focus:outline-none'>
                  {star <= (hoverRating || rating) ? (
                    <StarIcon className='w-8 h-8 text-yellow-400' />
                  ) : (
                    <StarOutlineIcon className='w-8 h-8 text-gray-300 dark:text-gray-600' />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Review Content */}
          <div className='space-y-2'>
            <label
              htmlFor='edit-review-content'
              className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
              Your Review *
            </label>
            <textarea
              id='edit-review-content'
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder='Update your review...'
              className='w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400'
              required
            />
          </div>

          {/* User Sentiment */}
          <div className='space-y-3'>
            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
              Overall Sentiment *
            </label>
            <div className='flex flex-col sm:flex-row gap-3'>
              <button
                type='button'
                onClick={() => setUserSentiment("positive")}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-colors ${userSentiment === "positive" ? "bg-green-100 dark:bg-green-900/30 border-green-400 dark:border-green-600 text-green-700 dark:text-green-300" : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"}`}>
                <HandThumbUpIcon className='w-5 h-5' />
                Positive
              </button>
              <button
                type='button'
                onClick={() => setUserSentiment("negative")}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-colors ${userSentiment === "negative" ? "bg-red-100 dark:bg-red-900/30 border-red-400 dark:border-red-600 text-red-700 dark:text-red-300" : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"}`}>
                <HandThumbDownIcon className='w-5 h-5' />
                Negative
              </button>
              <button
                type='button'
                onClick={() => setUserSentiment("mixed")}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-colors ${userSentiment === "mixed" ? "bg-yellow-100 dark:bg-yellow-900/30 border-yellow-400 dark:border-yellow-600 text-yellow-700 dark:text-yellow-300" : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"}`}>
                <ExclamationCircleIcon className='w-5 h-5' />
                Mixed
              </button>
            </div>
          </div>

          {/* Mentioned Menu Items */}
          <div className='space-y-2'>
            <label
              htmlFor='edit-mentioned-items'
              className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
              Mentioned Menu Items (Optional)
            </label>
            <input
              id='edit-mentioned-items'
              type='text'
              value={mentionedMenuItemsInput}
              onChange={(e) => setMentionedMenuItemsInput(e.target.value)}
              placeholder='e.g., Pizza, Pasta, Salad (comma-separated)'
              className='w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400'
            />
          </div>

          {/* Recommended Dishes */}
          <div className='space-y-2'>
            <label
              htmlFor='edit-recommended-dishes'
              className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
              Recommended Dishes (Optional)
            </label>
            <input
              id='edit-recommended-dishes'
              type='text'
              value={recommendedDishesInput}
              onChange={(e) => setRecommendedDishesInput(e.target.value)}
              placeholder='e.g., Steak, Tiramisu (comma-separated)'
              className='w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400'
            />
          </div>

          {error && (
            <div className='p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm'>
              {error}
            </div>
          )}

          <div className='flex gap-4 pt-2'>
            <button
              type='button'
              onClick={onClose}
              className='flex-1 px-4 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors'>
              Cancel
            </button>
            <button
              type='submit'
              disabled={isSubmitting}
              className='flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'>
              {isSubmitting ? "Updating..." : "Update Review"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
