import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { AppShell } from "@/components/app-shell";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const metadata: Metadata = {
  title: "Wallet | Inwestim",
  description: "Your Inwestim account balance and connected wallet.",
};

function formatUSDC(value: number): string {
  return `${(Number(value) || 0).toLocaleString("en-US")} USDC`;
}

function sumAmounts(rows: { amount: number | string | null }[] | null): number {
  if (!rows) return 0;
  return rows.reduce((total, row) => total + (Number(row.amount) || 0), 0);
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

  // Real figures where easy; simulated balances are mocked to 0 for now.
  const [approved, paid] = await Promise.all([
    supabase
      .from("investments")
      .select("amount")
      .eq("user_id", user.id)
      .eq("status", "approved"),
    supabase
      .from("rental_distributions")
      .select("amount")
      .eq("user_id", user.id)
      .eq("status", "paid"),
  ]);

  const totalInvested = approved.error ? 0 : sumAmounts(approved.data);
  const lifetimeDistributions = paid.error ? 0 : sumAmounts(paid.data);
  const availableBalance = 0; // Inwestim platform balance (simulated).
  const pendingBalance = 0; // Simulated.

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

          {/* Connected Wallet */}
          <Card className="mb-8 rounded-3xl border-white/10 bg-slate-900/90">
            <CardHeader>
              <div>
                <CardTitle>Connected Wallet</CardTitle>
                <CardDescription>Link an external wallet to move funds in and out.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-start gap-4 rounded-3xl border border-white/10 bg-slate-950/60 p-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-slate-400">Status</p>
                  <p className="mt-1 text-lg font-medium text-white">Not connected</p>
                </div>
                <Button type="button" variant="secondary" disabled>
                  Connect Wallet (Coming Soon)
                </Button>
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
              <div className="flex min-h-[160px] flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-slate-950/60 p-10 text-center">
                <p className="text-base font-medium text-slate-300">No transactions yet.</p>
                <p className="mt-3 text-sm text-slate-500">
                  Wallet transactions will appear here once available.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </AppShell>
  );
}
