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

  // Profile creation is deferred to first dashboard access (ensureProfileExists).
  // Here we only register the user and stash full_name/interest in user metadata.
  return supabase.auth.signUp({
    email,
    password,
    options: { data: metadata },
  });
}

export async function signInWithPassword(email: string, password: string) {
  const supabase = getSupabaseBrowserClient();
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signOut() {
  const supabase = getSupabaseBrowserClient();
  return supabase.auth.signOut();
}
