"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { AdminInvestment } from "@/lib/admin";
import { formatUSDC } from "@/lib/format/currency";
import { formatDate } from "@/lib/format/date";
import { EmptyState } from "@/components/empty-state";
import { INVESTMENT_STATUS, WALLET_TX_STATUS } from "@/lib/constants/status";
import { WALLET_TX_TYPE, WALLET_DIRECTION, REFERENCE_TYPE } from "@/lib/constants/wallet";

export function InvestmentRequests({ requests }: { requests: AdminInvestment[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  // Recomputes a property's funding_percentage from the sum of its approved
  // investments. Skips silently when total_value is missing/zero so funding is
  // left unchanged. Never throws — funding sync must not fail the approval.
  const syncFundingPercentage = async (
    supabase: ReturnType<typeof getSupabaseBrowserClient>,
    propertyId: string,
    totalValue: number
  ) => {
    if (!propertyId || !(totalValue > 0)) return;

    const { data, error } = await supabase
      .from("investments")
      .select("amount")
      .eq("property_id", propertyId)
      .eq("status", INVESTMENT_STATUS.APPROVED);

    if (error || !data) {
      if (process.env.NODE_ENV !== "production") {
        console.error("[admin] approved-sum query failed", error);
      }
      return;
    }

    const approvedSum = data.reduce((total, row) => total + (Number(row.amount) || 0), 0);
    const funding = Math.min(100, Math.round((approvedSum / totalValue) * 100));

    const { error: updateError } = await supabase
      .from("properties")
      .update({ funding_percentage: funding })
      .eq("id", propertyId);

    if (updateError && process.env.NODE_ENV !== "production") {
      console.error("[admin] funding_percentage update failed", updateError);
    }
  };

  // Records a completed debit for an approved investment. Idempotent: skips if
  // a matching wallet transaction already exists. Soft-fails so it never blocks
  // the approval.
  const createInvestmentDebit = async (
    supabase: ReturnType<typeof getSupabaseBrowserClient>,
    investment: AdminInvestment
  ) => {
    if (!investment.userId) return;

    const { data: existing } = await supabase
      .from("wallet_transactions")
      .select("id")
      .eq("reference_type", REFERENCE_TYPE.INVESTMENT)
      .eq("reference_id", investment.id)
      .eq("type", WALLET_TX_TYPE.INVESTMENT)
      .limit(1);

    if (existing && existing.length > 0) return;

    const { error } = await supabase.from("wallet_transactions").insert({
      user_id: investment.userId,
      type: WALLET_TX_TYPE.INVESTMENT,
      direction: WALLET_DIRECTION.DEBIT,
      amount: Number(investment.amount) || 0,
      status: WALLET_TX_STATUS.COMPLETED,
      reference_type: REFERENCE_TYPE.INVESTMENT,
      reference_id: investment.id,
      description: "Investment approved",
    });

    if (error && process.env.NODE_ENV !== "production") {
      console.error("[admin] investment debit insert failed", error);
    }
  };

  const updateStatus = async (id: string, status: "approved" | "rejected") => {
    setBusyId(id);

    const request = requests.find((r) => r.id === id);
    const supabase = getSupabaseBrowserClient();

    // On approval, stamp approved_at and set eligible_from = approved_at + 1 day
    // (a lot starts earning distributions the day after approval).
    const DAY_MS = 24 * 60 * 60 * 1000;
    const now = new Date();
    const payload =
      status === INVESTMENT_STATUS.APPROVED
        ? {
            status,
            approved_at: now.toISOString(),
            eligible_from: new Date(now.getTime() + DAY_MS).toISOString(),
          }
        : { status };

    const { error } = await supabase.from("investments").update(payload).eq("id", id);

    if (error) {
      setBusyId(null);
      if (process.env.NODE_ENV !== "production") {
        console.error("[admin] investment status update failed", error);
      }
      if (typeof window !== "undefined") {
        window.alert(`Could not update request: ${error.message}`);
      }
      return;
    }

    // Only approvals affect funding / ledger; rejections leave both as-is.
    if (status === INVESTMENT_STATUS.APPROVED && request) {
      await syncFundingPercentage(
        supabase,
        request.propertyId,
        request.propertyTotalValue
      );
      await createInvestmentDebit(supabase, request);
    }

    setBusyId(null);
    router.refresh();
  };

  if (requests.length === 0) {
    return (
      <EmptyState
        title="No pending requests."
        description="New investment requests will appear here for review."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {requests.map((request) => (
        <div
          key={request.id}
          className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-slate-950/60 p-6 lg:flex-row lg:items-center lg:justify-between"
        >
          <div className="min-w-0">
            <h3 className="truncate text-lg font-semibold text-white">
              {request.propertyTitle}
            </h3>
            <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-400">
              <span>
                Investor:{" "}
                <span className="text-slate-200">{request.userEmail ?? "—"}</span>
              </span>
              <span>
                Amount:{" "}
                <span className="text-slate-200">{formatUSDC(request.amount)}</span>
              </span>
              {request.created_at ? (
                <span>
                  Requested:{" "}
                  <span className="text-slate-200">{formatDate(request.created_at)}</span>
                </span>
              ) : null}
            </div>
          </div>
          <div className="flex flex-shrink-0 flex-wrap items-center gap-3">
            <Button
              type="button"
              size="sm"
              onClick={() => updateStatus(request.id, "approved")}
              disabled={busyId === request.id}
              className="bg-emerald-500 text-white hover:bg-emerald-400"
            >
              Approve
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => updateStatus(request.id, "rejected")}
              disabled={busyId === request.id}
            >
              Reject
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
