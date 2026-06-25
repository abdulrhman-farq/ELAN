"use client";
import { forwardRef, type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "muted" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Shows a spinner and disables the button to prevent double submission. */
  isLoading?: boolean;
  /** Optional label rendered next to the spinner while loading. */
  loadingText?: string;
  /** Selected/toggle state — sets aria-pressed and a strong, non-colour-only visual. */
  selected?: boolean;
  variant?: Variant;
  size?: Size;
}

const VARIANTS: Record<Variant, string> = {
  primary: "bg-primary text-ink",
  muted: "bg-status-full text-primary-900",
  ghost: "bg-status-full/40 text-primary-900",
  danger: "text-danger",
};

const SIZES: Record<Size, string> = {
  sm: "button-sm",
  md: "button-md",
  lg: "button-lg",
};

/** Unified member-side button. Pill design tokens (.btn/.button-*), instant tap
 *  feedback, accessible focus ring, and a strong selected affordance (ring + check,
 *  not colour alone). Dependency-free; safe to use anywhere in the member app. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    isLoading = false,
    loadingText,
    selected = false,
    variant = "primary",
    size = "md",
    disabled,
    type,
    className = "",
    children,
    ...rest
  },
  ref,
) {
  const isDisabled = disabled || isLoading;

  return (
    <button
      ref={ref}
      type={type ?? "button"}
      disabled={isDisabled}
      aria-pressed={selected || undefined}
      data-selected={selected || undefined}
      className={[
        "btn",
        SIZES[size],
        VARIANTS[variant],
        // tap + focus feedback
        "transition-[transform,opacity,box-shadow] active:scale-[.98] active:opacity-80",
        "outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
        // touch target
        "min-h-[44px]",
        // strong selected state — ring + background shift, not colour alone
        selected ? "ring-2 ring-accent ring-offset-2 ring-offset-surface shadow-glow" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {isLoading ? (
        <>
          <span className="spinner" aria-hidden />
          {loadingText ? <span>{loadingText}</span> : null}
        </>
      ) : (
        <>
          {selected ? <span aria-hidden>✓</span> : null}
          {children}
        </>
      )}
    </button>
  );
});
