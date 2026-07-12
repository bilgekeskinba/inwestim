import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServiceClient } from "@/lib/supabase-service";
import { createNotification } from "@/lib/notifications";
import { formatUSDC } from "@/lib/format/currency";

/**
 * SERVER-ONLY notification event emitters (Sprint 7A).
 *
 * Each emitter takes a trusted event name plus the id of the entity the event
 * is about, loads the entity with the service client, and DERIVES the
 * notification's target user, title, message and action URL SERVER-SIDE. The
 * browser never supplies notification content — it only asks "event X happened
 * for reference Y", and the (admin-gated) route re-derives everything here. An
 * admin therefore cannot forge an arbitrary message to an arbitrary user.
 *
 * Only the six events integrated in this sprint are handled. Idempotency is
 * provided by createNotification (keyed on user + type + reference).
 */

export const NOTIFICATION_EVENTS = [
  "investment_approved",
  "investment_rejected",
  "deposit_credited",
  "withdrawal_approved",
  "withdrawal_completed",
  "distribution_paid",
] as const;

export type NotificationEvent = (typeof NOTIFICATION_EVENTS)[number];

export function isNotificationEvent(value: unknown): value is NotificationEvent {
  return (
    typeof value === "string" &&
    (NOTIFICATION_EVENTS as readonly string[]).includes(value)
  );
}

export type EmitResult = {
  /** Number of notifications actually created (excludes idempotent skips). */
  emitted: number;
};

/**
 * Dispatches a trusted notification event. `referenceId` is the entity id for
 * single-target events (investment / deposit / withdrawal) or the distribution
 * cycle id for `distribution_paid` (which fans out one notification per payout).
 */
export async function emitNotificationEvent(
  event: NotificationEvent,
  referenceId: string,
  service?: SupabaseClient | null
): Promise<EmitResult> {
  const db = service ?? createSupabaseServiceClient();
  if (!db) return { emitted: 0 };

  switch (event) {
    case "investment_approved":
    case "investment_rejected":
      return emitInvestmentDecision(db, event, referenceId);
    case "deposit_credited":
      return emitDepositCredited(db, referenceId);
    case "withdrawal_approved":
    case "withdrawal_completed":
      return emitWithdrawalUpdate(db, event, referenceId);
    case "distribution_paid":
      return emitDistributionPaid(db, referenceId);
    default:
      return { emitted: 0 };
  }
}

async function emitInvestmentDecision(
  db: SupabaseClient,
  event: "investment_approved" | "investment_rejected",
  investmentId: string
): Promise<EmitResult> {
  const { data: investment } = await db
    .from("investments")
    .select("id, user_id, property_id, amount")
    .eq("id", investmentId)
    .maybeSingle();

  if (!investment?.user_id) return { emitted: 0 };

  const propertyId = investment.property_id ? String(investment.property_id) : "";
  const { data: property } = propertyId
    ? await db.from("properties").select("title").eq("id", propertyId).maybeSingle()
    : { data: null };
  const propertyTitle = property?.title ? String(property.title) : "your property";

  const approved = event === "investment_approved";
  const result = await createNotification(
    {
      userId: String(investment.user_id),
      type: approved ? "investment_approved" : "investment_rejected",
      title: approved ? "Investment approved" : "Investment not approved",
      message: approved
        ? `Your investment in ${propertyTitle} has been approved.`
        : `Your investment request for ${propertyTitle} was rejected.`,
      referenceType: "investment",
      referenceId: String(investment.id),
      actionUrl: approved && propertyId ? `/dashboard/positions/${propertyId}` : "/dashboard",
    },
    db
  );

  return { emitted: result.created ? 1 : 0 };
}

async function emitDepositCredited(
  db: SupabaseClient,
  depositId: string
): Promise<EmitResult> {
  const { data: deposit } = await db
    .from("deposit_requests")
    .select("id, user_id, amount")
    .eq("id", depositId)
    .maybeSingle();

  if (!deposit?.user_id) return { emitted: 0 };

  const result = await createNotification(
    {
      userId: String(deposit.user_id),
      type: "deposit_credited",
      title: "Deposit credited",
      message: `${formatUSDC(deposit.amount)} has been credited to your Inwestim Wallet.`,
      referenceType: "deposit_request",
      referenceId: String(deposit.id),
      actionUrl: "/wallet",
    },
    db
  );

  return { emitted: result.created ? 1 : 0 };
}

async function emitWithdrawalUpdate(
  db: SupabaseClient,
  event: "withdrawal_approved" | "withdrawal_completed",
  withdrawalId: string
): Promise<EmitResult> {
  const { data: withdrawal } = await db
    .from("withdrawal_requests")
    .select("id, user_id, amount")
    .eq("id", withdrawalId)
    .maybeSingle();

  if (!withdrawal?.user_id) return { emitted: 0 };

  const approved = event === "withdrawal_approved";
  const result = await createNotification(
    {
      userId: String(withdrawal.user_id),
      type: approved ? "withdrawal_approved" : "withdrawal_completed",
      title: approved ? "Withdrawal approved" : "Withdrawal completed",
      message: approved
        ? `Your withdrawal of ${formatUSDC(withdrawal.amount)} was approved and is awaiting payout.`
        : `${formatUSDC(withdrawal.amount)} was sent to your destination wallet.`,
      referenceType: "withdrawal_request",
      referenceId: String(withdrawal.id),
      actionUrl: "/wallet",
    },
    db
  );

  return { emitted: result.created ? 1 : 0 };
}

async function emitDistributionPaid(
  db: SupabaseClient,
  cycleId: string
): Promise<EmitResult> {
  // One notification per paid payout row (keyed on rental_distribution.id), so
  // every recipient in the cycle is notified exactly once — matching how the
  // ledger credits are keyed. Re-running "Mark as Paid" adds no duplicates.
  const { data: payouts } = await db
    .from("rental_distributions")
    .select("id, user_id, amount, property_id")
    .eq("distribution_cycle_id", cycleId)
    .eq("status", "paid");

  if (!payouts || payouts.length === 0) return { emitted: 0 };

  const propertyIds = [
    ...new Set(payouts.map((p) => (p.property_id ? String(p.property_id) : "")).filter(Boolean)),
  ];
  const titles = new Map<string, string>();
  if (propertyIds.length > 0) {
    const { data: props } = await db
      .from("properties")
      .select("id, title")
      .in("id", propertyIds);
    props?.forEach((p) => titles.set(String(p.id), String(p.title)));
  }

  let emitted = 0;
  for (const payout of payouts) {
    if (!payout.user_id) continue;
    const propertyId = payout.property_id ? String(payout.property_id) : "";
    const propertyTitle = titles.get(propertyId) ?? "your property";

    const result = await createNotification(
      {
        userId: String(payout.user_id),
        type: "distribution_paid",
        title: "Distribution paid",
        message: `You received ${formatUSDC(payout.amount)} from ${propertyTitle}.`,
        referenceType: "rental_distribution",
        referenceId: String(payout.id),
        actionUrl: propertyId ? `/dashboard/positions/${propertyId}` : "/dashboard",
      },
      db
    );
    if (result.created) emitted += 1;
  }

  return { emitted };
}
