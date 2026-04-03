import { memo } from "react";
import { motion } from "framer-motion";

export type SearchSourceTab = "search" | "direct";

type Props = {
  activeTab: SearchSourceTab;
  onTabChange: (tab: SearchSourceTab) => void;
};

/**
 * "지역 검색" vs "직접 URL/장소 입력" 상단 세그먼트 컨트롤 (layoutId로 슬라이드 인디케이터)
 */
function SearchSourceTabsComponent({ activeTab, onTabChange }: Props) {
  return (
    <div className='mb-8 flex justify-center'>
      <div className='relative flex space-x-1 rounded-2xl border border-indigo-100 bg-white/90 p-1.5 shadow-sm'>
        <motion.button
          type='button'
          whileHover={{ scale: 1.03, y: -1 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onTabChange("search")}
          className={`relative rounded-xl px-6 py-2.5 text-sm font-medium transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
            activeTab === "search" ? "text-indigo-600" : "text-slate-600 hover:text-slate-900"
          }`}>
          {activeTab === "search" && (
            <motion.span
              layoutId='activeTabIndicator'
              className='absolute inset-0 z-0 rounded-xl bg-indigo-50 shadow'
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          )}
          <span className='relative z-10'>Search by Location</span>
        </motion.button>
        <motion.button
          type='button'
          whileHover={{ scale: 1.03, y: -1 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onTabChange("direct")}
          className={`relative rounded-xl px-6 py-2.5 text-sm font-medium transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
            activeTab === "direct" ? "text-indigo-600" : "text-slate-600 hover:text-slate-900"
          }`}>
          {activeTab === "direct" && (
            <motion.span
              layoutId='activeTabIndicator'
              className='absolute inset-0 z-0 rounded-xl bg-indigo-50 shadow'
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          )}
          <span className='relative z-10'>Direct Search</span>
        </motion.button>
      </div>
    </div>
  );
}

export const SearchSourceTabs = memo(SearchSourceTabsComponent);
