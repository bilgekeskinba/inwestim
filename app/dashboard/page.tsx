import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardAction } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const metadata: Metadata = {
  title: "Dashboard | Inwestim",
  description: "Your investment dashboard for Inwestim.",
};

async function getUserEmail() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session?.user?.email) {
    return null;
  }

  return session.user.email;
}

export default async function DashboardPage() {
  const email = await getUserEmail();

  if (!email) {
    redirect("/sign-in");
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="relative mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="mb-10 flex flex-col gap-6 rounded-3xl border border-white/10 bg-slate-950/80 p-8 shadow-2xl shadow-black/20 backdrop-blur-xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-emerald-400/80">Welcome back</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Hello, investor.
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
                  <p className="mt-3 text-3xl font-semibold text-white">0 TL</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-6">
                  <p className="text-sm text-slate-400">Active Investments</p>
                  <p className="mt-3 text-3xl font-semibold text-white">0</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-6">
                  <p className="text-sm text-slate-400">Monthly Rental Income</p>
                  <p className="mt-3 text-3xl font-semibold text-white">0 TL</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-6">
                  <p className="text-sm text-slate-400">Pending Opportunities</p>
                  <p className="mt-3 text-3xl font-semibold text-white">0</p>
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
