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

      {/* Net treasury position (deposit credits − withdrawal debits) */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Net Treasury Position" value={formatUSDC(overview.netTreasuryPosition)} />
        <Stat label="Deposits credited" value={formatUSDC(overview.totalCreditedDeposits)} />
        <Stat label="Withdrawals debited" value={formatUSDC(overview.ledgerWithdrawalDebitTotal)} />
      </div>

      {/* Deposit metrics (database only) */}
      <p className="text-sm font-medium text-slate-300">Deposits</p>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Stat label="Incoming deposits" value={String(overview.pendingCount)} />
        <Stat label="Verified, not approved" value={String(overview.verifiedNotApprovedCount)} />
        <Stat label="Failed deposits" value={String(overview.failedCount)} />
        <Stat label="Completed deposits" value={formatUSDC(overview.completedTotal)} />
        <Stat label="Total credited (ledger)" value={formatUSDC(overview.totalCreditedDeposits)} />
        <Stat label="Completed count" value={String(overview.completedCount)} />
        <Stat label="Credited count" value={String(overview.creditedCount)} />
      </div>

      {/* Reconciliation */}
      {overview.reconciliationStatus === "balanced" ? (
        <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/5 p-5">
          <p className="text-sm font-medium text-emerald-300">Treasury ledger is balanced.</p>
        </div>
      ) : (
        <div className="rounded-3xl border border-rose-400/30 bg-rose-400/5 p-5">
          <p className="text-sm font-semibold text-rose-300">
            Treasury reconciliation mismatch detected.
          </p>
          <div className="mt-3 flex flex-wrap gap-x-8 gap-y-2 text-sm text-slate-400">
            <span>
              Completed deposits:{" "}
              <span className="text-white">{formatUSDC(overview.completedTotal)}</span>
            </span>
            <span>
              Ledger credited:{" "}
              <span className="text-white">{formatUSDC(overview.totalCreditedDeposits)}</span>
            </span>
            <span>
              Difference:{" "}
              <span className="text-rose-300">{formatUSDC(overview.reconciliationDifference)}</span>
            </span>
          </div>
        </div>
      )}

      {/* Completed deposits with no matching ledger credit */}
      {overview.missingLedgerCredits.length > 0 ? (
        <div>
          <p className="mb-3 text-sm font-medium text-rose-300">
            Completed deposits missing a ledger credit
          </p>
          <div className="flex flex-col gap-3">
            {overview.missingLedgerCredits.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-1 rounded-3xl border border-rose-400/20 bg-rose-400/5 p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-base font-semibold text-white">
                    {formatUSDC(item.amount)}
                  </span>
                  <span className="font-mono text-xs text-slate-400">{shorten(item.id)}</span>
                  <span className="text-xs text-slate-400">{item.userEmail ?? "—"}</span>
                </div>
                <span className="text-xs text-slate-500">{formatDate(item.createdAt)}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Recent deposit requests */}
      <div>
        <p className="mb-3 text-sm font-medium text-slate-300">Recent deposits</p>
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
            <p className="text-sm text-slate-400">No deposits yet.</p>
          </div>
        )}
      </div>

      {/* Withdrawal metrics */}
      <p className="pt-2 text-sm font-medium text-slate-300">Withdrawals</p>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Stat label="Outgoing withdrawals" value={String(overview.withdrawalPendingCount)} />
        <Stat label="Approved withdrawals" value={String(overview.withdrawalApprovedCount)} />
        <Stat label="Failed / cancelled" value={String(overview.withdrawalFailedCancelledCount)} />
        <Stat label="Completed withdrawals" value={formatUSDC(overview.completedWithdrawalTotal)} />
        <Stat label="Total debited (ledger)" value={formatUSDC(overview.ledgerWithdrawalDebitTotal)} />
        <Stat label="Completed count" value={String(overview.withdrawalCompletedCount)} />
        <Stat label="Debited count" value={String(overview.withdrawalDebitCount)} />
      </div>

      {/* Withdrawal reconciliation */}
      {overview.withdrawalReconciliationStatus === "balanced" ? (
        <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/5 p-5">
          <p className="text-sm font-medium text-emerald-300">
            Withdrawal ledger is balanced.
          </p>
        </div>
      ) : (
        <div className="rounded-3xl border border-rose-400/30 bg-rose-400/5 p-5">
          <p className="text-sm font-semibold text-rose-300">
            Withdrawal reconciliation mismatch detected.
          </p>
          <div className="mt-3 flex flex-wrap gap-x-8 gap-y-2 text-sm text-slate-400">
            <span>
              Completed withdrawals:{" "}
              <span className="text-white">{formatUSDC(overview.completedWithdrawalTotal)}</span>
            </span>
            <span>
              Ledger debited:{" "}
              <span className="text-white">{formatUSDC(overview.ledgerWithdrawalDebitTotal)}</span>
            </span>
            <span>
              Difference:{" "}
              <span className="text-rose-300">
                {formatUSDC(overview.withdrawalReconciliationDifference)}
              </span>
            </span>
          </div>
        </div>
      )}

      {/* Completed withdrawals with no matching ledger debit */}
      {overview.missingWithdrawalDebits.length > 0 ? (
        <div>
          <p className="mb-3 text-sm font-medium text-rose-300">
            Completed withdrawals missing a ledger debit
          </p>
          <div className="flex flex-col gap-3">
            {overview.missingWithdrawalDebits.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-1 rounded-3xl border border-rose-400/20 bg-rose-400/5 p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-base font-semibold text-white">
                    {formatUSDC(item.amount)}
                  </span>
                  <span className="font-mono text-xs text-slate-400">{shorten(item.id)}</span>
                  <span className="text-xs text-slate-400">{item.userEmail ?? "—"}</span>
                </div>
                <span className="text-xs text-slate-500">{formatDate(item.createdAt)}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Orphan withdrawal debits (reference no longer exists) */}
      {overview.orphanWithdrawalDebits.length > 0 ? (
        <div>
          <p className="mb-3 text-sm font-medium text-rose-300">
            Orphan withdrawal debits (no matching request)
          </p>
          <div className="flex flex-col gap-3">
            {overview.orphanWithdrawalDebits.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-1 rounded-3xl border border-rose-400/20 bg-rose-400/5 p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-base font-semibold text-white">
                    {formatUSDC(item.amount)}
                  </span>
                  <span className="font-mono text-xs text-slate-400">
                    ref: {item.referenceId ? shorten(item.referenceId) : "—"}
                  </span>
                </div>
                <span className="text-xs text-slate-500">{formatDate(item.createdAt)}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
