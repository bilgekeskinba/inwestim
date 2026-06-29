/**
 * Distribution engine — pro-rata distribution math (Sprint 3A, revised).
 *
 * Data flow this module supports:
 *   Property → Distribution Cycle → Calculation Layer → Rental Distribution
 *   Records → (future) Wallet/Payout Layer
 *
 * Business rules:
 * - Each investment row is a separate lot; a user may hold many lots per property.
 * - A lot becomes eligible 1 day after approval: eligible_from = approved_at + 1d.
 * - A lot's active window is [eligible_from, closed_at ?? cycle period_end].
 * - Eligible days for a cycle = overlap of the lot's active window with the
 *   distribution period [period_start, period_end].
 * - Lot weight = investment_amount × eligible_days.
 * - ownership_weight = lot weight / sum(all lot weights).
 * - calculated_amount = net_distribution × ownership_weight.
 * - Lots with 0 eligible days are ignored.
 * - Rounding drift is folded into the largest-weight lot so totals match exactly.
 *
 * Pure math only — no DB writes, no service role. It emits two parallel row
 * sets: one for `distribution_calculations` (the audit layer) and one for
 * `rental_distributions` (the user-facing payout). They are paired by index and
 * share `investment_id`; the DB-generated `distribution_calculation_id` is
 * filled in by the insert layer (a later sprint), not here.
 */

export const DAY_MS = 24 * 60 * 60 * 1000;

export type DistributionType =
  | "rental"
  | "capital_gain"
  | "bonus"
  | "referral"
  | "cashback";

export type InvestmentLot = {
  id: string;
  user_id: string;
  property_id: string;
  amount: number;
  /** When the lot became eligible (approved_at + 1 day). */
  eligible_from: string | Date | null;
  /** When the lot was exited/closed; null for active lots. */
  closed_at?: string | Date | null;
};

/** Audit row for `distribution_calculations` — explains one lot's payout. */
export type DistributionCalculationRow = {
  distribution_cycle_id: string | null;
  investment_id: string;
  user_id: string;
  property_id: string;
  investment_amount: number;
  eligible_days: number;
  weighted_amount: number;
  total_weighted_amount: number;
  ownership_weight: number;
  calculated_amount: number;
};

/** User-facing payout row for `rental_distributions`. */
export type RentalDistributionRow = {
  distribution_cycle_id: string | null;
  /** Filled by the insert layer after the calculation row is persisted. */
  distribution_calculation_id: string | null;
  investment_id: string;
  user_id: string;
  property_id: string;
  amount: number;
  status: "pending";
  period_start: string;
  period_end: string;
};

export type ProrataInput = {
  investments: InvestmentLot[];
  periodStart: string | Date;
  periodEnd: string | Date;
  netDistribution: number;
  /** Optional cycle id to stamp into the emitted rows. */
  distributionCycleId?: string | null;
};

export type ProrataResult = {
  calculations: DistributionCalculationRow[];
  payouts: RentalDistributionRow[];
  totalWeightedAmount: number;
};

