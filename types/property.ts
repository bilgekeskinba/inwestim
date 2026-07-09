/**
 * Property data types for the Inwestim platform
 * TODO: This data will later come from the admin panel / CMS / database
 */

export type PropertyStatus = "live" | "exited" | "funded";

export type RiskType = "Low" | "Medium" | "High";

export interface Property {
  id: string;
  // Basic Info
  image: string;
  title: string;
  location: string;
  description: string;
  status: PropertyStatus;
  riskType: RiskType;

  // Funding Details
  fundingProgress: number; // percentage 0-100
  offeringAmount: number;
  minimumEntry: number;
  purchasePrice: number;
  investors?: number; // number of investors

  // Returns & Valuation
  currentValuation?: number; // for live/funded
  exitPrice?: number; // for exited
  yearlyInvestmentReturn: number; // percentage
  rentalIncome: number; // percentage
  totalROI: number; // percentage

  // Dates
  fundedDate?: string;
  exitDate?: string;
}

/** Raw properties row as used by the admin panel (DB column names). */
export type AdminProperty = {
  id: string;
  title: string;
  location: string;
  description: string;
  image_url: string;
  total_value: number;
  minimum_investment: number;
  expected_annual_return: number;
  monthly_rental_income: number;
  funding_percentage: number;
  risk_level: string;
  status: string;
  created_at?: string;
};

/** A document attached to a property. */
export type PropertyDocument = {
  id: string;
  property_id: string;
  title: string;
  document_type: string;
  file_url: string;
  is_public: boolean;
  created_at?: string | null;
};

/** Public-facing single property (live only), read straight from DB columns. */
export type LivePropertyDetail = {
  id: string;
  title: string;
  location: string;
  description: string;
  image_url: string;
  total_value: number;
  minimum_investment: number;
  expected_annual_return: number;
  monthly_rental_income: number;
  funding_percentage: number;
  risk_level: string;
  status: string;
};
