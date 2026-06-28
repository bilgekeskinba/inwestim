import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { requireAdmin } from "@/lib/admin";
import { PropertyForm } from "@/components/admin/property-form";

export const metadata: Metadata = {
  title: "New property | Inwestim Admin",
  description: "Create a new Inwestim property listing.",
};

export default async function NewPropertyPage() {
  await requireAdmin();

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="relative mx-auto max-w-3xl px-6 py-10 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-emerald-400/80">Admin panel</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              New property
            </h1>
          </div>
          <Button asChild variant="secondary" size="sm">
            <a href="/admin">Back to admin</a>
          </Button>
        </div>

        <Card className="rounded-3xl border-white/10 bg-slate-900/90">
          <CardHeader>
            <div>
              <CardTitle>Property details</CardTitle>
              <CardDescription>Fill in the fields to publish a new opportunity.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <PropertyForm mode="create" />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
