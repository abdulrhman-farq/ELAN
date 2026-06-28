"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { purchaseAction } from "@/actions";
import { dict, type Locale } from "@/lib/i18n";
import { useToast } from "./Toast";
import { Button } from "./ui/Button";

type Kind = "membership" | "credit_pack";

export interface CatalogueItem {
  id: string;
  name: string;
  meta: string;
  price: number;
  featured?: boolean;
}

/** Client list of purchasable catalogue items. Tapping a card selects it (ring +
 *  check, not colour alone); only the pending item's Buy button shows a spinner. */
export function MembershipCards({
  kind,
  items,
  locale,
}: {
  kind: Kind;
  items: CatalogueItem[];
  locale: Locale;
}) {
  const router = useRouter();
  const toast = useToast();
  const t = dict[locale];
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, start] = useTransition();

  const buy = (id: string) => {
    setSelectedId(id);
    setPendingId(id);
    start(async () => {
      const res = await purchaseAction(kind, id);
      setPendingId(null);
      if (res && "error" in res && res.error) {
        toast.error(t.toast.purchaseFailed);
        return;
      }
      // Purchase creates a pending payment; credits arrive once it is confirmed.
      toast.success("pending" in res && res.pending ? t.toast.purchasePending : t.toast.purchased);
      router.refresh();
    });
  };

  const selectedLabel = t.memberships.selected;

  return (
    <div className="space-y-3">
      {items.map((p) => {
        const isSelected = selectedId === p.id;
        const isPending = pendingId === p.id;
        return (
          <div
            key={p.id}
            role="button"
            tabIndex={0}
            aria-pressed={isSelected}
            onClick={() => setSelectedId(p.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setSelectedId(p.id);
              }
            }}
            className={`card relative flex w-full cursor-pointer items-center justify-between gap-3 p-5 text-start outline-none transition-[transform,box-shadow] active:scale-[.99] focus-visible:ring-2 focus-visible:ring-accent ${
              p.featured ? "ring-2 ring-accent" : ""
            } ${isSelected ? "ring-2 ring-accent shadow-glow" : ""}`}
          >
            {p.featured ? (
              <span className="absolute -top-2 end-4 rounded-pill bg-accent px-2.5 py-0.5 text-caption font-medium text-primary-900">
                {t.memberships.mostPopular}
              </span>
            ) : null}
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 font-display text-lead font-medium text-primary-900">
                {isSelected ? (
                  <span aria-label={selectedLabel} className="text-primary-700">
                    ✓
                  </span>
                ) : null}
                {p.name}
              </p>
              <p className="whitespace-pre-line text-caption text-status-full">{p.meta}</p>
              <p className="mt-1 text-body font-number font-semibold text-primary-700">
                {p.price} {t.common.sar}
              </p>
            </div>
            <Button
              size="sm"
              className="shrink-0"
              isLoading={isPending}
              onClick={(e) => {
                e.stopPropagation();
                buy(p.id);
              }}
            >
              {t.common.buy}
            </Button>
          </div>
        );
      })}
    </div>
  );
}
