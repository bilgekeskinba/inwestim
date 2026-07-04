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

  if (deposits.length === 0) {
    return (
      <EmptyState
        title="No pending deposits."
        description="New deposit requests will appear here for review."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {deposits.map((deposit) => (
        <div
          key={deposit.id}
          className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-slate-950/60 p-6 lg:flex-row lg:items-center lg:justify-between"
        >
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-lg font-semibold text-white">
                {formatUSDC(deposit.amount)}
              </span>
              <span className="text-xs text-slate-400">
                {deposit.asset} · {deposit.chain ?? "—"}
              </span>
              <StatusBadge status={deposit.status} />
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
          </div>
          <div className="flex flex-shrink-0 flex-wrap items-center gap-3">
            <Button
              type="button"
              size="sm"
              onClick={() => decide(deposit, true)}
              disabled={busyId === deposit.id}
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
      ))}
    </div>
  );
}
