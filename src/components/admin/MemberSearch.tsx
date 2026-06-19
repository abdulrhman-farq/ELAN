"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function MemberSearch({ initial, placeholder }: { initial: string; placeholder: string }) {
  const router = useRouter();
  const [value, setValue] = useState(initial);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        router.push(value.trim() ? `/admin/members?q=${encodeURIComponent(value.trim())}` : "/admin/members");
      }}
    >
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-card border border-outline bg-surface px-4 py-2 text-sm outline-none focus:border-primary"
      />
    </form>
  );
}
