import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChartBarIcon } from "@heroicons/react/24/outline";
import { searchFadeIn } from "./searchMotion";

type RestaurantPick = { name: string } | null;

type Props = {
  open: boolean;
  selectedRestaurant: RestaurantPick;
  onCancel: () => void;
};

/**
 * 리뷰 분석 중 전체 화면 오버레이 (취소 버튼 포함)
 */
function SearchAnalyzingModalComponent({ open, selectedRestaurant, onCancel }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key='loading-modal'
          initial='initial'
          animate='animate'
          exit='exit'
          variants={searchFadeIn}
          transition={{ duration: 0.3 }}
          className='fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm'>
          <div className='byg-panel mx-4 w-full max-w-md p-8 text-center'>
            <ChartBarIcon className='mx-auto mb-4 h-12 w-12 animate-pulse text-indigo-600' aria-hidden />
            <h3 className='byg-title mb-2 text-xl font-semibold text-slate-900'>Analyzing Reviews</h3>
            <p className='mb-4 text-slate-600'>
              {selectedRestaurant ? (
                <>
                  Our AI is reading reviews for{" "}
                  <span className='font-medium'>{selectedRestaurant.name}</span>...
                </>
              ) : (
                "Please wait while we fetch the details and analyze..."
              )}
            </p>
            <div
              className='mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600'
              aria-hidden
            />
            <motion.button
              type='button'
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onCancel}
              className='rounded-xl bg-red-500 px-4 py-2 text-white transition-colors duration-200 hover:bg-red-600'>
              Cancel Analysis
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export const SearchAnalyzingModal = memo(SearchAnalyzingModalComponent);
