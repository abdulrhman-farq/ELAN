import type { Config } from "tailwindcss";

/** ÉLAN — warm cream quiet-luxury with charcoal + champagne-gold and dark
 *  photographic "brand moments" (per the reference). */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Champagne tints (100–400) for fills; brass at 700; charcoal at 500/800/900 (buttons + text).
        primary: {
          DEFAULT: "#2E2A26",
          50: "#F8F5F1", 100: "#EFE2D2", 200: "#E6D3BC", 300: "#D8BE9C",
          400: "#C9A878", 500: "#2E2A26", 600: "#4A423C", 700: "#9C7A45",
          800: "#3A332F", 900: "#3A332F",
        },
        surface: { DEFAULT: "#EDE8DD", variant: "#E8DFD0", container: "#FFFAF2", elevated: "#FFFAF2" },
        outline: "#E3D8C8",
        accent: "#C89F5F", // champagne gold
        sage: { DEFAULT: "#8A9272", 100: "#E5E7DA", 700: "#5F6049" },
        ink: "#F8F5F1", // creamy text on charcoal / gold fills
        brand: "#211C18", // dark espresso for hero + admin sidebar
        danger: "#BD493E",
        // status.full darkened from #8B8177 → #6B625A for WCAG AA (≥4.5:1) on cream.
        status: { available: "#8A9272", waitlist: "#C89F5F", full: "#6B625A" },
      },
      borderRadius: {
        // Unified radius scale: sm 12 / md 16 / lg 20 / xl 28. `card` aliases xl.
        sm: "0.75rem", // 12px
        md: "1rem", // 16px
        lg: "1.25rem", // 20px
        xl: "1.75rem", // 28px
        card: "1.75rem", // alias of xl — heroes + major cards share this
        pill: "9999px",
      },
      fontSize: {
        // Role-based type scale.
        caption: ["0.75rem", { lineHeight: "1rem" }], // 12
        meta: ["0.8125rem", { lineHeight: "1.125rem" }], // 13
        body: ["0.9375rem", { lineHeight: "1.5rem" }], // 15
        lead: ["1.0625rem", { lineHeight: "1.6rem" }], // 17
        title: ["1.25rem", { lineHeight: "1.6rem" }], // 20
        "page-title": ["1.75rem", { lineHeight: "2.1rem" }], // 28
        hero: ["2.25rem", { lineHeight: "2.4rem" }], // 36
      },
      boxShadow: {
        card: "0 14px 44px rgba(58,51,47,0.10), 0 4px 12px rgba(58,51,47,0.05)",
        sticky: "0 8px 30px rgba(58,51,47,0.12)",
        glow: "0 16px 40px -16px rgba(184,151,102,0.4)",
      },
      fontFamily: {
        sans: ["Inter", "'IBM Plex Sans Arabic'", "system-ui", "sans-serif"],
        display: ["'Cormorant Garamond'", "'IBM Plex Sans Arabic'", "Georgia", "serif"],
        label: ["Inter", "system-ui", "sans-serif"],
        arabic: ["'IBM Plex Sans Arabic'", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
