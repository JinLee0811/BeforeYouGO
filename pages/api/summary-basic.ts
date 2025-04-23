import { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "../../lib/supabaseClient";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
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
      .single();

    if (cachedSummary && !cacheError) {
      return res.status(200).json({
        success: true,
        data: cachedSummary,
        fromCache: true,
      });
    }

    // 평균 평점 계산
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;

    // 간단한 감성 분석 (평점 기반)
    const sentiment = averageRating >= 4 ? "positive" : averageRating >= 3 ? "mixed" : "negative";

    // 간단한 요약 생성
    const summary = `This restaurant has an average rating of ${averageRating.toFixed(1)}/5 based on ${reviews.length} reviews. ${
      sentiment === "positive"
        ? "Customers generally have a positive experience."
        : sentiment === "mixed"
          ? "Customer experiences are mixed."
          : "There are some concerns about the experience."
    }`;

    // 결과 저장
    const summaryData = {
      place_id: placeId,
      sentiment,
      summary,
      average_rating: parseFloat(averageRating.toFixed(1)),
      review_count: reviews.length,
      created_at: new Date().toISOString(),
    };

    const { error: insertError } = await supabase.from("summaries").insert(summaryData);

    if (insertError) {
      console.error("Error saving summary:", insertError);
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
