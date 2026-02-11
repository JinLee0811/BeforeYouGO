import { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import { crawlReviews } from "../../lib/crawlReviews";
import { googleMaps } from "../../lib/externalUrls";
import { supabase } from "../../lib/supabaseClient";
import { consumeAnalysisQuota } from "../../lib/apiUsageQuota";
import { ApiResponse, Review } from "../../types";

const RATE_LIMIT_WINDOW_MS = 5000;
const ipUsageMap = new Map<string, number>();
const inFlight = new Set<string>();
const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

const fetchReviewsFromPlaces = async (placeId: string): Promise<Review[]> => {
  if (!mapsApiKey) return [];
  const detailsUrl = `${googleMaps.placesDetailsUrl}?place_id=${placeId}&fields=reviews&key=${mapsApiKey}`;
  const response = await axios.get(detailsUrl);
  const reviews = response.data?.result?.reviews;
  if (!Array.isArray(reviews)) return [];
  return reviews
    .map((review: { text?: string; rating?: number; relative_time_description?: string }) => ({
      text: (review.text || "").trim(),
      rating: typeof review.rating === "number" ? review.rating : 0,
      date: (review.relative_time_description || "").trim(),
    }))
    .filter((review) => review.text && review.rating > 0);
};

const getClientIp = (req: NextApiRequest) => {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0];
  }
  return req.socket?.remoteAddress || "unknown";
};

const isIpRateLimited = (ip: string) => {
  const lastUsed = ipUsageMap.get(ip);
  return !!lastUsed && Date.now() - lastUsed < RATE_LIMIT_WINDOW_MS;
};

const markIpUsed = (ip: string) => {
  ipUsageMap.set(ip, Date.now());
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<Review[]>>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const { url, placeId } = req.body;

  const isValidMapsUrl = (value: string | undefined) => {
    if (!value) return false;
    if (!value.startsWith("https://")) return false;
    return (
      value.includes("google.com/maps") ||
      value.includes("goo.gl/maps") ||
      value.includes("maps.app.goo.gl")
    );
  };

  const effectiveUrl =
    isValidMapsUrl(url) && url ? url : placeId ? `https://www.google.com/maps/place/?q=place_id:${placeId}` : url;

  if (!effectiveUrl) {
    return res.status(400).json({ success: false, error: "URL or placeId is required" });
  }

  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authData?.user) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }
    const quotaResult = await consumeAnalysisQuota(authData.user.id);
    if (!quotaResult.success) {
      if (quotaResult.error === "USAGE_LIMIT_EXCEEDED") {
        return res.status(429).json({
          success: false,
          error: "Usage limit exceeded. Please upgrade your plan.",
          code: "USAGE_LIMIT_EXCEEDED",
        });
      }
      return res.status(500).json({ success: false, error: quotaResult.error });
    }

    const clientIp = getClientIp(req);
    if (isIpRateLimited(clientIp)) {
      return res.status(429).json({
        success: false,
        error: "Too many requests. Please wait a moment and try again.",
      });
    }

    if (inFlight.has(effectiveUrl)) {
      return res.status(429).json({
        success: false,
        error: "Crawling already in progress for this URL.",
      });
    }
    inFlight.add(effectiveUrl);
    markIpUsed(clientIp);
    let reviews: Review[] = [];
    if (placeId) {
      reviews = await fetchReviewsFromPlaces(placeId);
    }
    if (!reviews || reviews.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Failed to fetch reviews from Places API.",
      });
    }
    return res.status(200).json({ success: true, data: reviews });
  } catch (error) {
    console.error("Crawling error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to crawl reviews",
    });
  } finally {
    if (effectiveUrl) {
      inFlight.delete(effectiveUrl);
    }
  }
}
