import { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "../../lib/supabaseClient";
import { createSupabaseForRequest } from "../../lib/supabaseServerUser";
import { limitReviewsForAnalysis } from "../../lib/maxReviewsForAnalysis";
import type { Review } from "@/types";
import { getSummaryCacheTtlMs } from "../../lib/summaryCacheTtl";

type SummaryResponse =
  | { success: true; data: Record<string, unknown>; fromCache?: boolean }
  | { success: false; error: string };

export default async function handler(req: NextApiRequest, res: NextApiResponse<SummaryResponse>) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
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

    const db = createSupabaseForRequest(token);

    const { reviews: rawReviews, placeId } = req.body as {
      reviews?: Review[];
      placeId?: string;
    };

    if (!rawReviews || !Array.isArray(rawReviews) || rawReviews.length === 0) {
      return res.status(400).json({ success: false, error: "No reviews provided" });
    }
    if (!placeId) {
      return res.status(400).json({ success: false, error: "No placeId provided" });
    }

    const reviews = limitReviewsForAnalysis(rawReviews);

    const { data: cachedSummary, error: cacheError } = await db
      .from("summaries")
      .select("*")
      .eq("place_id", placeId)
      .eq("is_pro_analysis", false)
      .single();

    if (cachedSummary && !cacheError) {
      const cacheAge = Date.now() - new Date(cachedSummary.created_at).getTime();
      if (cacheAge < getSummaryCacheTtlMs()) {
        return res.status(200).json({
          success: true,
          data: cachedSummary as Record<string, unknown>,
          fromCache: true,
        });
      }
    }

    const totalRating = reviews.reduce((sum, review) => sum + (Number(review.rating) || 0), 0);
    const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;

    const positiveCount = reviews.filter((review) => (Number(review.rating) || 0) >= 4).length;
    const negativeCount = reviews.filter((review) => (Number(review.rating) || 0) <= 2).length;
    const mixedCount = reviews.filter((review) => (Number(review.rating) || 0) === 3).length;

    let sentiment: "positive" | "negative" | "mixed";
    if (positiveCount > negativeCount && positiveCount > mixedCount) {
      sentiment = "positive";
    } else if (negativeCount > positiveCount && negativeCount > mixedCount) {
      sentiment = "negative";
    } else {
      sentiment = "mixed";
    }

    const summary = `Based on a comprehensive analysis of ${reviews.length} reviews, this restaurant maintains an average rating of ${averageRating.toFixed(1)}/5. ${
      sentiment === "positive"
        ? `The majority of customers (${((positiveCount / reviews.length) * 100).toFixed(1)}%) report positive experiences, indicating consistent quality and service.`
        : sentiment === "mixed"
          ? `Customer experiences are varied, with a mix of positive and negative feedback, suggesting inconsistent quality or service.`
          : `A significant portion (${((negativeCount / reviews.length) * 100).toFixed(1)}%) of customers report concerns, indicating potential areas for improvement.`
    }`;

    const summaryData = {
      place_id: placeId,
      sentiment,
      summary,
      average_rating: parseFloat(averageRating.toFixed(1)),
      review_count: reviews.length,
      created_at: new Date().toISOString(),
      is_pro_analysis: false,
      positive_keywords: [],
      negative_keywords: [],
      mentioned_menu_items: [],
      recommended_dishes: [],
      photo_urls: [],
    };

    if (cachedSummary) {
      const { error: updateError } = await db
        .from("summaries")
        .update(summaryData)
        .eq("place_id", placeId)
        .eq("is_pro_analysis", false);

      if (updateError) {
        console.error("Error updating basic summary:", updateError);
      }
    } else {
      const { error: insertError } = await db.from("summaries").insert(summaryData);

      if (insertError) {
        console.error("Error saving basic summary:", insertError);
      }
    }

    return res.status(200).json({
      success: true,
      data: summaryData,
      fromCache: false,
    });
  } catch (error) {
    console.error("Basic summary error:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate basic summary",
    });
  }
}
