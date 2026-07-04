import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "@/lib/env";

export async function createSupabaseServerClient() {
  const supabaseUrl = SUPABASE_URL;
  const supabaseAnonKey = SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase environment variables are required.");
  }

  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            if (name && value) {
              cookieStore.set(name, value, options);
            }
          });
        } catch {
          // Server component cannot set cookies after response has been committed.
        }
      },
    },
  });
}
