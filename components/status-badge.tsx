import { cn } from "@/lib/utils";

// Shared status palette (matches the app's existing badge styling):
//  emerald → positive/settled, amber → in-progress, rose → negative,
//  slate → neutral/unknown.
const STATUS_STYLES: Record<string, string> = {
  approved: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  completed: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  paid: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  live: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  funded: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",

  pending: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  calculated: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  draft: "border-amber-400/30 bg-amber-400/10 text-amber-300",

  rejected: "border-rose-400/30 bg-rose-400/10 text-rose-300",
  failed: "border-rose-400/30 bg-rose-400/10 text-rose-300",
  cancelled: "border-rose-400/30 bg-rose-400/10 text-rose-300",

  closed: "border-slate-400/30 bg-slate-400/10 text-slate-300",
};

const UNKNOWN_STYLE = "border-slate-400/30 bg-slate-400/10 text-slate-300";

type StatusBadgeProps = {
  status: string;
  label?: string;
  className?: string;
};

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const key = (status ?? "").toLowerCase();
  const style = STATUS_STYLES[key] ?? UNKNOWN_STYLE;

  return (
    <span
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium capitalize",
        style,
        className
      )}
    >
      {label ?? status}
    </span>
  );
}
