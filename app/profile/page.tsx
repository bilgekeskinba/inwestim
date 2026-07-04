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
import { EmptyState } from "@/components/empty-state";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const metadata: Metadata = {
  title: "Profile | Inwestim",
  description: "Manage your Inwestim profile.",
};

export default async function ProfilePage() {
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
            <p className="text-sm uppercase tracking-[0.24em] text-emerald-400/80">Profile</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Your profile
            </h1>
            <p className="mt-2 max-w-2xl text-base text-slate-300">Signed in as {user.email}.</p>
          </div>

          <Card className="rounded-3xl border-white/10 bg-slate-900/90">
            <CardHeader>
              <div>
                <CardTitle>Account details</CardTitle>
                <CardDescription>Manage your name, email, and preferences.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <EmptyState
                className="min-h-[200px]"
                title="Profile settings coming soon."
                description="You'll be able to edit your details here."
              />
            </CardContent>
          </Card>
        </div>
      </main>
    </AppShell>
  );
}
