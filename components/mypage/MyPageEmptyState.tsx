import { memo, type ReactNode } from "react";
import { motion } from "framer-motion";
import { myPageItemVariants } from "./myPageMotion";

type Props = {
  icon: ReactNode;
  title: string;
  description: string;
  /** 패널 루트 Tailwind 클래스 (그리드 span·패딩 등) */
  className?: string;
};

/**
 * 북마크/리뷰가 없을 때 표시하는 빈 상태 패널
 */
function MyPageEmptyStateComponent({
  icon,
  title,
  description,
  className = "byg-panel-soft col-span-full p-8",
}: Props) {
  return (
    <motion.div variants={myPageItemVariants} initial='hidden' animate='visible' className={className}>
      <div className='flex flex-col items-center justify-center text-center'>
        <div className='mb-6 flex h-20 w-20 items-center justify-center rounded-xl bg-indigo-50'>{icon}</div>
        <h3 className='byg-title mb-2 text-xl font-medium text-slate-900'>{title}</h3>
        <p className='max-w-md text-sm text-slate-600'>{description}</p>
      </div>
    </motion.div>
  );
}

export const MyPageEmptyState = memo(MyPageEmptyStateComponent);
