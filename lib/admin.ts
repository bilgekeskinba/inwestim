import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

export function adminDevError(scope: string, error: unknown) {
  // Keep production logs clean; only surface details while developing.
  if (process.env.NODE_ENV !== "production") {
    console.error(`[admin] ${scope}`, error);
  }
}

// Raw shape of a row in the public.properties table.
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

export const PROPERTY_STATUSES = ["draft", "live", "funded", "exited"] as const;
export const RISK_LEVELS = ["low", "medium", "high"] as const;

// Columns we read/write for the admin panel.
const PROPERTY_COLUMNS =
  "id, title, location, description, image_url, total_value, minimum_investment, expected_annual_return, monthly_rental_income, funding_percentage, risk_level, status, created_at";

/**
 * Guards an admin route. Resolves to the authenticated admin's Supabase client
 * and user, or redirects:
 *   - not signed in        -> /sign-in
 *   - signed in, not admin -> /dashboard
 *
 * Uses RLS only: the profile lookup runs as the current user (no service role).
 */
export async function requireAdmin(): Promise<{
  supabase: SupabaseServerClient;
  userId: string;
}> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user?.id) {
    redirect("/sign-in");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    adminDevError("admin role lookup failed", profileError);
    redirect("/dashboard");
  }

  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  return { supabase, userId: user.id };
}

export type AdminStats = {
  total: number;
  live: number;
  draft: number;
  funded: number;
};

/**
 * Fetches all properties for the admin list. Soft-fails to an empty array so a
 * query error never crashes the admin panel.
 */
export async function getAdminProperties(
  supabase: SupabaseServerClient
): Promise<AdminProperty[]> {
  try {
    const { data, error } = await supabase
      .from("properties")
      .select(PROPERTY_COLUMNS)
      .order("created_at", { ascending: false });

    if (error || !data) {
      adminDevError("properties list query failed", error);
      return [];
    }

    return data as AdminProperty[];
  } catch (error) {
    adminDevError("properties list error", error);
    return [];
  }
}

// Derives dashboard counts from the already-fetched property list.
export function deriveAdminStats(properties: AdminProperty[]): AdminStats {
  return {
    total: properties.length,
    live: properties.filter((p) => p.status === "live").length,
    draft: properties.filter((p) => p.status === "draft").length,
    funded: properties.filter((p) => p.status === "funded").length,
  };
}

export type AdminInvestment = {
  id: string;
  amount: number;
  status: string;
  created_at: string | null;
  propertyId: string;
  propertyTitle: string;
  propertyTotalValue: number;
  userEmail: string | null;
};

/**
 * Lists pending investment requests for the admin panel, enriched with the
 * property title and (when readable) the investor's email. Soft-fails to an
 * empty array. The email join depends on an admin SELECT policy on profiles;
 * if that policy is absent, emails simply render as "—".
 */
export async function getPendingInvestments(
  supabase: SupabaseServerClient
): Promise<AdminInvestment[]> {
  try {
    const { data, error } = await supabase
      .from("investments")
      .select("id, amount, status, created_at, property_id, user_id")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error || !data) {
      adminDevError("pending investments query failed", error);
      return [];
    }

    const propertyIds = [...new Set(data.map((r) => r.property_id).filter(Boolean))];
    const userIds = [...new Set(data.map((r) => r.user_id).filter(Boolean))];

    const titles = new Map<string, string>();
    const totalValues = new Map<string, number>();
    if (propertyIds.length > 0) {
      const { data: props } = await supabase
        .from("properties")
        .select("id, title, total_value")
        .in("id", propertyIds);
      props?.forEach((p) => {
        titles.set(String(p.id), String(p.title));
        totalValues.set(String(p.id), Number(p.total_value) || 0);
      });
    }

    const emails = new Map<string, string | null>();
    if (userIds.length > 0) {
      const { data: profs, error: profsError } = await supabase
        .from("profiles")
        .select("id, email")
        .in("id", userIds);
      if (profsError) adminDevError("investor email lookup failed", profsError);
      profs?.forEach((p) =>
        emails.set(String(p.id), p.email ? String(p.email) : null)
      );
    }

    return data.map((row) => ({
      id: String(row.id),
      amount: Number(row.amount) || 0,
      status: String(row.status),
      created_at: (row.created_at as string | null) ?? null,
      propertyId: String(row.property_id ?? ""),
      propertyTitle: titles.get(String(row.property_id)) ?? "Property",
      propertyTotalValue: totalValues.get(String(row.property_id)) ?? 0,
      userEmail: emails.get(String(row.user_id)) ?? null,
    }));
  } catch (error) {
    adminDevError("pending investments error", error);
    return [];
  }
}

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

/**
 * Lists distribution cycles for the admin panel, enriched with property titles.
 * Soft-fails to an empty array.
 */
export async function getDistributionCycles(
  supabase: SupabaseServerClient
): Promise<AdminDistributionCycle[]> {
  try {
    const { data, error } = await supabase
      .from("distribution_cycles")
      .select(
        "id, property_id, distribution_type, period_start, period_end, net_distribution, status, created_at"
      )
      .order("created_at", { ascending: false });

    if (error || !data) {
      adminDevError("distribution cycles query failed", error);
      return [];
    }

    const propertyIds = [...new Set(data.map((r) => r.property_id).filter(Boolean))];
    const titles = new Map<string, string>();
    if (propertyIds.length > 0) {
      const { data: props } = await supabase
        .from("properties")
        .select("id, title")
        .in("id", propertyIds);
      props?.forEach((p) => titles.set(String(p.id), String(p.title)));
    }

    return data.map((row) => ({
      id: String(row.id),
      propertyTitle: titles.get(String(row.property_id)) ?? "Property",
      distributionType: String(row.distribution_type),
      periodStart: (row.period_start as string | null) ?? null,
      periodEnd: (row.period_end as string | null) ?? null,
      netDistribution: Number(row.net_distribution) || 0,
      status: String(row.status),
      createdAt: (row.created_at as string | null) ?? null,
    }));
  } catch (error) {
    adminDevError("distribution cycles error", error);
    return [];
  }
}

/**
 * Loads a single property by id for the edit page. Returns null when missing or
 * on error so the caller can render a not-found state.
 */
export async function getAdminProperty(
  supabase: SupabaseServerClient,
  id: string
): Promise<AdminProperty | null> {
  try {
    const { data, error } = await supabase
      .from("properties")
      .select(PROPERTY_COLUMNS)
      .eq("id", id)
      .maybeSingle();

    if (error) {
      adminDevError("property fetch failed", error);
      return null;
    }

    return (data as AdminProperty) ?? null;
  } catch (error) {
    adminDevError("property fetch error", error);
    return null;
  }
}
