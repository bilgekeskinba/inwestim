import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import type { AdminProperty } from "@/types/property";
import type { AdminInvestment } from "@/types/investment";
import type { AdminDistributionCycle } from "@/types/distribution";
import type { AdminDeposit, AdminWithdrawal } from "@/types/wallet";

// Re-exported so existing `@/lib/admin` type imports keep working.
export type {
  AdminProperty,
  AdminInvestment,
  AdminDistributionCycle,
  AdminDeposit,
  AdminWithdrawal,
};

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

export function adminDevError(scope: string, error: unknown) {
  // Keep production logs clean; only surface details while developing.
  if (process.env.NODE_ENV !== "production") {
    console.error(`[admin] ${scope}`, error);
  }
}

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
      userId: String(row.user_id ?? ""),
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
 * Counts legacy approved investments missing the distribution timestamps:
 *   status = 'approved' AND (approved_at IS NULL OR eligible_from IS NULL).
 * These were approved before those columns existed and are skipped by the
 * distribution engine until repaired. Soft-fails to 0.
 */
export async function getLegacyApprovedCount(
  supabase: SupabaseServerClient
): Promise<number> {
  try {
    const { count, error } = await supabase
      .from("investments")
      .select("id", { count: "exact", head: true })
      .eq("status", "approved")
      .or("approved_at.is.null,eligible_from.is.null");

    if (error) {
      adminDevError("legacy approved count failed", error);
      return 0;
    }
    return count ?? 0;
  } catch (error) {
    adminDevError("legacy approved count error", error);
    return 0;
  }
}

/**
 * Lists pending deposit requests for the admin panel, enriched with the
 * requester's email. Soft-fails to an empty array.
 */
export async function getPendingDeposits(
  supabase: SupabaseServerClient
): Promise<AdminDeposit[]> {
  try {
    // Select "*" so verification_* columns are included when present without
    // erroring before the migration is applied.
    const { data, error } = await supabase
      .from("deposit_requests")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error || !data) {
      adminDevError("pending deposits query failed", error);
      return [];
    }

    const userIds = [...new Set(data.map((r) => r.user_id).filter(Boolean))];
    const emails = new Map<string, string | null>();
    if (userIds.length > 0) {
      const { data: profs, error: profsError } = await supabase
        .from("profiles")
        .select("id, email")
        .in("id", userIds);
      if (profsError) adminDevError("deposit email lookup failed", profsError);
      profs?.forEach((p) => emails.set(String(p.id), p.email ? String(p.email) : null));
    }

    // Duplicate tx_hash detection across ALL deposit requests (any status).
    const txCounts = new Map<string, number>();
    const { data: allTx } = await supabase.from("deposit_requests").select("tx_hash");
    allTx?.forEach((r) => {
      const hash = r.tx_hash ? String(r.tx_hash) : null;
      if (hash) txCounts.set(hash, (txCounts.get(hash) ?? 0) + 1);
    });

    return data.map((row) => {
      const hash = (row.tx_hash as string | null) ?? null;
      return {
        id: String(row.id),
        userId: String(row.user_id ?? ""),
        userEmail: emails.get(String(row.user_id)) ?? null,
        amount: Number(row.amount) || 0,
        asset: String(row.asset ?? "USDC"),
        walletAddress: (row.wallet_address as string | null) ?? null,
        chain: (row.chain as string | null) ?? null,
        txHash: hash,
        status: String(row.status),
        createdAt: (row.created_at as string | null) ?? null,
        verificationStatus: (row.verification_status as string | null) ?? "not_verified",
        verificationDetails:
          (row.verification_details as AdminDeposit["verificationDetails"]) ?? null,
        verifiedAt: (row.verified_at as string | null) ?? null,
        isDuplicate: hash ? (txCounts.get(hash) ?? 0) > 1 : false,
      };
    });
  } catch (error) {
    adminDevError("pending deposits error", error);
    return [];
  }
}

/**
 * Lists pending + approved withdrawal requests for the admin panel, enriched
 * with the requester's email. Soft-fails to an empty array.
 */
export async function getPendingWithdrawals(
  supabase: SupabaseServerClient
): Promise<AdminWithdrawal[]> {
  try {
    const { data, error } = await supabase
      .from("withdrawal_requests")
      .select("id, user_id, wallet_address, chain, asset, amount, status, created_at")
      .in("status", ["pending", "approved"])
      .order("created_at", { ascending: false });

    if (error || !data) {
      adminDevError("pending withdrawals query failed", error);
      return [];
    }

    const userIds = [...new Set(data.map((r) => r.user_id).filter(Boolean))];
    const emails = new Map<string, string | null>();
    if (userIds.length > 0) {
      const { data: profs, error: profsError } = await supabase
        .from("profiles")
        .select("id, email")
        .in("id", userIds);
      if (profsError) adminDevError("withdrawal email lookup failed", profsError);
      profs?.forEach((p) => emails.set(String(p.id), p.email ? String(p.email) : null));
    }

    return data.map((row) => ({
      id: String(row.id),
      userId: String(row.user_id ?? ""),
      userEmail: emails.get(String(row.user_id)) ?? null,
      amount: Number(row.amount) || 0,
      asset: String(row.asset ?? "USDC"),
      walletAddress: (row.wallet_address as string | null) ?? null,
      chain: (row.chain as string | null) ?? null,
      status: String(row.status),
      createdAt: (row.created_at as string | null) ?? null,
    }));
  } catch (error) {
    adminDevError("pending withdrawals error", error);
    return [];
  }
}

