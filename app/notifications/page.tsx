import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { CardContent } from "@/components/ui/card";
import { AppShell } from "@/components/app-shell";
import { AppSectionCard } from "@/components/app-section-card";
import { AppSectionHeader } from "@/components/app-section-header";
import { NotificationsView } from "@/components/notifications/notifications-view";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import type { NotificationItem } from "@/types/notification";

export const metadata: Metadata = {
  title: "Notifications | Inwestim",
  description: "Your Inwestim notifications.",
};

const NOTIFICATION_COLUMNS =
  "id, type, title, message, reference_type, reference_id, action_url, is_read, created_at, read_at";

export default async function NotificationsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  // RLS restricts this to the current user's own rows; the explicit user_id
  // filter is defense-in-depth. Soft-fail to an empty list.
  const { data, error } = await supabase
    .from("notifications")
    .select(NOTIFICATION_COLUMNS)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  const items: NotificationItem[] = error || !data ? [] : (data as NotificationItem[]);
  const unreadCount = items.filter((i) => !i.is_read).length;

  return (
    <AppShell>
      <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
        <div className="relative mx-auto max-w-7xl px-6 py-10 lg:px-8">
          <div className="mb-8">
            <p className="text-sm uppercase tracking-[0.24em] text-emerald-400/80">Notifications</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Notifications
            </h1>
            <p className="mt-2 max-w-2xl text-base text-slate-300">
              {unreadCount > 0
                ? `You have ${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}.`
                : "Updates about your investments and distributions."}
            </p>
          </div>

          <AppSectionCard>
            <AppSectionHeader
              title="Recent activity"
              description="Investment approvals, payouts, and announcements."
            />
            <CardContent>
              <NotificationsView userId={user.id} initialItems={items} />
            </CardContent>
          </AppSectionCard>
        </div>
      </main>
    </AppShell>
  );
}
