import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { isAnalysisAdminByEnv } from "./analysisAdminEnv";

const DEFAULT_ANALYSIS_LIMIT = 5;

/** YYYY-MM-DD — ANALYSIS_QUOTA_TIMEZONE 이 있으면 해당 TZ의 '오늘', 없으면 UTC */
export function getQuotaCalendarDate(): string {
  const tz = process.env.ANALYSIS_QUOTA_TIMEZONE?.trim();
  if (tz) {
    try {
      return new Date().toLocaleDateString("en-CA", { timeZone: tz });
    } catch {
      console.warn("[quota] invalid ANALYSIS_QUOTA_TIMEZONE, falling back to UTC:", tz);
    }
  }
  return new Date().toISOString().slice(0, 10);
}

type UsageRow = {
  analysis_requests?: number | null;
  analysis_quota_day?: string | null;
};

function effectiveDailyUsed(row: UsageRow | null | undefined, today: string): number {
  if (!row) return 0;
  const day = row.analysis_quota_day;
  if (day == null || day !== today) return 0;
  return Math.max(0, Number(row.analysis_requests) || 0);
}

/**
 * 로컬 시연용: `next dev` + `.env.local` 에만 `DEMO_SKIP_ANALYSIS_QUOTA=true` 설정 시
 * user_api_usage 조회/증가를 건너뜀. 프로덕션 빌드에서는 절대 적용되지 않음.
 */
function shouldSkipQuotaForLocalDemo(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  const v = process.env.DEMO_SKIP_ANALYSIS_QUOTA;
  return v === "true" || v === "1";
}

/** 테이블 없음 등으로 read/update 실패 시에도 분석은 통과 (로컬/비상용). 프로덕션에서는 비권장. */
function isQuotaFailOpen(): boolean {
  const v = process.env.QUOTA_FAIL_OPEN;
  return v === "true" || v === "1";
}

const getAnalysisLimit = () => {
  const raw = Number(process.env.ANALYSIS_USAGE_LIMIT || DEFAULT_ANALYSIS_LIMIT);
  if (!Number.isFinite(raw) || raw < 1) return DEFAULT_ANALYSIS_LIMIT;
  return Math.floor(raw);
};

/**
 * Server-only: emails / UUIDs listed in env bypass analysis quota (no user_api_usage read or increment).
 * Set ANALYSIS_ADMIN_EMAILS and/or ANALYSIS_ADMIN_USER_IDS in Vercel / .env.local (never commit secrets).
 */
export function isAnalysisAdminUser(userId: string, email?: string | null): boolean {
  return isAnalysisAdminByEnv(userId, email);
}

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

/**
 * API 라우트에서 user_api_usage 를 읽고/갱신할 때 사용하는 클라이언트.
 * - SUPABASE_SERVICE_ROLE_KEY 가 있으면: 서버 전용, RLS 우회 (권장)
 * - 없으면: 요청의 사용자 JWT(anon 키 + Authorization)로 RLS 정책에 맞게 접근
 *
 * 공유 supabaseClient(anon만)로 조회하면 auth.uid() 가 비어 RLS에 막혀
 * "Failed to read quota usage." 가 나기 쉽습니다.
 */
