import { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { placeId } = req.query;

  if (!placeId || typeof placeId !== "string") {
    return res.status(400).json({ message: "Missing or invalid placeId query parameter" });
  }

  if (!mapsApiKey) {
    console.error("Error: Google Maps API Key is not configured.");
    return res.status(500).json({ message: "API key not configured" });
  }

  try {
    console.log(`[API /api/placedetails] Fetching details for placeId: ${placeId}`);
    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=photo,formatted_address&key=${mapsApiKey}`;
    const response = await axios.get(detailsUrl);
    const placeDetails = response.data.result;

    if (!placeDetails) {
      console.log(`[API /api/placedetails] No details found for placeId: ${placeId}`);
      return res.status(404).json({ message: "Place details not found" });
    }

    let photoUrls: string[] = [];
    if (placeDetails.photos && Array.isArray(placeDetails.photos)) {
      photoUrls = placeDetails.photos
        .slice(0, 5) // Limit photos
        .map(
          (photo: { photo_reference: string }) =>
            `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${mapsApiKey}`
        );
    }

    const resultData = {
      address: placeDetails.formatted_address || null,
      photos: photoUrls,
    };

    console.log(`[API /api/placedetails] Successfully fetched details for placeId: ${placeId}`);
    return res.status(200).json({ success: true, data: resultData });
  } catch (error: any) {
    console.error(
      `[API /api/placedetails] Error fetching Place Details for ${placeId}:`,
      error.response?.data || error.message
    );
    // Avoid leaking sensitive error details to the client
    let clientErrorMessage = "Failed to fetch place details";
    if (error.response?.status === 403) {
      clientErrorMessage = "API key might be invalid or restricted.";
    } else if (error.code === "ENOTFOUND") {
      clientErrorMessage = "Network error fetching place details.";
    }
    return res.status(500).json({ success: false, message: clientErrorMessage });
  }
}