function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function roundTo(value: number, dp: number): number {
  const factor = 10 ** dp;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

const round2 = (value: number) => roundTo(value, 2);

/**
 * Whole eligible days for a lot within a cycle period.
 *
 * Active window  = [eligible_from, closed_at ?? period_end]
 * Earning window = overlap(active window, [period_start, period_end])
 *
 * Returns 0 when the lot is not eligible, exited before the period, or has no
 * overlap with the period.
 */
export function eligibleDaysFor(
  eligibleFrom: string | Date | null,
  closedAt: string | Date | null | undefined,
  periodStart: string | Date,
  periodEnd: string | Date
): number {
  const from = toDate(eligibleFrom);
  const start = toDate(periodStart);
  const end = toDate(periodEnd);
  if (!from || !start || !end) return 0;
  if (end.getTime() <= start.getTime()) return 0;

  // Earning starts at the later of (eligible_from, period_start).
  const effectiveStart = Math.max(from.getTime(), start.getTime());

  // Earning ends at the earlier of (closed_at, period_end).
  const closed = toDate(closedAt ?? null);
  const effectiveEnd = closed
    ? Math.min(closed.getTime(), end.getTime())
    : end.getTime();

  if (effectiveEnd <= effectiveStart) return 0;
  return Math.max(0, Math.floor((effectiveEnd - effectiveStart) / DAY_MS));
}

/**
 * Computes pro-rata distributions for a cycle, returning both the calculation
 * audit rows and the payout rows. Only lots with > 0 eligible days and > 0
 * amount are included. Amounts round to 2 decimals; the rounding remainder is
 * folded into the largest-weight lot so payouts sum exactly to net_distribution.
 *
 * @example
 * // 30-day period, 1000 USDC net.
 * // Lot A: 1000 USDC, eligible whole period (30 days) → weight 30000
 * // Lot B: 1000 USDC, eligible from day 15 (15 days)  → weight 15000
 * // total weight = 45000
 * //   A = 1000 × 30000/45000 = 666.67  (ownership_weight 0.6667)
 * //   B = 1000 × 15000/45000 = 333.33  (ownership_weight 0.3333)
 * //   sum = 1000.00
 */
export function calculateProrataDistribution({
  investments,
  periodStart,
  periodEnd,
  netDistribution,
  distributionCycleId = null,
}: ProrataInput): ProrataResult {
  const empty: ProrataResult = {
    calculations: [],
    payouts: [],
    totalWeightedAmount: 0,
  };

  const start = toDate(periodStart);
  const end = toDate(periodEnd);
  if (!start || !end || end.getTime() <= start.getTime()) return empty;
  if (!(netDistribution > 0) || !Array.isArray(investments)) return empty;

  const startIso = start.toISOString();
  const endIso = end.toISOString();

  // 1. Eligible days + weight per lot; drop lots that earn nothing this period.
  const weighted = investments
    .map((lot) => {
      const amount = Number(lot.amount) || 0;
      const days = eligibleDaysFor(lot.eligible_from, lot.closed_at, start, end);
      return { lot, amount, days, weight: amount * days };
    })
    .filter((row) => row.days > 0 && row.weight > 0);

  const totalWeight = weighted.reduce((sum, row) => sum + row.weight, 0);
  if (totalWeight <= 0) return empty;

  // 2. Final per-lot amount (rounded), reconciled so the sum is exact.
  const amounts = weighted.map((row) =>
    round2((netDistribution * row.weight) / totalWeight)
  );
  const distributed = round2(amounts.reduce((sum, a) => sum + a, 0));
  const remainder = round2(netDistribution - distributed);
  if (remainder !== 0) {
    let largestIndex = 0;
    for (let i = 1; i < weighted.length; i += 1) {
      if (weighted[i].weight > weighted[largestIndex].weight) largestIndex = i;
    }
    amounts[largestIndex] = round2(amounts[largestIndex] + remainder);
  }

  // 3. Build the paired calculation + payout rows.
  const calculations: DistributionCalculationRow[] = weighted.map((row, i) => ({
    distribution_cycle_id: distributionCycleId,
    investment_id: row.lot.id,
    user_id: row.lot.user_id,
    property_id: row.lot.property_id,
    investment_amount: row.amount,
    eligible_days: row.days,
    weighted_amount: row.weight,
    total_weighted_amount: totalWeight,
    ownership_weight: roundTo(row.weight / totalWeight, 8),
    calculated_amount: amounts[i],
  }));

  const payouts: RentalDistributionRow[] = weighted.map((row, i) => ({
    distribution_cycle_id: distributionCycleId,
    distribution_calculation_id: null,
    investment_id: row.lot.id,
    user_id: row.lot.user_id,
    property_id: row.lot.property_id,
    amount: amounts[i],
    status: "pending",
    period_start: startIso,
    period_end: endIso,
  }));

  return { calculations, payouts, totalWeightedAmount: totalWeight };
}

/**
 * Internal worked example used in place of a test runner (none is configured).
 * Call from a scratch script / REPL to verify the math:
 *   import { runDistributionExample } from "@/lib/distribution";
 *   console.log(runDistributionExample());
 * Expected: Lot A ≈ 666.67, Lot B ≈ 333.33, total = 1000.00.
 */
export function runDistributionExample(): ProrataResult {
  return calculateProrataDistribution({
    netDistribution: 1000,
    periodStart: "2026-06-01T00:00:00.000Z",
    periodEnd: "2026-07-01T00:00:00.000Z", // 30 days
    investments: [
      {
        id: "lot-a",
        user_id: "user-1",
        property_id: "prop-1",
        amount: 1000,
        eligible_from: "2026-05-20T00:00:00.000Z", // before period → 30 days
        closed_at: null,
      },
      {
        id: "lot-b",
        user_id: "user-2",
        property_id: "prop-1",
        amount: 1000,
        eligible_from: "2026-06-16T00:00:00.000Z", // mid-period → 15 days
        closed_at: null,
      },
    ],
  });
}
