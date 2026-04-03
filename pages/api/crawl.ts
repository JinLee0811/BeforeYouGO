import { NextApiRequest, NextApiResponse } from "next";
import { fetchReviewsFromPlaceDetails } from "../../lib/fetchPlaceReviews";
import { supabase } from "../../lib/supabaseClient";
import { consumeAnalysisQuota } from "../../lib/apiUsageQuota";
import { ApiResponse, Review } from "../../types";

const inFlight = new Set<string>();

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
    const quotaResult = await consumeAnalysisQuota(authData.user.id, token, authData.user.email);
    if (!quotaResult.success) {
      if (quotaResult.error === "USAGE_LIMIT_EXCEEDED") {
        return res.status(429).json({
          success: false,
          error: "You have used all free analyses for today. Try again tomorrow or check pricing to upgrade.",
          code: "USAGE_LIMIT_EXCEEDED",
        });
      }
      if (quotaResult.error === "QUOTA_AUTH_FAILED") {
        return res.status(401).json({ success: false, error: "Unauthorized", code: "QUOTA_AUTH_FAILED" });
      }
      const code =
        quotaResult.error === "QUOTA_READ_FAILED"
          ? "QUOTA_READ_FAILED"
          : quotaResult.error === "QUOTA_UPDATE_FAILED"
            ? "QUOTA_UPDATE_FAILED"
            : "QUOTA_FAILED";
      return res.status(503).json({
        success: false,
        error:
          "We couldn’t verify your analysis allowance right now. Please try again in a moment. If it keeps happening, try again later or check pricing.",
        code,
      });
    }

    if (inFlight.has(effectiveUrl)) {
      return res.status(429).json({
        success: false,
        error: "An analysis for this place is already in progress. Please try again shortly.",
        code: "CRAWL_IN_FLIGHT",
      });
    }
    inFlight.add(effectiveUrl);
    let reviews: Review[] = [];
    if (placeId) {
      reviews = await fetchReviewsFromPlaceDetails(placeId);
    }
    if (!reviews || reviews.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Failed to fetch reviews from Places API.",
      });
    }
    return res.status(200).json({ success: true, data: reviews });
  } catch (error) {
    console.error("Crawl API error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch reviews",
    });
  } finally {
    if (effectiveUrl) {
      inFlight.delete(effectiveUrl);
    }
  }
}
