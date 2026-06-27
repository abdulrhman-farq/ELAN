"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./Icon";

const TABS = [
  { href: "/", key: "home", icon: "home" },
  { href: "/schedule", key: "timetable", icon: "calendar_month" },
  { href: "/bookings", key: "bookings", icon: "event_available" },
  { href: "/memberships", key: "memberships", icon: "card_membership" },
  { href: "/profile", key: "profile", icon: "person" },
] as const;

export function BottomTabs({ labels, unread = 0 }: { labels: Record<string, string>; unread?: number }) {
  const path = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-outline bg-surface-elevated pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-sticky md:hidden">
      <ul className="mx-auto flex max-w-md items-stretch justify-around">
        {TABS.map((t) => {
          const active = t.href === "/" ? path === "/" : path.startsWith(t.href);
          const anchor = t.key === "timetable"; // Schedule = most-used action, visual anchor
          return (
            <li key={t.href} className="flex-1">
              <Link
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={`relative flex min-h-[44px] flex-col items-center justify-center gap-0.5 rounded-md py-1.5 text-caption outline-none transition-transform active:scale-[.92] focus-visible:ring-2 focus-visible:ring-accent ${
                  active ? "font-medium text-primary-900" : anchor ? "text-primary-900/80" : "text-status-full"
                }`}
              >
                {/* gold indicator dot — active state does not rely on low-contrast gold text */}
                <span
                  aria-hidden
                  className={`absolute top-0 h-1 w-1 rounded-full bg-accent transition-opacity ${active ? "opacity-100" : "opacity-0"}`}
                />
                <span className="relative">
                  <Icon name={t.icon} filled={active || anchor} className={anchor ? "text-[24px]" : "text-[20px]"} />
                  {t.key === "profile" && unread > 0 ? (
                    <span className="absolute -end-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 font-number text-[10px] font-medium text-primary-900">
                      {unread > 9 ? "9+" : unread}
                    </span>
                  ) : null}
                </span>
                <span>{labels[t.key]}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
