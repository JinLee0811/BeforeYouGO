import React, { useRef, useState } from "react";
import Head from "next/head";
import { useLoadScript, Libraries } from "@react-google-maps/api";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import SearchSection from "../components/home/SearchSection";
import HowItWorksSection from "../components/home/HowItWorksSection";
import AuthModal from "../components/auth/AuthModal";
import { useUser } from "@/hooks/useUser";
import { supabase } from "@/lib/supabaseClient";

const libraries: Libraries = ["places"];

type PendingAction =
  | { type: "nearby" }
  | { type: "location"; location: string }
  | { type: "placeChanged" };

function HomeContent() {
  const router = useRouter();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { user, isLoading: isUserLoading } = useUser();
  const howItWorksRef = useRef<HTMLDivElement>(null);
  const [searchInput, setSearchInput] = useState("");
  const loginPromptCooldownUntilRef = useRef(0);
  const sessionCheckInFlightRef = useRef(false);
  const [autocompleteInstance, setAutocompleteInstance] =
    useState<google.maps.places.Autocomplete | null>(null);
  const locationInputRef = useRef<HTMLInputElement>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries,
    language: "en",
  });

  const handleScrollToHowItWorks = () => {
    howItWorksRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    if (!pendingAction) return;
    if (pendingAction.type === "nearby") {
      router.push("/search?mode=nearby");
    } else if (pendingAction.type === "location") {
      router.push(`/search?q=${encodeURIComponent(pendingAction.location)}`);
    } else if (pendingAction.type === "placeChanged") {
      const fallback = searchInput.trim();
      const target = fallback ? `/search?q=${encodeURIComponent(fallback)}` : "/search";
      router.push(target);
    }
    setPendingAction(null);
  };

  const hasUser = !!user;
  const isAuthenticated = hasUser && !isUserLoading;

  const ensureSessionOrPrompt = async (action?: PendingAction) => {
    if (sessionCheckInFlightRef.current) return;
    sessionCheckInFlightRef.current = true;
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        if (showAuthModal) {
          setShowAuthModal(false);
        }
        setPendingAction(null);
        if (action?.type === "nearby") {
          router.push("/search?mode=nearby");
        } else if (action?.type === "location" && action.location) {
          router.push(`/search?q=${encodeURIComponent(action.location)}`);
        } else if (action?.type === "placeChanged") {
          const fallback = searchInput.trim();
          const target = fallback ? `/search?q=${encodeURIComponent(fallback)}` : "/search";
          router.push(target);
        }
        return;
      }
      if (Date.now() < loginPromptCooldownUntilRef.current) return;
      if (action) {
        setPendingAction(action);
      }
      setShowAuthModal(true);
    } finally {
      sessionCheckInFlightRef.current = false;
    }
  };

  return (
    <>
      <Head>
        <title>Before You Go | AI Restaurant Insights for Travelers</title>
        <meta
          name='description'
          content='Discover restaurants faster with AI-generated review summaries.'
        />
      </Head>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => {
          loginPromptCooldownUntilRef.current = Date.now() + 500;
          setShowAuthModal(false);
        }}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Hero + search */}
      <div className='relative min-h-[calc(100vh-4.5rem)] overflow-hidden'>
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

        <div className='relative z-10 mx-auto flex min-h-[calc(100vh-4.5rem)] w-full max-w-6xl flex-col justify-center px-4 pb-16 pt-12'>
          <motion.div
            className='mx-auto max-w-4xl text-center'
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
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

          <motion.div
            className='mt-8'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.1 }}
          >
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
                        router.push("/search?mode=nearby");
                      } else {
                        ensureSessionOrPrompt({ type: "nearby" });
                      }
                    }}
                    onSearchByLocationText={(location) => {
                      const query = location.trim();
                      if (!query) return;
                      if (isUserLoading) return;
                      if (hasUser) {
                        router.push(`/search?q=${encodeURIComponent(query)}`);
                      } else {
                        ensureSessionOrPrompt({ type: "location", location: query });
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
                        router.push(`/search?q=${encodeURIComponent(query)}`);
                      } else {
                        ensureSessionOrPrompt({ type: "placeChanged" });
                      }
                    }}
                    locationInputRef={locationInputRef}
                    onLoginRequired={
                      !hasUser && !isUserLoading
                        ? () => {
                            ensureSessionOrPrompt();
                          }
                        : undefined
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
                {[
                  { value: "10K+", label: "Analyzed Restaurants" },
                  { value: "500K+", label: "Summarized Reviews" },
                  { value: "98%", label: "Summary Confidence" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className='rounded-2xl border border-indigo-100/80 bg-white/85 px-4 py-4 text-center'
                  >
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
                  onClick={handleScrollToHowItWorks}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 [font-family:'Space_Grotesk',ui-sans-serif,system-ui]"
                >
                  See how it works
                  <span className='animate-bounce text-sm'>↓</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* How it works section */}
      <div ref={howItWorksRef}>
        <HowItWorksSection
          onLoginClick={() => setShowAuthModal(true)}
          onSearchClick={() => router.push("/search")}
          isAuthenticated={isAuthenticated}
        />
      </div>
    </>
  );
}

export default function Home() {
  return <HomeContent />;
}
