import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { AppShell } from "@/components/app-shell";
import { AppSectionCard } from "@/components/app-section-card";
import { AppSectionHeader } from "@/components/app-section-header";
import { formatUSDC } from "@/lib/format/currency";
import { formatDate, formatPeriod } from "@/lib/format/date";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { INVESTMENT_STATUS, DISTRIBUTION_STATUS } from "@/lib/constants/status";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const metadata: Metadata = {
  title: "Dashboard | Inwestim",
  description: "Your investment dashboard for Inwestim.",
};

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;
type AuthUser = { id: string; email: string | null; full_name: string | null };

function devError(scope: string, error: unknown) {
  // Keep production logs clean; only surface details while developing.
  if (process.env.NODE_ENV !== "production") {
    console.error(`[dashboard] ${scope}`, error);
  }
}

// Reads the user's profile on first dashboard access, creating it if absent.
// Returns the profile full_name, or null when none is available. Never throws:
// on any failure we degrade to the email-based fallback in the caller.
async function ensureProfileExists(
  supabase: SupabaseServerClient,
  user: AuthUser
): Promise<string | null> {
  try {
    const { data: existing, error: readError } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle();

    if (readError) {
      devError("profile read failed", readError);
      return null;
    }

    if (existing) {
      return existing.full_name?.trim() || null;
    }

    // No profile yet — create one for this authenticated user.
    const fullName = user.full_name?.trim() || "";

    const { data: created, error: insertError } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        email: user.email ?? "",
        full_name: fullName,
        role: "user",
      })
      .select("full_name")
      .maybeSingle();

    if (insertError) {
      // Ignore duplicate races (23505); the row exists, just keep going.
      if (insertError.code !== "23505") {
        devError("profile creation failed", insertError);
      }
      return fullName || null;
    }

    return created?.full_name?.trim() || null;
  } catch (error) {
    devError("profile lookup error", error);
    return null;
  }
}

async function getDashboardUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user?.id) {
    return { supabase, userId: null, email: null, displayName: null };
  }

  const email = user.email ?? null;

  const fullName = await ensureProfileExists(supabase, {
    id: user.id,
    email,
    full_name: (user.user_metadata?.full_name as string | undefined) ?? null,
  });

  // Prefer full_name; otherwise fall back to the local part of the email so the
  // large heading never shows a full email address.
  const emailPrefix = email ? email.split("@")[0] : null;
  const displayName = fullName || emailPrefix || "investor";

  return { supabase, userId: user.id, email, displayName };
}

type DashboardMetrics = {
  portfolioValue: number;
  activeCount: number;
  monthlyRentalIncome: number;
  pendingCount: number;
};

const EMPTY_METRICS: DashboardMetrics = {
  portfolioValue: 0,
  activeCount: 0,
  monthlyRentalIncome: 0,
  pendingCount: 0,
};

function sumAmounts(rows: { amount: number | string | null }[] | null): number {
  if (!rows) return 0;
  return rows.reduce((total, row) => total + (Number(row.amount) || 0), 0);
}

// Reads the current user's portfolio metrics from Supabase. Each query is
// independent and soft-fails to 0 so a single failure never crashes the page.
async function getDashboardMetrics(
  supabase: SupabaseServerClient,
  userId: string
): Promise<DashboardMetrics> {
  try {
    const [approved, rentals, pending] = await Promise.all([
      // Approved investments → Portfolio Value (sum of lots) + Active Positions
      // (count of UNIQUE properties, not lots).
      supabase
        .from("investments")
        .select("amount, property_id")
        .eq("user_id", userId)
        .eq("status", INVESTMENT_STATUS.APPROVED),
      // Paid rental distributions → Monthly Rental Income (sum).
      supabase
        .from("rental_distributions")
        .select("amount")
        .eq("user_id", userId)
        .eq("status", DISTRIBUTION_STATUS.PAID),
      // Pending investments → Pending Opportunities (count only).
      supabase
        .from("investments")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("status", INVESTMENT_STATUS.PENDING),
    ]);

    if (approved.error) devError("approved investments query failed", approved.error);
    if (rentals.error) devError("rental distributions query failed", rentals.error);
    if (pending.error) devError("pending investments query failed", pending.error);

    // Active Positions = number of distinct properties with ≥1 approved lot.
    const activeCount = approved.error
      ? 0
      : new Set(
          (approved.data ?? [])
            .map((row) => String(row.property_id ?? ""))
            .filter(Boolean)
        ).size;

    return {
      portfolioValue: approved.error ? 0 : sumAmounts(approved.data),
      activeCount,
      monthlyRentalIncome: rentals.error ? 0 : sumAmounts(rentals.data),
      pendingCount: pending.error ? 0 : pending.count ?? 0,
    };
  } catch (error) {
    devError("metrics query error", error);
    return EMPTY_METRICS;
  }
}

