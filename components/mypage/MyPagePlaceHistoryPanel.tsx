import { memo } from "react";
import Link from "next/link";
import { MapPinIcon, ClockIcon, CursorArrowRaysIcon } from "@heroicons/react/24/outline";
import type { MyPagePlaceClick } from "@/types/mypage";
import { motion } from "framer-motion";
import { myPageContainerVariants, myPageItemVariants } from "./myPageMotion";
import { MyPageEmptyState } from "./MyPageEmptyState";

type Props = {
  items: MyPagePlaceClick[];
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

/**
 * Restaurants the user opened (search or detail). Shows visit count per place.
 */
function MyPagePlaceHistoryPanelComponent({ items }: Props) {
  if (items.length === 0) {
    return (
      <MyPageEmptyState
        icon={<CursorArrowRaysIcon className='h-10 w-10 text-indigo-500/70' aria-hidden />}
        title='No history yet'
        description='Places you open from search or visit on the map will appear here with how many times you viewed them.'
      />
    );
  }

  return (
    <div>
      <div className='mb-6 flex items-center gap-2'>
        <MapPinIcon className='h-6 w-6 text-indigo-600' aria-hidden />
        <h2 className='byg-title text-2xl font-semibold text-slate-900'>Your places</h2>
      </div>
      <motion.ul
        variants={myPageContainerVariants}
        initial='hidden'
        animate='visible'
        className='grid gap-4 sm:grid-cols-2'>
        {items.map((row) => (
          <motion.li key={row.place_id} variants={myPageItemVariants}>
            <Link
              href={`/restaurant/${encodeURIComponent(row.place_id)}`}
              className='group flex overflow-hidden rounded-2xl border border-indigo-100/80 bg-white/90 shadow-sm transition hover:shadow-md'>
              <div className='relative h-28 w-28 flex-shrink-0 bg-slate-100'>
                {row.image_url ? (
                  <img
                    src={row.image_url}
                    alt=''
                    className='h-full w-full object-cover'
                    loading='lazy'
                  />
                ) : (
                  <div className='flex h-full w-full items-center justify-center text-xs text-slate-400'>
                    No photo
                  </div>
                )}
              </div>
              <div className='min-w-0 flex-1 p-4'>
                <h3 className='byg-title truncate text-base font-semibold text-slate-900 group-hover:text-indigo-700'>
                  {row.restaurant_name}
                </h3>
                {row.restaurant_address && (
                  <p className='mt-1 flex items-start gap-1 text-xs text-slate-500'>
                    <MapPinIcon className='mt-0.5 h-3.5 w-3.5 flex-shrink-0' aria-hidden />
                    <span className='line-clamp-2'>{row.restaurant_address}</span>
                  </p>
                )}
                <div className='mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600'>
                  <span className='inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 font-medium text-indigo-800'>
                    Opened {row.click_count}×
                  </span>
                  <span className='inline-flex items-center gap-1 text-slate-500'>
                    <ClockIcon className='h-3.5 w-3.5' aria-hidden />
                    Last: {formatDate(row.last_clicked_at)}
                  </span>
                </div>
              </div>
            </Link>
          </motion.li>
        ))}
      </motion.ul>
    </div>
  );
}

export const MyPagePlaceHistoryPanel = memo(MyPagePlaceHistoryPanelComponent);
