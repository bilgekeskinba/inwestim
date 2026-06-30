import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardAction } from "@/components/ui/card";
import {
  requireAdmin,
  getAdminProperties,
  deriveAdminStats,
  getPendingInvestments,
  getDistributionCycles,
  getLegacyApprovedCount,
  type AdminProperty,
} from "@/lib/admin";
import { DeletePropertyButton } from "@/components/admin/delete-property-button";
import { InvestmentRequests } from "@/components/admin/investment-requests";
import { DistributionCycleForm } from "@/components/admin/distribution-cycle-form";
import { DistributionCycles } from "@/components/admin/distribution-cycles";
import { DataMaintenance } from "@/components/admin/data-maintenance";

export const metadata: Metadata = {
  title: "Admin | Inwestim",
  description: "Manage Inwestim property listings.",
};

function formatUSDC(value: number): string {
  return `${(Number(value) || 0).toLocaleString("en-US")} USDC`;
}

const statusBadgeClass: Record<string, string> = {
  live: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  draft: "border-slate-400/30 bg-slate-400/10 text-slate-300",
  funded: "border-sky-400/30 bg-sky-400/10 text-sky-300",
  exited: "border-amber-400/30 bg-amber-400/10 text-amber-300",
};

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-6">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
    </div>
  );
}

function PropertyRow({ property }: { property: AdminProperty }) {
  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-slate-950/60 p-6 lg:flex-row lg:items-center lg:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="truncate text-lg font-semibold text-white">{property.title}</h3>
          <span
            className={`rounded-full border px-3 py-1 text-xs font-medium capitalize ${
              statusBadgeClass[property.status] ?? statusBadgeClass.draft
            }`}
          >
            {property.status}
          </span>
        </div>
        <p className="mt-1 text-sm text-slate-400">{property.location}</p>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-400">
          <span>
            Funding:{" "}
            <span className="text-slate-200">{Number(property.funding_percentage) || 0}%</span>
          </span>
          <span>
            Min. investment:{" "}
            <span className="text-slate-200">{formatUSDC(property.minimum_investment)}</span>
          </span>
          <span>
            Expected return:{" "}
            <span className="text-slate-200">{Number(property.expected_annual_return) || 0}%</span>
          </span>
        </div>
      </div>
      <div className="flex flex-shrink-0 flex-wrap items-center gap-3">
        {property.status === "live" ? (
          <Button asChild variant="outline" size="sm">
            <a href={`/properties/${property.id}`}>View</a>
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled title="Preview available only for live properties">
            Preview unavailable
          </Button>
        )}
        <Button asChild variant="secondary" size="sm">
          <a href={`/admin/properties/${property.id}/edit`}>Edit</a>
        </Button>
        <DeletePropertyButton id={property.id} title={property.title} />
      </div>
    </div>
  );
}

export default async function AdminPage() {
  const { supabase } = await requireAdmin();

  const properties = await getAdminProperties(supabase);
  const stats = deriveAdminStats(properties);
  const pendingRequests = await getPendingInvestments(supabase);
  const distributionCycles = await getDistributionCycles(supabase);
  const legacyApprovedCount = await getLegacyApprovedCount(supabase);

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="relative mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="mb-10 flex flex-col gap-6 rounded-3xl border border-white/10 bg-slate-950/80 p-8 shadow-2xl shadow-black/20 backdrop-blur-xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-emerald-400/80">Admin panel</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Manage properties
              </h1>
              <p className="mt-2 max-w-2xl text-base text-slate-300">
                Review your portfolio, update listings, and publish new property opportunities.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button asChild>
                <a href="/admin/properties/new">New property</a>
              </Button>
              <Button asChild variant="secondary" size="sm">
                <a href="/dashboard">Back to dashboard</a>
              </Button>
            </div>
          </div>
        </div>

        <div className="mb-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total properties" value={stats.total} />
          <StatCard label="Live properties" value={stats.live} />
          <StatCard label="Draft properties" value={stats.draft} />
          <StatCard label="Funded properties" value={stats.funded} />
        </div>

        <Card className="rounded-3xl border-white/10 bg-slate-900/90">
          <CardHeader>
            <div>
              <CardTitle>All properties</CardTitle>
              <CardDescription>Every listing in the catalog, newest first.</CardDescription>
            </div>
            <CardAction>
              <Button asChild variant="default" size="sm">
                <a href="/admin/properties/new">Add property</a>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            {properties.length === 0 ? (
              <div className="flex min-h-[220px] flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-slate-950/60 p-10 text-center">
                <p className="text-base font-medium text-slate-300">No properties yet.</p>
                <p className="mt-3 text-sm text-slate-500">
                  Create your first property to start building the catalog.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {properties.map((property) => (
                  <PropertyRow key={property.id} property={property} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mt-10 rounded-3xl border-white/10 bg-slate-900/90">
          <CardHeader>
            <div>
              <CardTitle>Investment requests</CardTitle>
              <CardDescription>Pending requests awaiting your review.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <InvestmentRequests requests={pendingRequests} />
          </CardContent>
        </Card>

        <Card className="mt-10 rounded-3xl border-white/10 bg-slate-900/90">
          <CardHeader>
            <div>
              <CardTitle>Create distribution cycle</CardTitle>
              <CardDescription>
                Calculate pro-rata payouts for a property and a period, then save the cycle.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <DistributionCycleForm
              properties={properties.map((p) => ({ id: p.id, title: p.title }))}
            />
          </CardContent>
        </Card>

        <Card className="mt-10 rounded-3xl border-white/10 bg-slate-900/90">
          <CardHeader>
            <div>
              <CardTitle>Distribution cycles</CardTitle>
              <CardDescription>
                Recorded cycles and their payout status. Confirm payment when funds are sent.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <DistributionCycles cycles={distributionCycles} />
          </CardContent>
        </Card>

        <Card className="mt-10 rounded-3xl border-white/10 bg-slate-900/90">
          <CardHeader>
            <div>
              <CardTitle>Data Maintenance</CardTitle>
              <CardDescription>
                One-off migration tools for keeping records consistent.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <DataMaintenance legacyCount={legacyApprovedCount} />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