type PendingInvestment = {
  id: string;
  amount: number;
  status: string;
  created_at: string | null;
  propertyTitle: string;
};

// Lists the user's pending investment requests, enriched with property titles.
// Soft-fails to an empty array so a query error never crashes the dashboard.
async function getPendingInvestments(
  supabase: SupabaseServerClient,
  userId: string
): Promise<PendingInvestment[]> {
  try {
    const { data, error } = await supabase
      .from("investments")
      .select("id, amount, status, created_at, property_id")
      .eq("user_id", userId)
      .eq("status", INVESTMENT_STATUS.PENDING)
      .order("created_at", { ascending: false });

    if (error || !data) {
      devError("pending investments list failed", error);
      return [];
    }

    const propertyIds = [
      ...new Set(data.map((row) => row.property_id).filter(Boolean)),
    ];
    const titles = new Map<string, string>();

    if (propertyIds.length > 0) {
      const { data: props } = await supabase
        .from("properties")
        .select("id, title")
        .in("id", propertyIds);
      props?.forEach((p) => titles.set(String(p.id), String(p.title)));
    }

    return data.map((row) => ({
      id: String(row.id),
      amount: Number(row.amount) || 0,
      status: String(row.status),
      created_at: (row.created_at as string | null) ?? null,
      propertyTitle: titles.get(String(row.property_id)) ?? "Property",
    }));
  } catch (error) {
    devError("pending investments error", error);
    return [];
  }
}

type ActivePosition = {
  propertyId: string;
  propertyTitle: string;
  totalAmount: number;
  purchaseCount: number;
  latestDate: string | null;
};

// Aggregates the user's APPROVED investments into one position per property.
// Each purchase stays a separate row in the DB; this only groups for display.
// Soft-fails to an empty array so a query error never crashes the dashboard.
async function getActivePositions(
  supabase: SupabaseServerClient,
  userId: string
): Promise<ActivePosition[]> {
  try {
    const { data, error } = await supabase
      .from("investments")
      .select("amount, created_at, property_id")
      .eq("user_id", userId)
      .eq("status", INVESTMENT_STATUS.APPROVED);

    if (error || !data) {
      devError("active positions query failed", error);
      return [];
    }

    const groups = new Map<
      string,
      { total: number; count: number; latest: string | null }
    >();

    for (const row of data) {
      const propertyId = String(row.property_id ?? "");
      if (!propertyId) continue;

      const group = groups.get(propertyId) ?? { total: 0, count: 0, latest: null };
      group.total += Number(row.amount) || 0;
      group.count += 1;

      const created = (row.created_at as string | null) ?? null;
      if (created && (!group.latest || new Date(created) > new Date(group.latest))) {
        group.latest = created;
      }

      groups.set(propertyId, group);
    }

    const propertyIds = [...groups.keys()];
    const titles = new Map<string, string>();

    if (propertyIds.length > 0) {
      const { data: props } = await supabase
        .from("properties")
        .select("id, title")
        .in("id", propertyIds);
      props?.forEach((p) => titles.set(String(p.id), String(p.title)));
    }

    return propertyIds
      .map((propertyId) => {
        const group = groups.get(propertyId)!;
        return {
          propertyId,
          propertyTitle: titles.get(propertyId) ?? "Property",
          totalAmount: group.total,
          purchaseCount: group.count,
          latestDate: group.latest,
        };
      })
      .sort((a, b) => b.totalAmount - a.totalAmount);
  } catch (error) {
    devError("active positions error", error);
    return [];
  }
}

