// Centralized environment variable access.
//
// NEXT_PUBLIC_* values are statically inlined at build time, so reading them
// from this module works in both server and client bundles. Helpers here only
// read/normalize env — they never throw, so callers keep their existing
// validation/soft-fail behavior.

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const REOWN_PROJECT_ID = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID;

export const WALLETCONNECT_ENABLED =
  process.env.NEXT_PUBLIC_ENABLE_WALLETCONNECT === "true";
