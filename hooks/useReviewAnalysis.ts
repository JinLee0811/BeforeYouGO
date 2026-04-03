import { useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { AnalysisResult, BasicSummaryResult, Review, DetailedAnalysisResult } from "@/types";
import { useRouter } from "next/router";
import { parseApiJsonResponse } from "@/utils/parseApiJson";
import {
  analyzeApiFailureReason,
  crawlFailureReason,
  navigateToAnalysisError,
} from "@/lib/navigateAnalysisError";
import { messageForAnalysis429Response } from "@/lib/analysis429Message";
import { recordPlaceClick } from "@/lib/recordPlaceClick";

interface SelectedRestaurantState {
  placeId: string;
  name: string;
  address?: string;
  photos?: string[];
}

/** 검색 카드 선택 등에서 이미 /api/placedetails 로 채운 값 — handleSubmit 내 중복 요청 방지 */
export type SubmitPlacePrefill = {
  name?: string;
  address?: string;
  photos?: string[];
};

export const useReviewAnalysis = () => {
  const router = useRouter();
  const [isAnalyzing, setIsLoading] = useState(false);
  const [result, setResult] = useState<BasicSummaryResult | null>(null);
  const [detailedResult, setDetailedResult] = useState<DetailedAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<SelectedRestaurantState | null>(null);
  const reviewResultRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const getAccessToken = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token || null;
  };

  const handleSubmit = async (
    url: string | undefined,
    placeId?: string,
    placePrefill?: SubmitPlacePrefill
  ) => {
    setIsLoading(true);
    setResult(null);
    setDetailedResult(null);
    setError(null);
    setReviews([]);
    if (!placeId) setSelectedRestaurant(null);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        navigateToAnalysisError(router, "auth");
        return;
      }

      let effectiveUrl =
        url && url.startsWith("https://") ? url : undefined;
      if (!effectiveUrl && placeId) {
        effectiveUrl = `https://www.google.com/maps/search/?api=1&query_place_id=${encodeURIComponent(placeId)}`;
      }
      if (!effectiveUrl) {
        setError("A valid Google Maps URL or a place selection is required for analysis.");
        setIsLoading(false);
        return;
      }

      if (placeId) {
        if (placePrefill) {
          setSelectedRestaurant({
            placeId,
            name: placePrefill.name ?? "Restaurant",
            address: placePrefill.address,
            photos: placePrefill.photos ?? [],
          });
        } else {
          let rName = "Restaurant";
          let rAddr: string | undefined;
          let rPhotos: string[] = [];
          try {
            const detailsRes = await fetch(`/api/placedetails?placeId=${encodeURIComponent(placeId)}`, {
              headers: { Authorization: `Bearer ${accessToken}` },
              signal: abortControllerRef.current!.signal,
            });
            if (detailsRes.ok) {
              const detailsData = (await detailsRes.json()) as {
                success?: boolean;
                data?: { address?: string | null; photos?: string[] };
              };
              if (detailsData.success && detailsData.data) {
                rAddr = detailsData.data.address ?? undefined;
                rPhotos = detailsData.data.photos || [];
              }
            }
          } catch {
            /* optional metadata */
          }
          setSelectedRestaurant({ placeId, name: rName, address: rAddr, photos: rPhotos });
        }
      }

      const crawlResponse = await fetch("/api/crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ url: effectiveUrl, placeId }),
        signal: abortControllerRef.current!.signal,
      });
      if (crawlResponse.status === 429) {
        setError(await messageForAnalysis429Response(crawlResponse));
        setIsLoading(false);
        return;
      }
      let crawlData: {
        success?: boolean;
        data?: Review[];
        error?: string;
        code?: string;
      };
      try {
        crawlData = (await parseApiJsonResponse(crawlResponse)) as typeof crawlData;
      } catch (parseErr) {
        console.error("Basic analysis: crawl JSON parse:", parseErr);
        navigateToAnalysisError(
          router,
          "parse",
          parseErr instanceof Error ? parseErr.message : String(parseErr)
        );
        return;
      }
      if (!crawlData.success || !crawlData.data || crawlData.data.length === 0) {
        navigateToAnalysisError(
          router,
          crawlFailureReason(crawlData.code, crawlData.error),
          crawlData.error
        );
        return;
      }
      setReviews(crawlData.data);

      const summaryPayload = { reviews: crawlData.data, placeId };
      const summaryResponse = await fetch("/api/summary-basic", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(summaryPayload),
        signal: abortControllerRef.current.signal,
      });
      if (summaryResponse.status === 429) {
        setError(await messageForAnalysis429Response(summaryResponse));
        setIsLoading(false);
        return;
      }
      let summaryData: {
        success?: boolean;
        data?: BasicSummaryResult;
        error?: string;
      };
      try {
        summaryData = (await parseApiJsonResponse(summaryResponse)) as typeof summaryData;
      } catch (parseErr) {
        console.error("Basic analysis: summary JSON parse:", parseErr);
        navigateToAnalysisError(
          router,
          "parse",
          parseErr instanceof Error ? parseErr.message : String(parseErr)
        );
        return;
      }
      if (!summaryData.success) {
        navigateToAnalysisError(router, "summary", summaryData.error);
        return;
      }
      setResult(summaryData.data!);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("byg:analysis-quota-refresh"));
      }

      if (placeId) {
        try {
          const adminRes = await fetch("/api/me/analysis-admin", {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          const adminJson = (await adminRes.json()) as { analysisAdmin?: boolean };
          if (adminJson.analysisAdmin === true) {
            const analyzeResponse = await fetch("/api/analyze", {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
              body: JSON.stringify({ placeId }),
              signal: abortControllerRef.current.signal,
            });
            if (analyzeResponse.status === 429) {
              setError(await messageForAnalysis429Response(analyzeResponse));
            } else {
              let analyzeData: {
                success?: boolean;
                data?: DetailedAnalysisResult;
                error?: string;
                code?: string;
              };
              try {
                analyzeData = (await parseApiJsonResponse(analyzeResponse)) as typeof analyzeData;
              } catch (parseErr) {
                console.error("Basic→admin detailed: JSON parse:", parseErr);
                navigateToAnalysisError(
                  router,
                  "parse",
                  parseErr instanceof Error ? parseErr.message : String(parseErr)
                );
                return;
              }
              if (analyzeData.success && analyzeData.data) {
                setDetailedResult(analyzeData.data);
              } else if (!analyzeResponse.ok || !analyzeData.success) {
                navigateToAnalysisError(
                  router,
                  analyzeApiFailureReason(analyzeData.code),
                  analyzeData.error
                );
                return;
              }
            }
          }
        } catch (chainErr) {
          if (chainErr instanceof Error && chainErr.name === "AbortError") {
            navigateToAnalysisError(router, "cancelled");
            return;
          }
          console.error("Basic→admin detailed chain:", chainErr);
        }
      }

      setTimeout(() => {
        reviewResultRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 300);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        navigateToAnalysisError(router, "cancelled");
        return;
      }
      console.error("Basic analysis error:", err);
      navigateToAnalysisError(
        router,
        "unknown",
        err instanceof Error ? err.message : String(err)
      );
      setResult(null);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleGetDetailedAnalysisFromPlaceId = async (placeId: string) => {
    setIsLoading(true);
    setResult(null);
    setDetailedResult(null);
    setError(null);
    setReviews([]);

    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    try {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        navigateToAnalysisError(router, "auth");
        return;
      }

      const analyzeResponse = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ placeId }),
        signal: abortControllerRef.current.signal,
      });
      if (analyzeResponse.status === 429) {
        setError(await messageForAnalysis429Response(analyzeResponse));
        setIsLoading(false);
        return;
      }

      let analyzeData: {
        success?: boolean;
        data?: DetailedAnalysisResult;
        error?: string;
        code?: string;
      };
      try {
        analyzeData = (await parseApiJsonResponse(analyzeResponse)) as typeof analyzeData;
      } catch (parseErr) {
        console.error("Detailed analysis: JSON parse:", parseErr);
        navigateToAnalysisError(
          router,
          "parse",
          parseErr instanceof Error ? parseErr.message : String(parseErr)
        );
        return;
      }
      if (!analyzeData.success || !analyzeData.data) {
        navigateToAnalysisError(
          router,
          analyzeApiFailureReason(analyzeData.code),
          analyzeData.error
        );
        return;
      }

      setDetailedResult(analyzeData.data as DetailedAnalysisResult);

      setTimeout(() => {
        reviewResultRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 300);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        navigateToAnalysisError(router, "cancelled");
        return;
      }
      console.error("Detailed analysis error:", err);
      navigateToAnalysisError(
        router,
        "unknown",
        err instanceof Error ? err.message : String(err)
      );
      setDetailedResult(null);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleRestaurantSelect = (
    placeId: string,
    name: string,
    url: string,
    address?: string,
    photos?: string[]
  ) => {
    setSelectedRestaurant({ placeId, name, address, photos });
    recordPlaceClick({
      placeId,
      name,
      address,
      imageUrl: photos?.[0] ?? null,
    });
    void handleSubmit(url, placeId, { name, address, photos: photos ?? [] });
  };

  const cancelAnalysis = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  return {
    isAnalyzing,
    result,
    detailedResult,
    error,
    reviews,
    selectedRestaurant,
    reviewResultRef,
    handleSubmit,
    handleGetDetailedAnalysisFromPlaceId,
    handleRestaurantSelect,
    cancelAnalysis,
    setSelectedRestaurant,
  };
};
