import { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import { googleMaps } from "../../lib/externalUrls";
import { supabase } from "../../lib/supabaseClient";

const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const PLACE_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const RATE_LIMIT_WINDOW_MS = 3000;
const placeCache = new Map<string, { data: { address: string | null; photos: string[] }; expires: number }>();
const inFlight = new Map<string, Promise<{ status: number; body: any }>>();
const ipUsageMap = new Map<string, number>();

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
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authData?.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const cached = placeCache.get(placeId);
    if (cached && cached.expires > Date.now()) {
      return res.status(200).json({ success: true, data: cached.data, fromCache: true });
    }

    const clientIp = getClientIp(req);
    if (isIpRateLimited(clientIp)) {
      return res.status(429).json({
        success: false,
        message: "Too many requests. Please wait a moment and try again.",
      });
    }

    const existingFlight = inFlight.get(placeId);
    if (existingFlight) {
      const result = await existingFlight;
      return res.status(result.status).json(result.body);
    }

    const flightPromise = (async () => {
      markIpUsed(clientIp);
      const detailsUrl = `${googleMaps.placesDetailsUrl}?place_id=${placeId}&fields=photo,formatted_address&key=${mapsApiKey}`;
      const response = await axios.get(detailsUrl);
      const placeDetails = response.data.result;

      if (!placeDetails) {
        return { status: 404, body: { message: "Place details not found" } };
      }

      let photoUrls: string[] = [];
      if (placeDetails.photos && Array.isArray(placeDetails.photos)) {
        photoUrls = placeDetails.photos
          .slice(0, 5)
          .map(
            (photo: { photo_reference: string }) =>
              `${googleMaps.photoUrl}?maxwidth=400&photoreference=${photo.photo_reference}&key=${mapsApiKey}`
          );
      }

      const resultData = {
        address: placeDetails.formatted_address || null,
        photos: photoUrls,
      };

      placeCache.set(placeId, { data: resultData, expires: Date.now() + PLACE_CACHE_TTL_MS });
      return { status: 200, body: { success: true, data: resultData } };
    })();

    inFlight.set(placeId, flightPromise);
    const result = await flightPromise;
    return res.status(result.status).json(result.body);
  } catch (error: any) {
    inFlight.delete(placeId);
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
  } finally {
    inFlight.delete(placeId);
  }
}
