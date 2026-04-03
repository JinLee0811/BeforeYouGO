import { memo } from "react";
import { motion } from "framer-motion";
import { BookmarkIcon, ChatBubbleBottomCenterTextIcon } from "@heroicons/react/24/outline";

export type MyPageTab = "bookmarks" | "reviews";

type Props = {
  activeTab: MyPageTab;
  onTabChange: (tab: MyPageTab) => void;
};

/**
 * 저장된 식당 / 내 리뷰 탭 전환 UI
 */
function MyPageTabBarComponent({ activeTab, onTabChange }: Props) {
  return (
    <nav className='flex space-x-8' aria-label='My page sections'>
      <motion.button
        type='button'
        whileHover={{ scale: 1.03, y: -1 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onTabChange("bookmarks")}
        className={`flex items-center rounded-xl px-4 py-3 transition-all duration-200 ${
          activeTab === "bookmarks"
            ? "bg-gradient-to-r from-indigo-600 to-fuchsia-600 font-medium text-white shadow-md"
            : "text-slate-600 hover:bg-white hover:text-indigo-500"
        }`}>
        <BookmarkIcon className='mr-2 h-5 w-5' aria-hidden />
        Saved Restaurants
      </motion.button>
      <motion.button
        type='button'
        whileHover={{ scale: 1.03, y: -1 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onTabChange("reviews")}
        className={`flex items-center rounded-xl px-4 py-3 transition-all duration-200 ${
          activeTab === "reviews"
            ? "bg-gradient-to-r from-indigo-600 to-fuchsia-600 font-medium text-white shadow-md"
            : "text-slate-600 hover:bg-white hover:text-indigo-500"
        }`}>
        <ChatBubbleBottomCenterTextIcon className='mr-2 h-5 w-5' aria-hidden />
        My Reviews
      </motion.button>
    </nav>
  );
}

export const MyPageTabBar = memo(MyPageTabBarComponent);
