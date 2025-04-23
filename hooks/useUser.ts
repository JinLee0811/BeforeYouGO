import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [isProUser, setIsProUser] = useState<boolean>(true); // 테스트 버전에서는 모든 사용자를 Pro로 간주
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Get initial user
    const getInitialUser = async () => {
      try {
        const {
          data: { user: initialUser },
        } = await supabase.auth.getUser();

        if (mounted) {
          setUser(initialUser);
          setIsProUser(true);
        }
      } catch (error) {
        console.error("Error getting initial user:", error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };
    getInitialUser();

    // Listen for changes on auth state change
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setUser(session?.user ?? null);
        setIsProUser(true);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { user, isProUser, isLoading };
}
