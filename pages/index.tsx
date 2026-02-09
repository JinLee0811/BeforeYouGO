import React, { useEffect, useRef, useState } from "react";
import Head from "next/head";
import { useLoadScript, Libraries } from "@react-google-maps/api";
import { useRouter } from "next/router";
import HomeHeader from "../components/home/HomeHeader";
import SearchSection from "../components/home/SearchSection";
import HowItWorksSection from "../components/home/HowItWorksSection";
import AuthModal from "../components/auth/AuthModal";
import { useUser } from "@/hooks/useUser";
import { supabase } from "@/lib/supabaseClient";

const libraries: Libraries = ["places"];
function HomeContent() {
  const router = useRouter();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { user, isLoading: isUserLoading } = useUser();
  const howItWorksRef = useRef<HTMLDivElement>(null);
  const [searchInput, setSearchInput] = useState("");
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const loginPromptCooldownUntilRef = useRef(0);
  const sessionCheckInFlightRef = useRef(false);
  const [autocompleteInstance, setAutocompleteInstance] =
    useState<google.maps.places.Autocomplete | null>(null);
  const locationInputRef = useRef<HTMLInputElement>(null);
  const [pendingAction, setPendingAction] = useState<
    | { type: "nearby" }
    | { type: "location"; location: string }
    | { type: "placeChanged" }
    | null
  >(null);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries,
    language: "en",
  });

  const handleScrollToHowItWorks = () => {
    howItWorksRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    const handleScroll = () => {
      setShowHowItWorks(window.scrollY > 180);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

  const ensureSessionOrPrompt = async (action?: { type: "nearby" | "location" | "placeChanged"; location?: string }) => {
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

      <HomeHeader />

      <div className='max-w-5xl mx-auto px-4 py-10'>
        <div
          className={`rounded-[28px] border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl px-8 py-10 text-center transition-all duration-500 ${
            showHowItWorks ? "opacity-0 -translate-y-6 pointer-events-none" : "opacity-100"
          }`}>
          <div className='inline-flex items-center gap-2 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-200 px-3 py-1 text-xs font-semibold'>
            {user ? "Welcome back" : "New here?"}
          </div>
          <h1 className='mt-4 text-3xl sm:text-4xl font-semibold text-gray-900 dark:text-white'>
            Search smarter. Choose faster.
          </h1>
          <p className='mt-3 text-base sm:text-lg text-gray-600 dark:text-gray-300'>
            AI summaries help you decide in seconds.
          </p>
          <div className='mt-7'>
            <div className='max-w-2xl mx-auto w-full'>
              {loadError && (
                <p className='text-sm text-red-500 mb-3'>Error loading maps. Please refresh.</p>
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
                <div className='w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm text-gray-400'>
                  Loading search…
                </div>
              )}
            </div>
          </div>
          {!showHowItWorks && (
            <div className='mt-6 flex justify-center'>
              <p className='text-sm font-semibold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent animate-pulse'>
                New here? Scroll down to see how it works.
              </p>
            </div>
          )}
        </div>

        <div
          ref={howItWorksRef}
          className={`transition-opacity duration-500 ${
            showHowItWorks ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}>
          <HowItWorksSection
            onLoginClick={() => setShowAuthModal(true)}
            onSearchClick={() => router.push("/search")}
            isAuthenticated={isAuthenticated}
          />
        </div>
      </div>
    </>
  );
}

export default function Home() {
  return <HomeContent />;
}
