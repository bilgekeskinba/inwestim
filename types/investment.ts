// Investment-domain shared types.

/** Enriched pending investment request, shown in the admin panel. */
export type AdminInvestment = {
  id: string;
  userId: string;
  amount: number;
  status: string;
  created_at: string | null;
  propertyId: string;
  propertyTitle: string;
  propertyTotalValue: number;
  userEmail: string | null;
};

/** A single approved investment lot fed into the distribution engine. */
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
