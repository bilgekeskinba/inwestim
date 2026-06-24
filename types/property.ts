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
