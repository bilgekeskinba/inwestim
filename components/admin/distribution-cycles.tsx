"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { AdminDistributionCycle } from "@/lib/admin";
import { formatUSDC } from "@/lib/format/currency";
import { formatDate, formatPeriod } from "@/lib/format/date";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { DISTRIBUTION_STATUS, CYCLE_STATUS, WALLET_TX_STATUS } from "@/lib/constants/status";
import { WALLET_TX_TYPE, WALLET_DIRECTION, REFERENCE_TYPE } from "@/lib/constants/wallet";
import { emitNotification } from "@/lib/notifications-client";

export function DistributionCycles({ cycles }: { cycles: AdminDistributionCycle[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  // Creates a completed credit wallet transaction for every paid distribution
  // in a cycle. Idempotent: skips distributions that already have a matching
  // wallet transaction. Soft-fails (logs in dev) so the payout confirmation is
  // never blocked by the ledger step.
  const createDistributionCredits = async (
    supabase: ReturnType<typeof getSupabaseBrowserClient>,
    cycleId: string
  ) => {
    const { data: paidRows, error: paidError } = await supabase
      .from("rental_distributions")
      .select("id, user_id, amount")
      .eq("distribution_cycle_id", cycleId)
      .eq("status", DISTRIBUTION_STATUS.PAID);

    if (paidError || !paidRows || paidRows.length === 0) {
      if (paidError && process.env.NODE_ENV !== "production") {
        console.error("[admin] paid distributions query failed", paidError);
      }
      return;
    }

    const distributionIds = paidRows.map((row) => String(row.id));

    // Skip distributions already credited (idempotency).
    const { data: existing } = await supabase
      .from("wallet_transactions")
      .select("reference_id")
      .eq("reference_type", REFERENCE_TYPE.RENTAL_DISTRIBUTION)
      .in("reference_id", distributionIds);

    const alreadyCredited = new Set((existing ?? []).map((e) => String(e.reference_id)));

    const txRows = paidRows
      .filter((row) => !alreadyCredited.has(String(row.id)))
      .map((row) => ({
        user_id: row.user_id,
        type: WALLET_TX_TYPE.DISTRIBUTION,
        direction: WALLET_DIRECTION.CREDIT,
        amount: Number(row.amount) || 0,
        status: WALLET_TX_STATUS.COMPLETED,
        reference_type: REFERENCE_TYPE.RENTAL_DISTRIBUTION,
        reference_id: row.id,
        description: "Rental distribution payout",
      }));

    if (txRows.length === 0) return;

    const { error: insertError } = await supabase
      .from("wallet_transactions")
      .insert(txRows);

    if (insertError && process.env.NODE_ENV !== "production") {
      console.error("[admin] wallet credit insert failed", insertError);
    }
  };

  const markAsPaid = async (cycleId: string) => {
    setBusyId(cycleId);

    const supabase = getSupabaseBrowserClient();
    const now = new Date().toISOString();

    // Mark the pending payouts paid first, then the cycle. (No transaction is
    // available without an RPC/trigger; re-clicking is safe because the payout
    // update is scoped to status = 'pending'.)
    const { error: payoutError } = await supabase
      .from("rental_distributions")
      .update({ status: DISTRIBUTION_STATUS.PAID, paid_at: now })
      .eq("distribution_cycle_id", cycleId)
      .eq("status", DISTRIBUTION_STATUS.PENDING);

    if (payoutError) {
      setBusyId(null);
      if (process.env.NODE_ENV !== "production") {
        console.error("[admin] payout mark-paid failed", payoutError);
      }
      if (typeof window !== "undefined") {
        window.alert(`Could not mark payouts paid: ${payoutError.message}`);
      }
      return;
    }

    const { error: cycleError } = await supabase
      .from("distribution_cycles")
      .update({ status: CYCLE_STATUS.PAID, paid_at: now })
      .eq("id", cycleId);

    if (cycleError) {
      setBusyId(null);
      if (process.env.NODE_ENV !== "production") {
        console.error("[admin] cycle mark-paid failed", cycleError);
      }
      if (typeof window !== "undefined") {
        window.alert(`Payouts were marked paid, but the cycle status failed: ${cycleError.message}`);
      }
      return;
    }

    // Ledger: record a completed credit per paid distribution. Best-effort and
    // idempotent (skips distributions that already have a wallet transaction),
    // so it won't block the payment confirmation if it fails.
    await createDistributionCredits(supabase, cycleId);

    // Best-effort in-app notifications: the server fans out one notification per
    // paid payout in this cycle (idempotent, keyed per rental_distribution).
    await emitNotification("distribution_paid", cycleId);

    setBusyId(null);
    router.refresh();
  };

  if (cycles.length === 0) {
    return (
      <EmptyState
        title="No distribution cycles yet."
        description="Create a cycle above to calculate and record payouts."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {cycles.map((cycle) => (
        <div
          key={cycle.id}
          className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-slate-950/60 p-6 lg:flex-row lg:items-center lg:justify-between"
        >
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="truncate text-lg font-semibold text-white">{cycle.propertyTitle}</h3>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium capitalize text-slate-300">
                {cycle.distributionType}
              </span>
              <StatusBadge status={cycle.status} />
            </div>
            <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-400">
              <span>
                Period:{" "}
                <span className="text-slate-200">
                  {formatPeriod(cycle.periodStart, cycle.periodEnd)}
                </span>
              </span>
              <span>
                Net:{" "}
                <span className="text-slate-200">{formatUSDC(cycle.netDistribution)}</span>
              </span>
              <span>
                Created:{" "}
                <span className="text-slate-200">{formatDate(cycle.createdAt)}</span>
              </span>
            </div>
          </div>
          <div className="flex flex-shrink-0 items-center gap-3">
            {cycle.status === CYCLE_STATUS.CALCULATED ? (
              <Button
                type="button"
                size="sm"
                onClick={() => markAsPaid(cycle.id)}
                disabled={busyId === cycle.id}
                className="bg-emerald-500 text-white hover:bg-emerald-400"
              >
                {busyId === cycle.id ? "Processing…" : "Mark as Paid"}
              </Button>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
