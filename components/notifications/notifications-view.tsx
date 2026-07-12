"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { broadcastNotificationsChanged } from "@/lib/notifications-client";
import { formatDateTime } from "@/lib/format/date";
import { cn } from "@/lib/utils";
import type { NotificationItem } from "@/types/notification";

type Filter = "all" | "unread";

// Only same-origin, absolute in-app paths are navigable — never an external URL.
function isSafeActionUrl(url: string | null): url is string {
  return typeof url === "string" && url.startsWith("/") && !url.startsWith("//");
}

export function NotificationsView({
  userId,
  initialItems,
}: {
  userId: string;
  initialItems: NotificationItem[];
}) {
  const router = useRouter();
  const [items, setItems] = useState<NotificationItem[]>(initialItems);
  const [filter, setFilter] = useState<Filter>("all");
  const [busy, setBusy] = useState(false);

  const unreadCount = useMemo(() => items.filter((i) => !i.is_read).length, [items]);
  const visible = useMemo(
    () => (filter === "unread" ? items.filter((i) => !i.is_read) : items),
    [items, filter]
  );

  // Optimistically flip local state, then persist. RLS restricts the update to
  // the caller's own rows and the column grant restricts it to is_read/read_at.
  const markRead = async (ids: string[]) => {
    const target = ids.filter((id) => items.some((i) => i.id === id && !i.is_read));
    if (target.length === 0) return;

    const readAt = new Date().toISOString();
    setItems((prev) =>
      prev.map((i) => (target.includes(i.id) ? { ...i, is_read: true, read_at: readAt } : i))
    );

    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true, read_at: readAt })
      .in("id", target)
      .eq("is_read", false);

    if (error && process.env.NODE_ENV !== "production") {
      console.error("[notifications] mark read failed", error);
    }
    broadcastNotificationsChanged();
  };

  const markAllRead = async () => {
    if (unreadCount === 0) return;
    setBusy(true);

    const readAt = new Date().toISOString();
    setItems((prev) => prev.map((i) => (i.is_read ? i : { ...i, is_read: true, read_at: readAt })));

    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true, read_at: readAt })
      .eq("user_id", userId)
      .eq("is_read", false);

    if (error && process.env.NODE_ENV !== "production") {
      console.error("[notifications] mark all read failed", error);
    }
    broadcastNotificationsChanged();
    setBusy(false);
  };

  const onOpen = (item: NotificationItem) => {
    void markRead([item.id]);
    if (isSafeActionUrl(item.action_url)) {
      router.push(item.action_url);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Controls: filters + unread count + mark-all */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <FilterTab active={filter === "all"} onClick={() => setFilter("all")}>
            All
          </FilterTab>
          <FilterTab active={filter === "unread"} onClick={() => setFilter("unread")}>
            Unread
            {unreadCount > 0 ? (
              <span className="ml-2 rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-300">
                {unreadCount}
              </span>
            ) : null}
          </FilterTab>
        </div>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={markAllRead}
          disabled={busy || unreadCount === 0}
        >
          Mark all as read
        </Button>
      </div>

      {/* List */}
      {visible.length === 0 ? (
        <EmptyState
          className="min-h-[200px]"
          title={filter === "unread" ? "You're all caught up." : "No notifications yet."}
          description={
            filter === "unread"
              ? "You have no unread notifications."
              : "We'll let you know when something needs your attention."
          }
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {visible.map((item) => {
            const clickable = isSafeActionUrl(item.action_url);
            return (
              <li key={item.id}>
                <div
                  role={clickable ? "button" : undefined}
                  tabIndex={clickable ? 0 : undefined}
                  onClick={clickable ? () => onOpen(item) : undefined}
                  onKeyDown={
                    clickable
                      ? (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onOpen(item);
                          }
                        }
                      : undefined
                  }
                  className={cn(
                    "flex flex-col gap-3 rounded-3xl border p-5 transition-colors sm:flex-row sm:items-start sm:justify-between",
                    item.is_read
                      ? "border-white/10 bg-slate-950/40"
                      : "border-emerald-400/20 bg-emerald-400/5",
                    clickable && "cursor-pointer hover:border-white/20 hover:bg-slate-900/60"
                  )}
                >
                  <div className="flex min-w-0 gap-3">
                    {/* Unread dot */}
                    <span
                      aria-hidden
                      className={cn(
                        "mt-1.5 h-2.5 w-2.5 flex-shrink-0 rounded-full",
                        item.is_read ? "bg-transparent" : "bg-emerald-400"
                      )}
                    />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <h3
                          className={cn(
                            "text-sm font-semibold",
                            item.is_read ? "text-slate-200" : "text-white"
                          )}
                        >
                          {item.title}
                        </h3>
                        {!item.is_read ? (
                          <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-300">
                            New
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm text-slate-400">{item.message}</p>
                      <p className="mt-2 text-xs text-slate-500">
                        {formatDateTime(item.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-shrink-0 items-center gap-2 sm:pl-3">
                    {clickable ? (
                      <span className="text-xs font-medium text-emerald-300">View →</span>
                    ) : null}
                    {!item.is_read ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          void markRead([item.id]);
                        }}
                        className="text-slate-400 hover:text-white"
                      >
                        Mark read
                      </Button>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function FilterTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center rounded-full px-4 py-2 text-sm font-medium transition-colors",
        active ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"
      )}
    >
      {children}
    </button>
  );
}
