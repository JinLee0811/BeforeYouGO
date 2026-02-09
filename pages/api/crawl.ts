import { NextApiRequest, NextApiResponse } from "next";
import { crawlReviews } from "../../lib/crawlReviews";
import { supabase } from "../../lib/supabaseClient";
import { ApiResponse, Review } from "../../types";

const RATE_LIMIT_WINDOW_MS = 5000;
const ipUsageMap = new Map<string, number>();
const inFlight = new Set<string>();

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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<Review[]>>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ success: false, error: "URL is required" });
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

    const clientIp = getClientIp(req);
    if (isIpRateLimited(clientIp)) {
      return res.status(429).json({
        success: false,
        error: "Too many requests. Please wait a moment and try again.",
      });
    }

    if (inFlight.has(url)) {
      return res.status(429).json({
        success: false,
        error: "Crawling already in progress for this URL.",
      });
    }
    inFlight.add(url);
    markIpUsed(clientIp);
    const reviews = await crawlReviews(url);
    return res.status(200).json({ success: true, data: reviews });
  } catch (error) {
    console.error("Crawling error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to crawl reviews",
    });
  } finally {
    if (url) {
      inFlight.delete(url);
    }
  }
}
