import { supabase } from "@/lib/supabaseClient";

export type RecordPlaceClickPayload = {
  placeId: string;
  name?: string;
  address?: string;
  imageUrl?: string | null;
};

/** Fire-and-forget: logs a restaurant open for My page history. */
export function recordPlaceClick(payload: RecordPlaceClickPayload): void {
  const { placeId, name, address, imageUrl } = payload;
  if (!placeId?.trim()) return;

  void (async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return;

      const res = await fetch("/api/me/record-place-click", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          placeId: placeId.trim(),
          name: name ?? null,
          address: address ?? null,
          imageUrl: imageUrl ?? null,
        }),
      });
      if (!res.ok) {
        if (process.env.NODE_ENV === "development") {
          console.warn("[record-place-click] failed:", res.status);
        }
        return;
      }
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("byg:place-history-refresh"));
      }
    } catch {
      /* ignore */
    }
  })();
}
