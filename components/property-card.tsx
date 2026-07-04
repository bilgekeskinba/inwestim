import Image from "next/image";
import Link from "next/link";
import {
  MapPin,
  TrendingUp,
  Calendar,
  ArrowUpRight,
  Users,
  Clock,
} from "lucide-react";
import { Property } from "@/types/property";
import { Button } from "@/components/ui/button";
import { formatUSDC } from "@/lib/format/currency";

/**
 * Property Card Component
 * All content is dynamic and comes from the property data object
 * TODO: Data will be fetched from admin panel / CMS / database in production
 */

interface PropertyCardProps {
  property: Property;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

function getStatusConfig(status: Property["status"]) {
  const configs = {
    live: {
      label: "Live Offering",
      bgColor: "bg-emerald-500",
      textColor: "text-white",
      dotColor: "bg-white",
      showDot: true,
    },
    funded: {
      label: "Fully Funded",
      bgColor: "bg-sky-500",
      textColor: "text-white",
      dotColor: "",
      showDot: false,
    },
    exited: {
      label: "Exited",
      bgColor: "bg-slate-800",
      textColor: "text-white",
      dotColor: "",
      showDot: false,
    },
  };
  return configs[status];
}

function getRiskConfig(riskType: Property["riskType"]) {
  const configs = {
    Low: {
      color: "text-emerald-700",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
    Medium: {
      color: "text-amber-700",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
    },
    High: {
      color: "text-rose-700",
      bg: "bg-rose-500/10",
      border: "border-rose-500/20",
    },
  };
  return configs[riskType];
}

export function PropertyCard({ property }: PropertyCardProps) {
  const statusConfig = getStatusConfig(property.status);
  const riskConfig = getRiskConfig(property.riskType);

  return (
    <Link href={`/properties/${property.id}`} className="block h-full">
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all duration-300 hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.15)] hover:border-border hover:-translate-y-1">
      {/* Property Image */}
      <div className="relative aspect-[16/10] overflow-hidden">
        <Image
          src={property.image}
          alt={property.title}
          fill
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
        />
        {/* Premium gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Top Badges Row */}
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-4">
          {/* Status Badge */}
          <span
            className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold tracking-wide shadow-lg backdrop-blur-sm ${statusConfig.bgColor} ${statusConfig.textColor}`}
          >
            {statusConfig.showDot && (
              <span
                className={`h-2 w-2 rounded-full ${statusConfig.dotColor} animate-pulse`}
              />
            )}
            {statusConfig.label}
          </span>

          {/* Risk Badge */}
          <span
            className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold backdrop-blur-md ${riskConfig.bg} ${riskConfig.color} ${riskConfig.border}`}
          >
            {property.riskType} Risk
          </span>
        </div>

        {/* Bottom Image Info */}
        <div className="absolute inset-x-0 bottom-0 p-4">
          <div className="flex items-center gap-2 text-white/90">
            <MapPin className="h-4 w-4" />
            <span className="text-sm font-medium">{property.location}</span>
          </div>
          <h3 className="mt-1.5 text-xl font-bold text-white line-clamp-1 tracking-tight">
            {property.title}
          </h3>
        </div>
      </div>

      {/* Card Content */}
      <div className="flex flex-1 flex-col p-6">
        {/* Description */}
        <p className="text-sm leading-relaxed text-muted-foreground line-clamp-2">
          {property.description}
        </p>

        {/* Funding Progress - Only for live properties */}
        {property.status === "live" && (
          <div className="mt-5 rounded-xl bg-slate-50/80 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {property.investors || 0} investors
                </span>
              </div>
              <span className="text-sm font-bold text-foreground">
                {property.fundingProgress}%
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  funded
                </span>
              </span>
            </div>
            {/* Premium Progress Bar */}
            <div className="relative mt-3 h-2.5 overflow-hidden rounded-full bg-slate-200">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-700 ease-out"
                style={{ width: `${property.fundingProgress}%` }}
              />
              {/* Shimmer effect */}
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"
                style={{ width: `${property.fundingProgress}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {formatUSDC(
                  (property.offeringAmount * property.fundingProgress) / 100
                )}{" "}
                raised
              </span>
              <span>Goal: {formatUSDC(property.offeringAmount)}</span>
            </div>
          </div>
        )}

        {/* Key Metrics Grid */}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-border/50 bg-gradient-to-br from-slate-50 to-white p-4">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {property.status === "exited" ? "Exit Price" : "Target Raise"}
            </p>
            <p className="mt-1 text-lg font-bold text-foreground tracking-tight">
              {formatUSDC(
                property.status === "exited"
                  ? property.exitPrice || 0
                  : property.offeringAmount
              )}
            </p>
          </div>
          <div className="rounded-xl border border-border/50 bg-gradient-to-br from-slate-50 to-white p-4">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Min. Investment
            </p>
            <p className="mt-1 text-lg font-bold text-foreground tracking-tight">
              {formatUSDC(property.minimumEntry)}
            </p>
          </div>
        </div>

        {/* Returns Section */}
        <div className="mt-4 overflow-hidden rounded-xl border border-emerald-200/60 bg-gradient-to-br from-emerald-50/80 via-emerald-50/40 to-white">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 shadow-lg shadow-emerald-500/20">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-emerald-700/70">
                  Projected ROI
                </p>
                <p className="text-xl font-bold text-emerald-600">
                  {property.totalROI}%
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Annual Return
              </p>
              <p className="text-lg font-bold text-foreground">
                {property.yearlyInvestmentReturn}%
              </p>
            </div>
          </div>
        </div>

        {/* Dates for funded/exited */}
        {(property.fundedDate || property.exitDate) && (
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
            {property.fundedDate && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span>Funded {formatDate(property.fundedDate)}</span>
              </div>
            )}
            {property.exitDate && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                <span>Exited {formatDate(property.exitDate)}</span>
              </div>
            )}
          </div>
        )}

        {/* CTA Button */}
        <div className="mt-auto pt-5">
          <Button
            asChild
            className="w-full rounded-xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white shadow-lg shadow-slate-900/15 transition-all duration-300 hover:shadow-xl hover:shadow-slate-900/25 hover:scale-[1.01] active:scale-[0.99]"
            size="lg"
          >
            <span>
              {property.status === "live" ? "Start Investing Now" : "View Details"}
              <ArrowUpRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </span>
          </Button>
        </div>
      </div>
    </article>
    </Link>
  );
}
