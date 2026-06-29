"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { AdminInvestment } from "@/lib/admin";

function formatUSDC(value: number): string {
  return `${(Number(value) || 0).toLocaleString("en-US")} USDC`;
}

function formatDate(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

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
      .eq("status", "approved");

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

  const updateStatus = async (id: string, status: "approved" | "rejected") => {
    setBusyId(id);

    const request = requests.find((r) => r.id === id);
    const supabase = getSupabaseBrowserClient();

    // On approval, stamp approved_at and set eligible_from = approved_at + 1 day
    // (a lot starts earning distributions the day after approval).
    const DAY_MS = 24 * 60 * 60 * 1000;
    const now = new Date();
    const payload =
      status === "approved"
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

    // Only approvals affect funding; rejections leave funding_percentage as-is.
    if (status === "approved" && request) {
      await syncFundingPercentage(
        supabase,
        request.propertyId,
        request.propertyTotalValue
      );
    }

    setBusyId(null);
    router.refresh();
  };

  if (requests.length === 0) {
    return (
      <div className="flex min-h-[160px] flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-slate-950/60 p-10 text-center">
        <p className="text-base font-medium text-slate-300">No pending requests.</p>
        <p className="mt-3 text-sm text-slate-500">
          New investment requests will appear here for review.
        </p>
      </div>
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
