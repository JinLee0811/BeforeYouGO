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
import { Session } from "@supabase/supabase-js";

interface ReviewFormProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantId: string;
  restaurantName: string;
}

export default function ReviewForm({
  isOpen,
  onClose,
  restaurantId,
  restaurantName,
}: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [content, setContent] = useState("");
  const [userSentiment, setUserSentiment] = useState<"positive" | "negative" | "mixed" | null>(
    null
  );
  const [mentionedMenuItemsInput, setMentionedMenuItemsInput] = useState("");
  const [recommendedDishesInput, setRecommendedDishesInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nickname, setNickname] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchUserSession() {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();
      if (isMounted && currentSession) {
        setSession(currentSession);
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("nickname")
          .eq("id", currentSession.user.id)
          .single();

        if (profileError) {
          console.error("Error fetching profile:", profileError);
          setError("Failed to load user information.");
        } else if (profileData) {
          setNickname(profileData.nickname);
        }
      }
    }

    if (isOpen) {
      fetchUserSession();
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

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

    if (!session?.user) {
      setError("You need to be logged in to submit a review.");
      setIsSubmitting(false);
      return;
    }

    if (!nickname) {
      setError("Could not retrieve user nickname. Please try again.");
      setIsSubmitting(false);
      return;
    }

    if (rating === 0) {
      setError("Please select a rating.");
      setIsSubmitting(false);
      return;
    }

    if (!content.trim()) {
      setError("Please write your review content.");
      setIsSubmitting(false);
      return;
    }

    if (!userSentiment) {
      setError("Please select your overall sentiment about the experience.");
      setIsSubmitting(false);
      return;
    }

    const mentionedMenuItems = parseTags(mentionedMenuItemsInput);
    const recommendedDishes = parseTags(recommendedDishesInput);

    try {
      const service = new google.maps.places.PlacesService(document.createElement("div"));
      service.getDetails(
        {
          placeId: restaurantId,
          fields: ["formatted_address"],
        },
        async (place, status) => {
          if (status !== google.maps.places.PlacesServiceStatus.OK || !place) {
            console.error("PlacesService error:", status);
            setError("Failed to fetch restaurant details. Please try again.");
            setIsSubmitting(false);
            return;
          }

          const reviewData = {
            user_id: session.user.id,
            user_nickname: nickname,
            place_id: restaurantId,
            restaurant_name: restaurantName,
            restaurant_address: place.formatted_address || "",
            content: content.trim(),
            rating: rating,
            user_sentiment: userSentiment,
            mentioned_menu_items: mentionedMenuItems,
            recommended_dishes: recommendedDishes,
          };

          console.log("Submitting review:", reviewData);

          const { error: submitError } = await supabase.from("reviews").insert(reviewData);

          if (submitError) {
            console.error("Supabase insert error:", submitError);
            throw new Error(submitError.message || "Failed to submit review.");
          }

          console.log("Review submitted successfully!");
          handleClose();
        }
      );
    } catch (err: any) {
      console.error("Review submission process error:", err);
      setError(err.message || "An error occurred while submitting your review. Please try again.");
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setRating(0);
    setContent("");
    setHoverRating(0);
    setUserSentiment(null);
    setMentionedMenuItemsInput("");
    setRecommendedDishesInput("");
    setError(null);
    setIsSubmitting(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 py-10 backdrop-blur-sm'>
      <div className='mx-4 my-auto w-full max-w-lg transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all'>
        <div className='flex items-center justify-between border-b border-indigo-100 px-6 py-4'>
          <h2 className='byg-title text-xl font-semibold text-slate-900'>
            Write a Review for {restaurantName}
          </h2>
          <button
            onClick={handleClose}
            className='text-gray-400 transition-colors hover:text-gray-500'>
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
              htmlFor='review-content'
              className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
              Your Review *
            </label>
            <textarea
              id='review-content'
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`Share your experience at ${restaurantName}...`}
              className='byg-input'
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
                className={`flex-1 flex items-center justify-center gap-2 rounded-lg border px-4 py-3 transition-colors ${userSentiment === "positive" ? "border-green-400 bg-green-100 text-green-700" : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"}`}>
                <HandThumbUpIcon className='w-5 h-5' />
                Positive
              </button>
              <button
                type='button'
                onClick={() => setUserSentiment("negative")}
                className={`flex-1 flex items-center justify-center gap-2 rounded-lg border px-4 py-3 transition-colors ${userSentiment === "negative" ? "border-red-400 bg-red-100 text-red-700" : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"}`}>
                <HandThumbDownIcon className='w-5 h-5' />
                Negative
              </button>
              <button
                type='button'
                onClick={() => setUserSentiment("mixed")}
                className={`flex-1 flex items-center justify-center gap-2 rounded-lg border px-4 py-3 transition-colors ${userSentiment === "mixed" ? "border-yellow-400 bg-yellow-100 text-yellow-700" : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"}`}>
                <ExclamationCircleIcon className='w-5 h-5' />
                Mixed
              </button>
            </div>
          </div>

          {/* Mentioned Menu Items */}
          <div className='space-y-2'>
            <label
              htmlFor='mentioned-items'
              className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
              Mentioned Menu Items (Optional)
            </label>
            <input
              id='mentioned-items'
              type='text'
              value={mentionedMenuItemsInput}
              onChange={(e) => setMentionedMenuItemsInput(e.target.value)}
              placeholder='e.g., Pizza, Pasta, Salad (comma-separated)'
              className='byg-input'
            />
          </div>

          {/* Recommended Dishes */}
          <div className='space-y-2'>
            <label
              htmlFor='recommended-dishes'
              className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
              Recommended Dishes (Optional)
            </label>
            <input
              id='recommended-dishes'
              type='text'
              value={recommendedDishesInput}
              onChange={(e) => setRecommendedDishesInput(e.target.value)}
              placeholder='e.g., Steak, Tiramisu (comma-separated)'
              className='byg-input'
            />
          </div>

          {error && (
            <div className='rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600'>
              {error}
            </div>
          )}

          <div className='flex gap-4 pt-2'>
            <button
              type='button'
              onClick={handleClose}
              className='flex-1 rounded-lg bg-gray-100 px-4 py-3 text-gray-700 transition-colors hover:bg-gray-200'>
              Cancel
            </button>
            <button
              type='submit'
              disabled={isSubmitting}
              className='flex-1 rounded-lg bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-4 py-3 text-white transition-colors hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50'>
              {isSubmitting ? "Submitting..." : "Submit Review"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
