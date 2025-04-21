import { useState, useRef } from "react";
import { AnalysisResult } from "@/types";

export const useReviewAnalysis = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState<{
    placeId: string;
    name: string;
  } | null>(null);
  const reviewResultRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleSubmit = async (url: string, placeId?: string) => {
    console.log("handleSubmit called with:", { url, placeId });
    setIsLoading(true);
    setResult(null);
    setError(null);

    if (!placeId) {
      setSelectedRestaurant(null);
    }

    if (!url || !url.startsWith("https://")) {
      setError("Please enter a valid Google Maps URL starting with https://");
      setIsLoading(false);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      const crawlResponse = await fetch("/api/crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
        signal: abortControllerRef.current.signal,
      });
      const crawlData = await crawlResponse.json();
      if (!crawlData.success) {
        throw new Error(
          crawlData.error || "Failed to fetch reviews. Please check the URL or try again later."
        );
      }
      if (!crawlData.data || crawlData.data.length === 0) {
        throw new Error("No reviews found for this location, or failed to parse them.");
      }
      const analyzePayload: { reviews: any[]; placeId?: string } = { reviews: crawlData.data };
      if (placeId) {
        analyzePayload.placeId = placeId;
      }
      const analyzeResponse = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(analyzePayload),
        signal: abortControllerRef.current.signal,
      });
      const analyzeData = await analyzeResponse.json();
      if (!analyzeData.success) {
        throw new Error(analyzeData.error || "Failed to analyze reviews. Please try again later.");
      }
      setResult(analyzeData.data);
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
        console.error("Submission error:", err);
        setError(err instanceof Error ? err.message : "An unknown error occurred during analysis.");
      }
      setResult(null);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleRestaurantSelect = (placeId: string, name: string, url: string) => {
    console.log("handleRestaurantSelect called with:", { placeId, name, url });
    setSelectedRestaurant({ placeId, name });
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
    isLoading,
    result,
    error,
    selectedRestaurant,
    reviewResultRef,
    handleSubmit,
    handleRestaurantSelect,
    setSelectedRestaurant,
    cancelAnalysis,
  };
};
