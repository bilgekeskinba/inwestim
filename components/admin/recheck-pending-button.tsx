"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type ReverifySummary = {
  checked: number;
  verified: number;
  stillWaiting: number;
  failed: number;
  errors: number;
};

/**
 * Triggers the trusted batch reverify endpoint (Sprint 6H). The browser never
 * verifies or writes verification status — it only asks the server to recheck
 * pending deposits and shows the returned summary.
 */
export function RecheckPendingButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const recheck = async () => {
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch("/api/deposits/reverify-pending", { method: "POST" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setMessage(`Recheck failed: ${body.error ?? res.status}`);
        return;
      }
      const s = (await res.json()) as ReverifySummary;
      setMessage(
        `Checked ${s.checked} · verified ${s.verified} · still waiting ${s.stillWaiting} · ` +
          `failed ${s.failed} · errors ${s.errors}.`
      );
      router.refresh();
    } catch {
      setMessage("Recheck failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-2">
      <Button type="button" size="sm" onClick={recheck} disabled={busy}>
        {busy ? "Rechecking…" : "Recheck Pending Deposits"}
      </Button>
      {message ? <p className="text-xs text-slate-400">{message}</p> : null}
    </div>
  );
}
