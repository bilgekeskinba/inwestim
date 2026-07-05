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

// Active EVM network (slug from the network registry) + per-chain RPC URLs.
// The rest of the app derives everything else from lib/web3/networks.
export const ACTIVE_CHAIN = process.env.NEXT_PUBLIC_ACTIVE_CHAIN || "polygon";
export const POLYGON_RPC_URL = process.env.NEXT_PUBLIC_POLYGON_RPC_URL;

// Treasury address deposits must be sent to (chain-agnostic for now).
export const TREASURY_ADDRESS = process.env.NEXT_PUBLIC_TREASURY_ADDRESS;

// Deposit safety. Verification is required by default (only "false" disables it).
export const REQUIRE_DEPOSIT_VERIFICATION =
  process.env.NEXT_PUBLIC_REQUIRE_DEPOSIT_VERIFICATION !== "false";

// Minimum on-chain confirmations before a deposit tx is considered final.
export const MIN_DEPOSIT_CONFIRMATIONS =
  Number(process.env.NEXT_PUBLIC_MIN_DEPOSIT_CONFIRMATIONS ?? "12") || 12;
