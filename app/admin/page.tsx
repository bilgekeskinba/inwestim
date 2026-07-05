import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { AppSectionCard } from "@/components/app-section-card";
import { AppSectionHeader } from "@/components/app-section-header";
import {
  requireAdmin,
  getAdminProperties,
  deriveAdminStats,
  getPendingInvestments,
  getPendingDeposits,
  getDistributionCycles,
  getLegacyApprovedCount,
  getTreasuryOverview,
  type AdminProperty,
} from "@/lib/admin";
import { formatUSDC } from "@/lib/format/currency";
import { EmptyState } from "@/components/empty-state";
import { DeletePropertyButton } from "@/components/admin/delete-property-button";
import { InvestmentRequests } from "@/components/admin/investment-requests";
import { DepositRequests } from "@/components/admin/deposit-requests";
import { DistributionCycleForm } from "@/components/admin/distribution-cycle-form";
import { DistributionCycles } from "@/components/admin/distribution-cycles";
import { DataMaintenance } from "@/components/admin/data-maintenance";
import { TreasuryDashboard } from "@/components/admin/treasury-dashboard";

export const metadata: Metadata = {
  title: "Admin | Inwestim",
  description: "Manage Inwestim property listings.",
};

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
  const pendingDeposits = await getPendingDeposits(supabase);
  const treasuryOverview = await getTreasuryOverview(supabase);
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

        <AppSectionCard>
          <AppSectionHeader
            title="All properties"
            description="Every listing in the catalog, newest first."
            action={
              <Button asChild variant="default" size="sm">
                <a href="/admin/properties/new">Add property</a>
              </Button>
            }
          />
          <CardContent>
            {properties.length === 0 ? (
              <EmptyState
                className="min-h-[220px]"
                title="No properties yet."
                description="Create your first property to start building the catalog."
              />
            ) : (
              <div className="flex flex-col gap-4">
                {properties.map((property) => (
                  <PropertyRow key={property.id} property={property} />
                ))}
              </div>
            )}
          </CardContent>
        </AppSectionCard>

        <AppSectionCard className="mt-10">
          <AppSectionHeader
            title="Investment requests"
            description="Pending requests awaiting your review."
          />
          <CardContent>
            <InvestmentRequests requests={pendingRequests} />
          </CardContent>
        </AppSectionCard>

        <AppSectionCard className="mt-10">
          <AppSectionHeader
            title="Pending deposits"
            description="Deposit requests awaiting confirmation."
          />
          <CardContent>
            <DepositRequests deposits={pendingDeposits} />
          </CardContent>
        </AppSectionCard>

        <AppSectionCard className="mt-10">
          <AppSectionHeader
            title="Treasury overview"
            description="Operational overview of deposit activity (database only)."
          />
          <CardContent>
            <TreasuryDashboard overview={treasuryOverview} />
          </CardContent>
        </AppSectionCard>

        <AppSectionCard className="mt-10">
          <AppSectionHeader
            title="Create distribution cycle"
            description="Calculate pro-rata payouts for a property and a period, then save the cycle."
          />
          <CardContent>
            <DistributionCycleForm
              properties={properties.map((p) => ({ id: p.id, title: p.title }))}
            />
          </CardContent>
        </AppSectionCard>

        <AppSectionCard className="mt-10">
          <AppSectionHeader
            title="Distribution cycles"
            description="Recorded cycles and their payout status. Confirm payment when funds are sent."
          />
          <CardContent>
            <DistributionCycles cycles={distributionCycles} />
          </CardContent>
        </AppSectionCard>

        <AppSectionCard className="mt-10">
          <AppSectionHeader
            title="Data Maintenance"
            description="One-off migration tools for keeping records consistent."
          />
          <CardContent>
            <DataMaintenance legacyCount={legacyApprovedCount} />
          </CardContent>
        </AppSectionCard>
      </div>
    </main>
  );
}
