import { memo } from "react";
import { motion } from "framer-motion";
import {
  MapPinIcon,
  StarIcon,
  ClockIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";
import type { MyPageReview } from "@/types/mypage";

type Props = {
  review: MyPageReview;
  onEdit: (review: MyPageReview) => void;
  onDelete: (id: string) => void;
};

/**
 * 단일 리뷰 카드 (리스트 항목) — memo로 불필요한 리렌더 감소
 */
function MyPageReviewListItemComponent({ review, onEdit, onDelete }: Props) {
  return (
    <motion.div
      layout
      className='byg-panel-soft group rounded-3xl p-8 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:shadow-xl'>
      <div className='flex items-start gap-8'>
        <div className='flex-1'>
          <div className='mb-6 flex items-center justify-between'>
            <h3 className='byg-title text-2xl font-semibold text-slate-900 transition-colors duration-200 group-hover:text-indigo-600'>
              {review.restaurant_name}
            </h3>
            <div className='flex items-center space-x-4'>
              <div className='flex items-center rounded-xl bg-yellow-50 px-5 py-2.5'>
                <div className='mr-2 flex text-yellow-400' aria-label={`Rating ${review.rating} of 5`}>
                  {[...Array(5)].map((_, i) =>
                    i < review.rating ? (
                      <StarIconSolid key={i} className='h-6 w-6' />
                    ) : (
                      <StarIcon key={i} className='h-6 w-6 text-gray-300' />
                    )
                  )}
                </div>
                <span className='text-lg font-semibold text-yellow-700'>{review.rating}/5</span>
              </div>
              <div className='flex items-center space-x-2'>
                <motion.button
                  type='button'
                  whileHover={{ scale: 1.1, rotate: -5 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onEdit(review)}
                  className='rounded-full p-2 text-slate-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600'
                  title='Edit review'>
                  <PencilIcon className='h-5 w-5' />
                </motion.button>
                <motion.button
                  type='button'
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onDelete(review.id)}
                  className='rounded-full p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600'
                  title='Delete review'>
                  <TrashIcon className='h-5 w-5' />
                </motion.button>
              </div>
            </div>
          </div>
          <div className='mb-6 flex items-center text-slate-600'>
            <MapPinIcon className='mr-3 h-5 w-5 flex-shrink-0 text-indigo-500/70' aria-hidden />
            <p className='text-base'>{review.restaurant_address}</p>
          </div>
          <p className='mb-6 text-lg leading-relaxed text-slate-700'>{review.content}</p>
          <div className='flex items-center text-slate-500'>
            <ClockIcon className='mr-3 h-5 w-5 text-indigo-500/70' aria-hidden />
            <time className='text-base' dateTime={review.created_at}>
              Reviewed on {new Date(review.created_at).toLocaleDateString()}
            </time>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function propsEqualFixed(prev: Props, next: Props) {
  return (
    prev.review.id === next.review.id &&
    prev.review.content === next.review.content &&
    prev.review.rating === next.review.rating &&
    prev.review.created_at === next.review.created_at
  );
}

export const MyPageReviewListItem = memo(MyPageReviewListItemComponent, propsEqualFixed);
