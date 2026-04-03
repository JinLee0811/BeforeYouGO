import { memo } from "react";
import { motion } from "framer-motion";
import { ChatBubbleBottomCenterTextIcon } from "@heroicons/react/24/outline";
import type { MyPageReview } from "@/types/mypage";
import { myPageContainerVariants, myPageItemVariants } from "./myPageMotion";
import { MyPageEmptyState } from "./MyPageEmptyState";
import { MyPageReviewListItem } from "./MyPageReviewListItem";

type Props = {
  reviews: MyPageReview[];
  onEdit: (review: MyPageReview) => void;
  onDelete: (id: string) => void;
};

/**
 * 내 리뷰 탭: 리뷰 카드 리스트 또는 빈 상태
 */
function MyPageReviewsPanelComponent({ reviews, onEdit, onDelete }: Props) {
  if (reviews.length === 0) {
    return (
      <MyPageEmptyState
        className='byg-panel-soft rounded-3xl p-12'
        icon={<ChatBubbleBottomCenterTextIcon className='h-12 w-12 text-indigo-500/70' aria-hidden />}
        title='No Reviews Yet'
        description={"Share your honest reviews about the restaurants you've visited!"}
      />
    );
  }

  return (
    <motion.div
      variants={myPageContainerVariants}
      initial='hidden'
      animate='visible'
      exit='exit'
      className='space-y-8'>
      {reviews.map((review) => (
        <motion.div key={review.id} variants={myPageItemVariants}>
          <MyPageReviewListItem review={review} onEdit={onEdit} onDelete={onDelete} />
        </motion.div>
      ))}
    </motion.div>
  );
}

export const MyPageReviewsPanel = memo(MyPageReviewsPanelComponent);
