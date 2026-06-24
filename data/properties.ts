import { Property } from "@/types/property";

/**
 * Mock property data for development
 * TODO: Replace with data from admin panel / CMS / database (e.g., Supabase, Sanity, or custom backend)
 * This array should be fetched from an API endpoint in production
 */
export const properties: Property[] = [
  {
    id: "prop-001",
    image: "/images/property-1.jpg",
    title: "Skyline Residences",
    location: "Manhattan, New York",
    description:
      "Premium high-rise apartments in the heart of Manhattan with stunning city views and modern amenities.",
    status: "live",
    riskType: "Medium",
    fundingProgress: 72,
    offeringAmount: 2500000,
    minimumEntry: 5000,
    purchasePrice: 4200000,
    investors: 184,
    currentValuation: 4650000,
    yearlyInvestmentReturn: 8.5,
    rentalIncome: 5.2,
    totalROI: 13.7,
  },
  {
    id: "prop-002",
    image: "/images/property-2.jpg",
    title: "Heritage Townhouses",
    location: "Brooklyn, New York",
    description:
      "Charming renovated townhouses in a prime Brooklyn neighborhood with excellent rental demand.",
    status: "funded",
    riskType: "Low",
    fundingProgress: 100,
    offeringAmount: 1800000,
    minimumEntry: 2500,
    purchasePrice: 3100000,
    investors: 312,
    currentValuation: 3450000,
    yearlyInvestmentReturn: 7.2,
    rentalIncome: 6.1,
    totalROI: 13.3,
    fundedDate: "2024-08-15",
  },
  {
    id: "prop-003",
    image: "/images/property-3.jpg",
    title: "Commerce Tower",
    location: "Austin, Texas",
    description:
      "Class A office building in Austin's thriving tech corridor with long-term corporate tenants.",
    status: "exited",
    riskType: "Low",
    fundingProgress: 100,
    offeringAmount: 3200000,
    minimumEntry: 10000,
    purchasePrice: 5500000,
    investors: 427,
    exitPrice: 7150000,
    yearlyInvestmentReturn: 9.8,
    rentalIncome: 4.5,
    totalROI: 30.0,
    fundedDate: "2022-03-10",
    exitDate: "2024-09-22",
  },
];
