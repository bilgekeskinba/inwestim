import { formatUSDC } from "@/lib/format/currency";
import { formatDate } from "@/lib/format/date";
import { StatusBadge } from "@/components/status-badge";
import {
  ACTIVE_NETWORK,
  explorerAddressUrl,
  explorerTxUrl,
} from "@/lib/web3/networks";
import { TREASURY_ADDRESS } from "@/lib/env";
import type { TreasuryOverview } from "@/lib/admin";

function shorten(value: string): string {
  return value.length > 14 ? `${value.slice(0, 8)}…${value.slice(-6)}` : value;
}

const verificationLabel: Record<string, string> = {
  verified: "Verified",
  failed: "Failed",
  not_verified: "Not verified",
};

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-6">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
    </div>
  );
}

export function TreasuryDashboard({ overview }: { overview: TreasuryOverview }) {
  const treasury = TREASURY_ADDRESS ?? null;

  return (
    <div className="space-y-6">
      {/* Treasury identity */}
      <div className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-slate-950/60 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-slate-400">Treasury address · {ACTIVE_NETWORK.name}</p>
          {treasury ? (
            <a
              href={explorerAddressUrl(treasury)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block font-mono text-base text-emerald-300 underline-offset-2 hover:underline"
            >
              {shorten(treasury)}
            </a>
          ) : (
            <p className="mt-1 text-base font-medium text-amber-300">
              Treasury address is not configured.
            </p>
          )}
        </div>
      </div>

      {/* Operational metrics (database only) */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Stat label="Pending deposits" value={String(overview.pendingCount)} />
        <Stat label="Verified, not approved" value={String(overview.verifiedNotApprovedCount)} />
        <Stat label="Failed deposits" value={String(overview.failedCount)} />
        <Stat label="Completed deposits" value={formatUSDC(overview.completedTotal)} />
        <Stat label="Total credited (ledger)" value={formatUSDC(overview.totalCreditedDeposits)} />
        <Stat label="Completed count" value={String(overview.completedCount)} />
      </div>

      {/* Recent deposit requests */}
      <div>
        <p className="mb-3 text-sm font-medium text-slate-300">Recent deposit requests</p>
        {overview.recentDeposits.length > 0 ? (
          <div className="flex flex-col gap-3">
            {overview.recentDeposits.map((deposit) => (
              <div
                key={deposit.id}
                className="flex flex-col gap-2 rounded-3xl border border-white/10 bg-slate-950/60 p-5 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-base font-semibold text-white">
                      {formatUSDC(deposit.amount)}
                    </span>
                    <StatusBadge status={deposit.status} />
                    <span className="text-xs text-slate-400">
                      {verificationLabel[deposit.verificationStatus] ?? "Not verified"}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-400">
                    <span>
                      Investor: <span className="text-slate-200">{deposit.userEmail ?? "—"}</span>
                    </span>
                    {deposit.txHash ? (
                      <a
                        href={explorerTxUrl(deposit.txHash)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-emerald-300 underline-offset-2 hover:underline"
                      >
                        {shorten(deposit.txHash)}
                      </a>
                    ) : null}
                  </div>
                </div>
                <span className="text-xs text-slate-500">{formatDate(deposit.createdAt)}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex min-h-[120px] flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-slate-950/60 p-8 text-center">
            <p className="text-sm text-slate-400">No deposit requests yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
