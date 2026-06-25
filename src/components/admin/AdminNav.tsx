"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export interface AdminNavItem {
  href: string;
  label: string;
}

export function AdminNav({ items }: { items: AdminNavItem[] }) {
  const path = usePathname();
  return (
    <nav className="flex flex-row gap-1.5 overflow-x-auto text-sm md:flex-col">
      {items.map((it) => {
        const active = it.href === "/admin" ? path === "/admin" : path.startsWith(it.href);
        return (
          <Link
            key={it.href}
            href={it.href}
            aria-current={active ? "page" : undefined}
            className={`whitespace-nowrap rounded-[10px] px-3.5 py-3 outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-brand ${active ? "bg-white/10 text-accent" : "text-ink/60 hover:text-ink"}`}
          >
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
