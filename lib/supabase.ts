import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "@/lib/env";

export function getSupabaseClient(): SupabaseClient {
  const supabaseUrl = SUPABASE_URL;
  const supabaseAnonKey = SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase environment variables are required.");
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}
