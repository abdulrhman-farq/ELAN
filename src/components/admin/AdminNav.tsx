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
    <nav className="flex flex-col gap-1.5 text-sm">
      {items.map((it) => {
        const active = it.href === "/admin" ? path === "/admin" : path.startsWith(it.href);
        return (
          <Link
            key={it.href}
            href={it.href}
            className={`rounded-[4px] px-3.5 py-3 ${active ? "bg-primary text-surface" : "text-surface/70 hover:text-surface"}`}
          >
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
