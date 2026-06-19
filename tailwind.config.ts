import type { Config } from "tailwindcss";

/** ÉLAN editorial-luxury tokens — warm bone, terracotta, espresso ink. */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Terracotta accent (100–700) graduating to espresso ink (800/900).
        primary: {
          DEFAULT: "#B4654A",
          50: "#FBF8F3", 100: "#E8D5CB", 200: "#DCC2B2", 300: "#D0A88F",
          400: "#C2876B", 500: "#B4654A", 600: "#A2573F", 700: "#8E4A37",
          800: "#2B2622", 900: "#2B2622",
        },
        surface: { DEFAULT: "#F4EFE8", variant: "#EAE2D6", container: "#FBF8F3" },
        outline: "#E5DBCB",
        accent: "#B4654A",
        ink: "#2B2622",
        status: { available: "#B4654A", waitlist: "#8A6A2E", full: "#8A7F73" },
      },
      borderRadius: { card: "0.375rem", pill: "9999px" },
      boxShadow: {
        card: "0 1px 3px rgba(43,38,34,0.06), 0 1px 2px rgba(43,38,34,0.04)",
        sticky: "0 -2px 12px rgba(43,38,34,0.08)",
        frame: "0 36px 70px -28px rgba(43,38,34,0.45)",
      },
      fontFamily: {
        // Latin → DM Sans, Arabic → Noto Naskh Arabic (per-glyph fallback).
        sans: ["'DM Sans'", "'Noto Naskh Arabic'", "system-ui", "sans-serif"],
        // Editorial display: Cormorant for Latin, Naskh for Arabic.
        display: ["'Cormorant Garamond'", "'Noto Naskh Arabic'", "Georgia", "serif"],
        label: ["'DM Sans'", "system-ui", "sans-serif"],
        arabic: ["'Noto Naskh Arabic'", "serif"],
      },
    },
  },
  plugins: [],
};
export default config;