type DistributionHistoryRow = {
  id: string;
  propertyTitle: string;
  amount: number;
  status: string;
  periodStart: string | null;
  periodEnd: string | null;
  eligibleDays: number | null;
  paidAt: string | null;
};

// Lists the current user's rental distributions (all statuses), newest first,
// enriched with property titles. Soft-fails to an empty array.
async function getDistributionHistory(
  supabase: SupabaseServerClient,
  userId: string
): Promise<DistributionHistoryRow[]> {
  try {
    const { data, error } = await supabase
      .from("rental_distributions")
      .select(
        "id, amount, status, period_start, period_end, eligible_days, paid_at, property_id, created_at"
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error || !data) {
      devError("distribution history query failed", error);
      return [];
    }

    const propertyIds = [...new Set(data.map((row) => row.property_id).filter(Boolean))];
    const titles = new Map<string, string>();
    if (propertyIds.length > 0) {
      const { data: props } = await supabase
        .from("properties")
        .select("id, title")
        .in("id", propertyIds);
      props?.forEach((p) => titles.set(String(p.id), String(p.title)));
    }

    return data.map((row) => ({
      id: String(row.id),
      propertyTitle: titles.get(String(row.property_id)) ?? "Property",
      amount: Number(row.amount) || 0,
      status: String(row.status),
      periodStart: (row.period_start as string | null) ?? null,
      periodEnd: (row.period_end as string | null) ?? null,
      eligibleDays: row.eligible_days == null ? null : Number(row.eligible_days),
      paidAt: (row.paid_at as string | null) ?? null,
    }));
  } catch (error) {
    devError("distribution history error", error);
    return [];
  }
}

