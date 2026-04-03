import { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import { googleMaps } from "../../lib/externalUrls";
import { supabase } from "../../lib/supabaseClient";
import { createSupabaseForRequest } from "../../lib/supabaseServerUser";
import { Review } from "@/types";
import { consumeAnalysisQuota } from "../../lib/apiUsageQuota";
import { fetchReviewsFromPlaceDetails } from "../../lib/fetchPlaceReviews";
import { runProAnalysisLlm } from "../../lib/llm/runProAnalysisLlm";
import { getSummaryCacheTtlMs } from "../../lib/summaryCacheTtl";

const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const PHOTOS_CACHE_TTL_MS = 12 * 60 * 60 * 1000;
const inFlight = new Set<string>();
const photosCache = new Map<string, { value: string[]; expires: number }>();

async function getPlacePhotos(placeId: string): Promise<string[]> {
  if (!mapsApiKey) {
    return [];
  }
  const cached = photosCache.get(placeId);
  if (cached && cached.expires > Date.now()) {
    return cached.value;
  }
  const photosResponse = await axios.get(
    `${googleMaps.placesDetailsUrl}?place_id=${encodeURIComponent(placeId)}&fields=photos&key=${mapsApiKey}`
  );
  const photoUrls =
    photosResponse.data.result?.photos
      ?.slice(0, 5)
      .map(
        (photo: { photo_reference: string }) =>
          `${googleMaps.photoUrl}?maxwidth=400&photoreference=${photo.photo_reference}&key=${mapsApiKey}`
      ) || [];
  photosCache.set(placeId, { value: photoUrls, expires: Date.now() + PHOTOS_CACHE_TTL_MS });
  return photoUrls;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const { placeId } = req.body;

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

    if (!placeId) {
      return res.status(400).json({ success: false, error: "No placeId provided" });
    }

    if (inFlight.has(placeId)) {
      return res.status(429).json({
        success: false,
        error: "An analysis for this place is already in progress. Please try again shortly.",
        code: "CRAWL_IN_FLIGHT",
      });
    }
    inFlight.add(placeId);

    const db = createSupabaseForRequest(token);

    const { data: cachedAnalysis, error: cacheError } = await db
      .from("summaries")
      .select("*")
      .eq("place_id", placeId)
      .eq("is_pro_analysis", true)
      .single();

    if (cachedAnalysis && !cacheError) {
      const cacheAge = Date.now() - new Date(cachedAnalysis.created_at).getTime();
      if (cacheAge < getSummaryCacheTtlMs()) {
        return res.status(200).json({
          success: true,
          data: cachedAnalysis,
          fromCache: true,
        });
      }
    }

    let currentReviews: Review[] = [];
    try {
      currentReviews = await fetchReviewsFromPlaceDetails(placeId);
    } catch (fetchError: unknown) {
      console.error(`Places reviews error for ${placeId}:`, fetchError);
      return res.status(500).json({
        success: false,
        error: fetchError instanceof Error ? fetchError.message : "Failed to fetch reviews.",
      });
    }

    if (currentReviews.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No reviews available from Google Places for this location.",
      });
    }

    const totalRating = currentReviews.reduce((sum, review) => sum + (review.rating || 0), 0);
    const averageRating = currentReviews.length > 0 ? totalRating / currentReviews.length : 0;

    let analysisResult: Awaited<ReturnType<typeof runProAnalysisLlm>>;
    try {
      analysisResult = await runProAnalysisLlm(currentReviews);
    } catch (llmErr: unknown) {
      console.error("Pro LLM error:", llmErr);
      return res.status(500).json({
        success: false,
        error: llmErr instanceof Error ? llmErr.message : "LLM analysis failed.",
      });
    }

    const photo_urls = await getPlacePhotos(placeId);

    const finalResult = {
      ...analysisResult,
      average_rating: averageRating,
      photo_urls,
      review_count: currentReviews.length,
      is_pro_analysis: true,
      place_id: placeId,
      created_at: new Date().toISOString(),
    };

    if (cachedAnalysis) {
      const { error: updateError } = await db
        .from("summaries")
        .update(finalResult)
        .eq("place_id", placeId)
        .eq("is_pro_analysis", true);

      if (updateError) {
        console.error("Error updating Pro analysis:", updateError);
      }
    } else {
      const { error: insertError } = await db.from("summaries").insert(finalResult);

      if (insertError) {
        console.error("Error saving Pro analysis:", insertError);
      }
    }

    return res.status(200).json({
      success: true,
      data: finalResult,
      fromCache: false,
    });
  } catch (error: unknown) {
    console.error(`Error in /api/analyze for placeId ${placeId}:`, error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "An error occurred during analysis",
    });
  } finally {
    if (placeId) {
      inFlight.delete(placeId);
    }
  }
}
