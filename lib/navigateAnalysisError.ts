import type { NextRouter } from "next/router";

/** /api/crawl·/api/analyze 등의 JSON `code`로 실패 원인 구분 */
export function crawlFailureReason(code?: string, errorMessage?: string): AnalysisErrorReason {
  if (
    code === "QUOTA_READ_FAILED" ||
    code === "QUOTA_UPDATE_FAILED" ||
    code === "QUOTA_FAILED"
  ) {
    return "quota";
  }
  if (errorMessage?.toLowerCase().includes("quota")) {
    return "quota";
  }
  return "reviews";
}

export function analyzeApiFailureReason(code?: string): AnalysisErrorReason {
  if (
    code === "QUOTA_READ_FAILED" ||
    code === "QUOTA_UPDATE_FAILED" ||
    code === "QUOTA_FAILED"
  ) {
    return "quota";
  }
  return "analyze";
}

export type AnalysisErrorReason =
  | "quota"
  | "reviews"
  | "summary"
  | "analyze"
  | "auth"
  | "parse"
  | "cancelled"
  | "unknown";

/**
 * 분석 실패 시 전용 페이지로 이동 (콘솔/오버레이에 원문 에러 대신 사용자용 복구 UI)
 */
export function navigateToAnalysisError(
  router: NextRouter,
  reason: AnalysisErrorReason,
  debugDetail?: string
) {
  const query: Record<string, string> = { reason };
  // Never attach server quota/DB errors to the URL (would leak internals in dev tools or shared links).
  if (reason !== "quota" && debugDetail?.trim()) {
    query.d = debugDetail.trim().slice(0, 220);
  }
  void router.push({ pathname: "/analysis-error", query });
}
