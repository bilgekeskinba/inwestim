import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

export type SignUpMetadata = {
  full_name?: string;
  interest?: string;
};

export async function signUpWithEmail(
  email: string,
  password: string,
  metadata?: SignUpMetadata
) {
  const supabase = getSupabaseBrowserClient();
  return supabase.auth.signUp({ email, password }, { data: metadata });
}

export async function signInWithPassword(email: string, password: string) {
  const supabase = getSupabaseBrowserClient();
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signOut() {
  const supabase = getSupabaseBrowserClient();
  return supabase.auth.signOut();
}
