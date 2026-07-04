"use client";

import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "@/lib/env";

export function getSupabaseBrowserClient() {
  const supabaseUrl = SUPABASE_URL;
  const supabaseAnonKey = SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase environment variables are required.");
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
