import { createClient } from "@supabase/supabase-js";

/**
 * API 라우트에서 검증된 accessToken 으로 PostgREST RLS(auth.uid())에 맞게 호출할 클라이언트
 */
export function createSupabaseForRequest(accessToken: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
