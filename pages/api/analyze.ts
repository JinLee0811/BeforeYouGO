import { NextApiRequest, NextApiResponse } from "next";
import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from "axios";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || "");
const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

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

    // Calculate average rating
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;

    // Initialize Gemini model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Prepare review text
    const reviewText = reviews
      .map((review: any) => `Rating: ${review.rating}/5\nReview: ${review.text}`)
      .join("\n\n");

    // Create prompt
    const prompt = `Analyze these Google reviews for a restaurant in Sydney and provide a JSON response. Focus on extracting key insights about the dining experience, food quality, service, and ambiance.

Reviews:
${reviewText}

Respond with ONLY a JSON object in this exact format (no other text):
{
  "sentiment": "positive/negative/mixed",
  "positive_keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "negative_keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "summary": "Comprehensive 3-line summary of the overall dining experience",
  "mentioned_menu_items": ["item1", "item2", "item3"],
  "recommended_dishes": ["dish1", "dish2", "dish3"]
}`;

    // Call Gemini API
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Extract and validate JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Invalid response format from AI");
    }

    const jsonText = jsonMatch[0];
    const analysis = JSON.parse(jsonText);

    // Validate required fields
    const requiredFields = [
      "sentiment",
      "positive_keywords",
      "negative_keywords",
      "summary",
      "mentioned_menu_items",
      "recommended_dishes",
    ];

    for (const field of requiredFields) {
      if (!analysis[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Fetch photos from Google Places API
    let photoUrls: string[] = [];
    try {
      const placesApiUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=photos&key=${mapsApiKey}`;
      const placesResponse = await axios.get(placesApiUrl);

      if (placesResponse.data.result?.photos) {
        photoUrls = placesResponse.data.result.photos
          .slice(0, 5)
          .map(
            (photo: any) =>
              `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${mapsApiKey}`
          );
      }
    } catch (placesError) {
      console.error("Error fetching photos:", placesError);
      // Continue without photos if there's an error
    }

    // Prepare final result
    const finalResult = {
      ...analysis,
      average_rating: parseFloat(averageRating.toFixed(1)),
      photoUrls,
    };

    return res.status(200).json({
      success: true,
      data: finalResult,
    });
  } catch (error) {
    console.error("Analysis error:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to analyze reviews",
    });
  }
}
