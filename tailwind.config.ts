import type { Config } from "tailwindcss";

/** ÉLAN quiet-luxury tokens — warm sand, brass, terracotta/clay. */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Terracotta / clay ramp — anchored on brand #B5704F (=500/DEFAULT)
        primary: {
          DEFAULT: "#B5704F", 50: "#FBF4EE", 100: "#F2E3D5", 200: "#E6C9B3",
          300: "#D8A48A", 400: "#C5876A", 500: "#B5704F", 600: "#A54E45",
          700: "#8B4034", 800: "#6B3329", 900: "#4A3729",
        },
        surface: { DEFAULT: "#EFE7D8", variant: "#E4D6C1", container: "#FAF4E9" },
        outline: "#DDCDB6",
        // Brass accent for hairlines / selection / date underline (new, optional)
        accent: "#C2A05E",
        status: { available: "#B5704F", waitlist: "#8A6A2E", full: "#9B8C77" },
      },
      borderRadius: { card: "1rem", pill: "9999px" },
      boxShadow: {
        card: "0 1px 3px rgba(74,55,41,0.08), 0 1px 2px rgba(74,55,41,0.05)",
        sticky: "0 -2px 12px rgba(74,55,41,0.08)",
      },
      fontFamily: {
        sans: ["Tajawal", "system-ui", "sans-serif"],          // UI body (AR + EN) — unchanged role
        display: ["'Cormorant Garamond'", "Georgia", "serif"], // ÉLAN wordmark, hero titles (LTR)
        label: ["Jost", "system-ui", "sans-serif"],            // uppercase eyebrow labels
      },
    },
  },
  plugins: [],
};
export default config;
