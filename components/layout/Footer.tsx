import React from "react";
import { StarIcon } from "@heroicons/react/24/solid";

export default function Footer() {
  return (
    <footer className='border-t border-white/80 bg-white/70 backdrop-blur-xl'>
      <div className='mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-xs text-slate-500 sm:flex-row sm:text-sm'>
        <p className='flex items-center gap-2'>
          <StarIcon className='w-4 h-4 text-yellow-400' />
          <span className='byg-title'>Before You Go - AI-powered review summaries for restaurants.</span>
        </p>
        <p className='text-[11px] text-slate-400 sm:text-xs'>
          Portfolio project · &copy; {new Date().getFullYear()} All rights reserved.
        </p>
      </div>
    </footer>
  );
}
