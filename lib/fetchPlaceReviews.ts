import axios from "axios";
import { googleMaps } from "./externalUrls";
import { limitReviewsForAnalysis } from "./maxReviewsForAnalysis";
import type { Review } from "../types";

const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export async function fetchReviewsFromPlaceDetails(placeId: string): Promise<Review[]> {
  if (!mapsApiKey) return [];
  const detailsUrl = `${googleMaps.placesDetailsUrl}?place_id=${encodeURIComponent(placeId)}&fields=reviews&key=${mapsApiKey}`;
  const response = await axios.get(detailsUrl);
  const reviews = response.data?.result?.reviews;
  if (!Array.isArray(reviews)) return [];
  const mapped = reviews
    .map((review: { text?: string; rating?: number; relative_time_description?: string }) => ({
      text: (review.text || "").trim(),
      rating: typeof review.rating === "number" ? review.rating : 0,
      date: (review.relative_time_description || "").trim(),
    }))
    .filter((review) => review.text && review.rating > 0);
  return limitReviewsForAnalysis(mapped);
}
