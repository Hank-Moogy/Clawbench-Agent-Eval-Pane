// Clerk-aware Supabase client.
// Uses Supabase's Third-Party Auth (accessToken callback) so RLS policies
// can read the Clerk JWT via auth.jwt() ->> 'sub'.
import { createClient } from "@supabase/supabase-js";
import { useAuth } from "@clerk/clerk-react";
import { useMemo } from "react";
import type { Database } from "./types";

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || (typeof process !== "undefined" ? process.env.SUPABASE_URL : undefined);
const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  (typeof process !== "undefined" ? process.env.SUPABASE_PUBLISHABLE_KEY : undefined);

export function useClerkSupabaseClient() {
  const { getToken } = useAuth();

  return useMemo(() => {
    if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
      throw new Error("Supabase env vars missing");
    }
    return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
      accessToken: async () => (await getToken()) ?? null,
    });
  }, [getToken]);
}
