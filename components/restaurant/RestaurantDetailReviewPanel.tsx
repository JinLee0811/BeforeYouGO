import { memo } from "react";
import ReviewForm from "@/components/review/ReviewForm";

type Props = {
  open: boolean;
  placeId: string;
  restaurantName: string;
  onClose: () => void;
};

/**
 * 사용자 리뷰 작성 패널 (접기/닫기)
 */
function RestaurantDetailReviewPanelComponent({ open, placeId, restaurantName, onClose }: Props) {
  if (!open) return null;

  return (
    <div className='byg-panel-soft p-6'>
      <div className='mb-4 flex items-center justify-between'>
        <h2 className='byg-title text-2xl font-semibold'>Leave Your Review</h2>
        <button
          type='button'
          onClick={onClose}
          className='text-slate-500 transition hover:text-slate-700'>
          Close
        </button>
      </div>
      <ReviewForm
        isOpen={open}
        onClose={onClose}
        restaurantId={placeId}
        restaurantName={restaurantName}
      />
    </div>
  );
}

export const RestaurantDetailReviewPanel = memo(RestaurantDetailReviewPanelComponent);
