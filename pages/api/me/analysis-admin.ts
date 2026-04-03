import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import { isAnalysisAdminByEnv } from "@/lib/analysisAdminEnv";

/**
 * Whether the signed-in user bypasses analysis quota / should get full Pro UX (client + server).
 * Avoid importing apiUsageQuota here (lighter bundle; fewer dev chunk issues).
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) {
      return res.status(200).json({ analysisAdmin: false });
    }

    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authData.user) {
      return res.status(200).json({ analysisAdmin: false });
    }

    const u = authData.user;
    if (isAnalysisAdminByEnv(u.id, u.email)) {
      return res.status(200).json({ analysisAdmin: true });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anon) {
      return res.status(200).json({ analysisAdmin: false });
    }

    const scoped = createClient(url, anon, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: row } = await scoped
      .from("profiles")
      .select("is_analysis_admin")
      .eq("id", u.id)
      .maybeSingle();

    return res.status(200).json({ analysisAdmin: row?.is_analysis_admin === true });
  } catch (e) {
    console.error("[api/me/analysis-admin]", e);
    return res.status(200).json({ analysisAdmin: false });
  }
}
