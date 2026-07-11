import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { createSupabaseServiceClient } from "@/lib/supabase-service";
import { verifyAndPersistDeposit } from "@/lib/deposits/verify-and-persist";

/**
 * POST /api/deposits/[id]/verify — trusted server-side deposit verification.
 *
 * Sprint 6G: verification and the verification-status write moved off the
 * browser to this server boundary. The client sends ONLY the deposit id; every
 * value fed to the verifier (tx hash, sender wallet, amount) is loaded from the
 * database, and the treasury/RPC come from SERVER-ONLY env.
 *
 * Trust model:
 * - Auth is resolved from the Supabase session (cookies).
 * - The deposit is loaded with the request-scoped anon client, so RLS already
 *   restricts visibility to the owner or an admin. Callers who can't see the
 *   row get 404.
 * - Verification + persistence run in the shared server helper (Sprint 6H),
 *   which writes with a SERVER-ONLY service client the browser cannot obtain —
 *   so a user can never mark their own deposit "verified".
 * - Approval and the wallet ledger are untouched.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  // RLS returns the row only when the caller owns it or is an admin.
  const { data: deposit, error: loadError } = await supabase
    .from("deposit_requests")
    .select("id, tx_hash, wallet_address, amount")
    .eq("id", id)
    .maybeSingle();

  if (loadError) {
    return NextResponse.json({ error: "load_failed" }, { status: 500 });
  }
  if (!deposit) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const outcome = await verifyAndPersistDeposit(deposit, createSupabaseServiceClient());

  return NextResponse.json(
    {
      status: outcome.status,
      awaitingConfirmations: outcome.awaitingConfirmations,
      persisted: outcome.persisted,
      checks: outcome.checks,
      ...(outcome.reason ? { reason: outcome.reason } : {}),
    },
    { status: 200 }
  );
}
