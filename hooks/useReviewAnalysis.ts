import { useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { AnalysisResult, BasicSummaryResult, Review, DetailedAnalysisResult } from "@/types";

// Define the extended type for selectedRestaurant state
interface SelectedRestaurantState {
  placeId: string;
  name: string;
  address?: string; // Optional address
  photos?: string[]; // Optional photo URLs array
}

export const useReviewAnalysis = () => {
  const [isAnalyzing, setIsLoading] = useState(false);
  const [result, setResult] = useState<BasicSummaryResult | null>(null);
  const [detailedResult, setDetailedResult] = useState<DetailedAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  // Use the extended type for the state
  const [selectedRestaurant, setSelectedRestaurant] = useState<SelectedRestaurantState | null>(
    null
  );
  const reviewResultRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const markDemoUsage = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("demo_free_analysis_used", "true");
    }
  };

  const getAccessToken = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token || null;
  };

  // Modify handleSubmit to accept url as string | undefined
  const handleSubmit = async (url: string | undefined, placeId?: string) => {
    console.log("handleSubmit (basic) called with:", { url, placeId });
    setIsLoading(true);
    setResult(null);
    setDetailedResult(null);
    setError(null);
    setReviews([]);
    // Clear restaurant only if placeId is also missing? Or always clear?
    // If placeId exists from selection, maybe keep it?
    // Let's keep the existing logic for now: clear only if placeId is not provided.
    if (!placeId) setSelectedRestaurant(null);

    // **FIX: Relax URL validation**
    if (!url || !url.startsWith("https://")) {
      // Check only for https://
      console.warn("handleSubmit received an invalid or non-HTTPS URL:", url);
      setError("A valid URL starting with https:// is required for analysis.");
      setIsLoading(false);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        throw new Error("Login required to analyze reviews.");
      }

      // Crawling needs a valid URL
      const crawlResponse = await fetch("/api/crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ url }),
        signal: abortControllerRef.current!.signal,
      });
      if (crawlResponse.status === 429 && typeof window !== "undefined") {
        window.location.href = "/pricing";
        return;
      }
      const crawlData = await crawlResponse.json();
      if (!crawlData.success || !crawlData.data || crawlData.data.length === 0) {
        throw new Error(crawlData.error || "Failed to fetch reviews or no reviews found.");
      }
      setReviews(crawlData.data);
      console.log(`Basic flow: Crawled ${crawlData.data.length} reviews.`);

      const summaryPayload = { reviews: crawlData.data, placeId };
      const summaryResponse = await fetch("/api/summary-basic", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(summaryPayload),
        signal: abortControllerRef.current.signal,
      });
      if (summaryResponse.status === 429 && typeof window !== "undefined") {
        window.location.href = "/pricing";
        return;
      }
      const summaryData = await summaryResponse.json();
      if (!summaryData.success) {
        throw new Error(summaryData.error || "Failed to generate basic summary.");
      }
      setResult(summaryData.data);
      console.log("Basic flow: Basic summary received.", summaryData.data);
      markDemoUsage();

      setTimeout(() => {
        reviewResultRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 300);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        console.log("Analysis was cancelled");
        setError("Analysis was cancelled.");
      } else {
        console.error("Basic analysis error:", err);
        setError(
          err instanceof Error ? err.message : "An unknown error occurred during basic analysis."
        );
      }
      setResult(null);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleGetDetailedAnalysisFromPlaceId = async (placeId: string) => {
    console.log("handleGetDetailedAnalysisFromPlaceId called with:", placeId);
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
        throw new Error("Login required to analyze reviews.");
      }

      console.log(`Detailed flow: Calling /api/analyze for placeId ${placeId}`);
      const analyzeResponse = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ placeId }),
        signal: abortControllerRef.current.signal,
      });
      if (analyzeResponse.status === 429 && typeof window !== "undefined") {
        window.location.href = "/pricing";
        return;
      }

      const analyzeData = await analyzeResponse.json();
      if (!analyzeData.success) {
        throw new Error(analyzeData.error || "Failed to get detailed analysis.");
      }

      setDetailedResult(analyzeData.data as DetailedAnalysisResult);
      console.log("Detailed flow: Detailed analysis received.", analyzeData.data);
      markDemoUsage();

      setTimeout(() => {
        reviewResultRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 300);
    } catch (err) {
      console.error("Detailed analysis error:", err);
      setError(
        err instanceof Error ? err.message : "An unknown error occurred during detailed analysis."
      );
      setDetailedResult(null);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  // handleRestaurantSelect might need adjustment depending on where it's used,
  // but the setSelectedRestaurant type is now correct.
  const handleRestaurantSelect = (
    placeId: string,
    name: string,
    url: string,
    address?: string,
    photos?: string[]
  ) => {
    setSelectedRestaurant({ placeId, name, address, photos });
    handleSubmit(url, placeId);
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
    setSelectedRestaurant, // Make sure this is returned if needed outside
  };
};
