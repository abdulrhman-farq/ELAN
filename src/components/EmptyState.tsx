import Link from "next/link";
import { Icon } from "./Icon";

/** Warm, useful empty state: short elegant line + helpful hint + optional CTA. */
export function EmptyState({
  icon,
  title,
  hint,
  ctaHref,
  ctaLabel,
}: {
  icon?: string;
  title: string;
  hint?: string;
  ctaHref?: string;
  ctaLabel?: string;
}) {
  return (
    <div className="card flex flex-col items-center gap-2 p-6 text-center">
      {icon ? <Icon name={icon} className="text-4xl text-primary-300" /> : null}
      <p className="font-display text-lead font-medium text-primary-900">{title}</p>
      {hint ? <p className="max-w-[28ch] text-meta text-status-full">{hint}</p> : null}
      {ctaHref && ctaLabel ? (
        <Link href={ctaHref} className="btn button-sm mt-2 bg-primary text-ink">
          {ctaLabel}
        </Link>
      ) : null}
    </div>
  );
}
