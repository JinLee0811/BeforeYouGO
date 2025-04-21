import React, { useRef, useState } from "react";
import Head from "next/head";
import { ChartBarIcon } from "@heroicons/react/24/outline";
import { useLoadScript } from "@react-google-maps/api";
import { motion, AnimatePresence } from "framer-motion";
import HomeHeader from "../components/home/HomeHeader";
import SearchSection from "../components/home/SearchSection";
import RestaurantResults from "../components/home/RestaurantResults";
import DirectSearchSection from "../components/home/DirectSearchSection";
import AnalysisResults from "../components/home/AnalysisResults";
import { useRestaurantSearch } from "../hooks/useRestaurantSearch";
import { useReviewAnalysis } from "../hooks/useReviewAnalysis";

const libraries: ("places" | "geometry")[] = ["places", "geometry"];

// Animation variants
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

function HomeContent() {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries,
    language: "en",
  });

  const topRef = useRef<HTMLDivElement>(null);
  const [directUrlInput, setDirectUrlInput] = useState("");
  const [activeTab, setActiveTab] = useState<"search" | "direct">("search");

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
    isLoading,
    result,
    error: analysisError,
    selectedRestaurant,
    reviewResultRef,
    handleSubmit,
    handleRestaurantSelect,
    setSelectedRestaurant,
    cancelAnalysis,
  } = useReviewAnalysis();

  const handleNewSearch = () => {
    setSelectedRestaurant(null);
    setDirectUrlInput("");
    topRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  if (loadError) {
    return (
      <div className='text-center py-12 text-red-600'>Error loading maps: {loadError.message}</div>
    );
  }
  if (!isLoaded) {
    return <div className='text-center py-12'>Loading map services...</div>;
  }

  return (
    <>
      <Head>
        <title>Before You Go | AI Restaurant Insights for Travelers</title>
        <meta
          name='description'
          content='Find the best local restaurants anywhere. AI analyzes reviews, so you dine like a local, not a tourist. Perfect for your next trip!'
        />
      </Head>

      {/* Loading Indicator Animation */}
      <AnimatePresence>
        {isLoading && selectedRestaurant && (
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
                Our AI is reading reviews for{" "}
                <span className='font-medium'>{selectedRestaurant.name}</span>...
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
          {/* Tab Component */}
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

          {/* Tab Content Animation */}
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
                    onFindNearby={findNearby}
                    onSearchByLocationText={searchByLocationText}
                    onAutocompleteLoad={onAutocompleteLoad}
                    onPlaceChanged={onPlaceChanged}
                    locationInputRef={locationInputRef}
                  />
                ) : (
                  <DirectSearchSection
                    isLoading={isLoading}
                    directUrlInput={directUrlInput}
                    onDirectUrlInputChange={setDirectUrlInput}
                    onSubmit={handleSubmit}
                    onRestaurantSelect={handleRestaurantSelect}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Restaurant Results Animation */}
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
                onRestaurantSelect={handleRestaurantSelect}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Analysis Results Animation */}
        <AnimatePresence>
          {result && !isLoading && (
            <motion.div
              key='analysis-results'
              ref={reviewResultRef}
              initial='initial'
              animate='animate'
              exit='exit'
              variants={fadeInUp}
              transition={{ duration: 0.5 }}>
              <AnalysisResults
                result={result}
                selectedRestaurant={selectedRestaurant}
                onNewSearch={handleNewSearch}
                reviewResultRef={reviewResultRef}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

export default function Home() {
  return <HomeContent />;
}
