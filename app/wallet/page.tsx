import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { CardContent } from "@/components/ui/card";
import { AppShell } from "@/components/app-shell";
import { AppSectionCard } from "@/components/app-section-card";
import { AppSectionHeader } from "@/components/app-section-header";
import { Web3Provider } from "@/components/web3-provider";
import { ExternalWallet } from "@/components/external-wallet";
import { DepositRequestForm } from "@/components/deposit-request-form";
import { BlockchainDepositForm } from "@/components/blockchain-deposit-form";
import { formatUSDC } from "@/lib/format/currency";
import { formatDate } from "@/lib/format/date";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import {
  INVESTMENT_STATUS,
  DISTRIBUTION_STATUS,
  WALLET_TX_STATUS,
} from "@/lib/constants/status";
import { WALLET_DIRECTION } from "@/lib/constants/wallet";
import { WALLETCONNECT_ENABLED } from "@/lib/env";
import { DepositTimeline } from "@/components/deposit-timeline";
import { WithdrawalRequestForm } from "@/components/withdrawal-request-form";
import { WithdrawalTimeline } from "@/components/withdrawal-timeline";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const metadata: Metadata = {
  title: "Wallet | Inwestim",
  description: "Your Inwestim account balance and connected wallet.",
};

function sumAmounts(rows: { amount: number | string | null }[] | null): number {
  if (!rows) return 0;
  return rows.reduce((total, row) => total + (Number(row.amount) || 0), 0);
}

function formatSignedUSDC(amount: number, direction: string): string {
  const sign = direction === WALLET_DIRECTION.DEBIT ? "-" : "+";
  return `${sign}${formatUSDC(Number(amount) || 0)}`;
}

function BalanceCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-6">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
    </div>
  );
}

