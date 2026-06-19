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
            className={`whitespace-nowrap rounded-[10px] px-3.5 py-3 ${active ? "bg-white/10 text-accent" : "text-ink/60 hover:text-ink"}`}
          >
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
