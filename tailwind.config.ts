import type { Config } from "tailwindcss";

/** ÉLAN — warm cream quiet-luxury with charcoal + champagne-gold and dark
 *  photographic "brand moments" (per the reference). */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // ÉLAN brand identity (handoff §01): Peach Protein / Blush Beet / Honey Oatmilk
        // / Coconut Cream / Sage. Ink for text, Brass for lines & accent, Dark for
        // photographic "brand moments". Green is a sparing botanical accent only.
        primary: {
          DEFAULT: "#3B2D27", // Ink
          50: "#F8F5F1", // Coconut Cream
          100: "#F6EAD4", // Honey Oatmilk
          200: "#EFD7CF", // Peach Protein
          300: "#DDBAAE", // Blush Beet
          400: "#C8A98A", // brass-tinted fill
          500: "#3B2D27", // Ink
          600: "#5B4A41", // ink-soft
          700: "#846532", // deep brass — accessible accent text on cream
          800: "#2B2420", // Dark
          900: "#3B2D27", // Ink (headings)
        },
        surface: { DEFAULT: "#F4EBDD", variant: "#EFE0CF", container: "#FBF6EF", elevated: "#FBF6EF" },
        outline: "#E7D9C4", // brass line ~40%
        accent: "#B89B72", // Brass
        sage: { DEFAULT: "#818263", 100: "#E6E7DC", 700: "#5F6049" },
        ink: "#F8F5F1", // Coconut Cream text on dark / brass fills
        brand: "#2B2420", // Dark — hero + admin sidebar
        danger: "#9A5B3E", // warning / error
        status: { available: "#818263", waitlist: "#B89B72", full: "#6F5D52" },
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
        // Handoff §01: Amiri = Arabic headings (Display); Tajawal = Arabic body;
        // Bodoni Moda = wordmark, Latin & all numbers (prices, dates, counters).
        sans: ["'Tajawal'", "'IBM Plex Sans Arabic'", "system-ui", "sans-serif"],
        display: ["'Amiri'", "'Bodoni Moda'", "Georgia", "serif"],
        label: ["'Bodoni Moda'", "Georgia", "serif"],
        arabic: ["'Tajawal'", "sans-serif"],
        number: ["'Bodoni Moda'", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};
export default config;
