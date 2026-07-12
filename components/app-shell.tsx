"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { NOTIFICATIONS_CHANGED_EVENT } from "@/lib/notifications-client";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/wallet", label: "Wallet" },
  { href: "/properties", label: "Properties" },
  { href: "/notifications", label: "Notifications" },
  { href: "/profile", label: "Profile" },
  { href: "/settings", label: "Settings" },
];

/**
 * Tracks the current user's unread notification count for the nav badge. RLS
 * scopes the count to their own rows, so no user id is needed. Refreshes on
 * navigation (pathname change) and on the in-app `notifications:changed` event
 * (fired after the user marks notifications read). Soft-fails to 0.
 */
function useUnreadNotifications(pathname: string): number {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const { count } = await supabase
          .from("notifications")
          .select("id", { count: "exact", head: true })
          .eq("is_read", false);
        if (active) setUnread(count ?? 0);
      } catch {
        if (active) setUnread(0);
      }
    };

    void load();
    const onChange = () => void load();
    window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, onChange);
    return () => {
      active = false;
      window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, onChange);
    };
  }, [pathname]);

  return unread;
}

/**
 * Shared shell for authenticated app pages (dashboard, wallet, profile,
 * notifications, settings, position detail). Renders a sticky top nav — logo,
 * links, logout — then the page content. It intentionally does NOT wrap the
 * content in a background container, so each page keeps its own dark hero/bg.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const unread = useUnreadNotifications(pathname);

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4 lg:px-8">
          <a href="/" className="flex items-center gap-2" aria-label="Inwestim home">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
              <span className="text-lg font-bold text-white">I</span>
            </div>
            <span className="text-lg font-semibold tracking-tight text-white">Inwestim</span>
          </a>

          <nav className="order-3 flex w-full flex-wrap items-center gap-1 md:order-2 md:w-auto">
            {NAV_LINKS.map((link) => {
              const isActive =
                pathname === link.href || pathname.startsWith(`${link.href}/`);
              const showBadge = link.href === "/notifications" && unread > 0;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-white/10 text-white"
                      : "text-slate-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {link.label}
                  {showBadge ? (
                    <span
                      aria-label={`${unread} unread notifications`}
                      className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-semibold leading-none text-white"
                    >
                      {unread > 9 ? "9+" : unread}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>

          <form action="/dashboard/logout" method="post" className="order-2 md:order-3">
            <Button type="submit" variant="secondary" size="sm">
              Log out
            </Button>
          </form>
        </div>
      </header>

      {children}
    </>
  );
}
