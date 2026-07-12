import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { createSupabaseServiceClient } from "@/lib/supabase-service";
import { emitNotificationEvent, isNotificationEvent } from "@/lib/notification-events";

/**
 * POST /api/notifications — trusted, admin-gated notification emission (Sprint 7A).
 *
 * Mirrors the /api/deposits/[id]/verify trust model:
 *  - Auth is resolved from the Supabase session (cookies).
 *  - The caller must be an admin, checked with the request-scoped anon client
 *    (RLS-scoped read of their OWN profile). Non-admins get 403.
 *  - Only then does the server load the referenced entity and INSERT the
 *    notification with the SERVER-ONLY service client the browser can't obtain.
 *  - The body carries only { event, referenceId }; title/message/target user are
 *    derived server-side, so an admin cannot forge arbitrary notifications.
 *
 * No financial or blockchain logic runs here — notifications are side-effects.
 */
const REFERENCE_ID_RE = /^[A-Za-z0-9-]{1,64}$/;

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  // Admin gate — RLS-scoped read of the caller's own profile (no service role).
  const { data: profile, error: roleError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (roleError) {
    return NextResponse.json({ error: "role_lookup_failed" }, { status: 500 });
  }
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const { event, referenceId } = (body ?? {}) as {
    event?: unknown;
    referenceId?: unknown;
  };

  if (
    !isNotificationEvent(event) ||
    typeof referenceId !== "string" ||
    !REFERENCE_ID_RE.test(referenceId)
  ) {
    return NextResponse.json({ error: "invalid_event" }, { status: 400 });
  }

  const result = await emitNotificationEvent(
    event,
    referenceId,
    createSupabaseServiceClient()
  );

  return NextResponse.json({ emitted: result.emitted }, { status: 200 });
}
