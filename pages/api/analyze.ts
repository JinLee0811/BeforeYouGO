import { NextApiRequest, NextApiResponse } from "next";
import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from "axios";
import { googleMaps } from "../../lib/externalUrls";
import { supabase } from "../../lib/supabaseClient";
import { Review } from "@/types";
import { consumeAnalysisQuota } from "../../lib/apiUsageQuota";
// Remove internal crawler imports and function
// import puppeteer from "puppeteer-core";
// import chromium from "@sparticuz/chromium-min";
// Import the consolidated crawler function
import { crawlReviews } from "../../lib/crawlReviews";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || "");
const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

// 15 days in milliseconds
const CACHE_DURATION = 15 * 24 * 60 * 60 * 1000;
const URL_CACHE_TTL_MS = 12 * 60 * 60 * 1000;
const PHOTOS_CACHE_TTL_MS = 12 * 60 * 60 * 1000;
const inFlight = new Set<string>();
const urlCache = new Map<string, { value: string | null; expires: number }>();
const photosCache = new Map<string, { value: string[]; expires: number }>();

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

// --- Helper to get Google Maps URL (keep as is) ---
async function getGoogleMapsUrl(placeId: string): Promise<string | null> {
  if (!mapsApiKey) {
    console.warn("Google Maps API Key not configured. Cannot fetch URL.");
    return null;
  }
  const cached = urlCache.get(placeId);
  if (cached && cached.expires > Date.now()) {
    return cached.value;
  }
  try {
    const detailsUrl = `${googleMaps.placesDetailsUrl}?place_id=${placeId}&fields=url&key=${mapsApiKey}`;
    const response = await axios.get(detailsUrl);
    const url = response.data.result?.url || null;
    urlCache.set(placeId, { value: url, expires: Date.now() + URL_CACHE_TTL_MS });
    return url;
  } catch (error) {
    console.error(`Error fetching Google Maps URL for placeId ${placeId}:`, error);
    return null;
  }
}