function createQuotaSupabaseClient(accessToken: string): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (serviceKey) {
    return createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  return createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function consumeAnalysisQuota(
  userId: string,
  accessToken: string,
  userEmail?: string | null
): Promise<QuotaResult> {
  if (shouldSkipQuotaForLocalDemo()) {
    const limit = getAnalysisLimit();
    console.warn("[quota] DEMO_SKIP_ANALYSIS_QUOTA: skipping DB (local demo only)");
    return {
      success: true,
      limit,
      used: 0,
      remaining: limit,
    };
  }

  if (isAnalysisAdminUser(userId, userEmail)) {
    const limit = getAnalysisLimit();
    console.info("[quota] admin user: skipping quota (ANALYSIS_ADMIN_EMAILS / ANALYSIS_ADMIN_USER_IDS)");
    return {
      success: true,
      limit,
      used: 0,
      remaining: limit,
    };
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY && !accessToken) {
    return { success: false, error: "QUOTA_AUTH_FAILED" };
  }

  const supabase = createQuotaSupabaseClient(accessToken);
  const limit = getAnalysisLimit();

  const { data: profileRow, error: profileError } = await supabase
    .from("profiles")
    .select("is_analysis_admin")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    console.error("[quota] read profiles.is_analysis_admin:", profileError.message);
  } else if (profileRow?.is_analysis_admin === true) {
    console.info("[quota] admin user: skipping quota (profiles.is_analysis_admin)");
    return {
      success: true,
      limit,
      used: 0,
      remaining: limit,
    };
  }

  const today = getQuotaCalendarDate();

  const { data: usageRow, error: selectError } = await supabase
    .from("user_api_usage")
    .select("analysis_requests, analysis_quota_day")
    .eq("user_id", userId)
    .maybeSingle();

  if (selectError) {
    console.error("[quota] read user_api_usage:", selectError.message, selectError.code, selectError);
    if (isQuotaFailOpen()) {
      console.warn("[quota] QUOTA_FAIL_OPEN: skipping read error (see supabase/sql/user_api_usage.sql)");
      return { success: true, limit, used: 0, remaining: limit };
    }
    return {
      success: false,
      error: "QUOTA_READ_FAILED",
      limit,
      used: limit,
      remaining: 0,
    };
  }

  const used = effectiveDailyUsed(usageRow as UsageRow | null, today);
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
      analysis_quota_day: today,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (upsertError) {
    console.error("[quota] upsert user_api_usage:", upsertError.message, upsertError.code, upsertError);
    if (isQuotaFailOpen()) {
      console.warn("[quota] QUOTA_FAIL_OPEN: skipping upsert error");
      return { success: true, limit, used: nextUsed, remaining: Math.max(0, limit - nextUsed) };
    }
    return {
      success: false,
      error: "QUOTA_UPDATE_FAILED",
      limit,
      used,
      remaining: Math.max(0, limit - used),
    };
  }

  return {
    success: true,
    limit,
    used: nextUsed,
    remaining: Math.max(0, limit - nextUsed),
  };
}

export type AnalysisQuotaSnapshot =
  | { unlimited: true }
  | {
      unlimited: false;
      limit: number;
      used: number;
      remaining: number;
      /** DB/RLS/read error — not the same as "used all" */
      quotaUnavailable?: boolean;
    };

/**
 * 소비 없이 현재 한도만 조회 (GET /api/me/analysis-quota 등)
 */
export async function getAnalysisQuotaSnapshot(
  userId: string,
  accessToken: string,
  userEmail?: string | null
): Promise<AnalysisQuotaSnapshot> {
  if (shouldSkipQuotaForLocalDemo()) {
    return { unlimited: true };
  }

  if (isAnalysisAdminUser(userId, userEmail)) {
    return { unlimited: true };
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY && !accessToken) {
    return { unlimited: false, limit: getAnalysisLimit(), used: 0, remaining: getAnalysisLimit() };
  }

  const supabase = createQuotaSupabaseClient(accessToken);
  const limit = getAnalysisLimit();

  const { data: profileRow, error: profileError } = await supabase
    .from("profiles")
    .select("is_analysis_admin")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    console.error("[quota] snapshot profiles:", profileError.message);
  } else if (profileRow?.is_analysis_admin === true) {
    return { unlimited: true };
  }

  const today = getQuotaCalendarDate();

  const { data: usageRow, error: selectError } = await supabase
    .from("user_api_usage")
    .select("analysis_requests, analysis_quota_day")
    .eq("user_id", userId)
    .maybeSingle();

  if (selectError) {
    console.error("[quota] snapshot user_api_usage:", selectError.message);
    if (isQuotaFailOpen()) {
      return { unlimited: true };
    }
    // Do not pretend the user exhausted quota (misleading for new signups when RLS/table errors).
    return {
      unlimited: false,
      limit,
      used: 0,
      remaining: 0,
      quotaUnavailable: true,
    };
  }

  const used = effectiveDailyUsed(usageRow as UsageRow | null, today);
  return {
    unlimited: false,
    limit,
    used,
    remaining: Math.max(0, limit - used),
  };
}
