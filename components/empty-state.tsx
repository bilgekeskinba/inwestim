import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

/**
 * Shared empty-state block matching the app's dark, dashed-border style.
 * Pass `className` to tweak sizing (e.g. "min-h-[220px]") — tailwind-merge
 * lets it override the defaults.
 */
export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-[160px] flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-slate-950/60 p-10 text-center",
        className
      )}
    >
      <p className="text-base font-medium text-slate-300">{title}</p>
      {description ? <p className="mt-3 text-sm text-slate-500">{description}</p> : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
