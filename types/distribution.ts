// Distribution-domain shared types (cycles, calculations, payouts).
import type { InvestmentLot } from "@/types/investment";

export type DistributionType =
  | "rental"
  | "capital_gain"
  | "bonus"
  | "referral"
  | "cashback";

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
  eligible_days: number;
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

/** Enriched distribution cycle, shown in the admin panel. */
export type AdminDistributionCycle = {
  id: string;
  propertyTitle: string;
  distributionType: string;
  periodStart: string | null;
  periodEnd: string | null;
  netDistribution: number;
  status: string;
  createdAt: string | null;
};
