import { redirect } from "next/navigation";
import type { Metadata } from "next";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { AppShell } from "@/components/app-shell";
import { Web3Provider } from "@/components/web3-provider";
import { ExternalWallet } from "@/components/external-wallet";
import { DepositRequestForm } from "@/components/deposit-request-form";
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

const depositStatusClass: Record<string, string> = {
  pending: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  confirming: "border-sky-400/30 bg-sky-400/10 text-sky-300",
  completed: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  failed: "border-rose-400/30 bg-rose-400/10 text-rose-300",
  cancelled: "border-slate-400/30 bg-slate-400/10 text-slate-300",
};

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

  const [approved, paid, ledger, depositRows] = await Promise.all([
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
      .select("id, amount, asset, chain, status, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const totalInvested = approved.error ? 0 : sumAmounts(approved.data);
  const lifetimeDistributions = paid.error ? 0 : sumAmounts(paid.data);

  const transactions = ledger.error ? [] : ledger.data ?? [];
  const deposits = depositRows.error ? [] : depositRows.data ?? [];

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
  const walletConnectEnabled =
    process.env.NEXT_PUBLIC_ENABLE_WALLETCONNECT === "true";

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
          <Card className="mb-8 rounded-3xl border-white/10 bg-slate-900/90">
            <CardHeader>
              <div>
                <CardTitle>Inwestim Account</CardTitle>
                <CardDescription>
                  Your platform balance used for investments and distributions.
                </CardDescription>
              </div>
            </CardHeader>
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
          </Card>

          {/* External Wallet (read-only identity via WalletConnect, feature-flagged) */}
          <Card className="mb-8 rounded-3xl border-white/10 bg-slate-900/90">
            <CardHeader>
              <div>
                <CardTitle>External Wallet</CardTitle>
                <CardDescription>
                  {walletConnectEnabled
                    ? "Connect a Polygon wallet as your identity. Read-only — no funds move."
                    : "Link an external wallet to your account."}
                </CardDescription>
              </div>
            </CardHeader>
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
          </Card>

          {/* Deposits */}
          <Card className="mb-8 rounded-3xl border-white/10 bg-slate-900/90">
            <CardHeader>
              <div>
                <CardTitle>Deposits</CardTitle>
                <CardDescription>
                  Request a deposit; an admin confirms it before it credits your balance.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <DepositRequestForm userId={user.id} />

              <div className="mt-8">
                <p className="mb-3 text-sm font-medium text-slate-300">Your deposit requests</p>
                {deposits.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {deposits.map((deposit) => (
                      <div
                        key={String(deposit.id)}
                        className="flex flex-col gap-2 rounded-3xl border border-white/10 bg-slate-950/60 p-5 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="text-base font-semibold text-white">
                            {formatUSDC(Number(deposit.amount) || 0)}
                          </span>
                          <span className="text-xs text-slate-400">
                            {String(deposit.asset)} · {String(deposit.chain)}
                          </span>
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-medium capitalize ${
                              depositStatusClass[String(deposit.status)] ?? depositStatusClass.pending
                            }`}
                          >
                            {String(deposit.status)}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500">
                          {formatDate((deposit.created_at as string | null) ?? null)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex min-h-[120px] flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-slate-950/60 p-8 text-center">
                    <p className="text-sm text-slate-400">No deposit requests yet.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Transaction History */}
          <Card className="rounded-3xl border-white/10 bg-slate-900/90">
            <CardHeader>
              <div>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>Deposits, withdrawals, and transfers.</CardDescription>
              </div>
            </CardHeader>
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
          </Card>
        </div>
      </main>
    </AppShell>
  );
}
