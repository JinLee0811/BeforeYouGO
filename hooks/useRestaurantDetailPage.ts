import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/lib/supabaseClient";
import { analyzeApiFailureReason, navigateToAnalysisError } from "@/lib/navigateAnalysisError";
import { messageForAnalysis429Response } from "@/lib/analysis429Message";
import { parseApiJsonResponse } from "@/utils/parseApiJson";
import type { AnalysisResult, BasicSummaryResult, Review } from "@/types";
import type { RestaurantDetails } from "@/types/restaurantDetail";

type Args = {
  placeId: string | undefined;
  isLoaded: boolean;
  loadError: Error | undefined;
  routerIsReady: boolean;
  /** Pro(/api/analyze) 자동 실행·결과 표시는 분석 어드민만 */
  analysisAdmin: boolean;
  isUserLoading: boolean;
  /** 로그인 전환 후 분석 분기 재실행 */
  userId: string | null | undefined;
};

/**
 * 식당 상세: Places Details 후 어드민은 /api/analyze, 일반 유저는 crawl + /api/summary-basic(기본 요약) 후 카드에서 업그레이드 유도.
 */
export function useRestaurantDetailPage({
  placeId,
  isLoaded,
  loadError,
  routerIsReady,
  analysisAdmin,
  isUserLoading,
  userId,
}: Args) {
  const router = useRouter();
  const accessSyncGeneration = useRef(0);
  const [details, setDetails] = useState<RestaurantDetails | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [needsAuthForAnalysis, setNeedsAuthForAnalysis] = useState(false);
  const [basicSummaryResult, setBasicSummaryResult] = useState<BasicSummaryResult | null>(null);
  const [basicSummaryLoading, setBasicSummaryLoading] = useState(false);
  const [basicSummaryError, setBasicSummaryError] = useState<string | null>(null);

  const runProAnalysis = useCallback(async (pid: string, syncGen?: number) => {
    const gen = syncGen !== undefined ? syncGen : ++accessSyncGeneration.current;
    const stillHere = () => accessSyncGeneration.current === gen;
    if (!stillHere()) return;

    setIsAnalyzing(true);
    setAnalysisError(null);
    setNeedsAuthForAnalysis(false);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setNeedsAuthForAnalysis(true);
        return;
      }

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ placeId: pid }),
      });
      if (res.status === 429) {
        if (stillHere()) {
          setAnalysisError(await messageForAnalysis429Response(res));
        }
        return;
      }
      let data: {
        success?: boolean;
        data?: AnalysisResult;
        error?: string;
        code?: string;
      };
      try {
        data = (await parseApiJsonResponse(res)) as typeof data;
      } catch (parseErr) {
        console.error("Pro analysis: JSON parse:", parseErr);
        navigateToAnalysisError(
          router,
          "parse",
          parseErr instanceof Error ? parseErr.message : String(parseErr)
        );
        return;
      }
      if (!res.ok || !data.success || !data.data) {
        navigateToAnalysisError(router, analyzeApiFailureReason(data.code), data.error);
        return;
      }
      if (!stillHere()) return;
      setAnalysisResult(data.data);
    } catch (e) {
      console.error("Pro analysis error:", e);
      navigateToAnalysisError(
        router,
        "unknown",
        e instanceof Error ? e.message : String(e)
      );
    } finally {
      if (stillHere()) setIsAnalyzing(false);
    }
  }, [router]);

  const runBasicSummary = useCallback(
    async (pid: string, mapsUrl: string | undefined, syncGen: number) => {
      const stillHere = () => accessSyncGeneration.current === syncGen;
      if (!stillHere()) return;

      setBasicSummaryLoading(true);
      setBasicSummaryError(null);
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const accessToken = session?.access_token;
        if (!accessToken) {
          if (stillHere()) setNeedsAuthForAnalysis(true);
          return;
        }

        const url =
          mapsUrl && mapsUrl.startsWith("http")
            ? mapsUrl
            : `https://www.google.com/maps/search/?api=1&query_place_id=${encodeURIComponent(pid)}`;

        const crawlResponse = await fetch("/api/crawl", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ url, placeId: pid }),
        });
        if (crawlResponse.status === 429) {
          if (stillHere()) setBasicSummaryError(await messageForAnalysis429Response(crawlResponse));
          return;
        }
        let crawlData: { success?: boolean; data?: Review[]; error?: string; code?: string };
        try {
          crawlData = (await parseApiJsonResponse(crawlResponse)) as typeof crawlData;
        } catch (parseErr) {
          console.error("Basic summary: crawl JSON parse:", parseErr);
          if (stillHere()) setBasicSummaryError("Could not read review data. Try again later.");
          return;
        }
        if (!crawlData.success || !crawlData.data || crawlData.data.length === 0) {
          if (stillHere())
            setBasicSummaryError(crawlData.error || "No reviews found for this place.");
          return;
        }

        const summaryResponse = await fetch("/api/summary-basic", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ reviews: crawlData.data, placeId: pid }),
        });
        if (summaryResponse.status === 429) {
          if (stillHere()) setBasicSummaryError(await messageForAnalysis429Response(summaryResponse));
          return;
        }
        let summaryJson: {
          success?: boolean;
          data?: Record<string, unknown>;
          fromCache?: boolean;
          error?: string;
        };
        try {
          summaryJson = (await parseApiJsonResponse(summaryResponse)) as typeof summaryJson;
        } catch (parseErr) {
          console.error("Basic summary: summary JSON parse:", parseErr);
          if (stillHere()) setBasicSummaryError("Could not read summary response.");
          return;
        }
        if (!summaryJson.success || !summaryJson.data) {
          if (stillHere()) setBasicSummaryError(summaryJson.error || "Could not build summary.");
          return;
        }
        const d = summaryJson.data;
        const basic: BasicSummaryResult = {
          sentiment: String(d.sentiment ?? ""),
          summary: String(d.summary ?? ""),
          average_rating: Number(d.average_rating ?? 0),
          review_count: Number(d.review_count ?? crawlData.data.length),
          fromCache: Boolean(summaryJson.fromCache),
          photo_urls: Array.isArray(d.photo_urls) ? (d.photo_urls as string[]) : undefined,
        };
        if (!stillHere()) return;
        setBasicSummaryResult(basic);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("byg:analysis-quota-refresh"));
        }
      } catch (e) {
        console.error("Basic summary error:", e);
        if (stillHere())
          setBasicSummaryError(e instanceof Error ? e.message : "Something went wrong.");
      } finally {
        if (stillHere()) setBasicSummaryLoading(false);
      }
    },
    [router]
  );

  useEffect(() => {
    accessSyncGeneration.current += 1;
    setDetails(null);
    setAnalysisResult(null);
    setAnalysisError(null);
    setNeedsAuthForAnalysis(false);
    setPageError(null);
    setBasicSummaryResult(null);
    setBasicSummaryError(null);
    setBasicSummaryLoading(false);
  }, [placeId]);

  useEffect(() => {
    if (loadError) {
      setPageError(`Google Maps Error: ${loadError.message}`);
      setPageLoading(false);
      return;
    }
    if (!routerIsReady) return;
    if (!placeId) {
      setPageError("Place ID is missing in the URL.");
      setPageLoading(false);
      return;
    }
    if (!isLoaded) return;

    setPageLoading(true);
    setPageError(null);

    const service = new google.maps.places.PlacesService(document.createElement("div"));
    service.getDetails(
      {
        placeId,
        fields: [
          "place_id",
          "name",
          "formatted_address",
          "rating",
          "user_ratings_total",
          "photos",
          "url",
        ],
      },
      (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
          setDetails(place as RestaurantDetails);
        } else {
          setPageError(`Failed to load restaurant details. Status: ${status}`);
          console.error("PlacesService error:", status);
        }
        setPageLoading(false);
      }
    );
  }, [placeId, isLoaded, loadError, routerIsReady]);

  useEffect(() => {
    if (!details?.place_id || isUserLoading) return;

    const syncAccess = async () => {
      const syncGen = ++accessSyncGeneration.current;

      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        if (accessSyncGeneration.current !== syncGen) return;
        setNeedsAuthForAnalysis(true);
        setAnalysisResult(null);
        setBasicSummaryResult(null);
        setBasicSummaryError(null);
        setBasicSummaryLoading(false);
        return;
      }

      if (accessSyncGeneration.current !== syncGen) return;
      setNeedsAuthForAnalysis(false);

      if (!analysisAdmin) {
        setAnalysisResult(null);
        setAnalysisError(null);
        await runBasicSummary(details.place_id, details.url, syncGen);
        return;
      }

      setBasicSummaryResult(null);
      setBasicSummaryError(null);
      setBasicSummaryLoading(false);
      await runProAnalysis(details.place_id, syncGen);
    };

    void syncAccess();
  }, [
    details?.place_id,
    details?.url,
    analysisAdmin,
    isUserLoading,
    userId,
    runProAnalysis,
    runBasicSummary,
  ]);

  return {
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
  };
}
