import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import EditReviewForm from "@/components/review/EditReviewForm";
import type { MyPageReview } from "@/types/mypage";
import { myPageModalVariants } from "./myPageMotion";

type Props = {
  editingReview: MyPageReview | null;
  onClose: () => void;
  onUpdated: () => void;
};

/**
 * 리뷰 수정 모달 (EditReviewForm + 배경 딤)
 */
function MyPageEditReviewModalComponent({ editingReview, onClose, onUpdated }: Props) {
  return (
    <AnimatePresence>
      {editingReview && (
        <motion.div
          key='edit-review-modal'
          initial='hidden'
          animate='visible'
          exit='exit'
          variants={myPageModalVariants}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm'>
          <EditReviewForm
            isOpen
            onClose={onClose}
            reviewId={editingReview.id}
            restaurantName={editingReview.restaurant_name}
            initialRating={editingReview.rating}
            initialContent={editingReview.content}
            initialUserSentiment={editingReview.user_sentiment ?? null}
            initialMentionedMenuItems={editingReview.mentioned_menu_items ?? []}
            initialRecommendedDishes={editingReview.recommended_dishes ?? []}
            onReviewUpdate={() => {
              onClose();
              onUpdated();
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export const MyPageEditReviewModal = memo(MyPageEditReviewModalComponent);
