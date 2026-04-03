import { memo } from "react";
import { MapPinIcon, StarIcon, PhotoIcon } from "@heroicons/react/24/solid";
import BookmarkButton from "@/components/bookmark/BookmarkButton";
import type { RestaurantDetails } from "@/types/restaurantDetail";

type Props = {
  details: RestaurantDetails;
  onAuthRequired: () => void;
};

/**
 * 상단 히어로 이미지 + 이름·평점·주소 + 북마크 버튼
 */
function RestaurantDetailHeaderComponent({ details, onAuthRequired }: Props) {
  const photoUrl = details.photos?.[0]?.getUrl({ maxWidth: 800 });

  return (
    <>
      {photoUrl ? (
        <img
          src={photoUrl}
          alt={details.name}
          className='mb-6 h-64 w-full rounded-2xl object-cover shadow-md'
        />
      ) : (
        <div className='mb-6 flex h-64 w-full items-center justify-center rounded-2xl bg-slate-100 shadow-md'>
          <PhotoIcon className='h-16 w-16 text-gray-400' aria-hidden />
        </div>
      )}

      <div className='byg-panel-soft mb-6 p-6'>
        <div className='mb-4 flex items-start justify-between'>
          <h1 className='byg-title text-3xl font-bold text-slate-900'>{details.name}</h1>
          {details.place_id && (
            <BookmarkButton
              placeId={details.place_id}
              restaurantName={details.name}
              onAuthRequired={onAuthRequired}
            />
          )}
        </div>
        <div className='mb-2 flex items-center text-gray-600'>
          <StarIcon className='mr-1 h-5 w-5 text-yellow-500' aria-hidden />
          <span>
            {details.rating ?? "N/A"} ({details.user_ratings_total ?? 0} reviews)
          </span>
        </div>
        <div className='flex items-center text-slate-600'>
          <MapPinIcon className='mr-1 h-5 w-5 text-slate-500' aria-hidden />
          <span>{details.formatted_address ?? "Address not available"}</span>
        </div>
      </div>
    </>
  );
}

export const RestaurantDetailHeader = memo(RestaurantDetailHeaderComponent);
