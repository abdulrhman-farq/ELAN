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

/** Desktop-only left nav for the member app (mobile uses BottomTabs). */
export function MemberSidebar({ labels }: { labels: Record<string, string> }) {
  const path = usePathname();
  return (
    <aside className="sticky top-0 hidden h-screen shrink-0 flex-col gap-8 border-e border-outline bg-surface-elevated p-7 md:flex md:w-[240px]">
      <div className="wordmark text-3xl text-primary-900">ÉLAN</div>
      <nav className="flex flex-col gap-1.5">
        {TABS.map((t) => {
          const active = t.href === "/" ? path === "/" : path.startsWith(t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-[44px] items-center gap-3 rounded-sm px-4 py-3 text-body outline-none transition-[transform,background-color] active:scale-[.98] focus-visible:ring-2 focus-visible:ring-accent ${active ? "bg-primary font-medium text-ink ring-1 ring-accent" : "text-primary-900/70 hover:bg-surface-variant hover:text-primary-900"}`}
            >
              <Icon name={t.icon} filled={active} className="text-[20px]" />
              <span>{labels[t.key]}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
