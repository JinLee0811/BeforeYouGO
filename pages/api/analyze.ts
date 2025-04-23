import { NextApiRequest, NextApiResponse } from "next";
import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from "axios";
import { supabase } from "../../lib/supabaseClient";
import { Review } from "@/types";
// Remove internal crawler imports and function
// import puppeteer from "puppeteer-core";
// import chromium from "@sparticuz/chromium-min";
// Import the consolidated crawler function
import { crawlReviews } from "../../lib/crawlReviews";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || "");
const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

// --- Helper to get Google Maps URL (keep as is) ---
async function getGoogleMapsUrl(placeId: string): Promise<string | null> {
  if (!mapsApiKey) {
    console.warn("Google Maps API Key not configured. Cannot fetch URL.");
    return null;
  }
  try {
    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=url&key=${mapsApiKey}`;
    const response = await axios.get(detailsUrl);
    return response.data.result?.url || null;
  } catch (error) {
    console.error(`Error fetching Google Maps URL for placeId ${placeId}:`, error);
    return null;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log("\n--- /api/analyze handler started ---");
  if (req.method !== "POST") {
    console.log("Method not allowed:", req.method);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { placeId, userId } = req.body;
  console.log("Received request with:", { placeId, userId });
  let fetchedUrl: string | null = null;

  try {
    if (!placeId) {
      console.log("Error: placeId is missing.");
      return res.status(400).json({ success: false, error: "No placeId provided" });
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
      // Use the imported crawlReviews function
      currentReviews = await crawlReviews(fetchedUrl);
      console.log(`Finished fetching reviews. Count: ${currentReviews.length}`);
      if (currentReviews.length === 0) {
        console.log("Warning: No reviews found or parsed by crawlReviews.");
        // Still proceed to analysis even with 0 reviews? Or return error?
        // Let's proceed for now, Gemini might handle it or return empty results.
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

    const prompt = `Analyze these Google reviews for a restaurant and provide a structured analysis in JSON format. Include the following aspects:

1. Overall sentiment (positive/negative/mixed)
2. A comprehensive summary (2-3 sentences)
3. Key positive keywords (up to 5)
4. Key negative keywords (up to 5)
5. Mentioned menu items
6. Recommended dishes based on positive reviews

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
      const photosResponse = await axios.get(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=photos&key=${mapsApiKey}`
      );

      const photoUrls =
        photosResponse.data.result?.photos
          ?.slice(0, 5)
          .map(
            (photo: { photo_reference: string }) =>
              `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${mapsApiKey}`
          ) || [];

      // Combine all results
      const finalResult = {
        ...analysisResult,
        average_rating: averageRating,
        photoUrls,
        is_pro_analysis: true,
      };

      console.log(`Analysis complete for ${placeId}.`);
      return res.status(200).json({
        success: true,
        data: finalResult,
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
  }
}
