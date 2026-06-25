import { createSupabaseServerClient } from "@/lib/supabase-server";
import { Property } from "@/types/property";

function mapPropertyRow(row: Record<string, unknown>): Property {
  return {
    id: String(row.id ?? ""),
    image: String(row.image ?? row.image_url ?? row.imageUrl ?? ""),
    title: String(row.title ?? ""),
    location: String(row.location ?? ""),
    description: String(row.description ?? ""),
    status: String(row.status ?? "live") as Property["status"],
    riskType: String(row.risk_type ?? row.riskType ?? "Medium") as Property["riskType"],
    fundingProgress: Number(row.funding_progress ?? row.fundingProgress ?? 0),
    offeringAmount: Number(row.offering_amount ?? row.offeringAmount ?? 0),
    minimumEntry: Number(row.minimum_entry ?? row.minimumEntry ?? 0),
    purchasePrice: Number(row.purchase_price ?? row.purchasePrice ?? 0),
    investors: Number(row.investors ?? 0) || 0,
    currentValuation:
      row.current_valuation ?? row.currentValuation
        ? Number(row.current_valuation ?? row.currentValuation)
        : undefined,
    yearlyInvestmentReturn: Number(row.yearly_investment_return ?? row.yearlyInvestmentReturn ?? 0),
    rentalIncome: Number(row.rental_income ?? row.rentalIncome ?? 0),
    totalROI: Number(row.total_roi ?? row.totalROI ?? 0),
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
