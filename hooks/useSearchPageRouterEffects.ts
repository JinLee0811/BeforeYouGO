import { useEffect, useRef, type Dispatch, type SetStateAction } from "react";
import type { NextRouter } from "next/router";
import type { User } from "@supabase/supabase-js";
import type { SearchPendingAction } from "@/types/searchPage";

type Args = {
  isLoaded: boolean;
  router: NextRouter;
  user: User | null;
  isUserLoading: boolean;
  isAnalyzing: boolean;
  result: unknown;
  detailedResult: unknown;
  /** true면 ?analyze= 일 때 Pro(/api/analyze), 아니면 무료 기본 요약(crawl + summary-basic) */
  analysisAdmin: boolean;
  handleSubmit: (url: string | undefined, placeId?: string) => void | Promise<void>;
  handleGetDetailedAnalysisFromPlaceId: (placeId: string) => void | Promise<void>;
  findNearby: () => void;
  searchByLocationText: (location: string) => void;
  setSearchLocationInput: (value: string) => void;
  setPendingAction: Dispatch<SetStateAction<SearchPendingAction | null>>;
  setShowAuthModal: (open: boolean) => void;
};

/**
 * URL 쿼리(placeId+analyze, q, mode=nearby)와 인증 상태를 동기화하는 부수 효과 모음.
 * (검색 페이지 본문에서 useEffect 블록을 제거해 가독성 확보)
 */
export function useSearchPageRouterEffects({
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
}: Args) {
  const lastQueryRef = useRef<string | null>(null);
  const hasTriggeredNearbyRef = useRef(false);
  /** React Strict Mode 이중 실행 시 같은 placeId로 crawl 429(CRAWL_IN_FLIGHT) 나는 것 방지 */
  const lastAutoAnalyzeRef = useRef<{ placeId: string; at: number } | null>(null);

  // ?placeId=&analyze=true → 어드민만 Pro(/api/analyze), 일반 유저는 무료 기본 요약
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
      const now = Date.now();
      const prev = lastAutoAnalyzeRef.current;
      const dedupeMs = 4000;
      const isDuplicate =
        prev && prev.placeId === placeId && now - prev.at < dedupeMs;

      const queryWithoutAnalyze = { ...router.query };
      delete queryWithoutAnalyze.analyze;
      void router.replace({ pathname: router.pathname, query: queryWithoutAnalyze }, undefined, {
        shallow: true,
      });

      if (isDuplicate) {
        return;
      }
      lastAutoAnalyzeRef.current = { placeId, at: now };

      if (analysisAdmin) {
        void handleGetDetailedAnalysisFromPlaceId(placeId);
      } else {
        void handleSubmit(undefined, placeId);
      }
    }
  }, [
    isLoaded,
    router.isReady,
    router.query,
    isAnalyzing,
    result,
    detailedResult,
    user,
    analysisAdmin,
    handleSubmit,
    handleGetDetailedAnalysisFromPlaceId,
    router,
  ]);

  // ?q= → 지역명 검색 (미로그인 시 로그인 모달에 액션 보류)
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
    setPendingAction,
    setShowAuthModal,
  ]);

  // ?mode=nearby → 내 주변 검색 1회
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
  }, [isLoaded, router.isReady, router.query.mode, user, isUserLoading, findNearby, setPendingAction, setShowAuthModal]);

  useEffect(() => {
    if (router.query.mode !== "nearby") {
      hasTriggeredNearbyRef.current = false;
    }
  }, [router.query.mode]);
}
