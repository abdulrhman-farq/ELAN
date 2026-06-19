/** Material Symbols (Rounded) icon. Size/colour via Tailwind text-* classes. */
export function Icon({
  name,
  className,
  filled,
}: {
  name: string;
  className?: string;
  filled?: boolean;
}) {
  return (
    <span
      aria-hidden
      className={`material-symbols-rounded select-none leading-none ${className ?? ""}`}
      style={filled ? { fontVariationSettings: "'FILL' 1, 'opsz' 24" } : undefined}
    >
      {name}
    </span>
  );
}
