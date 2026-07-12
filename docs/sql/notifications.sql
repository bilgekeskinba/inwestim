-- Sprint 7A — In-App Notifications Foundation
-- ---------------------------------------------------------------------------
-- Persistent, per-user notification center. IN-APP ONLY (no email, no push).
--
-- Security model (RLS-safe, mirrors the existing app):
--   * A signed-in user may READ only their own notifications.
--   * A signed-in user may UPDATE only the read-state (is_read, read_at) of
--     their own notifications — enforced by BOTH a column-level GRANT and an
--     RLS policy.
--   * No one may INSERT or DELETE via the anon/authenticated roles. Trusted
--     server flows insert with the service-role key (SUPABASE_SERVICE_ROLE_KEY),
--     which bypasses RLS. The service-role key is never exposed to the browser.
--
-- This migration only ADDS a table/policies/grants. It does not touch any
-- existing table, policy, or grant, so it cannot weaken current RLS.

-- 1. Table ------------------------------------------------------------------
create table if not exists public.notifications (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  type           text not null,
  title          text not null,
  message        text not null,
  reference_type text,
  reference_id   uuid,
  action_url     text,
  is_read        boolean not null default false,
  created_at     timestamptz not null default now(),
  read_at        timestamptz,
  constraint notifications_type_check check (type in (
    'investment_submitted',
    'investment_approved',
    'investment_rejected',
    'deposit_submitted',
    'deposit_verified',
    'deposit_credited',
    'deposit_failed',
    'withdrawal_submitted',
    'withdrawal_approved',
    'withdrawal_completed',
    'withdrawal_failed',
    'distribution_calculated',
    'distribution_paid',
    'property_funded',
    'system'
  ))
);

-- 2. Indexes ----------------------------------------------------------------
-- Newest-first list, scoped per user (drives the notifications page query).
create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

-- Cheap unread count / unread filter and the AppShell badge.
create index if not exists notifications_user_unread_idx
  on public.notifications (user_id)
  where is_read = false;

-- Idempotency: at most ONE notification per (user, type, referenced entity).
-- Partial so reference-less rows (e.g. 'system') are exempt and can repeat.
-- This is the DB-level guard behind the application pre-check in
-- lib/notifications.ts; together they stop duplicates when an admin action is
-- retried (double-click, re-approve, re-run "Mark as Paid").
create unique index if not exists notifications_dedupe_idx
  on public.notifications (user_id, type, reference_type, reference_id)
  where reference_id is not null;

-- 3. Column-level grants ----------------------------------------------------
-- Supabase grants broad table privileges to anon/authenticated by default.
-- Tighten them: an authenticated user can SELECT their rows and UPDATE ONLY
-- the two read-state columns. No insert, no delete, and title/message/type/
-- reference/action_url are immutable from the client.
revoke all on public.notifications from anon, authenticated;
grant select on public.notifications to authenticated;
grant update (is_read, read_at) on public.notifications to authenticated;
-- service_role keeps its default full access (and bypasses RLS) for trusted
-- server-side inserts.

-- 4. Row Level Security -----------------------------------------------------
alter table public.notifications enable row level security;

-- Read only your own notifications.
create policy "notifications_select_own"
  on public.notifications
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Update only your own notifications. The GRANT above already limits WHICH
-- columns can change (is_read, read_at); WITH CHECK stops a row being
-- re-assigned to another user.
create policy "notifications_update_own"
  on public.notifications
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- No INSERT or DELETE policy is defined on purpose: under RLS the anon and
-- authenticated roles therefore cannot insert or delete. Notification creation
-- is a trusted, server-only operation performed with the service-role key.
