/**
 * Map 429 JSON `code` from /api/crawl and /api/analyze to user-facing English copy.
 */
export async function messageForAnalysis429Response(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { code?: string; error?: string };
    return messageForAnalysis429Payload(data);
  } catch {
    return "We could not complete this request. Please try again in a moment.";
  }
}

export function messageForAnalysis429Payload(data: { code?: string; error?: string }): string {
  switch (data.code) {
    case "USAGE_LIMIT_EXCEEDED":
      return "You have used all free analyses for today. Try again tomorrow or upgrade on the pricing page.";
    case "CRAWL_IN_FLIGHT":
      return "An analysis for this place is already running. Please wait a moment and try again.";
    case "RATE_LIMITED":
      return "Too many requests. Please wait a few seconds and try again.";
    default:
      if (data.error && typeof data.error === "string" && data.error.length > 0) {
        return data.error;
      }
      return "We could not complete this request. Please try again in a moment.";
  }
}