async function getPlacePhotos(placeId: string): Promise<string[]> {
  if (!mapsApiKey) {
    return [];
  }
  const cached = photosCache.get(placeId);
  if (cached && cached.expires > Date.now()) {
    return cached.value;
  }
  const photosResponse = await axios.get(
    `${googleMaps.placesDetailsUrl}?place_id=${placeId}&fields=photos&key=${mapsApiKey}`
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
  console.log("\n--- /api/analyze handler started ---");
  if (req.method !== "POST") {
    console.log("Method not allowed:", req.method);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { placeId } = req.body;
  console.log("Received request with:", { placeId });
  let fetchedUrl: string | null = null;

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

    if (!placeId) {
      console.log("Error: placeId is missing.");
      return res.status(400).json({ success: false, error: "No placeId provided" });
    }

    if (inFlight.has(placeId)) {
      return res.status(429).json({
        success: false,
        error: "Analysis already in progress for this place.",
      });
    }
    inFlight.add(placeId);

    // 캐시된 Pro 분석 결과 확인
    const { data: cachedAnalysis, error: cacheError } = await supabase
      .from("summaries")
      .select("*")
      .eq("place_id", placeId)
      .eq("is_pro_analysis", true)
      .single();

    // 캐시가 있고 15일이 지나지 않았다면 캐시된 결과 반환
    if (cachedAnalysis && !cacheError) {
      const cacheAge = Date.now() - new Date(cachedAnalysis.created_at).getTime();
      if (cacheAge < CACHE_DURATION) {
        console.log(`Returning cached Pro analysis for ${placeId}`);
        return res.status(200).json({
          success: true,
          data: cachedAnalysis,
          fromCache: true,
        });
      }
      console.log(`Cached Pro analysis for ${placeId} is older than 15 days, refreshing...`);
    }

    // --- Review Fetching (using the imported crawlReviews) ---
    let currentReviews: Review[] = [];
    console.log(`Attempting to fetch URL for placeId: ${placeId}`);
    fetchedUrl = await getGoogleMapsUrl(placeId);
    console.log(`Fetched URL result: ${fetchedUrl}`);
    if (!fetchedUrl) {
      console.log("Error: Could not find Google Maps URL.");
      return res
        .status(400)
        .json({ success: false, error: "Could not find Google Maps URL for this place." });
    }

    try {
      console.log(`Attempting to fetch reviews using crawlReviews from URL: ${fetchedUrl}`);
      currentReviews = await crawlReviews(fetchedUrl);
      console.log(`Finished fetching reviews. Count: ${currentReviews.length}`);
      if (currentReviews.length === 0) {
        console.log("Warning: No reviews found or parsed by crawlReviews.");
      }
    } catch (crawlError: any) {
      console.error(`Crawling error for ${placeId} using crawlReviews:`, crawlError);
      return res
        .status(500)
        .json({ success: false, error: crawlError.message || "Failed to fetch reviews." });
    }

    // --- Analysis Logic ---
    console.log(`Starting Gemini analysis for ${placeId} with ${currentReviews.length} reviews...`);
    const totalRating = currentReviews.reduce((sum, review) => sum + (review.rating || 0), 0);
    const averageRating = currentReviews.length > 0 ? totalRating / currentReviews.length : 0;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    const reviewText = currentReviews
      .map((review: Review) => `Rating: ${review.rating}/5\nReview: ${review.text}`)
      .join("\n\n");

    const prompt = `Analyze all ${currentReviews.length} Google reviews for this restaurant and provide a comprehensive analysis in JSON format. Your analysis should be based on the complete dataset to ensure accurate insights.

Please include the following aspects in your analysis:

1. Overall sentiment (positive/negative/mixed) - Consider the distribution of ratings and review content
2. A detailed summary (2-3 sentences) that captures the overall customer experience and highlights any significant patterns
3. Key positive keywords (up to 5) - Extract the most frequently mentioned positive aspects
4. Key negative keywords (up to 5) - Extract the most frequently mentioned concerns or issues
5. All menu items mentioned across the reviews
6. Most recommended dishes based on positive reviews and frequency of mentions

Reviews to analyze:
${reviewText}

Respond in this exact JSON format:
{
  "sentiment": "positive/negative/mixed",
  "summary": "Comprehensive summary here",
  "positive_keywords": ["keyword1", "keyword2", ...],
  "negative_keywords": ["keyword1", "keyword2", ...],
  "mentioned_menu_items": ["item1", "item2", ...],
  "recommended_dishes": ["dish1", "dish2", ...]
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    try {
      // Extract JSON from the response text
      console.log("Raw Gemini response:", text);

      // Remove markdown code block if present
      const jsonText = text.replace(/```json\n|\n```/g, "").trim();
      console.log("Cleaned JSON text:", jsonText);

      const analysisResult = JSON.parse(jsonText);

      // Validate required fields
      const requiredFields = [
        "sentiment",
        "summary",
        "positive_keywords",
        "negative_keywords",
        "mentioned_menu_items",
        "recommended_dishes",
      ];

      for (const field of requiredFields) {
        if (!analysisResult[field]) {
          console.error(`Missing required field in analysis result: ${field}`);
          throw new Error(`Analysis result missing required field: ${field}`);
        }
      }

      // Get photos from Google Places API
      const photoUrls = await getPlacePhotos(placeId);

      // Combine all results
      const finalResult = {
        ...analysisResult,
        average_rating: averageRating,
        photoUrls,
        is_pro_analysis: true,
        place_id: placeId,
        created_at: new Date().toISOString(),
      };

      // 기존 Pro 분석 결과가 있다면 업데이트, 없다면 새로 생성
      if (cachedAnalysis) {
        const { error: updateError } = await supabase
          .from("summaries")
          .update(finalResult)
          .eq("place_id", placeId)
          .eq("is_pro_analysis", true);

        if (updateError) {
          console.error("Error updating Pro analysis:", updateError);
        }
      } else {
        const { error: insertError } = await supabase.from("summaries").insert(finalResult);

        if (insertError) {
          console.error("Error saving Pro analysis:", insertError);
        }
      }

      console.log(`Analysis complete for ${placeId}.`);
      return res.status(200).json({
        success: true,
        data: finalResult,
        fromCache: false,
      });
    } catch (parseError) {
      console.error("Error parsing Gemini response:", parseError);
      return res.status(500).json({
        success: false,
        error: "Failed to parse analysis results",
      });
    }
  } catch (error: any) {
    console.error(`General error in /api/analyze for placeId ${placeId}:`, error);
    return res.status(500).json({
      success: false,
      error: error.message || "An error occurred during analysis",
    });
  } finally {
    if (placeId) {
      inFlight.delete(placeId);
    }
  }
}
