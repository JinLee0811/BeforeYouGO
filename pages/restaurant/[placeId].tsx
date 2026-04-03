import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import AuthModal from "../../components/auth/AuthModal";
import { useGoogleMaps } from "@/hooks/useGoogleMaps";
import { useRestaurantDetailPage } from "@/hooks/useRestaurantDetailPage";
import { useUser } from "@/hooks/useUser";
import { RestaurantDetailHeader } from "@/components/restaurant/RestaurantDetailHeader";
import { RestaurantDetailAnalysisSection } from "@/components/restaurant/RestaurantDetailAnalysisSection";
import { RestaurantDetailReviewPanel } from "@/components/restaurant/RestaurantDetailReviewPanel";
import { recordPlaceClick } from "@/lib/recordPlaceClick";

/**
 * Google Place ID 기준 식당 상세: 메타 로드 후 어드민은 Pro 분석, 일반 유저는 기본 요약 + 업그레이드 유도
 */
export default function RestaurantDetailPage() {
  const router = useRouter();
  const { placeId } = router.query;
  const { isLoaded, loadError } = useGoogleMaps();
  const pid = typeof placeId === "string" ? placeId : undefined;
  const { user, isLoading: isUserLoading, analysisAdmin } = useUser();

  const {
    details,
    pageLoading,
    pageError,
    analysisResult,
    isAnalyzing,
    analysisError,
    needsAuthForAnalysis,
    runProAnalysis,
    basicSummaryResult,
    basicSummaryLoading,
    basicSummaryError,
  } = useRestaurantDetailPage({
    placeId: pid,
    isLoaded,
    loadError: loadError ?? undefined,
    routerIsReady: router.isReady,
    analysisAdmin,
    isUserLoading,
    userId: user?.id,
  });

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const recordedPlaceRef = useRef<string | null>(null);

  useEffect(() => {
    recordedPlaceRef.current = null;
  }, [pid]);

  useEffect(() => {
    if (!details?.place_id || !user) return;
    if (recordedPlaceRef.current === details.place_id) return;
    recordedPlaceRef.current = details.place_id;
    const photoUrl = details.photos?.[0]?.getUrl({ maxWidth: 400 });
    recordPlaceClick({
      placeId: details.place_id,
      name: details.name,
      address: details.formatted_address,
      imageUrl: photoUrl ?? null,
    });
  }, [details, user]);

  const handleAuthRequired = useCallback(() => setShowAuthModal(true), []);

  const handleWishlistClick = useCallback(() => {
    handleAuthRequired();
  }, [handleAuthRequired]);

  const handleReviewClick = useCallback(() => {
    handleAuthRequired();
    setShowReviewForm(true);
  }, [handleAuthRequired]);

  const handleAuthSuccess = useCallback(() => {
    setShowAuthModal(false);
    if (details?.place_id && analysisAdmin) {
      void runProAnalysis(details.place_id);
    }
  }, [details?.place_id, runProAnalysis, analysisAdmin]);

  const selectedRestaurantForCard =
    details != null
      ? {
          placeId: details.place_id,
          name: details.name,
          address: details.formatted_address,
          photos: details.photos?.map((p) => p.getUrl({ maxWidth: 520 })).filter(Boolean),
          rating: details.rating,
        }
      : null;

  if (pageLoading) {
    return <div className='py-12 text-center'>Loading restaurant details...</div>;
  }

  if (!details && pageError) {
    return <div className='py-12 text-center text-red-600'>Error loading page: {pageError}</div>;
  }

  if (!details) {
    return <div className='py-12 text-center'>Restaurant not found or failed to load.</div>;
  }

  return (
    <>
      <Head>
        <title>{details.name} - Restaurant Details</title>
      </Head>

      <div className='mx-auto max-w-4xl px-4 py-8'>
        <RestaurantDetailHeader details={details} onAuthRequired={handleAuthRequired} />

        <RestaurantDetailAnalysisSection
          analysisAdmin={analysisAdmin}
          isAnalyzing={isAnalyzing}
          analysisError={analysisError}
          needsAuthForAnalysis={needsAuthForAnalysis}
          analysisResult={analysisResult}
          basicSummaryLoading={basicSummaryLoading}
          basicSummaryError={basicSummaryError}
          basicSummaryResult={basicSummaryResult}
          selectedRestaurant={selectedRestaurantForCard}
          onOpenAuth={handleAuthRequired}
          onWishlistClick={handleWishlistClick}
          onReviewClick={handleReviewClick}
        />

        <RestaurantDetailReviewPanel
          open={showReviewForm}
          placeId={details.place_id}
          restaurantName={details.name}
          onClose={() => setShowReviewForm(false)}
        />
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </>
  );
}

/**
 * 동적 placeId — 빌드 시 정적 경로를 만들지 않고 요청 시 SSR/SSG fallback
 */
export async function getStaticPaths() {
  return { paths: [], fallback: "blocking" };
}

export async function getStaticProps() {
  return { props: {} };
}
