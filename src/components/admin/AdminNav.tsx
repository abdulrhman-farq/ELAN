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
    <nav className="flex flex-wrap gap-2">
      {items.map((it) => {
        const active = it.href === "/admin" ? path === "/admin" : path.startsWith(it.href);
        return (
          <Link
            key={it.href}
            href={it.href}
            className={`chip ${active ? "bg-primary text-white" : "bg-surface-variant text-primary-700"}`}
          >
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
