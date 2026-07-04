import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Standard dark app section card. Bakes in the repeated
 * `rounded-3xl border-white/10 bg-slate-900/90` styling; pass `className`
 * for per-instance tweaks like margins (merged via tailwind-merge).
 */
export function AppSectionCard({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <Card className={cn("rounded-3xl border-white/10 bg-slate-900/90", className)}>
      {children}
    </Card>
  );
}