export default async function WalletPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const [approved, paid, ledger, depositRows, withdrawalRows] = await Promise.all([
    supabase
      .from("investments")
      .select("amount")
      .eq("user_id", user.id)
      .eq("status", INVESTMENT_STATUS.APPROVED),
    supabase
      .from("rental_distributions")
      .select("amount")
      .eq("user_id", user.id)
      .eq("status", DISTRIBUTION_STATUS.PAID),
    // Ledger-based balances + history: no stored balance, derived from txns.
    supabase
      .from("wallet_transactions")
      .select("id, type, direction, amount, status, description, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("deposit_requests")
      .select("id, amount, asset, chain, status, created_at, tx_hash, verification_status")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("withdrawal_requests")
      .select("id, amount, asset, chain, status, created_at, wallet_address")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const totalInvested = approved.error ? 0 : sumAmounts(approved.data);
  const lifetimeDistributions = paid.error ? 0 : sumAmounts(paid.data);

  const transactions = ledger.error ? [] : ledger.data ?? [];
  const deposits = depositRows.error ? [] : depositRows.data ?? [];
  const withdrawals = withdrawalRows.error ? [] : withdrawalRows.data ?? [];

  // Available Balance = sum(completed credits) − sum(completed debits).
  // Pending Balance = the same over pending transactions.
  let availableBalance = 0;
  let pendingBalance = 0;
  for (const tx of transactions) {
    const signed = (Number(tx.amount) || 0) * (tx.direction === WALLET_DIRECTION.DEBIT ? -1 : 1);
    if (tx.status === WALLET_TX_STATUS.COMPLETED) availableBalance += signed;
    else if (tx.status === WALLET_TX_STATUS.PENDING) pendingBalance += signed;
  }

  // WalletConnect is gated until deposits exist, to avoid confusing external
  // wallet balance with the separate Inwestim platform balance.
  const walletConnectEnabled = WALLETCONNECT_ENABLED;

  return (
    <AppShell>
      <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
        <div className="relative mx-auto max-w-7xl px-6 py-10 lg:px-8">
          <div className="mb-8">
            <p className="text-sm uppercase tracking-[0.24em] text-emerald-400/80">Wallet</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Your Inwestim wallet
            </h1>
            <p className="mt-2 max-w-2xl text-base text-slate-300">
              Your platform balance is separate from any external wallet you connect.
            </p>
          </div>

          {/* Inwestim Account */}
          <AppSectionCard className="mb-8">
            <AppSectionHeader
              title="Inwestim Account"
              description="Your platform balance used for investments and distributions."
            />
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <BalanceCard label="Available Balance" value={formatUSDC(availableBalance)} />
                <BalanceCard label="Pending Balance" value={formatUSDC(pendingBalance)} />
                <BalanceCard label="Total Invested" value={formatUSDC(totalInvested)} />
                <BalanceCard
                  label="Lifetime Distributions"
                  value={formatUSDC(lifetimeDistributions)}
                />
              </div>
            </CardContent>
          </AppSectionCard>

          {/* External Wallet (read-only identity via WalletConnect, feature-flagged) */}
          <AppSectionCard className="mb-8">
            <AppSectionHeader
              title="External Wallet"
              description={
                walletConnectEnabled
                  ? "Connect a Polygon wallet as your identity. Read-only — no funds move."
                  : "Link an external wallet to your account."
              }
            />
            <CardContent>
              {walletConnectEnabled ? (
                <Web3Provider>
                  <ExternalWallet userId={user.id} />
                </Web3Provider>
              ) : (
                <div className="flex flex-col items-start gap-2 rounded-3xl border border-white/10 bg-slate-950/60 p-6">
                  <p className="text-lg font-medium text-white">Wallet connection coming soon</p>
                  <p className="text-sm text-slate-400">
                    Deposits and withdrawals will be available in a later sprint.
                  </p>
                </div>
              )}
            </CardContent>
          </AppSectionCard>

          {/* Deposits */}
          <AppSectionCard className="mb-8">
            <AppSectionHeader
              title="Deposit USDC"
              description="Deposit USDC; an admin confirms it before it credits your balance."
            />
            <CardContent>
              {walletConnectEnabled ? (
                <Web3Provider>
                  <BlockchainDepositForm userId={user.id} />
                </Web3Provider>
              ) : (
                <DepositRequestForm userId={user.id} />
              )}

              <div className="mt-8">
                <p className="mb-3 text-sm font-medium text-slate-300">Deposit History</p>
                {deposits.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {deposits.map((deposit) => (
                      <DepositTimeline
                        key={String(deposit.id)}
                        amount={Number(deposit.amount) || 0}
                        asset={String(deposit.asset)}
                        chain={String(deposit.chain)}
                        status={String(deposit.status)}
                        createdAt={(deposit.created_at as string | null) ?? null}
                        txHash={(deposit.tx_hash as string | null) ?? null}
                        verificationStatus={
                          (deposit.verification_status as string | null) ?? "not_verified"
                        }
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex min-h-[120px] flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-slate-950/60 p-8 text-center">
                    <p className="text-sm text-slate-400">No deposits yet.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </AppSectionCard>

          {/* Withdrawals */}
          <AppSectionCard className="mb-8">
            <AppSectionHeader
              title="Withdraw USDC"
              description="Withdraw USDC; an admin reviews and pays it out before it debits your balance."
            />
            <CardContent>
              <WithdrawalRequestForm userId={user.id} availableBalance={availableBalance} />

              <div className="mt-8">
                <p className="mb-3 text-sm font-medium text-slate-300">Withdrawal History</p>
                {withdrawals.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {withdrawals.map((withdrawal) => (
                      <WithdrawalTimeline
                        key={String(withdrawal.id)}
                        amount={Number(withdrawal.amount) || 0}
                        asset={String(withdrawal.asset)}
                        chain={String(withdrawal.chain)}
                        status={String(withdrawal.status)}
                        createdAt={(withdrawal.created_at as string | null) ?? null}
                        walletAddress={(withdrawal.wallet_address as string | null) ?? null}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex min-h-[120px] flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-slate-950/60 p-8 text-center">
                    <p className="text-sm text-slate-400">No withdrawals yet.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </AppSectionCard>

          {/* Transaction History */}
          <AppSectionCard>
            <AppSectionHeader
              title="Transaction History"
              description="Deposits, withdrawals, and transfers."
            />
            <CardContent>
              {transactions.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {transactions.map((tx) => (
                    <div
                      key={String(tx.id)}
                      className="flex flex-col gap-2 rounded-3xl border border-white/10 bg-slate-950/60 p-5 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="text-base font-medium capitalize text-white">
                            {String(tx.type)}
                          </span>
                          <StatusBadge status={String(tx.status)} />
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          {formatDate((tx.created_at as string | null) ?? null)}
                          {tx.description ? ` · ${String(tx.description)}` : ""}
                        </p>
                      </div>
                      <span
                        className={`text-base font-semibold ${
                          tx.direction === WALLET_DIRECTION.DEBIT ? "text-rose-300" : "text-emerald-300"
                        }`}
                      >
                        {formatSignedUSDC(Number(tx.amount) || 0, String(tx.direction))}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No transactions yet."
                  description="Wallet transactions will appear here once available."
                />
              )}
            </CardContent>
          </AppSectionCard>
        </div>
      </main>
    </AppShell>
  );
}
