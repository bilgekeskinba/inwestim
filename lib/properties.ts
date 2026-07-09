import { createSupabaseServerClient } from "@/lib/supabase-server";
import { Property } from "@/types/property";
import type { LivePropertyDetail, PropertyDocument } from "@/types/property";

// Re-exported so existing `@/lib/properties` type imports keep working.
export type { LivePropertyDetail };

// DB stores risk_level lowercase (low/medium/high); the Property type and the
// card UI expect "Low" | "Medium" | "High".
function normalizeRiskType(value: unknown): Property["riskType"] {
  const risk = String(value ?? "").trim().toLowerCase();
  if (risk === "low") return "Low";
  if (risk === "high") return "High";
  return "Medium";
}

function mapPropertyRow(row: Record<string, unknown>): Property {
  // The real properties table uses: total_value, minimum_investment,
  // expected_annual_return, monthly_rental_income, funding_percentage,
  // risk_level. Legacy names are kept as fallbacks only.
  const totalValue = Number(row.total_value ?? row.offering_amount ?? row.offeringAmount ?? 0);
  const expectedAnnualReturn = Number(
    row.expected_annual_return ?? row.yearly_investment_return ?? row.yearlyInvestmentReturn ?? 0
  );

  return {
    id: String(row.id ?? ""),
    image: String(row.image_url ?? row.image ?? row.imageUrl ?? ""),
    title: String(row.title ?? ""),
    location: String(row.location ?? ""),
    description: String(row.description ?? ""),
    status: String(row.status ?? "live") as Property["status"],
    riskType: normalizeRiskType(row.risk_level ?? row.risk_type ?? row.riskType),
    fundingProgress: Number(row.funding_percentage ?? row.funding_progress ?? row.fundingProgress ?? 0),
    offeringAmount: totalValue,
    minimumEntry: Number(row.minimum_investment ?? row.minimum_entry ?? row.minimumEntry ?? 0),
    purchasePrice: Number(row.purchase_price ?? row.purchasePrice ?? totalValue),
    investors: Number(row.investors ?? 0) || 0,
    currentValuation:
      row.current_valuation ?? row.currentValuation
        ? Number(row.current_valuation ?? row.currentValuation)
        : undefined,
    yearlyInvestmentReturn: expectedAnnualReturn,
    rentalIncome: Number(row.monthly_rental_income ?? row.rental_income ?? row.rentalIncome ?? 0),
    // No dedicated ROI column; expected annual return is the best available proxy.
    totalROI: Number(row.total_roi ?? row.totalROI ?? expectedAnnualReturn),
    fundedDate:
      row.funded_date ?? row.fundedDate
        ? String(row.funded_date ?? row.fundedDate)
        : undefined,
    exitDate:
      row.exit_date ?? row.exitDate
        ? String(row.exit_date ?? row.exitDate)
        : undefined,
    exitPrice:
      row.exit_price ?? row.exitPrice
        ? Number(row.exit_price ?? row.exitPrice)
        : undefined,
  };
}

const PUBLIC_DETAIL_COLUMNS =
  "id, title, location, description, image_url, total_value, minimum_investment, expected_annual_return, monthly_rental_income, funding_percentage, risk_level, status";

/**
 * Fetches a single property for the public detail page. Only returns the row
 * when status = 'live', so draft/funded/exited properties are never exposed
 * publicly. Returns null when missing, not live, or on error.
 */
export async function getLivePropertyById(
  id: string
): Promise<LivePropertyDetail | null> {
  try {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("properties")
      .select(PUBLIC_DETAIL_COLUMNS)
      .eq("id", id)
      .eq("status", "live")
      .maybeSingle();

    if (error || !data) {
      if (error && process.env.NODE_ENV !== "production") {
        console.error("[properties] detail fetch failed", error);
      }
      return null;
    }

    return data as LivePropertyDetail;
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[properties] detail fetch error", error);
    }
    return null;
  }
}

/**
 * Public documents for a property. Only is_public = true rows are returned
 * (and RLS also enforces this). Soft-fails to an empty array.
 */
export async function getPublicPropertyDocuments(
  propertyId: string
): Promise<Pick<PropertyDocument, "id" | "title" | "document_type" | "file_url">[]> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("property_documents")
      .select("id, title, document_type, file_url")
      .eq("property_id", propertyId)
      .eq("is_public", true)
      .order("created_at", { ascending: false });

    if (error || !data) {
      if (error && process.env.NODE_ENV !== "production") {
        console.error("[properties] public documents fetch failed", error);
      }
      return [];
    }

    return data.map((row) => ({
      id: String(row.id),
      title: String(row.title ?? ""),
      document_type: String(row.document_type ?? "other"),
      file_url: String(row.file_url ?? ""),
    }));
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[properties] public documents error", error);
    }
    return [];
  }
}

export async function getLiveProperties(): Promise<Property[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error, count } = await supabase
    .from("properties")
    .select("*", { count: "exact" })
    .eq("status", "live")
    .order("created_at", { ascending: false });

  const {
    data: unrestrictedData,
    error: unrestrictedError,
    count: unrestrictedCount,
  } = await supabase
    .from("properties")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  console.log("[getLiveProperties] target: properties");
  console.log("[getLiveProperties] filtered error:", error);
  console.log("[getLiveProperties] filtered count:", count);
  console.log("[getLiveProperties] filtered rows:", data?.length ?? 0);
  console.log("[getLiveProperties] filtered sample:", data?.slice(0, 2));
  console.log(
    "[getLiveProperties] filtered sample keys:",
    data?.[0] ? Object.keys(data[0]) : undefined
  );

  console.log("[getLiveProperties] unrestricted error:", unrestrictedError);
  console.log("[getLiveProperties] unrestricted count:", unrestrictedCount);
  console.log("[getLiveProperties] unrestricted rows:", unrestrictedData?.length ?? 0);
  console.log(
    "[getLiveProperties] unrestricted sample keys:",
    unrestrictedData?.[0] ? Object.keys(unrestrictedData[0]) : undefined
  );

  if (error || !data) {
    return [];
  }

  return data.map(mapPropertyRow);
}
