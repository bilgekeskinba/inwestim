import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardAction } from "@/components/ui/card";
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

  const displayName = fullName || email || "investor";

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
      // Approved investments → Portfolio Value (sum) + Active Investments (count).
      supabase
        .from("investments")
        .select("amount")
        .eq("user_id", userId)
        .eq("status", "approved"),
      // Paid rental distributions → Monthly Rental Income (sum).
      supabase
        .from("rental_distributions")
        .select("amount")
        .eq("user_id", userId)
        .eq("status", "paid"),
      // Pending investments → Pending Opportunities (count only).
      supabase
        .from("investments")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("status", "pending"),
    ]);

    if (approved.error) devError("approved investments query failed", approved.error);
    if (rentals.error) devError("rental distributions query failed", rentals.error);
    if (pending.error) devError("pending investments query failed", pending.error);

    return {
      portfolioValue: approved.error ? 0 : sumAmounts(approved.data),
      activeCount: approved.error ? 0 : approved.data?.length ?? 0,
      monthlyRentalIncome: rentals.error ? 0 : sumAmounts(rentals.data),
      pendingCount: pending.error ? 0 : pending.count ?? 0,
    };
  } catch (error) {
    devError("metrics query error", error);
    return EMPTY_METRICS;
  }
}

function formatTL(value: number): string {
  return `${value.toLocaleString("tr-TR")} TL`;
}

export default async function DashboardPage() {
  const { supabase, userId, email, displayName } = await getDashboardUser();

  if (!email || !userId) {
    redirect("/sign-in");
  }

  const metrics = await getDashboardMetrics(supabase, userId);

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="relative mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="mb-10 flex flex-col gap-6 rounded-3xl border border-white/10 bg-slate-950/80 p-8 shadow-2xl shadow-black/20 backdrop-blur-xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-emerald-400/80">Welcome back</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Hello, {displayName}.
              </h1>
              <p className="mt-2 max-w-2xl text-base text-slate-300">
                Your Inwestim dashboard is ready. Monitor your portfolio, review opportunities, and manage your account from one place.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <p className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
                {email}
              </p>
              <form action="/dashboard/logout" method="post">
                <Button type="submit" variant="secondary" size="sm">
                  Log out
                </Button>
              </form>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card className="rounded-3xl border-white/10 bg-slate-900/90">
            <CardHeader>
              <div>
                <CardTitle>Portfolio summary</CardTitle>
                <CardDescription>Overview of your current account activity.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-6">
                  <p className="text-sm text-slate-400">Portfolio Value</p>
                  <p className="mt-3 text-3xl font-semibold text-white">{formatTL(metrics.portfolioValue)}</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-6">
                  <p className="text-sm text-slate-400">Active Investments</p>
                  <p className="mt-3 text-3xl font-semibold text-white">{metrics.activeCount}</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-6">
                  <p className="text-sm text-slate-400">Monthly Rental Income</p>
                  <p className="mt-3 text-3xl font-semibold text-white">{formatTL(metrics.monthlyRentalIncome)}</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-6">
                  <p className="text-sm text-slate-400">Pending Opportunities</p>
                  <p className="mt-3 text-3xl font-semibold text-white">{metrics.pendingCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-white/10 bg-slate-900/90">
            <CardHeader>
              <div>
                <CardTitle>Portfolio status</CardTitle>
                <CardDescription>Start building momentum with your first investment.</CardDescription>
              </div>
              <CardAction>
                <Button asChild variant="default" size="sm">
                  <a href="/properties">Explore Properties</a>
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent>
              <div className="flex min-h-[220px] flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-slate-950/60 p-10 text-center">
                <p className="text-base font-medium text-slate-300">
                  You haven't made any investments yet.
                </p>
                <p className="mt-3 text-sm text-slate-500">
                  Browse curated property opportunities and make your first allocation.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
