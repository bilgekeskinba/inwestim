"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { AdminWithdrawal } from "@/lib/admin";
import { formatUSDC } from "@/lib/format/currency";
import { formatDate } from "@/lib/format/date";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { WITHDRAWAL_STATUS, WALLET_TX_STATUS } from "@/lib/constants/status";
import { WALLET_TX_TYPE, WALLET_DIRECTION, REFERENCE_TYPE } from "@/lib/constants/wallet";

export function WithdrawalRequests({ withdrawals }: { withdrawals: AdminWithdrawal[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  const notify = (scope: string, message: string) => {
    if (process.env.NODE_ENV !== "production") console.error(`[admin] ${scope}`, message);
    if (typeof window !== "undefined") window.alert(message);
  };

  // Idempotent: skip if a ledger debit already exists for this withdrawal.
  const createWithdrawalDebit = async (
    supabase: ReturnType<typeof getSupabaseBrowserClient>,
    withdrawal: AdminWithdrawal
  ) => {
    if (!withdrawal.userId) return;

    const { data: existing } = await supabase
      .from("wallet_transactions")
      .select("id")
      .eq("reference_type", REFERENCE_TYPE.WITHDRAWAL_REQUEST)
      .eq("reference_id", withdrawal.id)
      .eq("type", WALLET_TX_TYPE.WITHDRAWAL)
      .limit(1);

    if (existing && existing.length > 0) return;

    const { error } = await supabase.from("wallet_transactions").insert({
      user_id: withdrawal.userId,
      type: WALLET_TX_TYPE.WITHDRAWAL,
      direction: WALLET_DIRECTION.DEBIT,
      amount: withdrawal.amount,
      status: WALLET_TX_STATUS.COMPLETED,
      reference_type: REFERENCE_TYPE.WITHDRAWAL_REQUEST,
      reference_id: withdrawal.id,
      description: "Withdrawal completed",
    });

    if (error && process.env.NODE_ENV !== "production") {
      console.error("[admin] withdrawal debit insert failed", error);
    }
  };

  // Mark as Completed with a safety re-check of the user's available balance.
  const markCompleted = async (withdrawal: AdminWithdrawal) => {
    setBusyId(withdrawal.id);
    const supabase = getSupabaseBrowserClient();

    // Recompute available balance from the ledger (completed credits − debits).
    const { data: txns, error: balError } = await supabase
      .from("wallet_transactions")
      .select("amount, direction, status")
      .eq("user_id", withdrawal.userId);

    if (balError) {
      setBusyId(null);
      notify("balance check failed", `Could not verify balance: ${balError.message}`);
      return;
    }

    let available = 0;
    for (const tx of txns ?? []) {
      if (tx.status !== WALLET_TX_STATUS.COMPLETED) continue;
      available += (Number(tx.amount) || 0) * (tx.direction === WALLET_DIRECTION.DEBIT ? -1 : 1);
    }

    if (withdrawal.amount > available) {
      setBusyId(null);
      notify(
        "insufficient balance",
        "Insufficient available balance at completion time."
      );
      return;
    }

    const { error } = await supabase
      .from("withdrawal_requests")
      .update({
        status: WITHDRAWAL_STATUS.COMPLETED,
        completed_at: new Date().toISOString(),
      })
      .eq("id", withdrawal.id)
      .eq("status", WITHDRAWAL_STATUS.APPROVED);

    if (error) {
      setBusyId(null);
      notify("withdrawal completion failed", `Could not complete withdrawal: ${error.message}`);
      return;
    }

    await createWithdrawalDebit(supabase, withdrawal);

    setBusyId(null);
    router.refresh();
  };

  const setStatus = async (
    withdrawal: AdminWithdrawal,
    next: string,
    fromStatus: string,
    extra: Record<string, unknown> = {}
  ) => {
    setBusyId(withdrawal.id);
    const supabase = getSupabaseBrowserClient();

    const { error } = await supabase
      .from("withdrawal_requests")
      .update({ status: next, ...extra })
      .eq("id", withdrawal.id)
      .eq("status", fromStatus);

    if (error) {
      setBusyId(null);
      notify("withdrawal status update failed", `Could not update withdrawal: ${error.message}`);
      return;
    }

    // Ledger debit is created ONLY on completion.
    if (next === WITHDRAWAL_STATUS.COMPLETED) {
      await createWithdrawalDebit(supabase, withdrawal);
    }

    setBusyId(null);
    router.refresh();
  };

  const now = () => new Date().toISOString();

  if (withdrawals.length === 0) {
    return (
      <EmptyState
        title="No outgoing withdrawals."
        description="New withdrawals will appear here for review."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {withdrawals.map((withdrawal) => {
        const isPending = withdrawal.status === WITHDRAWAL_STATUS.PENDING;
        const isApproved = withdrawal.status === WITHDRAWAL_STATUS.APPROVED;
        const busy = busyId === withdrawal.id;

        return (
          <div
            key={withdrawal.id}
            className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-slate-950/60 p-6 lg:flex-row lg:items-center lg:justify-between"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-lg font-semibold text-white">
                  {formatUSDC(withdrawal.amount)}
                </span>
                <span className="text-xs text-slate-400">
                  {withdrawal.asset} · {withdrawal.chain ?? "—"}
                </span>
                <StatusBadge status={withdrawal.status} />
              </div>
              <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-400">
                <span>
                  Investor: <span className="text-slate-200">{withdrawal.userEmail ?? "—"}</span>
                </span>
                <span className="break-all">
                  Destination:{" "}
                  <span className="text-slate-200">{withdrawal.walletAddress ?? "—"}</span>
                </span>
                <span>
                  Requested:{" "}
                  <span className="text-slate-200">{formatDate(withdrawal.createdAt)}</span>
                </span>
              </div>
            </div>
            <div className="flex flex-shrink-0 flex-wrap items-center gap-3">
              {isPending ? (
                <>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() =>
                      setStatus(withdrawal, WITHDRAWAL_STATUS.APPROVED, WITHDRAWAL_STATUS.PENDING, {
                        approved_at: now(),
                      })
                    }
                    disabled={busy}
                    className="bg-emerald-500 text-white hover:bg-emerald-400"
                  >
                    Approve
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() =>
                      setStatus(withdrawal, WITHDRAWAL_STATUS.FAILED, WITHDRAWAL_STATUS.PENDING)
                    }
                    disabled={busy}
                  >
                    Reject
                  </Button>
                </>
              ) : null}
              {isApproved ? (
                <>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => markCompleted(withdrawal)}
                    disabled={busy}
                    className="bg-emerald-500 text-white hover:bg-emerald-400"
                  >
                    Complete Payout
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      setStatus(withdrawal, WITHDRAWAL_STATUS.CANCELLED, WITHDRAWAL_STATUS.APPROVED)
                    }
                    disabled={busy}
                  >
                    Cancel
                  </Button>
                </>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
