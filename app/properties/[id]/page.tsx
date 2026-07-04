import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { MapPin, TrendingUp, ArrowLeft } from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { InvestmentModal } from "@/components/investment-modal";
import { getLivePropertyById, type LivePropertyDetail } from "@/lib/properties";
import { formatUSDC } from "@/lib/format/currency";

export const metadata: Metadata = {
  title: "Property | Inwestim",
  description: "Explore this Inwestim property investment opportunity.",
};

const riskBadgeClass: Record<string, string> = {
  low: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  medium: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  high: "border-rose-400/30 bg-rose-400/10 text-rose-300",
};

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-6">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

function NotFoundState() {
  return (
    <main className="bg-slate-950">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.18),transparent_25%)]" />
        <div className="relative">
          <Header />
          <div className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-6 py-24 text-center">
            <p className="text-sm font-medium uppercase tracking-[0.32em] text-emerald-300">
              Property
            </p>
            <h1 className="mt-6 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              This property isn&apos;t available
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-slate-300">
              It may have been funded, closed, or removed. Browse our live opportunities to find
              your next investment.
            </p>
            <div className="mt-8">
              <Button asChild size="lg">
                <Link href="/properties">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Properties
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}

function PropertyDetail({ property }: { property: LivePropertyDetail }) {
  const funding = Math.max(0, Math.min(100, Number(property.funding_percentage) || 0));
  const riskKey = property.risk_level?.toLowerCase() ?? "medium";

  return (
    <main className="bg-slate-950">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.18),transparent_25%)]" />
        <div className="relative">
          <Header />

          <div className="mx-auto max-w-7xl px-6 pb-6 pt-10 md:px-12 lg:px-20">
            <Button asChild variant="ghost" size="sm" className="text-slate-300 hover:text-white">
              <Link href="/properties">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Properties
              </Link>
            </Button>
          </div>

          {/* Hero image */}
          <div className="mx-auto max-w-7xl px-6 md:px-12 lg:px-20">
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-3xl border border-white/10 shadow-2xl shadow-black/30">
              <Image
                src={property.image_url}
                alt={property.title}
                fill
                priority
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-4 p-8">
                <div>
                  <div className="flex items-center gap-2 text-white/90">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm font-medium">{property.location}</span>
                  </div>
                  <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
                    {property.title}
                  </h1>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-white shadow-lg">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
                    Live Offering
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold capitalize ${
                      riskBadgeClass[riskKey] ?? riskBadgeClass.medium
                    }`}
                  >
                    {property.risk_level} Risk
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12 md:px-12 lg:px-20">
        <div className="grid gap-10 lg:grid-cols-3">
          {/* Main column */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold text-white">About this property</h2>
            <p className="mt-4 text-base leading-relaxed text-slate-300">
              {property.description}
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <MetricCard label="Target Raise" value={formatUSDC(property.total_value)} />
              <MetricCard label="Minimum investment" value={formatUSDC(property.minimum_investment)} />
              <MetricCard
                label="Expected annual return"
                value={`${Number(property.expected_annual_return) || 0}%`}
              />
              <MetricCard
                label="Estimated Monthly Distribution"
                value={formatUSDC(property.monthly_rental_income)}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="rounded-3xl border border-white/10 bg-slate-900/90 p-8 shadow-2xl shadow-black/20">
              {/* Funding progress */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Funding progress</span>
                <span className="text-sm font-semibold text-white">{funding}%</span>
              </div>
              <div className="relative mt-3 h-2.5 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                  style={{ width: `${funding}%` }}
                />
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <span className="text-sm text-slate-400">Status</span>
                  <span className="text-sm font-medium capitalize text-emerald-300">
                    {property.status}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <span className="text-sm text-slate-400">Risk level</span>
                  <span className="text-sm font-medium capitalize text-white">
                    {property.risk_level}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                    <span className="text-sm text-slate-400">Expected return</span>
                  </div>
                  <span className="text-sm font-semibold text-white">
                    {Number(property.expected_annual_return) || 0}%
                  </span>
                </div>
              </div>

              <div className="mt-8 space-y-3">
                <InvestmentModal
                  propertyId={property.id}
                  title={property.title}
                  minimumInvestment={Number(property.minimum_investment) || 0}
                  totalValue={Number(property.total_value) || 0}
                  fundingPercentage={Number(property.funding_percentage) || 0}
                />
                <Button asChild variant="secondary" size="lg" className="w-full">
                  <Link href="/properties">Back to Properties</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const property = await getLivePropertyById(id);

  if (!property) {
    return <NotFoundState />;
  }

  return <PropertyDetail property={property} />;
}
