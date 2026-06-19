import type { Config } from "tailwindcss";

/** ÉLAN v3 — dark wellness. Espresso surfaces, gold + sage, light text. */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Gold accent at low/mid steps; light parchment text at 800/900.
        primary: {
          DEFAULT: "#D6B47A",
          50: "#FBF6EE", 100: "#F1E7D2", 200: "#E7D4AE", 300: "#DEC592",
          400: "#E4C58E", 500: "#D6B47A", 600: "#E4C58E", 700: "#D6B47A",
          800: "#ECE6DC", 900: "#F5F1EB",
        },
        surface: { DEFAULT: "#241E1A", variant: "#2C241F", container: "#342B25" },
        outline: "rgba(214,180,122,0.18)",
        accent: "#C78B73", // rose-clay
        sage: { DEFAULT: "#A9B39B", 100: "#E8ECE2", 700: "#8FA07E" },
        ink: "#241E1A", // dark text on gold
        brand: "#241E1A",
        status: { available: "#A9B39B", waitlist: "#C78B73", full: "#8E8478" },
      },
      borderRadius: { card: "1.25rem", pill: "9999px" },
      boxShadow: {
        card: "0 10px 34px rgba(0,0,0,0.32)",
        sticky: "0 -2px 16px rgba(0,0,0,0.4)",
        glow: "0 14px 30px -12px rgba(214,180,122,0.5)",
      },
      fontFamily: {
        sans: ["'IBM Plex Sans'", "'IBM Plex Sans Arabic'", "system-ui", "sans-serif"],
        display: ["'Cormorant Garamond'", "'IBM Plex Sans Arabic'", "Georgia", "serif"],
        label: ["'IBM Plex Sans'", "system-ui", "sans-serif"],
        arabic: ["'IBM Plex Sans Arabic'", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
