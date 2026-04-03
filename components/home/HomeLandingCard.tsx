import { memo, type Ref } from "react";
import { motion } from "framer-motion";
import SearchSection from "@/components/home/SearchSection";
import type { SearchPendingAction } from "@/types/searchPage";

const STATS = [
  { value: "10K+", label: "Analyzed Restaurants" },
  { value: "500K+", label: "Summarized Reviews" },
  { value: "98%", label: "Summary Confidence" },
] as const;

type Props = {
  loadError?: Error;
  isLoaded: boolean;
  searchInput: string;
  setSearchInput: (v: string) => void;
  locationInputRef: Ref<HTMLInputElement>;
  autocompleteInstance: google.maps.places.Autocomplete | null;
  setAutocompleteInstance: (a: google.maps.places.Autocomplete | null) => void;
  user: unknown;
  isUserLoading: boolean;
  hasUser: boolean;
  showAuthModal: boolean;
  ensureSessionOrPrompt: (action?: SearchPendingAction) => void;
  onScrollToHowItWorks: () => void;
  routerPush: (path: string) => void;
};

/**
 * 히어로 하단 카드: 상태 배지, SearchSection, 통계, "How it works" 스크롤 버튼
 */
function HomeLandingCardComponent({
  loadError,
  isLoaded,
  searchInput,
  setSearchInput,
  locationInputRef,
  autocompleteInstance,
  setAutocompleteInstance,
  user,
  isUserLoading,
  hasUser,
  showAuthModal,
  ensureSessionOrPrompt,
  onScrollToHowItWorks,
  routerPush,
}: Props) {
  return (
    <motion.div
      className='mt-8'
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.65, delay: 0.1 }}>
      <div className='mx-auto w-full max-w-4xl rounded-[2rem] border border-white/70 bg-white/75 px-5 py-6 shadow-[0_30px_90px_-45px_rgba(79,70,229,0.75)] backdrop-blur-xl sm:px-8 sm:py-8'>
        <div className='mb-5 text-center'>
          <div className="inline-flex items-center rounded-full bg-slate-900 px-3 py-1 text-[11px] font-medium text-white [font-family:'Space_Grotesk',ui-sans-serif,system-ui]">
            {user ? "Signed in - ready to search" : "Portfolio demo - free basic summary"}
          </div>
        </div>
        <div className='mx-auto w-full max-w-3xl'>
          {loadError && (
            <p className="mb-3 text-center text-sm text-red-500 [font-family:'Space_Grotesk',ui-sans-serif,system-ui]">
              Error loading maps. Please refresh.
            </p>
          )}
          {isLoaded ? (
            <SearchSection
              isSearching={false}
              error={null}
              searchLocationInput={searchInput}
              onSearchLocationInputChange={setSearchInput}
              onFindNearby={() => {
                if (isUserLoading) return;
                if (hasUser) {
                  routerPush("/search?mode=nearby");
                } else {
                  void ensureSessionOrPrompt({ type: "nearby" });
                }
              }}
              onSearchByLocationText={(location) => {
                const query = location.trim();
                if (!query) return;
                if (isUserLoading) return;
                if (hasUser) {
                  routerPush(`/search?q=${encodeURIComponent(query)}`);
                } else {
                  void ensureSessionOrPrompt({ type: "location", location: query });
                }
              }}
              onAutocompleteLoad={(autocomplete) => setAutocompleteInstance(autocomplete)}
              onPlaceChanged={() => {
                const place = autocompleteInstance?.getPlace();
                const locationName = place?.name || place?.formatted_address || searchInput;
                const query = locationName?.trim();
                if (!query) return;
                if (isUserLoading) return;
                if (hasUser) {
                  routerPush(`/search?q=${encodeURIComponent(query)}`);
                } else {
                  void ensureSessionOrPrompt({ type: "placeChanged" });
                }
              }}
              locationInputRef={locationInputRef}
              onLoginRequired={
                !hasUser && !isUserLoading ? () => void ensureSessionOrPrompt() : undefined
              }
              isLoginModalOpen={showAuthModal}
              disableSearchInput={!hasUser && !isUserLoading}
            />
          ) : (
            <div className="w-full rounded-2xl border border-indigo-100 bg-white/80 px-4 py-4 text-center text-sm text-slate-400 [font-family:'Space_Grotesk',ui-sans-serif,system-ui]">
              Loading search…
            </div>
          )}
        </div>

        <div className='mt-3 grid gap-3 sm:grid-cols-3'>
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className='rounded-2xl border border-indigo-100/80 bg-white/85 px-4 py-4 text-center'>
              <p className="text-2xl font-semibold text-slate-900 [font-family:'Space_Grotesk',ui-sans-serif,system-ui]">
                {stat.value}
              </p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-slate-500 [font-family:'Space_Grotesk',ui-sans-serif,system-ui]">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        <div className='mt-7 flex flex-col items-center gap-2'>
          <p className="text-xs font-medium text-slate-500 [font-family:'Space_Grotesk',ui-sans-serif,system-ui]">
            Curious what happens next?
          </p>
          <button
            type='button'
            onClick={onScrollToHowItWorks}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 [font-family:'Space_Grotesk',ui-sans-serif,system-ui]">
            See how it works
            <span className='animate-bounce text-sm'>↓</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export const HomeLandingCard = memo(HomeLandingCardComponent);
