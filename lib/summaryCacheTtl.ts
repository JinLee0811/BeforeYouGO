/**
 * 동일 place_id 요약(기본/Pro) 재사용 기간.
 * 이 안이면 LLM·Places 재호출 없이 Supabase summaries 행을 그대로 반환해 비용 절감.
 */
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DEFAULT_DAYS = 7;
const MIN_DAYS = 1;
const MAX_DAYS = 365;

export function getSummaryCacheTtlMs(): number {
  const raw = process.env.SUMMARY_CACHE_TTL_DAYS;
  if (raw === undefined || raw.trim() === "") {
    return DEFAULT_DAYS * MS_PER_DAY;
  }
  const days = Number(raw);
  if (!Number.isFinite(days)) {
    return DEFAULT_DAYS * MS_PER_DAY;
  }
  const clamped = Math.min(Math.max(Math.floor(days), MIN_DAYS), MAX_DAYS);
  return clamped * MS_PER_DAY;
}
