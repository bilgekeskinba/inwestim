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
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const metadata: Metadata = {
  title: "Settings | Inwestim",
  description: "Manage your Inwestim settings.",
};

export default async function SettingsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <AppShell>
      <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
        <div className="relative mx-auto max-w-7xl px-6 py-10 lg:px-8">
          <div className="mb-8">
            <p className="text-sm uppercase tracking-[0.24em] text-emerald-400/80">Settings</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Settings
            </h1>
            <p className="mt-2 max-w-2xl text-base text-slate-300">
              Manage your account and application preferences.
            </p>
          </div>

          <Card className="rounded-3xl border-white/10 bg-slate-900/90">
            <CardHeader>
              <div>
                <CardTitle>Preferences</CardTitle>
                <CardDescription>Security, notifications, and account options.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex min-h-[200px] flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-slate-950/60 p-10 text-center">
                <p className="text-base font-medium text-slate-300">Settings coming soon.</p>
                <p className="mt-3 text-sm text-slate-500">
                  Preferences and account controls will live here.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </AppShell>
  );
}
