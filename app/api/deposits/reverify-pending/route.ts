import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { createSupabaseServiceClient } from "@/lib/supabase-service";
import { verifyAndPersistDeposit } from "@/lib/deposits/verify-and-persist";
import { isRetryableDeposit } from "@/lib/web3/verification-status";

/**
 * POST /api/deposits/reverify-pending — trusted batch re-verification (Sprint 6H).
 *
 * Re-runs the SAME server verification for deposits still awaiting blockchain
 * confirmations, so freshly mined transactions get verified without an admin
 * clicking each one. Admin-only; never auto-approves and never credits the
 * ledger — it only refreshes verification_status.
 *
 * Designed to also be callable by a trusted scheduler (Vercel Cron / Supabase
 * scheduled function): if a server-only CRON_SECRET is configured, a request
 * carrying `Authorization: Bearer <CRON_SECRET>` is accepted without a session.
 * Otherwise an authenticated admin session is required. No transaction details
 * are accepted from the caller. No cron schedule is registered here.
 */

// Safe cap per run so a scheduler can't fan out unbounded RPC calls.
const BATCH_LIMIT = 20;

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();

  // Scheduler path: a server-only shared secret (never exposed to the browser).
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  const isScheduler = Boolean(cronSecret) && authHeader === `Bearer ${cronSecret}`;

  if (!isScheduler) {
    // Admin path: authenticated admin only, enforced server-side.
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
  }

  const service = createSupabaseServiceClient();

  // Candidate retryable deposits: still awaiting verification, have a tx hash,
  // and not yet approved/completed. Oldest first so the longest-waiting settle
  // first. Capped to a safe batch. Read with the trusted service client when
  // available (works for both the admin and scheduler paths); otherwise fall
  // back to the RLS-scoped session client (admin only).
  const reader = service ?? supabase;
  const { data: rows, error: loadError } = await reader
    .from("deposit_requests")
    .select("id, tx_hash, wallet_address, amount, status, verification_status, verification_details, created_at")
    .eq("verification_status", "not_verified")
    .not("tx_hash", "is", null)
    .in("status", ["pending", "confirming"])
    .order("created_at", { ascending: true })
    .limit(BATCH_LIMIT);

  if (loadError) {
    return NextResponse.json({ error: "load_failed" }, { status: 500 });
  }

  // Defensive refinement: exclude anything whose stored details show a
  // substantive (non-transient) failure — those must not be retried.
  const retryable = (rows ?? []).filter((row) =>
    isRetryableDeposit({
      verification_status: row.verification_status as string | null,
      tx_hash: row.tx_hash as string | null,
      status: row.status as string | null,
      verification_details: (row.verification_details as never) ?? null,
    })
  );

  const summary = { checked: 0, verified: 0, stillWaiting: 0, failed: 0, errors: 0 };

  for (const row of retryable) {
    summary.checked += 1;
    try {
      const outcome = await verifyAndPersistDeposit(
        {
          id: String(row.id),
          tx_hash: row.tx_hash as string | null,
          wallet_address: row.wallet_address as string | null,
          amount: row.amount as number | string | null,
        },
        service
      );
      if (outcome.status === "verified") summary.verified += 1;
      else if (outcome.status === "failed") summary.failed += 1;
      else summary.stillWaiting += 1;
    } catch (err) {
      summary.errors += 1;
      if (process.env.NODE_ENV !== "production") {
        console.error("[reverify] deposit failed", row.id, err);
      }
    }
  }

  return NextResponse.json(
    { ...summary, batchLimit: BATCH_LIMIT, persistedEnabled: Boolean(service) },
    { status: 200 }
  );
}
