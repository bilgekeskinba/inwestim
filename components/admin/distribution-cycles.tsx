"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { AdminDistributionCycle } from "@/lib/admin";
import { formatUSDC } from "@/lib/format/currency";
import { formatDate, formatPeriod } from "@/lib/format/date";

const statusBadgeClass: Record<string, string> = {
  draft: "border-slate-400/30 bg-slate-400/10 text-slate-300",
  calculated: "border-sky-400/30 bg-sky-400/10 text-sky-300",
  approved: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  paid: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  cancelled: "border-rose-400/30 bg-rose-400/10 text-rose-300",
};

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
      .eq("status", "paid");

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
      .eq("reference_type", "rental_distribution")
      .in("reference_id", distributionIds);

    const alreadyCredited = new Set((existing ?? []).map((e) => String(e.reference_id)));

    const txRows = paidRows
      .filter((row) => !alreadyCredited.has(String(row.id)))
      .map((row) => ({
        user_id: row.user_id,
        type: "distribution",
        direction: "credit",
        amount: Number(row.amount) || 0,
        status: "completed",
        reference_type: "rental_distribution",
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
      .update({ status: "paid", paid_at: now })
      .eq("distribution_cycle_id", cycleId)
      .eq("status", "pending");

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
      .update({ status: "paid", paid_at: now })
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

    setBusyId(null);
    router.refresh();
  };

  if (cycles.length === 0) {
    return (
      <div className="flex min-h-[160px] flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-slate-950/60 p-10 text-center">
        <p className="text-base font-medium text-slate-300">No distribution cycles yet.</p>
        <p className="mt-3 text-sm text-slate-500">
          Create a cycle above to calculate and record payouts.
        </p>
      </div>
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
              <span
                className={`rounded-full border px-3 py-1 text-xs font-medium capitalize ${
                  statusBadgeClass[cycle.status] ?? statusBadgeClass.draft
                }`}
              >
                {cycle.status}
              </span>
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
            {cycle.status === "calculated" ? (
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
