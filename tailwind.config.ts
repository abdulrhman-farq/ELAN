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
        surface: { DEFAULT: "#F2EBE1", variant: "#E7DACB", container: "#FBF7F0", elevated: "#FFFDF9" },
        outline: "#E8DCCB",
        accent: "#B89766", // aged brass / champagne gold
        sage: { DEFAULT: "#818263", 100: "#E8E9DF", 700: "#5F6049" },
        ink: "#F8F5F1", // creamy text on charcoal / gold fills
        brand: "#2E2A26", // dark charcoal for hero + admin sidebar
        status: { available: "#818263", waitlist: "#B08D57", full: "#8D7E75" },
      },
      borderRadius: { card: "1.75rem", pill: "9999px" },
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
