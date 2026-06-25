/** Shared loading-skeleton primitive — a rounded, subtly pulsing placeholder.
 *  Warm neutral fill tuned to the ÉLAN cream palette so it reads as "loading"
 *  without flashing. Respects prefers-reduced-motion via the global guard in
 *  globals.css (which neutralises animate-pulse). */
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`animate-pulse rounded-md bg-surface-variant/70 ${className}`}
    />
  );
}