export default async function DashboardPage() {
  const { supabase, userId, email, displayName } = await getDashboardUser();

  if (!email || !userId) {
    redirect("/sign-in");
  }

  const metrics = await getDashboardMetrics(supabase, userId);
  const pendingInvestments = await getPendingInvestments(supabase, userId);
  const activePositions = await getActivePositions(supabase, userId);
  const distributionHistory = await getDistributionHistory(supabase, userId);

  return (
    <AppShell>
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="relative mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="mb-10 flex flex-col gap-6 rounded-3xl border border-white/10 bg-slate-950/80 p-8 shadow-2xl shadow-black/20 backdrop-blur-xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-emerald-400/80">Dashboard</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Welcome back, {displayName}.
              </h1>
              <p className="mt-2 max-w-2xl text-base text-slate-300">
                Your Inwestim dashboard is ready. Monitor your portfolio, review opportunities, and manage your account from one place.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <p className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
                {email}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <AppSectionCard>
            <AppSectionHeader
              title="Portfolio summary"
              description="Overview of your current account activity."
            />
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-6">
                  <p className="text-sm text-slate-400">Portfolio Value</p>
                  <p className="mt-3 text-3xl font-semibold text-white">{formatUSDC(metrics.portfolioValue)}</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-6">
                  <p className="text-sm text-slate-400">Active Positions</p>
                  <p className="mt-3 text-3xl font-semibold text-white">{metrics.activeCount}</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-6">
                  <p className="text-sm text-slate-400">Monthly Rental Income</p>
                  <p className="mt-3 text-3xl font-semibold text-white">{formatUSDC(metrics.monthlyRentalIncome)}</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-6">
                  <p className="text-sm text-slate-400">Pending Opportunities</p>
                  <p className="mt-3 text-3xl font-semibold text-white">{metrics.pendingCount}</p>
                </div>
              </div>
            </CardContent>
          </AppSectionCard>

          <AppSectionCard>
            <AppSectionHeader
              title="Portfolio status"
              description={
                pendingInvestments.length > 0
                  ? "Your pending investment requests."
                  : activePositions.length > 0
                    ? "Your active positions at a glance."
                    : "Start building momentum with your first investment."
              }
              action={
                <Button asChild variant="default" size="sm">
                  <a href="/properties">Explore Properties</a>
                </Button>
              }
            />
            <CardContent>
              {pendingInvestments.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {pendingInvestments.map((investment) => (
                    <div
                      key={investment.id}
                      className="flex flex-col gap-2 rounded-3xl border border-white/10 bg-slate-950/60 p-5 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-base font-medium text-white">
                          {investment.propertyTitle}
                        </p>
                        {investment.created_at ? (
                          <p className="mt-1 text-xs text-slate-500">
                            Requested {formatDate(investment.created_at)}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-1">
                        <span className="text-base font-semibold text-white">
                          {formatUSDC(investment.amount)}
                        </span>
                        <StatusBadge status={investment.status} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : activePositions.length > 0 ? (
                <div className="flex min-h-[220px] flex-col justify-center gap-4 rounded-3xl border border-white/10 bg-slate-950/60 p-8">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="text-sm text-slate-400">Active positions</p>
                      <p className="mt-2 text-3xl font-semibold text-white">
                        {activePositions.length}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-400">Total invested</p>
                      <p className="mt-2 text-3xl font-semibold text-white">
                        {formatUSDC(metrics.portfolioValue)}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-500">
                    See the full breakdown in Active Positions below.
                  </p>
                </div>
              ) : (
                <EmptyState
                  className="min-h-[220px]"
                  title="You haven't made any investments yet."
                  description="Browse curated property opportunities and make your first allocation."
                />
              )}
            </CardContent>
          </AppSectionCard>
        </div>

        <AppSectionCard className="mt-6">
          <AppSectionHeader
            title="Active Positions"
            description="Your approved holdings, grouped by property."
          />
          <CardContent>
            {activePositions.length > 0 ? (
              <div className="flex flex-col gap-3">
                {activePositions.map((position) => (
                  <a
                    key={position.propertyId}
                    href={`/dashboard/positions/${position.propertyId}`}
                    className="group flex cursor-pointer flex-col gap-2 rounded-3xl border border-white/10 bg-slate-950/60 p-5 transition-colors hover:border-white/20 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-base font-medium text-white transition-colors group-hover:text-emerald-300">
                        {position.propertyTitle}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {position.purchaseCount}{" "}
                        {position.purchaseCount === 1 ? "purchase" : "purchases"}
                        {position.latestDate
                          ? ` · latest ${formatDate(position.latestDate)}`
                          : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-1">
                        <span className="text-base font-semibold text-white">
                          {formatUSDC(position.totalAmount)}
                        </span>
                        <span className="text-xs text-slate-400">total invested</span>
                      </div>
                      <ArrowRight className="h-5 w-5 shrink-0 text-slate-600 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-emerald-400" />
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No active positions yet."
                description="Approved investments will appear here, grouped by property."
              />
            )}
          </CardContent>
        </AppSectionCard>

        <AppSectionCard className="mt-6">
          <AppSectionHeader
            title="Distribution History"
            description="Rental distributions across your positions."
          />
          <CardContent>
            {distributionHistory.length > 0 ? (
              <div className="flex flex-col gap-3">
                {distributionHistory.map((distribution) => (
                  <div
                    key={distribution.id}
                    className="flex flex-col gap-2 rounded-3xl border border-white/10 bg-slate-950/60 p-5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="truncate text-base font-medium text-white">
                          {distribution.propertyTitle}
                        </p>
                        <StatusBadge status={distribution.status} />
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {formatPeriod(distribution.periodStart, distribution.periodEnd)}
                        {distribution.eligibleDays != null
                          ? ` · ${distribution.eligibleDays} eligible ${
                              distribution.eligibleDays === 1 ? "day" : "days"
                            }`
                          : ""}
                        {distribution.paidAt ? ` · paid ${formatDate(distribution.paidAt)}` : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-semibold text-white">
                        {formatUSDC(distribution.amount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No distributions yet."
                description="Once your positions earn rental income, distributions will appear here."
              />
            )}
          </CardContent>
        </AppSectionCard>
      </div>
    </main>
    </AppShell>
  );
}
