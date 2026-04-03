import { memo } from "react";
import { motion } from "framer-motion";

/**
 * 랜딩 메인 카피(배지, 헤드라인, 서브텍스트)
 */
function HomeHeroIntroComponent() {
  return (
    <motion.div
      className='mx-auto max-w-4xl text-center'
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}>
      <span className="inline-flex items-center rounded-full border border-indigo-200/80 bg-white/80 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-500 shadow-sm [font-family:'Space_Grotesk',ui-sans-serif,system-ui]">
        Before You Go
      </span>
      <h1 className="mt-5 text-4xl font-semibold leading-tight text-slate-900 sm:text-5xl lg:text-6xl [font-family:'Space_Grotesk',ui-sans-serif,system-ui]">
        AI Review Summary
        <span className='block bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 bg-clip-text text-transparent'>
          for Smarter Restaurant Picks
        </span>
      </h1>
      <p className="mx-auto mt-5 max-w-2xl text-base text-slate-600 sm:text-lg [font-family:'Space_Grotesk',ui-sans-serif,system-ui]">
        Search the place, skip the review overload, and read the signal in seconds.
      </p>
    </motion.div>
  );
}

export const HomeHeroIntro = memo(HomeHeroIntroComponent);
