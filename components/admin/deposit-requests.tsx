"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { AdminDeposit } from "@/lib/admin";
import { formatUSDC } from "@/lib/format/currency";
import { formatDate } from "@/lib/format/date";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { DEPOSIT_STATUS, WALLET_TX_STATUS } from "@/lib/constants/status";
import { WALLET_TX_TYPE, WALLET_DIRECTION, REFERENCE_TYPE } from "@/lib/constants/wallet";
import { explorerTxUrl } from "@/lib/web3/networks";
import { REQUIRE_DEPOSIT_VERIFICATION } from "@/lib/env";

function shortenHash(hash: string): string {
  return hash.length > 18 ? `${hash.slice(0, 10)}…${hash.slice(-8)}` : hash;
}

const verificationBadgeClass: Record<string, string> = {
  verified: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  failed: "border-rose-400/30 bg-rose-400/10 text-rose-300",
  not_verified: "border-slate-400/30 bg-slate-400/10 text-slate-300",
};

const verificationLabel: Record<string, string> = {
  verified: "Verified",
  failed: "Failed verification",
  not_verified: "Not verified",
};

export function DepositRequests({ deposits }: { deposits: AdminDeposit[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  // Idempotent: skip if a wallet transaction already exists for this deposit.
  const createDepositCredit = async (
    supabase: ReturnType<typeof getSupabaseBrowserClient>,
    deposit: AdminDeposit
  ) => {
    if (!deposit.userId) return;

    const { data: existing } = await supabase
      .from("wallet_transactions")
      .select("id")
      .eq("reference_type", REFERENCE_TYPE.DEPOSIT_REQUEST)
      .eq("reference_id", deposit.id)
      .eq("type", WALLET_TX_TYPE.DEPOSIT)
      .limit(1);

    if (existing && existing.length > 0) return;

    const { error } = await supabase.from("wallet_transactions").insert({
      user_id: deposit.userId,
      type: WALLET_TX_TYPE.DEPOSIT,
      direction: WALLET_DIRECTION.CREDIT,
      amount: deposit.amount,
      status: WALLET_TX_STATUS.COMPLETED,
      reference_type: REFERENCE_TYPE.DEPOSIT_REQUEST,
      reference_id: deposit.id,
      description: "Deposit approved",
    });

    if (error && process.env.NODE_ENV !== "production") {
      console.error("[admin] deposit credit insert failed", error);
    }
  };

  const decide = async (deposit: AdminDeposit, approve: boolean) => {
    setBusyId(deposit.id);

    const supabase = getSupabaseBrowserClient();
    const now = new Date().toISOString();

    const update = approve
      ? { status: DEPOSIT_STATUS.COMPLETED, confirmed_at: now }
      : { status: DEPOSIT_STATUS.FAILED };

    const { error } = await supabase
      .from("deposit_requests")
      .update(update)
      .eq("id", deposit.id)
      .eq("status", DEPOSIT_STATUS.PENDING);

    if (error) {
      setBusyId(null);
      if (process.env.NODE_ENV !== "production") {
        console.error("[admin] deposit decision failed", error);
      }
      if (typeof window !== "undefined") {
        window.alert(`Could not update deposit: ${error.message}`);
      }
      return;
    }

    // Only approvals credit the ledger; rejections create nothing.
    if (approve) {
      await createDepositCredit(supabase, deposit);
    }

    setBusyId(null);
    router.refresh();
  };

  // Manual fallback — delegates to the SAME trusted server endpoint the native
  // deposit flow uses (Sprint 6G). The admin browser no longer runs the verifier
  // or writes verification_status directly; the server computes and persists it.
  const verify = async (deposit: AdminDeposit) => {
    if (!deposit.txHash) return;
    setBusyId(deposit.id);

    try {
      const res = await fetch(`/api/deposits/${deposit.id}/verify`, { method: "POST" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        if (typeof window !== "undefined") {
          window.alert(`Could not verify transaction: ${body.error ?? res.status}`);
        }
      }
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.error("[admin] verification request failed", err);
      }
      if (typeof window !== "undefined") {
        window.alert("Could not verify the transaction. Please try again.");
      }
    } finally {
      setBusyId(null);
      router.refresh();
    }
  };

  if (deposits.length === 0) {
    return (
      <EmptyState
        title="No incoming deposits."
        description="New deposits will appear here for review."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {deposits.map((deposit) => (
        <div
          key={deposit.id}
          className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-slate-950/60 p-6"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-lg font-semibold text-white">
                  {formatUSDC(deposit.amount)}
                </span>
                <span className="text-xs text-slate-400">
                  {deposit.asset} · {deposit.chain ?? "—"}
                </span>
                <StatusBadge status={deposit.status} />
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-medium ${
                    verificationBadgeClass[deposit.verificationStatus] ??
                    verificationBadgeClass.not_verified
                  }`}
                >
                  {verificationLabel[deposit.verificationStatus] ?? "Not verified"}
                </span>
                {deposit.isDuplicate ? (
                  <span className="rounded-full border border-rose-400/30 bg-rose-400/10 px-3 py-1 text-xs font-medium text-rose-300">
                    Duplicate tx
                  </span>
                ) : null}
              </div>
              <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-400">
                <span>
                  Investor: <span className="text-slate-200">{deposit.userEmail ?? "—"}</span>
                </span>
                <span className="break-all">
                  Wallet: <span className="text-slate-200">{deposit.walletAddress ?? "—"}</span>
                </span>
                <span>
                  Requested: <span className="text-slate-200">{formatDate(deposit.createdAt)}</span>
                </span>
              </div>
              {deposit.txHash ? (
                <p className="mt-1 text-xs text-slate-500">
                  Tx:{" "}
                  <a
                    href={explorerTxUrl(deposit.txHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-emerald-300 underline-offset-2 hover:underline"
                  >
                    {shortenHash(deposit.txHash)}
                  </a>
                </p>
              ) : null}
            </div>
            <div className="flex flex-shrink-0 flex-wrap items-center gap-3">
              {/* Verification runs automatically when the deposit is created.
                  Once it has completed (verified/failed) the manual button is
                  hidden and the outcome is shown. The button reappears only when
                  the deposit is still not_verified (e.g. an RPC timeout) as a
                  manual fallback. */}
              {deposit.txHash && deposit.verificationStatus === "not_verified" ? (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => verify(deposit)}
                  disabled={busyId === deposit.id}
                >
                  Verify Transaction
                </Button>
              ) : deposit.verificationStatus === "verified" ? (
                <span className="text-xs font-medium text-emerald-300">
                  Verified automatically
                </span>
              ) : deposit.verificationStatus === "failed" ? (
                <span className="text-xs font-medium text-rose-300">
                  Automatic verification failed
                </span>
              ) : null}
              <Button
                type="button"
                size="sm"
                onClick={() => decide(deposit, true)}
                disabled={
                  busyId === deposit.id ||
                  (REQUIRE_DEPOSIT_VERIFICATION &&
                    deposit.verificationStatus !== "verified")
                }
                className="bg-emerald-500 text-white hover:bg-emerald-400"
              >
                Approve
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => decide(deposit, false)}
                disabled={busyId === deposit.id}
              >
                Reject
              </Button>
            </div>
          </div>

          {deposit.isDuplicate ? (
            <p className="text-xs font-medium text-rose-300">
              Duplicate tx hash — this transaction is used by more than one deposit.
            </p>
          ) : null}

          {deposit.verificationStatus !== "verified" ? (
            <p className="text-xs font-medium text-amber-300">
              {REQUIRE_DEPOSIT_VERIFICATION
                ? "Verification is required before approval."
                : "This deposit has not been verified on-chain yet."}
            </p>
          ) : null}

          {deposit.verificationDetails && deposit.verificationDetails.length > 0 ? (
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <div className="flex flex-col gap-1.5">
                {deposit.verificationDetails.map((check, index) => (
                  <div
                    key={`${deposit.id}-check-${index}`}
                    className="flex items-start justify-between gap-3 text-xs"
                  >
                    <span className={check.passed ? "text-emerald-300" : "text-rose-300"}>
                      {check.passed ? "✓" : "✗"} {check.label}
                    </span>
                    {check.detail ? (
                      <span className="break-all text-right text-slate-500">{check.detail}</span>
                    ) : null}
                  </div>
                ))}
              </div>
              {deposit.verifiedAt ? (
                <p className="mt-3 text-[11px] text-slate-500">
                  Verified {formatDate(deposit.verifiedAt)}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
