"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { markNotificationsReadAction } from "@/actions";

/** Clears the unread badge once the member opens the inbox (profile). Renders
 *  nothing; only runs when there is something unread. */
export function MarkNotificationsRead({ hasUnread }: { hasUnread: boolean }) {
  const router = useRouter();
  const done = useRef(false);
  useEffect(() => {
    if (!hasUnread || done.current) return;
    done.current = true;
    markNotificationsReadAction().then(() => router.refresh());
  }, [hasUnread, router]);
  return null;
}
