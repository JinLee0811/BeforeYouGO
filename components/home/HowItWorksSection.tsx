import React, { useEffect, useMemo, useRef, useState } from "react";

interface HowItWorksSectionProps {
  onLoginClick: () => void;
  onSearchClick: () => void;
  isAuthenticated: boolean;
}

const steps = [
  {
    title: "Start after login",
    description: "After login, you can begin with a pre-filled place in the search bar.",
    mockLabel: "Logged in + search input",
  },
  {
    title: "Pick a restaurant",
    description: "Select a place from the results to generate a summary.",
    mockLabel: "Restaurant list/card",
  },
  {
    title: "View the summary",
    description: "See key keywords and a concise review summary at a glance.",
    mockLabel: "Summary preview",
  },
  {
    title: "Continue or sign in",
    description: "More features are in progress. For now, one demo run per IP.",
    mockLabel: "Restart prompt",
  },
  {
    title: "Ready to search?",
    description: "Run a quick search and get a clean summary in seconds.",
    mockLabel: "Go to search",
  },
];

export default function HowItWorksSection({
  onLoginClick,
  onSearchClick,
  isAuthenticated,
}: HowItWorksSectionProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const titleRef = useRef<HTMLDivElement | null>(null);

  const stepItems = useMemo(
    () =>
      steps.map((step, index) => ({
        ...step,
        id: `how-it-works-${index}`,
      })),
    [],
  );

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const titleRect = titleRef.current?.getBoundingClientRect();
      const sectionHeight = containerRef.current.offsetHeight;
      const viewportHeight = window.innerHeight;
      const scrollSpan = Math.max(sectionHeight - viewportHeight, 1);
      const titleOffset = titleRect ? titleRect.top - rect.top : 0;
      const startOffset = titleOffset + 120;
      const scrolled = Math.min(Math.max(-rect.top - startOffset, 0), scrollSpan);
      const progress = scrolled / scrollSpan;
      const nextIndex = Math.min(
        steps.length - 1,
        Math.max(0, Math.floor(progress * steps.length)),
      );
      setActiveIndex(nextIndex);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section className='mt-16' ref={containerRef}>
      <div className='max-w-6xl mx-auto'>
        <div ref={titleRef} className='text-center mb-12'>
          <h2 className='text-3xl font-bold text-gray-900 dark:text-white'>How it works</h2>
          <p className='mt-3 text-gray-600 dark:text-gray-300'>
            Scroll down to see a quick walkthrough.
          </p>
        </div>

        <div className='relative' style={{ minHeight: `${steps.length * 70}vh` }}>
          <div className='sticky top-20 transition-all duration-500 opacity-100'>
            <div className='rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-2xl overflow-hidden'>
              <div className='px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-700'>
                <div className='flex items-center justify-between'>
                  <div className='text-sm font-semibold text-indigo-600 dark:text-indigo-400'>
                    Step {activeIndex + 1} / {steps.length}
                  </div>
                  <div className='flex items-center gap-2'>
                    {stepItems.map((step, index) => (
                      <span
                        key={step.id}
                        className={`h-2 w-2 rounded-full transition-colors ${
                          activeIndex === index ? "bg-indigo-500" : "bg-gray-300 dark:bg-gray-600"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <h3 className='mt-3 text-2xl font-semibold text-gray-900 dark:text-white'>
                  {steps[activeIndex].title}
                </h3>
                <p className='mt-2 text-sm text-gray-600 dark:text-gray-300 max-w-2xl'>
                  {steps[activeIndex].description}
                </p>
              </div>

              <div className='p-6'>
                <div className='relative aspect-[16/7] rounded-3xl overflow-hidden'>
                  <div
                    className={`absolute inset-0 transition-opacity duration-500 ${
                      activeIndex === 0
                        ? "bg-gradient-to-br from-indigo-200 via-purple-200 to-pink-200 dark:from-indigo-900/40 dark:via-purple-900/40 dark:to-pink-900/40"
                        : activeIndex === 1
                          ? "bg-gradient-to-br from-emerald-200 via-teal-200 to-cyan-200 dark:from-emerald-900/40 dark:via-teal-900/40 dark:to-cyan-900/40"
                          : activeIndex === 2
                            ? "bg-gradient-to-br from-amber-200 via-orange-200 to-rose-200 dark:from-amber-900/40 dark:via-orange-900/40 dark:to-rose-900/40"
                            : activeIndex === 3
                              ? "bg-gradient-to-br from-slate-200 via-gray-200 to-zinc-200 dark:from-slate-800/60 dark:via-gray-800/60 dark:to-zinc-800/60"
                              : "bg-gradient-to-br from-indigo-300 via-sky-200 to-emerald-200 dark:from-indigo-800/60 dark:via-sky-800/60 dark:to-emerald-800/60"
                    }`}
                  />
                  <div className='absolute inset-0 flex items-center justify-center'>
                    {activeIndex === steps.length - 1 ? (
                      <div className='flex flex-col items-center gap-3'>
                        <div className='text-sm sm:text-base font-medium text-gray-800 dark:text-gray-100 bg-white/80 dark:bg-black/40 px-5 py-2.5 rounded-full'>
                          {steps[activeIndex].mockLabel}
                        </div>
                        <div className='flex flex-col sm:flex-row items-center gap-3'>
                          {isAuthenticated ? (
                            <button
                              onClick={onSearchClick}
                              className='px-7 py-3.5 rounded-2xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-lg'>
                              Go to search
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={onLoginClick}
                                className='px-7 py-3.5 rounded-2xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-lg'>
                                Log in to search
                              </button>
                              <button
                                onClick={onSearchClick}
                                className='px-7 py-3.5 rounded-2xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors'>
                                Go to search
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className='text-sm sm:text-base font-medium text-gray-800 dark:text-gray-100 bg-white/70 dark:bg-black/40 px-5 py-2.5 rounded-full'>
                        {steps[activeIndex].mockLabel}
                      </div>
                    )}
                  </div>
                  <div className='absolute bottom-4 right-4 text-xs text-gray-500 dark:text-gray-400'>
                    Dynamic preview
                  </div>
                </div>

                <div className='mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3'>
                  {stepItems.map((step, index) => (
                    <button
                      key={step.id}
                      onClick={() => {
                        const offset = window.innerHeight * 0.8 * index;
                        window.scrollTo({
                          top: containerRef.current
                            ? containerRef.current.offsetTop + offset
                            : window.scrollY,
                          behavior: "smooth",
                        });
                      }}
                      className={`rounded-2xl border px-4 py-3 text-left transition-all ${
                        activeIndex === index
                          ? "border-indigo-400/60 bg-indigo-50 dark:bg-indigo-900/20"
                          : "border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-gray-800/40"
                      }`}>
                      <div className='text-xs font-semibold text-indigo-600 dark:text-indigo-400'>
                        Step {index + 1}
                      </div>
                      <div className='mt-1 text-sm font-semibold text-gray-900 dark:text-white'>
                        {step.title}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className='h-8' />
      </div>
    </section>
  );
}
