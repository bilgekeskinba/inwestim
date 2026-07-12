import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServiceClient } from "@/lib/supabase-service";

/**
 * SERVER-ONLY trusted notification service (Sprint 7A).
 *
 * `createNotification` is the single trusted insert path for the notifications
 * table. It writes with the SERVER-ONLY service client (RLS-bypassing), so it
 * must NEVER be imported from client/browser code. Untrusted browser flows that
 * want to emit a notification go through the admin-gated POST /api/notifications
 * route, which calls the event emitters in lib/notification-events.ts, which in
 * turn call this helper.
 *
 * Idempotency: a notification is created at most once per
 * (user_id, type, reference_type, reference_id). The pre-check here plus the
 * partial unique index `notifications_dedupe_idx` make retried admin actions
 * safe (no duplicates).
 */

export const NOTIFICATION_TYPES = [
  "investment_submitted",
  "investment_approved",
  "investment_rejected",
  "deposit_submitted",
  "deposit_verified",
  "deposit_credited",
  "deposit_failed",
  "withdrawal_submitted",
  "withdrawal_approved",
  "withdrawal_completed",
  "withdrawal_failed",
  "distribution_calculated",
  "distribution_paid",
  "property_funded",
  "system",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export type CreateNotificationInput = {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  referenceType?: string | null;
  referenceId?: string | null;
  actionUrl?: string | null;
};

export type CreateNotificationResult = {
  /** True when a new row was inserted; false when skipped (duplicate/soft-fail). */
  created: boolean;
};

/**
 * Idempotently inserts one notification with the trusted service client.
 *
 * @param input notification fields (see CreateNotificationInput)
 * @param service optional service client; defaults to createSupabaseServiceClient()
 *
 * Soft-fails (returns { created: false }) instead of throwing, so a
 * notification failure can never break the financial/admin flow that triggered
 * it. Returns { created: false } when the service key is unconfigured.
 */
export async function createNotification(
  input: CreateNotificationInput,
  service?: SupabaseClient | null
): Promise<CreateNotificationResult> {
  const db = service ?? createSupabaseServiceClient();
  if (!db) {
    if (process.env.NODE_ENV !== "production") {
      console.error(`[notifications] service client unavailable — skipped (type=${input.type})`);
    }
    return { created: false };
  }

  if (!input.userId || !input.type || !input.title || !input.message) {
    return { created: false };
  }

  const referenceType = input.referenceType ?? null;
  const referenceId = input.referenceId ?? null;

  // Application-level idempotency pre-check: never create a second notification
  // for the same (user, type, referenced entity). Skipped for reference-less
  // notifications (e.g. 'system'), which are allowed to repeat.
  if (referenceId) {
    let existingQuery = db
      .from("notifications")
      .select("id")
      .eq("user_id", input.userId)
      .eq("type", input.type)
      .eq("reference_id", referenceId)
      .limit(1);
    existingQuery =
      referenceType === null
        ? existingQuery.is("reference_type", null)
        : existingQuery.eq("reference_type", referenceType);

    const { data: existing } = await existingQuery;
    if (existing && existing.length > 0) return { created: false };
  }

  const { error } = await db.from("notifications").insert({
    user_id: input.userId,
    type: input.type,
    title: input.title,
    message: input.message,
    reference_type: referenceType,
    reference_id: referenceId,
    action_url: input.actionUrl ?? null,
  });

  if (error) {
    // 23505 = unique-violation from notifications_dedupe_idx: a concurrent
    // insert won the race, so the notification already exists — not an error.
    if (error.code === "23505") return { created: false };
    if (process.env.NODE_ENV !== "production") {
      console.error(
        `[notifications] insert failed (type=${input.type}, code=${error.code ?? "db_error"})`
      );
    }
    return { created: false };
  }

  return { created: true };
}
