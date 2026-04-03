import { memo } from "react";
import { motion } from "framer-motion";
import { BookmarkIcon } from "@heroicons/react/24/outline";
import WishlistCard from "@/components/mypage/WishlistCard";
import type { MyPageBookmark } from "@/types/mypage";
import { myPageContainerVariants, myPageItemVariants } from "./myPageMotion";
import { MyPageEmptyState } from "./MyPageEmptyState";

type Props = {
  bookmarks: MyPageBookmark[];
  onDeleteBookmark: (id: string) => void;
  onRefresh: () => void;
};

/**
 * 북마크 탭: WishlistCard 그리드 또는 빈 상태
 */
function MyPageBookmarksPanelComponent({ bookmarks, onDeleteBookmark, onRefresh }: Props) {
  if (bookmarks.length === 0) {
    return (
      <MyPageEmptyState
        icon={<BookmarkIcon className='h-10 w-10 text-indigo-500/70' aria-hidden />}
        title='No Saved Restaurants'
        description='Start exploring and save your favorite restaurants to your wishlist!'
      />
    );
  }

  return (
    <motion.div
      variants={myPageContainerVariants}
      initial='hidden'
      animate='visible'
      exit='exit'
      className='grid grid-cols-1 gap-4 md:grid-cols-2'>
      {bookmarks.map((bookmark) => (
        <motion.div key={bookmark.id} variants={myPageItemVariants}>
          <WishlistCard
            id={bookmark.id}
            placeId={bookmark.place_id}
            restaurantName={bookmark.restaurant_name}
            address={bookmark.restaurant_address}
            imageUrl={bookmark.image_url}
            averageRating={bookmark.average_rating}
            sentiment={bookmark.sentiment}
            positiveKeywords={bookmark.positive_keywords}
            negativeKeywords={bookmark.negative_keywords}
            mentionedMenuItems={bookmark.mentioned_menu_items}
            recommendedDishes={bookmark.recommended_dishes}
            summary={bookmark.summary}
            photoUrls={bookmark.photo_urls}
            isProAnalysis={bookmark.is_pro_analysis}
            onDelete={onDeleteBookmark}
            onUpdate={onRefresh}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}

export const MyPageBookmarksPanel = memo(MyPageBookmarksPanelComponent);
