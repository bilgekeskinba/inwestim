# Environment Variables

This document lists every environment variable Inwestim reads, whether it is
public or server-only, and how to configure it for local development and
deployment.

> **Golden rule:** anything prefixed `NEXT_PUBLIC_` is inlined into the browser
> bundle and is therefore **public**. Everything else is **server-only** and
> must never be exposed to the client or committed to git. Secrets (service-role
> key, private RPC with an API key, cron secret) must **never** be `NEXT_PUBLIC_`.

---

## Public variables (`NEXT_PUBLIC_*`, safe to expose)

These are inlined into the client bundle at build time.

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL (browser + server clients). |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes | Supabase anon/publishable key. RLS enforces authorization — this key is designed to be public. |
| `NEXT_PUBLIC_REOWN_PROJECT_ID` | For wallet UI | Reown / WalletConnect v2 project id (get one at https://dashboard.reown.com). |
| `NEXT_PUBLIC_ENABLE_WALLETCONNECT` | No (flag) | Feature flag. `true` shows the WalletConnect deposit UI on `/wallet`; anything else hides it. |
| `NEXT_PUBLIC_ACTIVE_CHAIN` | No (default `polygon`) | Active network slug from `lib/web3/networks`. Only `polygon` (Polygon Mainnet) is enabled. |
| `NEXT_PUBLIC_TREASURY_ADDRESS` | For deposits | Treasury address the **transfer UI** sends USDC to. **Display/transfer only** — it is validated independently server-side (see `TREASURY_ADDRESS`). |
| `NEXT_PUBLIC_REQUIRE_DEPOSIT_VERIFICATION` | No (default `true`) | Feature flag. When `true`, an admin cannot approve a deposit until verification is `verified`. Only the literal `false` disables it. |
| `NEXT_PUBLIC_MIN_DEPOSIT_CONFIRMATIONS` | No (default `12`) | Minimum on-chain confirmations before a deposit tx is considered final. |

---

## Server-only variables (never `NEXT_PUBLIC`, never commit)

Read only in server code (route handlers / server helpers). They are **not**
inlined into the browser bundle.

| Variable | Required | Purpose |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Yes (for verification to persist) | Privileged Supabase key used **only** by the trusted verification routes to write `verification_status` / `verification_details` / `verified_at`. Bypasses RLS — never expose. If unset, verification is computed but not persisted (safe fallback). |
| `TREASURY_ADDRESS` | Yes (for verification) | Treasury address the **server verifier** validates the transfer recipient against, independently of `NEXT_PUBLIC_TREASURY_ADDRESS`. Usually the same value, stored server-side. |
| `POLYGON_RPC_URL` | Recommended | Polygon RPC used by the **server** verifier. Keep private RPC/API-key URLs here — never `NEXT_PUBLIC`. Falls back to the chain's default public RPC when unset. |
| `CRON_SECRET` | Optional | Shared secret enabling a scheduler to call `POST /api/deposits/reverify-pending` via `Authorization: Bearer <secret>` without an admin session. When unset, only an authenticated admin can call the batch endpoint. |

> The wallet provider (wagmi / Reown AppKit) uses its own default RPC, so the
> Polygon RPC is **not** needed on the client. It was intentionally moved from
> `NEXT_PUBLIC_POLYGON_RPC_URL` to the server-only `POLYGON_RPC_URL`.

---

## Must never be committed

`.env*.local` is already git-ignored. Never commit real values for:

- `SUPABASE_SERVICE_ROLE_KEY`
- `POLYGON_RPC_URL` (if it contains a provider API key)
- `CRON_SECRET`
- `TREASURY_ADDRESS` (low sensitivity, but keep with the rest of the config)

The publishable / `NEXT_PUBLIC_*` values are public by design, but there is no
reason to commit them either — keep all environment values out of the repo.

---

## Local development setup

1. Create `.env.local` in the project root (git-ignored).
2. Add the public variables (Supabase URL + publishable key at minimum; add the
   `NEXT_PUBLIC_REOWN_PROJECT_ID` and `NEXT_PUBLIC_ENABLE_WALLETCONNECT=true` to
   exercise the wallet flow; `NEXT_PUBLIC_TREASURY_ADDRESS` for deposits).
3. Add the server-only variables (`SUPABASE_SERVICE_ROLE_KEY`, `TREASURY_ADDRESS`,
   `POLYGON_RPC_URL`) so server-side deposit verification can run and persist.
4. `npm install`
5. `npm run dev`

Verification degrades safely if server vars are missing: results are computed but
not persisted, and the admin can still verify manually.

---

## Deployment checklist

- [ ] Set every **public** variable in the hosting provider's environment.
- [ ] Set every **server-only** variable as a *secret* (not public) env var.
- [ ] Confirm `SUPABASE_SERVICE_ROLE_KEY` is present so verification persists.
- [ ] Confirm `TREASURY_ADDRESS` (server) matches `NEXT_PUBLIC_TREASURY_ADDRESS`.
- [ ] Set `POLYGON_RPC_URL` to a reliable (ideally private) Polygon RPC.
- [ ] (Optional) Set `CRON_SECRET` and schedule `POST /api/deposits/reverify-pending`
      (e.g. Vercel Cron every few minutes) to settle deposits awaiting confirmations.
- [ ] Verify no server secret is prefixed with `NEXT_PUBLIC_`.

---

## Feature flags

| Flag | Effect |
|---|---|
| `NEXT_PUBLIC_ENABLE_WALLETCONNECT` | `true` → native WalletConnect deposit UI on `/wallet`; otherwise the manual deposit form / a "coming soon" placeholder. |
| `NEXT_PUBLIC_REQUIRE_DEPOSIT_VERIFICATION` | `true` (default) → Approve is disabled until a deposit is `verified`; `false` → admins may approve unverified deposits. |
| `NEXT_PUBLIC_MIN_DEPOSIT_CONFIRMATIONS` | Confirmation threshold used by the verifier (default 12). |
