"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

const DAY_MS = 24 * 60 * 60 * 1000;

export function DataMaintenance({ legacyCount }: { legacyCount: number }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isRepairing, setIsRepairing] = useState(false);

  const repair = async () => {
    setIsRepairing(true);
    setError("");
    setSuccess("");

    const supabase = getSupabaseBrowserClient();

    // Re-read the legacy lots fresh at click time.
    const { data: rows, error: queryError } = await supabase
      .from("investments")
      .select("id, created_at, approved_at, eligible_from")
      .eq("status", "approved")
      .or("approved_at.is.null,eligible_from.is.null");

    if (queryError) {
      setIsRepairing(false);
      if (process.env.NODE_ENV !== "production") {
        console.error("[admin] legacy lots query failed", queryError);
      }
      setError(`Could not load legacy investments: ${queryError.message}`);
      return;
    }

    let repaired = 0;
    for (const row of rows ?? []) {
      // approved_at: keep existing, else created_at, else now().
      const approvedAt =
        (row.approved_at as string | null) ??
        (row.created_at as string | null) ??
        new Date().toISOString();

      // eligible_from: keep existing, else approved_at + 1 day.
      const eligibleFrom =
        (row.eligible_from as string | null) ??
        new Date(new Date(approvedAt).getTime() + DAY_MS).toISOString();

      const { error: updateError } = await supabase
        .from("investments")
        .update({ approved_at: approvedAt, eligible_from: eligibleFrom })
        .eq("id", row.id);

      if (updateError) {
        if (process.env.NODE_ENV !== "production") {
          console.error("[admin] legacy lot repair failed", row.id, updateError);
        }
        continue;
      }
      repaired += 1;
    }

    setIsRepairing(false);
    setSuccess(`Successfully repaired ${repaired} investment(s).`);
    router.refresh();
  };

  return (
    <div className="space-y-4">
      {legacyCount === 0 ? (
        <p className="text-sm text-slate-300">All approved investments are up to date.</p>
      ) : (
        <>
          <p className="text-sm text-amber-300">
            {legacyCount} approved investment{legacyCount === 1 ? "" : "s"} require migration.
          </p>
          <Button type="button" onClick={repair} disabled={isRepairing}>
            {isRepairing ? "Repairing…" : "Repair Legacy Investments"}
          </Button>
        </>
      )}

      {error ? <p className="text-sm font-medium text-red-400">{error}</p> : null}
      {success ? <p className="text-sm font-medium text-emerald-400">{success}</p> : null}
    </div>
  );
}
