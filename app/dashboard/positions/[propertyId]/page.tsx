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
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const metadata: Metadata = {
  title: "Position | Inwestim",
  description: "Details for your investment position.",
};

function formatUSDC(value: number): string {
  return `${(Number(value) || 0).toLocaleString("en-US")} USDC`;
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

const distributionStatusClass: Record<string, string> = {
  pending: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  paid: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  failed: "border-rose-400/30 bg-rose-400/10 text-rose-300",
  cancelled: "border-slate-400/30 bg-slate-400/10 text-slate-300",
};

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-6">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

export default async function PositionDetailPage({
  params,
}: {
  params: Promise<{ propertyId: string }>;
}) {
  const { propertyId } = await params;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  // The user's approved lots for this property (RLS: own rows only).
  const { data: lotsData } = await supabase
    .from("investments")
    .select("id, amount, approved_at, eligible_from, created_at, status")
    .eq("user_id", user.id)
    .eq("property_id", propertyId)
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  const lots = lotsData ?? [];

  // Property details (readable when live/admin); degrade gracefully if not.
  const { data: property } = await supabase
    .from("properties")
    .select("id, title, total_value, expected_annual_return, monthly_rental_income")
    .eq("id", propertyId)
    .maybeSingle();

  // This user's distributions for this property (RLS: own rows only).
  const { data: distData } = await supabase
    .from("rental_distributions")
    .select("id, amount, status, period_start, period_end, eligible_days, paid_at")
    .eq("user_id", user.id)
    .eq("property_id", propertyId)
    .order("created_at", { ascending: false });

  const distributions = distData ?? [];

  const shell = (children: React.ReactNode) => (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="relative mx-auto max-w-5xl px-6 py-10 lg:px-8">{children}</div>
    </main>
  );

  if (lots.length === 0) {
    return shell(
      <>
        <div className="mb-8">
          <Button asChild variant="secondary" size="sm">
            <a href="/dashboard">Back to Dashboard</a>
          </Button>
        </div>
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-slate-950/60 p-10 text-center">
          <p className="text-lg font-medium text-slate-300">No position found.</p>
          <p className="mt-3 max-w-md text-sm text-slate-500">
            You don&apos;t have any approved investments for this property.
          </p>
        </div>
      </>
    );
  }

  const totalInvested = lots.reduce((sum, lot) => sum + (Number(lot.amount) || 0), 0);
  const purchaseCount = lots.length;
  const latestDate = lots.reduce<string | null>((latest, lot) => {
    const created = (lot.created_at as string | null) ?? null;
    if (created && (!latest || new Date(created) > new Date(latest))) return created;
    return latest;
  }, null);

  const title = property?.title ?? "Property";
  const totalValue = Number(property?.total_value) || 0;
  const ownership = totalValue > 0 ? (totalInvested / totalValue) * 100 : null;
  const expectedReturn =
    property?.expected_annual_return != null ? Number(property.expected_annual_return) : null;
  const monthlyDistribution =
    property?.monthly_rental_income != null ? Number(property.monthly_rental_income) : null;

  return shell(
    <>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="secondary" size="sm">
          <a href="/dashboard">Back to Dashboard</a>
        </Button>
        <Button asChild size="sm">
          <a href={`/properties/${propertyId}`}>View Property</a>
        </Button>
      </div>

      <div className="mb-8">
        <p className="text-sm uppercase tracking-[0.24em] text-emerald-400/80">Position</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          {title}
        </h1>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Metric label="Total invested" value={formatUSDC(totalInvested)} />
        <Metric label="Purchases" value={String(purchaseCount)} />
        <Metric label="Latest purchase" value={formatDate(latestDate)} />
        <Metric
          label="Ownership estimate"
          value={ownership != null ? `${ownership.toFixed(2)}%` : "—"}
        />
        <Metric
          label="Expected annual return"
          value={expectedReturn != null ? `${expectedReturn}%` : "—"}
        />
        <Metric
          label="Est. monthly distribution"
          value={monthlyDistribution != null ? formatUSDC(monthlyDistribution) : "—"}
        />
      </div>

      <Card className="mb-8 rounded-3xl border-white/10 bg-slate-900/90">
        <CardHeader>
          <div>
            <CardTitle>Investment lots</CardTitle>
            <CardDescription>
              Each purchase is held as a separate lot, newest first.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3">
            {lots.map((lot) => (
              <div
                key={String(lot.id)}
                className="flex flex-col gap-2 rounded-3xl border border-white/10 bg-slate-950/60 p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-base font-semibold text-white">
                    {formatUSDC(Number(lot.amount) || 0)}
                  </span>
                  <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-medium capitalize text-emerald-300">
                    {String(lot.status)}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-400">
                  <span>
                    Purchased:{" "}
                    <span className="text-slate-200">
                      {formatDate((lot.created_at as string | null) ?? null)}
                    </span>
                  </span>
                  <span>
                    Approved:{" "}
                    <span className="text-slate-200">
                      {formatDate((lot.approved_at as string | null) ?? null)}
                    </span>
                  </span>
                  <span>
                    Eligible from:{" "}
                    <span className="text-slate-200">
                      {formatDate((lot.eligible_from as string | null) ?? null)}
                    </span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-white/10 bg-slate-900/90">
        <CardHeader>
          <div>
            <CardTitle>Distribution history</CardTitle>
            <CardDescription>Your distributions for this property.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {distributions.length > 0 ? (
            <div className="flex flex-col gap-3">
              {distributions.map((distribution) => (
                <div
                  key={String(distribution.id)}
                  className="flex flex-col gap-2 rounded-3xl border border-white/10 bg-slate-950/60 p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-base font-semibold text-white">
                        {formatUSDC(Number(distribution.amount) || 0)}
                      </span>
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-medium capitalize ${
                          distributionStatusClass[String(distribution.status)] ??
                          distributionStatusClass.pending
                        }`}
                      >
                        {String(distribution.status)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatDate((distribution.period_start as string | null) ?? null)} –{" "}
                      {formatDate((distribution.period_end as string | null) ?? null)}
                      {distribution.eligible_days != null
                        ? ` · ${Number(distribution.eligible_days)} eligible ${
                            Number(distribution.eligible_days) === 1 ? "day" : "days"
                          }`
                        : ""}
                      {distribution.paid_at
                        ? ` · paid ${formatDate(distribution.paid_at as string)}`
                        : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex min-h-[160px] flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-slate-950/60 p-10 text-center">
              <p className="text-base font-medium text-slate-300">No distributions yet.</p>
              <p className="mt-3 text-sm text-slate-500">
                Distributions for this property will appear here once paid.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
