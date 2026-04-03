import { useCallback, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import type { UserProfile } from "@/types/user";
import type { MyPagePlaceClick } from "@/types/mypage";

/**
 * My page: profile + restaurant open history (user_place_clicks).
 */
export function useMyPageData(user: User | null) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [placeClicks, setPlaceClicks] = useState<MyPagePlaceClick[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user) {
        console.error("User authentication information not found");
        return;
      }

      let { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, email, nickname, settings, created_at, updated_at")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
        return;
      }

      if (!profileData) {
        const { data: newProfile, error: createError } = await supabase
          .from("profiles")
          .insert({
            id: user.id,
            email: user.email,
            nickname: user.user_metadata?.nickname || user.email?.split("@")[0] || "User",
            settings: {
              notifications: {
                email: true,
                push: true,
                reviewResponse: true,
                newRestaurant: true,
              },
              language: "en",
              theme: "system",
            },
          })
          .select("id, email, nickname, settings, created_at, updated_at")
          .single();

        if (createError) {
          console.error("Error creating profile:", createError);
          return;
        }
        profileData = newProfile;
      }

      if (!profileData) {
        console.error("Could not fetch profile data");
        return;
      }

      setProfile({
        id: profileData.id,
        email: profileData.email,
        nickname: profileData.nickname,
        settings: profileData.settings,
        createdAt: new Date(profileData.created_at),
        updatedAt: new Date(profileData.updated_at),
      });

      const { data: clicksData, error: clicksError } = await supabase
        .from("user_place_clicks")
        .select(
          "place_id, restaurant_name, restaurant_address, image_url, click_count, first_clicked_at, last_clicked_at"
        )
        .eq("user_id", user.id)
        .order("last_clicked_at", { ascending: false });

      if (clicksError) {
        console.error(
          "[My page] Place history not loaded (check Supabase migration user_place_clicks + RLS):",
          clicksError.message,
          clicksError.code,
          clicksError
        );
        setPlaceClicks([]);
      } else {
        setPlaceClicks((clicksData as MyPagePlaceClick[]) || []);
      }
    } catch (e) {
      console.error("Error fetching data:", e);
      setError("We couldn’t load your page. Please refresh and try again.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  return {
    profile,
    setProfile,
    placeClicks,
    loading,
    error,
    fetchUserData,
  };
}
