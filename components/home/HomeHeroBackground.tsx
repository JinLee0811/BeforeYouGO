import { memo } from "react";
import { motion } from "framer-motion";

/**
 * 랜딩 히어로 배경: 그라데이션 베이스 + 부드럽게 움직이는 블롭 (순수 시각, pointer-events 없음)
 */
function HomeHeroBackgroundComponent() {
  return (
    <>
      <div className='absolute inset-0 bg-gradient-to-br from-slate-50 via-indigo-50/80 to-fuchsia-50/80' />
      <div className='pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/60 to-transparent' />
      <motion.div
        className='pointer-events-none absolute -top-20 -left-20 h-80 w-80 rounded-full bg-sky-200/60 blur-3xl'
        animate={{ scale: [1, 1.2, 1], x: [0, 30, 0], y: [0, 35, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className='pointer-events-none absolute top-1/3 -right-20 h-96 w-96 rounded-full bg-fuchsia-200/55 blur-3xl'
        animate={{ scale: [1, 1.15, 1], x: [0, -25, 0], y: [0, -30, 0] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className='pointer-events-none absolute -bottom-28 left-1/4 h-80 w-80 rounded-full bg-indigo-200/60 blur-3xl'
        animate={{ scale: [1, 1.22, 1], x: [0, -20, 0], y: [0, 22, 0] }}
        transition={{ duration: 13, repeat: Infinity, ease: "easeInOut" }}
      />
    </>
  );
}

export const HomeHeroBackground = memo(HomeHeroBackgroundComponent);
