/**
 * Client-safe notification emit helper (Sprint 7A).
 *
 * Untrusted browser code (admin panel components) calls this after a successful
 * admin action. It does NOT insert anything — it only asks the admin-gated,
 * server-only POST /api/notifications route to emit a trusted notification. The
 * server re-verifies the caller is an admin and re-derives all content, so this
 * helper carries no privilege of its own.
 *
 * Best-effort by design: failures are swallowed (logged in dev only) so a
 * notification hiccup never blocks or reverts the financial/admin flow that
 * already committed.
 */
/**
 * Window event broadcast after the user changes their own read-state (mark one
 * / mark all). The AppShell unread badge listens for it to refresh instantly,
 * without a full navigation or realtime subscription.
 */
export const NOTIFICATIONS_CHANGED_EVENT = "notifications:changed";

export function broadcastNotificationsChanged(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT));
  }
}

export async function emitNotification(
  event: string,
  referenceId: string
): Promise<void> {
  try {
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, referenceId }),
      keepalive: true,
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[notifications] emit request failed", error);
    }
  }
}
