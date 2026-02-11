import { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "../../lib/supabaseClient";

// 15 days in milliseconds
const CACHE_DURATION = 15 * 24 * 60 * 60 * 1000;

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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authData?.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { reviews, placeId } = req.body;

    if (!reviews || !Array.isArray(reviews) || reviews.length === 0) {
      return res.status(400).json({ error: "No reviews provided" });
    }
    if (!placeId) {
      return res.status(400).json({ error: "No placeId provided" });
    }

    // 캐시된 요약 확인
    const { data: cachedSummary, error: cacheError } = await supabase
      .from("summaries")
      .select("*")
      .eq("place_id", placeId)
      .eq("is_pro_analysis", false)
      .single();

    // 캐시가 있고 15일이 지나지 않았다면 캐시된 결과 반환
    if (cachedSummary && !cacheError) {
      const cacheAge = Date.now() - new Date(cachedSummary.created_at).getTime();
      if (cacheAge < CACHE_DURATION) {
        console.log(`Returning cached basic summary for ${placeId}`);
        return res.status(200).json({
          success: true,
          data: cachedSummary,
          fromCache: true,
        });
      }
      console.log(`Cached basic summary for ${placeId} is older than 15 days, refreshing...`);
    }

    // 평균 평점 계산
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;

    // 감성 분석 (평점 기반)
    let positiveCount = reviews.filter((review) => review.rating >= 4).length;
    let negativeCount = reviews.filter((review) => review.rating <= 2).length;
    let mixedCount = reviews.filter((review) => review.rating === 3).length;

    let sentiment;
    if (positiveCount > negativeCount && positiveCount > mixedCount) {
      sentiment = "positive";
    } else if (negativeCount > positiveCount && negativeCount > mixedCount) {
      sentiment = "negative";
    } else {
      sentiment = "mixed";
    }

    // 상세한 요약 생성
    const summary = `Based on a comprehensive analysis of ${reviews.length} reviews, this restaurant maintains an average rating of ${averageRating.toFixed(1)}/5. ${
      sentiment === "positive"
        ? `The majority of customers (${((positiveCount / reviews.length) * 100).toFixed(1)}%) report positive experiences, indicating consistent quality and service.`
        : sentiment === "mixed"
          ? `Customer experiences are varied, with a mix of positive and negative feedback, suggesting inconsistent quality or service.`
          : `A significant portion (${((negativeCount / reviews.length) * 100).toFixed(1)}%) of customers report concerns, indicating potential areas for improvement.`
    }`;

    // 결과 데이터 생성
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

    // 기존 요약이 있다면 업데이트, 없다면 새로 생성
    if (cachedSummary) {
      const { error: updateError } = await supabase
        .from("summaries")
        .update(summaryData)
        .eq("place_id", placeId)
        .eq("is_pro_analysis", false);

      if (updateError) {
        console.error("Error updating basic summary:", updateError);
      }
    } else {
      const { error: insertError } = await supabase.from("summaries").insert(summaryData);

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
