import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createSupabaseServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseKey = supabaseServiceRoleKey ?? supabaseAnonKey;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase environment variables are required.");
  }

  const cookieStore = await cookies();

  if (supabaseServiceRoleKey) {
    console.log("[supabase-server] using SUPABASE_SERVICE_ROLE_KEY for server client");
  } else {
    console.log("[supabase-server] using anon publishable key for server client");
  }

  return createServerClient(supabaseUrl, supabaseKey, {
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
