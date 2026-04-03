/**
 * AI 분석에 넣을 Google 리뷰 최대 개수 (토큰·비용 조절).
 * Places API는 보통 최대 5개만 주므로, 실질 상한은 대개 5입니다.
 */
const DEFAULT_MAX = 5;
const ABSOLUTE_CAP = 20;

export function getMaxReviewsForAnalysis(): number {
  const raw = Number(process.env.MAX_REVIEWS_FOR_ANALYSIS ?? DEFAULT_MAX);
  if (!Number.isFinite(raw) || raw < 1) return DEFAULT_MAX;
  return Math.min(Math.floor(raw), ABSOLUTE_CAP);
}

export function limitReviewsForAnalysis<T>(reviews: T[]): T[] {
  const max = getMaxReviewsForAnalysis();
  return reviews.slice(0, max);
}
