import type { SupabaseClient } from "@supabase/supabase-js";
import { verifyDepositTransaction, type VerificationCheck } from "@/lib/web3/verify-deposit";
import {
  isAwaitingConfirmations,
  persistedStatusFor,
  type PersistedVerificationStatus,
} from "@/lib/web3/verification-status";

/**
 * Server-only: verify ONE deposit and persist the result. Single source of
 * truth for the verify-and-write step, shared by the single verify route and
 * the batch reverify route so verification logic is never duplicated.
 *
 * - Expected values (tx hash, sender, amount) come from the passed DB row, never
 *   from a client request body.
 * - Treasury + RPC come from SERVER-ONLY env (TREASURY_ADDRESS, POLYGON_RPC_URL).
 * - Persistence uses the passed service client (RLS-bypassing, server-only); the
 *   update is guarded to pending/confirming rows so approved/completed deposits
 *   are never modified.
 */

export type DepositForVerification = {
  id: string;
  tx_hash: string | null;
  wallet_address: string | null;
  amount: number | string | null;
};

export type VerifyOutcome = {
  status: PersistedVerificationStatus;
  awaitingConfirmations: boolean;
  persisted: boolean;
  checks: VerificationCheck[];
  reason?: string;
};

export async function verifyAndPersistDeposit(
  deposit: DepositForVerification,
  service: SupabaseClient | null
): Promise<VerifyOutcome> {
  const txHash = deposit.tx_hash ? String(deposit.tx_hash) : null;
  if (!txHash) {
    return {
      status: "not_verified",
      awaitingConfirmations: false,
      persisted: false,
      checks: [],
      reason: "no_tx_hash",
    };
  }

  // Reuse the existing verifier. Treasury/RPC from server-only env.
  const result = await verifyDepositTransaction({
    txHash,
    walletAddress: deposit.wallet_address ? String(deposit.wallet_address) : null,
    amount: Number(deposit.amount) || 0,
    treasury: process.env.TREASURY_ADDRESS,
    rpcUrl: process.env.POLYGON_RPC_URL || undefined,
  });

  const awaitingConfirmations = isAwaitingConfirmations(result.status, result.checks);
  const status = persistedStatusFor(result.status, result.checks);

  let persisted = false;
  if (service) {
    const { data, error } = await service
      .from("deposit_requests")
      .update({
        verification_status: status,
        verification_details: result.checks,
        verified_at: new Date().toISOString(),
      })
      .eq("id", deposit.id)
      // Never modify approved/completed/failed/cancelled deposits.
      .in("status", ["pending", "confirming"])
      .select("id");
    if (error) {
      // Log only safe operational info: deposit id + error code. Never the raw
      // error (may carry connection details) or any secret/config value.
      if (process.env.NODE_ENV !== "production") {
        console.error(`[verify] persist failed (deposit=${deposit.id}, code=${error.code ?? "db_error"})`);
      }
    } else {
      persisted = (data?.length ?? 0) > 0;
    }
  }

  return { status, awaitingConfirmations, persisted, checks: result.checks };
}
