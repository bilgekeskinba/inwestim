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
