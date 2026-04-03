import { useCallback, type Dispatch, type SetStateAction } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import type { SearchPendingAction } from "@/types/searchPage";
import type { SubmitPlacePrefill } from "@/hooks/useReviewAnalysis";
import { recordPlaceClick } from "@/lib/recordPlaceClick";

type SelectedRestaurant = {
  placeId: string;
  name: string;
  address?: string;
  photos: string[];
};

type Params = {
  user: User | null;
  setPendingAction: Dispatch<SetStateAction<SearchPendingAction | null>>;
  setShowAuthModal: (v: boolean) => void;
  setSelectedRestaurant: (r: SelectedRestaurant | null) => void;
  handleSubmit: (url?: string, placeId?: string, prefill?: SubmitPlacePrefill) => void | Promise<void>;
};

/**
 * 검색 결과 카드 선택 시: /api/placedetails 로 주소·사진 보강 후 기본 요약 파이프라인(handleSubmit) 실행
 */
export function useSearchRestaurantSelection({
  user,
  setPendingAction,
  setShowAuthModal,
  setSelectedRestaurant,
  handleSubmit,
}: Params) {
  const performSelectRestaurantForBasicAnalysis = useCallback(
    async (placeId: string, name: string, url?: string, address?: string) => {
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

      const prefill: SubmitPlacePrefill = {
        name,
        address: finalAddress,
        photos: finalPhotos,
      };
      setSelectedRestaurant({ placeId, name, address: finalAddress, photos: finalPhotos });
      recordPlaceClick({
        placeId,
        name,
        address: finalAddress,
        imageUrl: finalPhotos[0] ?? null,
      });

      if (url) {
        void handleSubmit(url, placeId, prefill);
      } else if (placeId) {
        void handleSubmit(undefined, placeId, prefill);
      }
    },
    [handleSubmit, setPendingAction, setSelectedRestaurant, setShowAuthModal]
  );

  const handleSelectRestaurantForBasicAnalysis = useCallback(
    async (placeId: string, name: string, url?: string, address?: string) => {
      if (!user) {
        setPendingAction({ type: "select", placeId, name, url, address });
        setShowAuthModal(true);
        return;
      }
      await performSelectRestaurantForBasicAnalysis(placeId, name, url, address);
    },
    [performSelectRestaurantForBasicAnalysis, setPendingAction, setShowAuthModal, user]
  );

  return { performSelectRestaurantForBasicAnalysis, handleSelectRestaurantForBasicAnalysis };
}
