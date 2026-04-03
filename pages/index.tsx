import React, { useRef, useState } from "react";
import Head from "next/head";
import { useLoadScript, Libraries } from "@react-google-maps/api";
import { useRouter } from "next/router";
import AuthModal from "../components/auth/AuthModal";
import HowItWorksSection from "../components/home/HowItWorksSection";
import { HomeHeroBackground } from "../components/home/HomeHeroBackground";
import { HomeHeroIntro } from "../components/home/HomeHeroIntro";
import { HomeLandingCard } from "../components/home/HomeLandingCard";
import { useUser } from "@/hooks/useUser";
import { useHomeAuthFlow } from "@/hooks/useHomeAuthFlow";

const libraries: Libraries = ["places"];

/**
 * 랜딩 페이지: 히어로 + 검색 진입(인증 게이트) + How it works
 */
function HomeContent() {
  const router = useRouter();
  const howItWorksRef = useRef<HTMLDivElement>(null);
  const [searchInput, setSearchInput] = useState("");
  const [autocompleteInstance, setAutocompleteInstance] =
    useState<google.maps.places.Autocomplete | null>(null);
  const locationInputRef = useRef<HTMLInputElement>(null);
  const { user, isLoading: isUserLoading } = useUser();

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries,
    language: "en",
  });

  const hasUser = !!user;
  const isAuthenticated = hasUser && !isUserLoading;

  const {
    showAuthModal,
    setShowAuthModal,
    handleAuthSuccess,
    ensureSessionOrPrompt,
    onAuthModalClose,
  } = useHomeAuthFlow({
    router,
    hasUser,
    isUserLoading,
    searchInput,
  });

  const handleScrollToHowItWorks = () => {
    howItWorksRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
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

      <AuthModal isOpen={showAuthModal} onClose={onAuthModalClose} onAuthSuccess={handleAuthSuccess} />

      <div className='relative min-h-[calc(100vh-4.5rem)] overflow-hidden'>
        <HomeHeroBackground />

        <div className='relative z-10 mx-auto flex min-h-[calc(100vh-4.5rem)] w-full max-w-6xl flex-col justify-center px-4 pb-16 pt-12'>
          <HomeHeroIntro />
          <HomeLandingCard
            loadError={loadError ?? undefined}
            isLoaded={isLoaded}
            searchInput={searchInput}
            setSearchInput={setSearchInput}
            locationInputRef={locationInputRef}
            autocompleteInstance={autocompleteInstance}
            setAutocompleteInstance={setAutocompleteInstance}
            user={user}
            isUserLoading={isUserLoading}
            hasUser={hasUser}
            showAuthModal={showAuthModal}
            ensureSessionOrPrompt={ensureSessionOrPrompt}
            onScrollToHowItWorks={handleScrollToHowItWorks}
            routerPush={(path) => void router.push(path)}
          />
        </div>
      </div>

      <div ref={howItWorksRef}>
        <HowItWorksSection
          onLoginClick={() => setShowAuthModal(true)}
          onSearchClick={() => void router.push("/search")}
          isAuthenticated={isAuthenticated}
        />
      </div>
    </>
  );
}

export default function Home() {
  return <HomeContent />;
}
