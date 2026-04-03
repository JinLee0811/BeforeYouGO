import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabaseClient";
import { createSupabaseForRequest } from "@/lib/supabaseServerUser";

type Body = {
  placeId?: string;
  name?: string | null;
  address?: string | null;
  imageUrl?: string | null;
};

/**
 * Records or increments a restaurant open (My page history). Non-blocking for clients.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse<{ ok: true } | { error: string }>) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { data: authData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !authData?.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { placeId, name, address, imageUrl } = req.body as Body;
  if (!placeId || typeof placeId !== "string" || !placeId.trim()) {
    return res.status(400).json({ error: "placeId is required" });
  }

  const db = createSupabaseForRequest(token);
  const { error: rpcError } = await db.rpc("record_place_click", {
    p_place_id: placeId.trim(),
    p_name: typeof name === "string" ? name : null,
    p_address: typeof address === "string" ? address : null,
    p_image_url: typeof imageUrl === "string" ? imageUrl : null,
  });

  if (rpcError) {
    console.error("[record-place-click]", rpcError.message, rpcError);
    return res.status(500).json({ error: "Failed to record click" });
  }

  return res.status(200).json({ ok: true });
}
