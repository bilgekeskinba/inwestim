import type { VerificationCheck } from "@/lib/web3/verify-deposit";

/**
 * Shared classification of on-chain verification outcomes (Sprint 6G/6H).
 *
 * Pure functions over the verifier's `checks` array — no viem, no DB. Reused by
 * the single verify route, the batch reverify route, and the admin monitor so
 * the "transient vs substantive" rule lives in exactly one place.
 */

// Failing checks that reflect TIMING or server CONFIG, not a real mismatch.
// When a non-verified result's failures are all in this set, the deposit is
// still settling (freshly mined / confirmations pending / RPC lag) and must NOT
// be marked `failed`. Everything else (wrong sender/treasury/amount/token,
// reverted tx, wrong network) is substantive and is never retried automatically.
export const TRANSIENT_CHECK_LABELS = new Set<string>([
  "Treasury configured",
  "Transaction exists",
  "Minimum confirmations reached",
]);

export type PersistedVerificationStatus = "verified" | "failed" | "not_verified";

/** True when a non-verified result is only transiently failing (retryable). */
export function isAwaitingConfirmations(
  status: "verified" | "failed",
  checks: VerificationCheck[]
): boolean {
  if (status === "verified") return false;
  const failed = checks.filter((c) => !c.passed);
  return failed.length > 0 && failed.every((c) => TRANSIENT_CHECK_LABELS.has(c.label));
}

/** Maps a fresh verifier result to the status we persist on the deposit row. */
export function persistedStatusFor(
  status: "verified" | "failed",
  checks: VerificationCheck[]
): PersistedVerificationStatus {
  if (status === "verified") return "verified";
  return isAwaitingConfirmations(status, checks) ? "not_verified" : "failed";
}

/**
 * Whether a STORED deposit row should be retried by the batch reverify job.
 * Retryable when it is still awaiting verification (not_verified), has a tx
 * hash, is not yet approved/completed, and any prior failures were transient.
 */
export function isRetryableDeposit(row: {
  verification_status: string | null;
  tx_hash: string | null;
  status: string | null;
  verification_details: VerificationCheck[] | null;
}): boolean {
  if ((row.verification_status ?? "not_verified") !== "not_verified") return false;
  if (!row.tx_hash) return false;
  const dstatus = row.status ?? "";
  if (dstatus !== "pending" && dstatus !== "confirming") return false;

  const details = row.verification_details;
  // No prior attempt (or all checks passed) → retry to settle it.
  if (!details || details.length === 0) return true;
  const failed = details.filter((c) => !c.passed);
  if (failed.length === 0) return true;
  // Retry only when every prior failure was transient.
  return failed.every((c) => TRANSIENT_CHECK_LABELS.has(c.label));
}

/** Monitor helper: a stored row that is visibly waiting on confirmations. */
export function isAwaitingConfirmationsRow(row: {
  verification_status: string | null;
  verification_details: VerificationCheck[] | null;
}): boolean {
  if ((row.verification_status ?? "not_verified") !== "not_verified") return false;
  const details = row.verification_details;
  if (!details || details.length === 0) return false;
  return details.some(
    (c) =>
      !c.passed &&
      (c.label === "Minimum confirmations reached" || c.label === "Transaction exists")
  );
}
