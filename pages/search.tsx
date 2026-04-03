import React, { useRef, useState } from "react";
import Head from "next/head";
import { useLoadScript, Libraries } from "@react-google-maps/api";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/router";
import HomeHeader from "../components/home/HomeHeader";
import SearchSection from "../components/home/SearchSection";
import RestaurantResults from "../components/home/RestaurantResults";
import DirectSearchSection from "../components/home/DirectSearchSection";
import AnalysisResults from "../components/home/AnalysisResults";
import AuthModal from "../components/auth/AuthModal";
import { SearchAnalyzingModal } from "../components/search/SearchAnalyzingModal";
import { SearchSourceTabs, type SearchSourceTab } from "../components/search/SearchSourceTabs";
import { searchFadeIn, searchFadeInUp } from "../components/search/searchMotion";
import { useRestaurantSearch } from "../hooks/useRestaurantSearch";
import { useReviewAnalysis } from "../hooks/useReviewAnalysis";
import { useUser } from "@/hooks/useUser";
import { useSearchPageRouterEffects } from "@/hooks/useSearchPageRouterEffects";
import { useSearchRestaurantSelection } from "@/hooks/useSearchRestaurantSelection";
import { useAnalysisQuota } from "@/hooks/useAnalysisQuota";
import {
  isAnalysisQuotaNormal,
  isAnalysisQuotaUnavailable,
  shouldShowFreeTierQuotaBanners,
} from "@/lib/analysisQuotaUi";
import type { SearchPendingAction } from "@/types/searchPage";

const libraries: Libraries = ["places"];

/**
 * 검색 페이지 본문: Maps 로드, 훅 연결, 라우터·모달·결과 UI 조합
 */
function SearchContent() {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries,
    language: "en",
  });

  const router = useRouter();
  const topRef = useRef<HTMLDivElement>(null);
  const [directUrlInput, setDirectUrlInput] = useState("");
  const [activeTab, setActiveTab] = useState<SearchSourceTab>("search");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<SearchPendingAction | null>(null);
  const { user, isLoading: isUserLoading, analysisAdmin } = useUser();
  const { quota: quotaInfo } = useAnalysisQuota(user, analysisAdmin, isUserLoading);
  const showQuotaBanners = shouldShowFreeTierQuotaBanners(user, isUserLoading, analysisAdmin, quotaInfo);

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
    error: analysisFlowError,
    reviews,
    selectedRestaurant,
    reviewResultRef,
    handleSubmit,
    handleGetDetailedAnalysisFromPlaceId,
    setSelectedRestaurant,
    cancelAnalysis,
  } = useReviewAnalysis();

  useSearchPageRouterEffects({
    isLoaded,
    router,
    user,
    isUserLoading,
    isAnalyzing,
    result,
    detailedResult,
    analysisAdmin,
    handleSubmit,
    handleGetDetailedAnalysisFromPlaceId,
    findNearby,
    searchByLocationText,
    setSearchLocationInput,
    setPendingAction,
    setShowAuthModal,
  });

  const { performSelectRestaurantForBasicAnalysis, handleSelectRestaurantForBasicAnalysis } =
    useSearchRestaurantSelection({
      user,
      setPendingAction,
      setShowAuthModal,
      setSelectedRestaurant,
      handleSubmit,
    });

  const handleNewSearch = () => {
    setSelectedRestaurant(null);
    void router.replace("/search", undefined, { shallow: true });
    topRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleFindNearby = () => {
    if (!user) {
      setPendingAction({ type: "nearby" });
      setShowAuthModal(true);
      return;
    }
    findNearby();
  };

  const handleSearchByLocationText = (location: string) => {
    if (!user) {
      setPendingAction({ type: "location", location });
      setShowAuthModal(true);
      return;
    }
    searchByLocationText(location);
  };

  const handlePlaceChanged = () => {
    if (!user) {
      setPendingAction({ type: "placeChanged" });
      setShowAuthModal(true);
      return;
    }
    onPlaceChanged();
  };

  /** 로그인 성공 후 보류 중이던 액션 재개 */
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
      <div className='py-12 text-center text-red-600'>Error loading maps: {loadError.message}</div>
    );
  }
  if (!isLoaded) {
    return <div className='py-12 text-center'>Loading map services...</div>;
  }

  const displayResultData = detailedResult || result;

  return (
    <>
      <Head>
        <title>Search | Before You Go</title>
        <meta name='description' content='Search restaurants and generate AI summaries in seconds.' />
      </Head>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => {
          setShowAuthModal(false);
          setPendingAction(null);
        }}
        onAuthSuccess={handleAuthSuccess}
      />

      <SearchAnalyzingModal
        open={isAnalyzing}
        selectedRestaurant={selectedRestaurant}
        onCancel={cancelAnalysis}
      />

      <div ref={topRef}>
        <HomeHeader />

        <div className='mx-auto max-w-4xl px-4 py-8'>
          {showQuotaBanners && isAnalysisQuotaUnavailable(quotaInfo) && (
              <div
                className='mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950'
                role='status'>
                <p className='font-semibold'>We couldn&apos;t load your daily usage.</p>
                <p className='mt-1'>
                  You may still try an analysis. If it doesn&apos;t work, wait a moment and refresh, or sign out and back
                  in. If this keeps happening, contact support.
                </p>
              </div>
            )}

          {showQuotaBanners && isAnalysisQuotaNormal(quotaInfo) && quotaInfo.remaining === 0 && (
              <div
                className='mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-950'
                role='status'>
                <p className='font-semibold'>You have used all free analyses for today.</p>
                <p className='mt-1'>
                  You used {quotaInfo.used} of {quotaInfo.limit} today. Your allowance resets at the start of the next
                  day. Upgrade on the pricing page for more.
                </p>
                <a
                  href='/pricing'
                  className='mt-2 inline-block font-medium text-indigo-700 underline hover:text-indigo-900'>
                  View plans & pricing
                </a>
              </div>
            )}

          {showQuotaBanners && isAnalysisQuotaNormal(quotaInfo) && quotaInfo.remaining > 0 && (
              <div
                className='mb-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700'
                role='status'>
                Free analyses today: <span className='font-semibold'>{quotaInfo.remaining}</span> left · {quotaInfo.used}
                /{quotaInfo.limit} used
              </div>
            )}

          {analysisFlowError && (
            <div
              className='mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950'
              role='alert'>
              <p className='mb-2'>{analysisFlowError}</p>
              <a href='/pricing' className='font-medium text-indigo-700 underline hover:text-indigo-900'>
                View plans & pricing
              </a>
            </div>
          )}

          <SearchSourceTabs activeTab={activeTab} onTabChange={setActiveTab} />

          <div className='mt-8'>
            <AnimatePresence mode='wait'>
              <motion.div
                key={activeTab}
                initial='initial'
                animate='animate'
                exit='exit'
                variants={searchFadeIn}
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
              variants={searchFadeInUp}
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
              variants={searchFadeInUp}
              transition={{ duration: 0.5 }}>
              <AnalysisResults
                analysisAdmin={analysisAdmin}
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

/** Next 페이지 엔트리 — SearchContent로 Maps 훅 스코프 유지 */
export default function SearchPage() {
  return <SearchContent />;
}
