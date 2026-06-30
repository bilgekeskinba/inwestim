"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import {
  calculateProrataDistribution,
  type InvestmentLot,
} from "@/lib/distribution";

type PropertyOption = { id: string; title: string };

const DISTRIBUTION_TYPES = [
  "rental",
  "capital_gain",
  "bonus",
  "referral",
  "cashback",
];

const inputClass =
  "w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-[15px] text-white shadow-sm placeholder:text-slate-500 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20";
const labelClass = "text-sm font-medium text-slate-300";

function formatUSDC(value: number): string {
  return `${(Number(value) || 0).toLocaleString("en-US")} USDC`;
}

function devError(scope: string, error: unknown) {
  if (process.env.NODE_ENV !== "production") {
    console.error(`[admin] ${scope}`, error);
  }
}

export function DistributionCycleForm({ properties }: { properties: PropertyOption[] }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [propertyId, setPropertyId] = useState(properties[0]?.id ?? "");
  const [distributionType, setDistributionType] = useState("rental");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [gross, setGross] = useState("");
  const [expenses, setExpenses] = useState("");

  const grossNum = Number(gross) || 0;
  const expensesNum = Number(expenses) || 0;
  const net = grossNum - expensesNum;

  // Best-effort cleanup so a failed payout insert doesn't leave a half-built
  // cycle behind (no DB transactions available without an RPC/trigger).
  const rollback = async (
    supabase: ReturnType<typeof getSupabaseBrowserClient>,
    cycleId: string
  ) => {
    await supabase
      .from("distribution_calculations")
      .delete()
      .eq("distribution_cycle_id", cycleId);
    await supabase.from("distribution_cycles").delete().eq("id", cycleId);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!propertyId) {
      setError("Please select a property.");
      return;
    }
    if (!periodStart || !periodEnd) {
      setError("Please set both period dates.");
      return;
    }
    if (new Date(periodEnd).getTime() <= new Date(periodStart).getTime()) {
      setError("Period end must be after period start.");
      return;
    }
    if (!(net > 0)) {
      setError("Net distribution (gross − expenses) must be greater than 0.");
      return;
    }

    setIsSubmitting(true);
    const supabase = getSupabaseBrowserClient();

    // 1. Load this property's approved lots.
    const { data: lots, error: lotsError } = await supabase
      .from("investments")
      .select("id, user_id, property_id, amount, eligible_from, closed_at")
      .eq("property_id", propertyId)
      .eq("status", "approved");

    if (lotsError) {
      devError("approved lots query failed", lotsError);
      setError(`Could not load investments: ${lotsError.message}`);
      setIsSubmitting(false);
      return;
    }

    // 2. Compute pro-rata distribution before creating anything.
    const result = calculateProrataDistribution({
      investments: (lots ?? []) as InvestmentLot[],
      periodStart,
      periodEnd,
      netDistribution: net,
    });

    if (result.calculations.length === 0) {
      setError("No eligible investment lots for this period — nothing to distribute.");
      setIsSubmitting(false);
      return;
    }

    // 3. Create the cycle (already calculated).
    const { data: cycle, error: cycleError } = await supabase
      .from("distribution_cycles")
      .insert({
        property_id: propertyId,
        distribution_type: distributionType,
        period_start: new Date(periodStart).toISOString(),
        period_end: new Date(periodEnd).toISOString(),
        gross_amount: grossNum,
        expenses: expensesNum,
        net_distribution: net,
        status: "calculated",
        calculated_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (cycleError || !cycle) {
      devError("cycle insert failed", cycleError);
      setError(`Could not create distribution cycle: ${cycleError?.message ?? "unknown error"}`);
      setIsSubmitting(false);
      return;
    }

    const cycleId = String(cycle.id);

    // 4. Insert calculation audit rows, return their ids.
    const calcRows = result.calculations.map((c) => ({
      ...c,
      distribution_cycle_id: cycleId,
    }));

    const { data: insertedCalcs, error: calcError } = await supabase
      .from("distribution_calculations")
      .insert(calcRows)
      .select("id, investment_id");

    if (calcError || !insertedCalcs) {
      devError("calculations insert failed", calcError);
      await rollback(supabase, cycleId);
      setError(`Could not save calculations: ${calcError?.message ?? "unknown error"}`);
      setIsSubmitting(false);
      return;
    }

    const calcIdByInvestment = new Map<string, string>();
    insertedCalcs.forEach((row) =>
      calcIdByInvestment.set(String(row.investment_id), String(row.id))
    );

    // 5. Insert payout rows linked to their calculation row.
    const payoutRows = result.payouts.map((p) => ({
      ...p,
      distribution_cycle_id: cycleId,
      distribution_calculation_id: calcIdByInvestment.get(String(p.investment_id)) ?? null,
    }));

    const { error: payoutError } = await supabase
      .from("rental_distributions")
      .insert(payoutRows);

    if (payoutError) {
      devError("payouts insert failed", payoutError);
      await rollback(supabase, cycleId);
      setError(`Could not save payouts: ${payoutError.message}`);
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
    setSuccess(
      `Created a ${distributionType} cycle: ${result.payouts.length} payout(s) totaling ${formatUSDC(net)}.`
    );
    setGross("");
    setExpenses("");
    setPeriodStart("");
    setPeriodEnd("");
    router.refresh();
  };

  if (properties.length === 0) {
    return (
      <div className="flex min-h-[120px] flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-slate-950/60 p-8 text-center">
        <p className="text-sm text-slate-400">
          Create a property first to run a distribution cycle.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="property" className={labelClass}>
            Property
          </label>
          <select
            id="property"
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
            className={inputClass}
          >
            {properties.map((p) => (
              <option key={p.id} value={p.id} className="bg-slate-900">
                {p.title}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="distribution_type" className={labelClass}>
            Distribution type
          </label>
          <select
            id="distribution_type"
            value={distributionType}
            onChange={(e) => setDistributionType(e.target.value)}
            className={inputClass}
          >
            {DISTRIBUTION_TYPES.map((type) => (
              <option key={type} value={type} className="bg-slate-900">
                {type}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="period_start" className={labelClass}>
            Period start
          </label>
          <input
            id="period_start"
            type="date"
            value={periodStart}
            onChange={(e) => setPeriodStart(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="period_end" className={labelClass}>
            Period end
          </label>
          <input
            id="period_end"
            type="date"
            value={periodEnd}
            onChange={(e) => setPeriodEnd(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="gross_amount" className={labelClass}>
            Gross amount (USDC)
          </label>
          <input
            id="gross_amount"
            type="number"
            min="0"
            step="any"
            value={gross}
            onChange={(e) => setGross(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="expenses" className={labelClass}>
            Expenses (USDC)
          </label>
          <input
            id="expenses"
            type="number"
            min="0"
            step="any"
            value={expenses}
            onChange={(e) => setExpenses(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/60 p-4">
        <span className="text-sm text-slate-400">Net distribution</span>
        <span className="text-base font-semibold text-white">{formatUSDC(net)}</span>
      </div>

      {error ? <p className="text-sm font-medium text-red-400">{error}</p> : null}
      {success ? <p className="text-sm font-medium text-emerald-400">{success}</p> : null}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Calculating…" : "Create & calculate cycle"}
      </Button>
    </form>
  );
}
