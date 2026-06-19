"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./Icon";

const TABS = [
  { href: "/", key: "timetable", icon: "calendar_month" },
  { href: "/bookings", key: "bookings", icon: "confirmation_number" },
  { href: "/memberships", key: "memberships", icon: "credit_card" },
  { href: "/profile", key: "profile", icon: "person" },
] as const;

export function BottomTabs({ labels }: { labels: Record<string, string> }) {
  const path = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-outline bg-surface pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
      <ul className="mx-auto flex max-w-md items-stretch justify-around">
        {TABS.map((t) => {
          const active = t.href === "/" ? path === "/" : path.startsWith(t.href);
          return (
            <li key={t.href} className="flex-1">
              <Link href={t.href} className={`flex flex-col items-center gap-0.5 py-1 text-xs ${active ? "text-primary" : "text-status-full"}`}>
                <Icon name={t.icon} filled={active} className="text-[22px]" />
                <span>{labels[t.key]}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
