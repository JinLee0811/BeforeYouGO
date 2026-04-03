import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [analysisAdmin, setAnalysisAdmin] = useState(false);

  useEffect(() => {
    let mounted = true;

    const getInitialSession = async () => {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();
        if (sessionError) {
          throw sessionError;
        }
        if (mounted) {
          const initialUser = session?.user ?? null;
          setUser(initialUser);
        }
      } catch (error) {
        console.error("Error getting initial session:", error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    getInitialSession();

    const {
      data: { subscription: authSubscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (mounted) {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
      }
    });

    return () => {
      mounted = false;
      authSubscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadAdmin = async () => {
      if (!user) {
        setAnalysisAdmin(false);
        return;
      }
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setAnalysisAdmin(false);
        return;
      }
      try {
        const r = await fetch("/api/me/analysis-admin", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const j = (await r.json()) as { analysisAdmin?: boolean };
        if (!cancelled) {
          setAnalysisAdmin(j.analysisAdmin === true);
        }
      } catch {
        if (!cancelled) setAnalysisAdmin(false);
      }
    };

    void loadAdmin();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  return { user, isLoading, analysisAdmin };
}
