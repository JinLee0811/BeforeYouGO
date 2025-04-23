import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import { BookmarkIcon as BookmarkOutline } from "@heroicons/react/24/outline";
import { BookmarkIcon as BookmarkSolid } from "@heroicons/react/24/solid";
import { useUser } from "@/hooks/useUser";

interface BookmarkButtonProps {
  placeId: string;
  restaurantName: string;
  onAuthRequired: () => void;
}

export default function BookmarkButton({
  placeId,
  restaurantName,
  onAuthRequired,
}: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useUser();

  useEffect(() => {
    if (user) {
      checkBookmarkStatus();
    }
  }, [user, placeId]);

  const checkBookmarkStatus = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("bookmarks")
      .select("id")
      .eq("user_id", user.id)
      .eq("place_id", placeId)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error checking bookmark status:", error);
      return;
    }

    setIsBookmarked(!!data);
  };

  const toggleBookmark = async () => {
    if (!user) {
      onAuthRequired();
      return;
    }

    setLoading(true);
    try {
      if (isBookmarked) {
        const { error } = await supabase
          .from("bookmarks")
          .delete()
          .eq("user_id", user.id)
          .eq("place_id", placeId);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("bookmarks").insert([
          {
            user_id: user.id,
            place_id: placeId,
            restaurant_name: restaurantName,
          },
        ]);

        if (error) throw error;
      }
      setIsBookmarked(!isBookmarked);
    } catch (error) {
      console.error("Error toggling bookmark:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggleBookmark}
      disabled={loading}
      className='p-2 rounded-full hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
      title={isBookmarked ? "Remove from bookmarks" : "Add to bookmarks"}>
      {isBookmarked ? (
        <BookmarkSolid className='w-6 h-6 text-blue-600' />
      ) : (
        <BookmarkOutline className='w-6 h-6 text-gray-600' />
      )}
    </button>
  );
}
