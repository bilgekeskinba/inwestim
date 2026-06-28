import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { requireAdmin, getAdminProperty } from "@/lib/admin";
import { PropertyForm, type PropertyFormValues } from "@/components/admin/property-form";

export const metadata: Metadata = {
  title: "Edit property | Inwestim Admin",
  description: "Edit an existing Inwestim property listing.",
};

export default async function EditPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { supabase } = await requireAdmin();
  const { id } = await params;

  const property = await getAdminProperty(supabase, id);

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="relative mx-auto max-w-3xl px-6 py-10 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-emerald-400/80">Admin panel</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Edit property
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
              <CardDescription>Update the fields and save your changes.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {property ? (
              <PropertyForm
                mode="edit"
                initialValues={property as PropertyFormValues}
              />
            ) : (
              <div className="flex min-h-[180px] flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-slate-950/60 p-10 text-center">
                <p className="text-base font-medium text-slate-300">Property not found.</p>
                <p className="mt-3 text-sm text-slate-500">
                  It may have been removed, or you don&apos;t have access to it.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
