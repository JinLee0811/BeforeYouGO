import React, { useState } from "react";
import Image from "next/image";

interface HowItWorksSectionProps {
  onLoginClick: () => void;
  onSearchClick: () => void;
  isAuthenticated: boolean;
}

const steps = [
  {
    title: "Log in",
    subtitle: "Start by signing in",
    description: "Create an account or log in so we can keep your demo usage and results in sync.",
    image: "/how_it_works/login.png",
  },
  {
    title: "Search a restaurant",
    subtitle: "Find a place you care about",
    description: "Search by address, restaurant name, or use Nearby to quickly find places around you.",
    image: "/how_it_works/search.png",
  },
  {
    title: "Pick one",
    subtitle: "Choose from the results",
    description:
      "From the search results, pick the restaurant you actually want to check before you visit.",
    image: "/how_it_works/pick.png",
  },
  {
    title: "See AI review summary",
    subtitle: "Read the signal, not the noise",
    description:
      "We aggregate real Google reviews into one clean summary so you can decide in seconds.",
    image: "/how_it_works/review_summary.png",
  },
];

export default function HowItWorksSection({
  onLoginClick,
  onSearchClick,
  isAuthenticated,
}: HowItWorksSectionProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeStep = steps[activeIndex];

  return (
    <section className="py-20">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-12 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-indigo-500 [font-family:'Space_Grotesk',ui-sans-serif,system-ui]">
            Product Flow
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl [font-family:'Space_Grotesk',ui-sans-serif,system-ui]">
            How it works
          </h2>
          <p className="mt-3 text-sm text-slate-600 [font-family:'Space_Grotesk',ui-sans-serif,system-ui]">
            From login to AI-powered review summary in four simple steps.
          </p>
        </div>

        <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          {/* Steps list */}
          <div className="space-y-3">
            {steps.map((step, index) => {
              const isActive = index === activeIndex;
              return (
                <button
                  key={step.title}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className={`w-full rounded-2xl border px-4 py-4 text-left transition-all md:px-5 ${
                    isActive
                      ? "border-indigo-400 bg-gradient-to-r from-indigo-50 to-fuchsia-50 shadow-lg shadow-indigo-100"
                      : "border-slate-200 bg-white/90 hover:border-indigo-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold [font-family:'Space_Grotesk',ui-sans-serif,system-ui] ${
                        isActive
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500 [font-family:'Space_Grotesk',ui-sans-serif,system-ui]">
                        {step.subtitle}
                      </p>
                      <h3 className="mt-0.5 text-sm font-semibold text-slate-900 md:text-base [font-family:'Space_Grotesk',ui-sans-serif,system-ui]">
                        {step.title}
                      </h3>
                      <p className="mt-1 text-xs text-slate-600 md:text-sm [font-family:'Space_Grotesk',ui-sans-serif,system-ui]">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Preview card */}
          <div className="overflow-hidden rounded-[2rem] border border-indigo-100 bg-white/90 shadow-[0_24px_80px_-45px_rgba(79,70,229,0.7)]">
            <div className="border-b border-indigo-100 bg-gradient-to-r from-indigo-50 to-fuchsia-50 px-5 pb-3 pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500 [font-family:'Space_Grotesk',ui-sans-serif,system-ui]">
                    Step {activeIndex + 1} of {steps.length}
                  </p>
                  <h3 className="mt-1 text-sm font-semibold text-slate-900 md:text-base [font-family:'Space_Grotesk',ui-sans-serif,system-ui]">
                    {activeStep.title}
                  </h3>
                </div>
                <span className="inline-flex items-center rounded-full border border-indigo-200 bg-white px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-indigo-500 [font-family:'Space_Grotesk',ui-sans-serif,system-ui]">
                  Live preview
                </span>
              </div>
            </div>

            <div className="p-4 md:p-5">
              <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-slate-100">
                {steps.map((step, index) => (
                  <div
                    key={step.image}
                    className={`absolute inset-0 transition-opacity duration-300 ${
                      index === activeIndex ? "opacity-100 z-10" : "opacity-0 z-0"
                    }`}
                  >
                    <Image
                      src={step.image}
                      alt={step.title}
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 100vw, 640px"
                    />
                  </div>
                ))}

                {activeIndex === steps.length - 3 && (
                  <div className="absolute bottom-3 left-3 rounded-full bg-black/70 px-3 py-1 text-[10px] text-white [font-family:'Space_Grotesk',ui-sans-serif,system-ui]">
                    Pick a place to analyze
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 별도 CTA 영역 (Step 5 느낌) */}
        <div className="mt-10 flex flex-col items-center gap-3 text-center">
          <p className="text-sm text-slate-600 [font-family:'Space_Grotesk',ui-sans-serif,system-ui]">
            Ready to try it with a real place?
          </p>
          {isAuthenticated ? (
            <button
              onClick={onSearchClick}
              className="rounded-full bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:brightness-105 [font-family:'Space_Grotesk',ui-sans-serif,system-ui]"
            >
              Go to search
            </button>
          ) : (
            <button
              onClick={onLoginClick}
              className="rounded-full bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-black [font-family:'Space_Grotesk',ui-sans-serif,system-ui]"
            >
              Log in to start
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
