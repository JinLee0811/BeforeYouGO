import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabaseClient";
import { getAnalysisQuotaSnapshot } from "@/lib/apiUsageQuota";

type OkBody =
  | { unlimited: true }
  | {
      unlimited: false;
      limit: number;
      used: number;
      remaining: number;
      quotaUnavailable?: boolean;
    };

/**
 * 로그인 사용자의 분석 쿼터 스냅샷(소비 없음). 무료 티어 UI 배너용.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse<OkBody | { error: string }>) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authData?.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const u = authData.user;
    const snap = await getAnalysisQuotaSnapshot(u.id, token, u.email);
    return res.status(200).json(snap);
  } catch (e) {
    console.error("[api/me/analysis-quota]", e);
    return res.status(500).json({ error: "Failed to read quota" });
  }
}
