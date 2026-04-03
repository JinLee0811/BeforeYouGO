import { useCallback, useRef, useState } from "react";
import type { NextRouter } from "next/router";
import { supabase } from "@/lib/supabaseClient";
import type { SearchPendingAction } from "@/types/searchPage";

type Params = {
  router: NextRouter;
  hasUser: boolean;
  isUserLoading: boolean;
  searchInput: string;
};

/**
 * 랜딩 페이지: 비로그인 시 검색 전에 세션 확인·로그인 모달·인증 후 /search 로 라우팅
 */
export function useHomeAuthFlow({ router, hasUser, isUserLoading, searchInput }: Params) {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<SearchPendingAction | null>(null);
  const loginPromptCooldownUntilRef = useRef(0);
  const sessionCheckInFlightRef = useRef(false);

  const handleAuthSuccess = useCallback(() => {
    setShowAuthModal(false);
    if (!pendingAction) return;
    if (pendingAction.type === "nearby") {
      void router.push("/search?mode=nearby");
    } else if (pendingAction.type === "location") {
      void router.push(`/search?q=${encodeURIComponent(pendingAction.location)}`);
    } else if (pendingAction.type === "placeChanged") {
      const fallback = searchInput.trim();
      const target = fallback ? `/search?q=${encodeURIComponent(fallback)}` : "/search";
      void router.push(target);
    }
    setPendingAction(null);
  }, [pendingAction, router, searchInput]);

  const ensureSessionOrPrompt = useCallback(
    async (action?: SearchPendingAction) => {
      if (sessionCheckInFlightRef.current) return;
      sessionCheckInFlightRef.current = true;
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user) {
          if (showAuthModal) setShowAuthModal(false);
          setPendingAction(null);
          if (action?.type === "nearby") {
            void router.push("/search?mode=nearby");
          } else if (action?.type === "location" && action.location) {
            void router.push(`/search?q=${encodeURIComponent(action.location)}`);
          } else if (action?.type === "placeChanged") {
            const fallback = searchInput.trim();
            const target = fallback ? `/search?q=${encodeURIComponent(fallback)}` : "/search";
            void router.push(target);
          }
          return;
        }
        if (Date.now() < loginPromptCooldownUntilRef.current) return;
        if (action) setPendingAction(action);
        setShowAuthModal(true);
      } finally {
        sessionCheckInFlightRef.current = false;
      }
    },
    [router, searchInput, showAuthModal]
  );

  const onAuthModalClose = useCallback(() => {
    loginPromptCooldownUntilRef.current = Date.now() + 500;
    setShowAuthModal(false);
  }, []);

  return {
    showAuthModal,
    /** How it works 등에서 로그인 모달만 열 때 사용 */
    setShowAuthModal,
    handleAuthSuccess,
    ensureSessionOrPrompt,
    onAuthModalClose,
  };
}
