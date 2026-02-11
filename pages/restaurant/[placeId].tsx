import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { MapPinIcon, StarIcon, PhotoIcon } from "@heroicons/react/24/solid";
import BookmarkButton from "../../components/bookmark/BookmarkButton";
import ReviewForm from "../../components/review/ReviewForm";
import ReviewResultCard from "../../components/ReviewResultCard";
import AuthModal from "../../components/auth/AuthModal";
import { useGoogleMaps } from "@/hooks/useGoogleMaps";
import { AnalysisResult } from "@/types";

interface RestaurantDetails extends google.maps.places.PlaceResult {
  place_id: string; // Ensure place_id is always present
  name: string;
  formatted_address: string;
  rating: number;
  user_ratings_total: number;
  photos?: google.maps.places.PlacePhoto[];
  url?: string;
}

export default function RestaurantDetail() {
  const router = useRouter();
  const { placeId } = router.query;
  const { isLoaded, loadError } = useGoogleMaps();

  const [details, setDetails] = useState<RestaurantDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  const fetchAnalysis = async (url: string, currentPlaceId: string) => {
    setIsAnalyzing(true);
    setError(null); // Clear previous analysis errors
    try {
      const crawlResponse = await fetch("/api/crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const crawlData = await crawlResponse.json();
      if (!crawlData.success || !crawlData.data || crawlData.data.length === 0) {
        throw new Error(crawlData.error || "Failed to fetch or parse reviews.");
      }

      const analyzeResponse = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviews: crawlData.data, placeId: currentPlaceId }),
      });
      const analyzeData = await analyzeResponse.json();
      if (!analyzeData.success) {
        throw new Error(analyzeData.error || "Failed to analyze reviews.");
      }
      setAnalysisResult(analyzeData.data);
    } catch (err) {
      console.error("Analysis error:", err);
      setError(`Analysis Error: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    if (placeId && isLoaded && typeof placeId === "string") {
      setIsLoading(true);
      setError(null); // Clear previous page load errors
      const service = new google.maps.places.PlacesService(document.createElement("div"));
      service.getDetails(
        {
          placeId: placeId,
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
            // Type assertion to ensure properties exist
            const placeDetails = place as RestaurantDetails;
            setDetails(placeDetails);
            if (placeDetails.url && placeDetails.place_id) {
              fetchAnalysis(placeDetails.url, placeDetails.place_id);
            } else {
              console.warn("Place URL or Place ID not found, cannot fetch analysis.");
              setError("Could not fetch review analysis for this place."); // Inform user
            }
          } else {
            setError(`Failed to load restaurant details. Status: ${status}`);
            console.error("PlacesService error:", status);
          }
          setIsLoading(false);
        }
      );
    } else if (loadError) {
      setError(`Google Maps Error: ${loadError.message}`);
      setIsLoading(false);
    } else if (!router.isReady) {
      // Wait for router, do nothing yet
    } else if (router.isReady && !placeId) {
      setError("Place ID is missing in the URL.");
      setIsLoading(false);
    }
  }, [placeId, isLoaded, loadError, router.isReady]);

  const handleAuthRequired = () => {
    setShowAuthModal(true);
  };

  const handleWishlistClick = () => {
    if (!details?.place_id) return;
    handleAuthRequired(); // Show auth modal if not logged in
  };

  const handleReviewClick = () => {
    if (!details?.place_id) return;
    handleAuthRequired(); // Show auth modal if not logged in
    setShowReviewForm(true); // Show review form after successful auth
  };

  if (isLoading) {
    return <div className='text-center py-12'>Loading restaurant details...</div>;
  }

  // Separate error display for page load vs analysis
  if (!details && error) {
    return <div className='text-center py-12 text-red-600'>Error loading page: {error}</div>;
  }

  if (!details) {
    return <div className='text-center py-12'>Restaurant not found or failed to load.</div>;
  }

  const photoUrl = details.photos?.[0]?.getUrl({ maxWidth: 800 });

  return (
    <>
      <Head>
        <title>{details.name} - Restaurant Details</title>
      </Head>

      <div className='mx-auto max-w-4xl px-4 py-8'>
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={details.name}
            className='mb-6 h-64 w-full rounded-2xl object-cover shadow-md'
          />
        ) : (
          <div className='mb-6 flex h-64 w-full items-center justify-center rounded-2xl bg-slate-100 shadow-md'>
            <PhotoIcon className='w-16 h-16 text-gray-400' />
          </div>
        )}

        <div className='byg-panel-soft mb-6 p-6'>
          <div className='flex justify-between items-start mb-4'>
            <h1 className='byg-title text-3xl font-bold text-slate-900'>{details.name}</h1>
            {/* Ensure placeId exists before rendering BookmarkButton */}
            {details.place_id && (
              <BookmarkButton
                placeId={details.place_id}
                restaurantName={details.name}
                onAuthRequired={handleAuthRequired}
              />
            )}
          </div>
          <div className='flex items-center text-gray-600 mb-2'>
            <StarIcon className='w-5 h-5 text-yellow-500 mr-1' />
            <span>
              {details.rating ?? "N/A"} ({details.user_ratings_total ?? 0} reviews)
            </span>
          </div>
          <div className='flex items-center text-slate-600'>
            <MapPinIcon className='mr-1 h-5 w-5 text-slate-500' />
            <span>{details.formatted_address ?? "Address not available"}</span>
          </div>
        </div>

        {/* Review Analysis Section */}
        <div className='byg-panel-soft mb-6 p-6'>
          <h2 className='byg-title mb-4 text-2xl font-semibold'>AI Review Analysis</h2>
          {isAnalyzing && <p className='text-center text-slate-600'>Analyzing reviews...</p>}
          {/* Display analysis error specifically */}
          {!isAnalyzing && error && error.startsWith("Analysis Error:") && (
            <p className='text-center text-red-600'> {error}</p>
          )}
          {analysisResult && (
            <ReviewResultCard
              result={analysisResult}
              onWishlistClick={handleWishlistClick}
              onReviewClick={handleReviewClick}
            />
          )}
        </div>

        {/* Review Form - Only show when showReviewForm is true */}
        {showReviewForm && details.place_id && (
          <div className='byg-panel-soft p-6'>
            <div className='flex justify-between items-center mb-4'>
              <h2 className='byg-title text-2xl font-semibold'>Leave Your Review</h2>
              <button
                onClick={() => setShowReviewForm(false)}
                className='text-slate-500 transition hover:text-slate-700'>
                Close
              </button>
            </div>
            <ReviewForm
              placeId={details.place_id}
              restaurantName={details.name}
              onAuthRequired={handleAuthRequired}
              onReviewSubmitted={() => {
                setShowReviewForm(false);
                console.log("Review submitted!");
              }}
            />
          </div>
        )}
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={() => {
          setShowAuthModal(false);
          // If user was trying to write a review, show the form after successful auth
          if (showReviewForm) {
            setShowReviewForm(true);
          }
        }}
      />
    </>
  );
}