export type TreasuryRecentDeposit = {
  id: string;
  userEmail: string | null;
  amount: number;
  status: string;
  verificationStatus: string;
  txHash: string | null;
  createdAt: string | null;
};

export type MissingLedgerCredit = {
  id: string;
  userEmail: string | null;
  amount: number;
  createdAt: string | null;
};

export type TreasuryOverview = {
  pendingCount: number;
  verifiedNotApprovedCount: number;
  completedCount: number;
  completedTotal: number;
  failedCount: number;
  totalCreditedDeposits: number;
  creditedCount: number;
  reconciliationDifference: number;
  reconciliationStatus: "balanced" | "mismatch";
  missingLedgerCredits: MissingLedgerCredit[];
  recentDeposits: TreasuryRecentDeposit[];
};

const EMPTY_TREASURY_OVERVIEW: TreasuryOverview = {
  pendingCount: 0,
  verifiedNotApprovedCount: 0,
  completedCount: 0,
  completedTotal: 0,
  failedCount: 0,
  totalCreditedDeposits: 0,
  creditedCount: 0,
  reconciliationDifference: 0,
  reconciliationStatus: "balanced",
  missingLedgerCredits: [],
  recentDeposits: [],
};

/**
 * Database-only operational overview of deposit activity for the treasury
 * dashboard. Does NOT query the blockchain. Soft-fails to zeroed metrics.
 */
export async function getTreasuryOverview(
  supabase: SupabaseServerClient
): Promise<TreasuryOverview> {
  try {
    const { data, error } = await supabase
      .from("deposit_requests")
      .select("id, user_id, amount, status, verification_status, tx_hash, created_at")
      .order("created_at", { ascending: false });

    if (error || !data) {
      adminDevError("treasury deposits query failed", error);
      return EMPTY_TREASURY_OVERVIEW;
    }

    const statusOf = (row: (typeof data)[number]) => String(row.status ?? "");
    const verificationOf = (row: (typeof data)[number]) =>
      String(row.verification_status ?? "not_verified");

    const pendingCount = data.filter((r) => statusOf(r) === "pending").length;
    const verifiedNotApprovedCount = data.filter(
      (r) =>
        verificationOf(r) === "verified" &&
        (statusOf(r) === "pending" || statusOf(r) === "confirming")
    ).length;
    const completed = data.filter((r) => statusOf(r) === "completed");
    const completedCount = completed.length;
    const completedTotal = completed.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
    const failedCount = data.filter((r) => statusOf(r) === "failed").length;

    // Ledger deposit credits (source of truth for money in). Pull reference_id
    // too so we can spot completed deposits with no matching credit.
    const { data: credits, error: creditsError } = await supabase
      .from("wallet_transactions")
      .select("amount, reference_id")
      .eq("type", "deposit")
      .eq("direction", "credit")
      .eq("status", "completed");
    if (creditsError) adminDevError("treasury credits query failed", creditsError);
    const totalCreditedDeposits = (credits ?? []).reduce(
      (sum, r) => sum + (Number(r.amount) || 0),
      0
    );
    const creditedCount = (credits ?? []).length;
    const creditedRefIds = new Set(
      (credits ?? []).map((r) => (r.reference_id ? String(r.reference_id) : "")).filter(Boolean)
    );

    // Reconciliation (rounded to avoid float noise; 0 → balanced).
    const reconciliationDifference =
      Math.round((completedTotal - totalCreditedDeposits) * 1e6) / 1e6;
    const reconciliationStatus: "balanced" | "mismatch" =
      reconciliationDifference === 0 ? "balanced" : "mismatch";

    // Completed deposit requests with no matching ledger credit.
    const missing = completed.filter((r) => !creditedRefIds.has(String(r.id))).slice(0, 5);

    // Recent 5 + missing 5 — enrich emails in one lookup.
    const recent = data.slice(0, 5);
    const userIds = [
      ...new Set([...recent, ...missing].map((r) => r.user_id).filter(Boolean)),
    ];
    const emails = new Map<string, string | null>();
    if (userIds.length > 0) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, email")
        .in("id", userIds);
      profs?.forEach((p) => emails.set(String(p.id), p.email ? String(p.email) : null));
    }

    const recentDeposits: TreasuryRecentDeposit[] = recent.map((r) => ({
      id: String(r.id),
      userEmail: emails.get(String(r.user_id)) ?? null,
      amount: Number(r.amount) || 0,
      status: statusOf(r),
      verificationStatus: verificationOf(r),
      txHash: (r.tx_hash as string | null) ?? null,
      createdAt: (r.created_at as string | null) ?? null,
    }));

    const missingLedgerCredits: MissingLedgerCredit[] = missing.map((r) => ({
      id: String(r.id),
      userEmail: emails.get(String(r.user_id)) ?? null,
      amount: Number(r.amount) || 0,
      createdAt: (r.created_at as string | null) ?? null,
    }));

    return {
      pendingCount,
      verifiedNotApprovedCount,
      completedCount,
      completedTotal,
      failedCount,
      totalCreditedDeposits,
      creditedCount,
      reconciliationDifference,
      reconciliationStatus,
      missingLedgerCredits,
      recentDeposits,
    };
  } catch (error) {
    adminDevError("treasury overview error", error);
    return EMPTY_TREASURY_OVERVIEW;
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
