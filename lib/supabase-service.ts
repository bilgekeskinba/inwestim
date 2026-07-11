import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Privileged, SERVER-ONLY Supabase client used exclusively by trusted server
 * routes to persist verification results that the browser must never be able to
 * write (deposit_requests.verification_status / verification_details /
 * verified_at).
 *
 * Security:
 * - Uses SUPABASE_SERVICE_ROLE_KEY, which is NOT prefixed with NEXT_PUBLIC and
 *   is therefore never inlined into the client bundle (it is `undefined` in the
 *   browser). This module must only be imported from server code (route
 *   handlers / server actions), never from a client component.
 * - Callers MUST perform their own auth/ownership checks (with the request-
 *   scoped anon client) before using this client, because it bypasses RLS.
 * - Returns null when the key is not configured, so callers can degrade safely
 *   instead of crashing.
 */
export function createSupabaseServiceClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;

  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
