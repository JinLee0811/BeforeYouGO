import React, { useRef, useState, useEffect } from "react";
import Head from "next/head";
import { ChartBarIcon } from "@heroicons/react/24/outline";
import { useLoadScript, Libraries } from "@react-google-maps/api";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/router";
import HomeHeader from "../components/home/HomeHeader";
import SearchSection from "../components/home/SearchSection";
import RestaurantResults from "../components/home/RestaurantResults";
import DirectSearchSection from "../components/home/DirectSearchSection";
import AnalysisResults from "../components/home/AnalysisResults";
import AuthModal from "../components/auth/AuthModal";
import { useRestaurantSearch } from "../hooks/useRestaurantSearch";
import { useReviewAnalysis } from "../hooks/useReviewAnalysis";
import { useUser } from "@/hooks/useUser";
import { supabase } from "@/lib/supabaseClient";

const libraries: Libraries = ["places"];

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

function SearchContent() {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries,
    language: "en",
  });

  const router = useRouter();
  const topRef = useRef<HTMLDivElement>(null);
  const [directUrlInput, setDirectUrlInput] = useState("");
  const [activeTab, setActiveTab] = useState<"search" | "direct">("search");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const hasTriggeredNearbyRef = useRef(false);
  const lastQueryRef = useRef<string | null>(null);
  const [pendingAction, setPendingAction] = useState<
    | { type: "nearby" }
    | { type: "location"; location: string }
    | { type: "placeChanged" }
    | { type: "select"; placeId: string; name: string; url?: string; address?: string }
    | null
  >(null);
  const { user, isLoading: isUserLoading } = useUser();

  const {
    isSearching,
    error: searchError,
    restaurants,
    searchLocationInput,
    hasSearched,
    locationInputRef,
    setSearchLocationInput,
    findNearby,
    searchByLocationText,
    onAutocompleteLoad,
    onPlaceChanged,
  } = useRestaurantSearch(isLoaded);

  const {
    isAnalyzing,
    result,
    detailedResult,
    reviews,
    selectedRestaurant,
    reviewResultRef,
    handleSubmit,
    handleGetDetailedAnalysisFromPlaceId,
    setSelectedRestaurant,
    cancelAnalysis,
  } = useReviewAnalysis();

  useEffect(() => {
    if (!isLoaded || !router.isReady) return;

    const { placeId, analyze } = router.query;

    if (
      placeId &&
      typeof placeId === "string" &&
      analyze === "true" &&
      user &&
      !isAnalyzing &&
      !result &&
      !detailedResult
    ) {
      handleGetDetailedAnalysisFromPlaceId(placeId);

      const currentPath = router.pathname;
      const queryWithoutAnalyze = { ...router.query };
      delete queryWithoutAnalyze.analyze;
      router.replace({ pathname: currentPath, query: queryWithoutAnalyze }, undefined, {
        shallow: true,
      });
    }
  }, [
    isLoaded,
    router.isReady,
    router.query,
    isAnalyzing,
    result,
    detailedResult,
    user,
    handleGetDetailedAnalysisFromPlaceId,
    router,
  ]);

  useEffect(() => {
    if (!isLoaded || !router.isReady) return;
    if (isUserLoading) return;
    const queryText = typeof router.query.q === "string" ? router.query.q.trim() : "";
    if (!queryText) return;
    if (lastQueryRef.current === queryText) return;
    lastQueryRef.current = queryText;
    if (!user) {
      setPendingAction({ type: "location", location: queryText });
      setShowAuthModal(true);
      return;
    }
    setSearchLocationInput(queryText);
    searchByLocationText(queryText);
  }, [
    isLoaded,
    router.isReady,
    router.query.q,
    user,
    isUserLoading,
    searchByLocationText,
    setSearchLocationInput,
  ]);

  useEffect(() => {
    if (!isLoaded || !router.isReady) return;
    if (isUserLoading) return;
    if (router.query.mode !== "nearby") return;
    if (hasTriggeredNearbyRef.current) return;
    if (!user) {
      setPendingAction({ type: "nearby" });
      setShowAuthModal(true);
      return;
    }
    hasTriggeredNearbyRef.current = true;
    findNearby();
  }, [isLoaded, router.isReady, router.query.mode, user, isUserLoading, findNearby]);

  useEffect(() => {
    if (router.query.mode !== "nearby") {
      hasTriggeredNearbyRef.current = false;
    }
  }, [router.query.mode]);

  const isDemoLocked = () =>
    typeof window !== "undefined" && localStorage.getItem("demo_free_analysis_used") === "true";

  const performSelectRestaurantForBasicAnalysis = async (
    placeId: string,
    name: string,
    url?: string,
    address?: string
  ) => {
    let finalAddress = address;
    let finalPhotos: string[] = [];

    if (placeId) {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const accessToken = session?.access_token;
        const response = await fetch(`/api/placedetails?placeId=${placeId}`, {
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
        });
        if (response.status === 401) {
          setPendingAction({ type: "select", placeId, name, url, address });
          setShowAuthModal(true);
          return;
        }
        if (response.status === 429) {
          console.warn("Place details rate limited.");
          return;
        }
        const detailsData = await response.json();

        if (detailsData.success && detailsData.data) {
          finalAddress = detailsData.data.address || finalAddress;
          finalPhotos = detailsData.data.photos || [];
        }
      } catch (error) {
        console.error(`[Frontend] Error calling /api/placedetails for ${placeId}:`, error);
      }
    }

    setSelectedRestaurant({ placeId, name, address: finalAddress, photos: finalPhotos });

    if (url) {
      handleSubmit(url, placeId);
    } else if (placeId) {
      handleSubmit(undefined, placeId);
    }
  };

  const handleSelectRestaurantForBasicAnalysis = async (
    placeId: string,
    name: string,
    url?: string,
    address?: string
  ) => {
    if (isDemoLocked()) {
      router.push("/pricing");
      return;
    }
    if (!user) {
      setPendingAction({ type: "select", placeId, name, url, address });
      setShowAuthModal(true);
      return;
    }
    await performSelectRestaurantForBasicAnalysis(placeId, name, url, address);
  };

  const handleNewSearch = () => {
    if (isDemoLocked()) {
      router.push("/pricing");
      return;
    }
    setSelectedRestaurant(null);
    router.replace("/search", undefined, { shallow: true });
    topRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleFindNearby = () => {
    if (isDemoLocked()) {
      router.push("/pricing");
      return;
    }
    if (!user) {
      setPendingAction({ type: "nearby" });
      setShowAuthModal(true);
      return;
    }
    findNearby();
  };

  const handleSearchByLocationText = (location: string) => {
    if (isDemoLocked()) {
      router.push("/pricing");
      return;
    }
    if (!user) {
      setPendingAction({ type: "location", location });
      setShowAuthModal(true);
      return;
    }
    searchByLocationText(location);
  };

  const handlePlaceChanged = () => {
    if (isDemoLocked()) {
      router.push("/pricing");
      return;
    }
    if (!user) {
      setPendingAction({ type: "placeChanged" });
      setShowAuthModal(true);
      return;
    }
    onPlaceChanged();
  };

  const handleAuthSuccess = async () => {
    setShowAuthModal(false);
    if (!pendingAction) return;
    switch (pendingAction.type) {
      case "nearby":
        findNearby();
        break;
      case "location":
        searchByLocationText(pendingAction.location);
        break;
      case "placeChanged":
        onPlaceChanged();
        break;
      case "select":
        await performSelectRestaurantForBasicAnalysis(
          pendingAction.placeId,
          pendingAction.name,
          pendingAction.url,
          pendingAction.address
        );
        break;
    }
    setPendingAction(null);
  };

  if (loadError) {
    return (
      <div className='text-center py-12 text-red-600'>Error loading maps: {loadError.message}</div>
    );
  }
  if (!isLoaded) {
    return <div className='text-center py-12'>Loading map services...</div>;
  }

  const displayResultData = detailedResult || result;

  return (
    <>
      <Head>
        <title>Search | Before You Go</title>
        <meta
          name='description'
          content='Search restaurants and generate AI summaries in seconds.'
        />
      </Head>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => {
          setShowAuthModal(false);
          setPendingAction(null);
        }}
        onAuthSuccess={handleAuthSuccess}
      />

      <AnimatePresence>
        {isAnalyzing && (
          <motion.div
            key='loading-modal'
            initial='initial'
            animate='animate'
            exit='exit'
            variants={fadeIn}
            transition={{ duration: 0.3 }}
            className='fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50'>
            <div className='bg-white dark:bg-gray-800 rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl text-center'>
              <ChartBarIcon className='w-12 h-12 text-blue-600 dark:text-blue-400 mx-auto mb-4 animate-pulse' />
              <h3 className='text-xl font-semibold mb-2 text-gray-900 dark:text-white'>
                Analyzing Reviews
              </h3>
              <p className='text-gray-600 dark:text-gray-300 mb-4'>
                {selectedRestaurant ? (
                  <>
                    Our AI is reading reviews for{" "}
                    <span className='font-medium'>{selectedRestaurant.name}</span>...
                  </>
                ) : (
                  "Please wait while we fetch the details and analyze..."
                )}
              </p>
              <div className='w-16 h-16 border-4 border-blue-200 dark:border-blue-900 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin mx-auto mb-4'></div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={cancelAnalysis}
                className='px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors duration-200'>
                Cancel Analysis
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div ref={topRef}>
        <HomeHeader />

        <div className='max-w-4xl mx-auto px-4 py-8'>
          <div className='flex justify-center mb-8'>
            <div className='relative bg-gray-200 dark:bg-gray-800 p-1 rounded-lg flex space-x-1 shadow-sm'>
              <motion.button
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab("search")}
                className={`relative px-6 py-2.5 rounded-md text-sm font-medium transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800 ${
                  activeTab === "search"
                    ? "text-blue-600 dark:text-blue-300"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                }`}>
                {activeTab === "search" && (
                  <motion.span
                    layoutId='activeTabIndicator'
                    className='absolute inset-0 z-0 rounded-md bg-white dark:bg-gray-600 shadow'
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <span className='relative z-10'>Search by Location</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab("direct")}
                className={`relative px-6 py-2.5 rounded-md text-sm font-medium transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800 ${
                  activeTab === "direct"
                    ? "text-blue-600 dark:text-blue-300"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                }`}>
                {activeTab === "direct" && (
                  <motion.span
                    layoutId='activeTabIndicator'
                    className='absolute inset-0 z-0 rounded-md bg-white dark:bg-gray-600 shadow'
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <span className='relative z-10'>Direct Search</span>
              </motion.button>
            </div>
          </div>

          <div className='mt-8'>
            <AnimatePresence mode='wait'>
              <motion.div
                key={activeTab}
                initial='initial'
                animate='animate'
                exit='exit'
                variants={fadeIn}
                transition={{ duration: 0.3 }}>
                {activeTab === "search" ? (
                  <SearchSection
                    isSearching={isSearching}
                    error={searchError}
                    searchLocationInput={searchLocationInput}
                    onSearchLocationInputChange={setSearchLocationInput}
                    onFindNearby={handleFindNearby}
                    onSearchByLocationText={handleSearchByLocationText}
                    onAutocompleteLoad={onAutocompleteLoad}
                    onPlaceChanged={handlePlaceChanged}
                    locationInputRef={locationInputRef}
                    isLoginModalOpen={showAuthModal}
                  />
                ) : (
                  <DirectSearchSection
                    isLoading={isAnalyzing}
                    directUrlInput={directUrlInput}
                    onDirectUrlInputChange={setDirectUrlInput}
                    onSubmit={handleSubmit}
                    onRestaurantSelect={handleSelectRestaurantForBasicAnalysis}
                    isAuthenticated={!!user}
                    onAuthRequired={() => setShowAuthModal(true)}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <AnimatePresence>
          {hasSearched && !isSearching && restaurants.length > 0 && (
            <motion.div
              key='restaurant-results'
              initial='initial'
              animate='animate'
              exit='exit'
              variants={fadeInUp}
              transition={{ duration: 0.5 }}
              className='mt-8'>
              <RestaurantResults
                restaurants={restaurants}
                onRestaurantSelect={handleSelectRestaurantForBasicAnalysis}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {displayResultData && !isAnalyzing && (
            <motion.div
              key='analysis-results'
              ref={reviewResultRef}
              initial='initial'
              animate='animate'
              exit='exit'
              variants={fadeInUp}
              transition={{ duration: 0.5 }}>
              <AnalysisResults
                result={displayResultData}
                selectedRestaurant={selectedRestaurant}
                onNewSearch={handleNewSearch}
                reviewResultRef={reviewResultRef}
                reviews={reviews}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

export default function SearchPage() {
  return <SearchContent />;
}
