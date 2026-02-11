import { supabase } from "./supabaseClient";

const DEFAULT_ANALYSIS_LIMIT = 3;

const getAnalysisLimit = () => {
  const raw = Number(process.env.ANALYSIS_USAGE_LIMIT || DEFAULT_ANALYSIS_LIMIT);
  if (!Number.isFinite(raw) || raw < 1) return DEFAULT_ANALYSIS_LIMIT;
  return Math.floor(raw);
};

type QuotaResult =
  | {
      success: true;
      limit: number;
      used: number;
      remaining: number;
    }
  | {
      success: false;
      error: string;
      limit?: number;
      used?: number;
      remaining?: number;
    };

export async function consumeAnalysisQuota(userId: string): Promise<QuotaResult> {
  const limit = getAnalysisLimit();

  const { data: usageRow, error: selectError } = await supabase
    .from("user_api_usage")
    .select("analysis_requests")
    .eq("user_id", userId)
    .maybeSingle();

  if (selectError) {
    return { success: false, error: "Failed to read quota usage." };
  }

  const used = usageRow?.analysis_requests ?? 0;
  if (used >= limit) {
    return {
      success: false,
      error: "USAGE_LIMIT_EXCEEDED",
      limit,
      used,
      remaining: 0,
    };
  }

  const nextUsed = used + 1;
  const { error: upsertError } = await supabase.from("user_api_usage").upsert(
    {
      user_id: userId,
      analysis_requests: nextUsed,
    },
    { onConflict: "user_id" }
  );

  if (upsertError) {
    return { success: false, error: "Failed to update quota usage." };
  }

  return {
    success: true,
    limit,
    used: nextUsed,
    remaining: Math.max(0, limit - nextUsed),
  };
}
