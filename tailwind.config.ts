import type { Config } from "tailwindcss";

/** ÉLAN "Hybrid Luxury" tokens — warm light content surfaces, dark brand moments,
 *  gold + sage accents. */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Gold accent (100–700) graduating to espresso ink for text (800/900).
        primary: {
          DEFAULT: "#D6B47A",
          50: "#FAF6EE", 100: "#F1E7D2", 200: "#E7D4AE", 300: "#DEC592",
          400: "#D9BC84", 500: "#D6B47A", 600: "#BE9A5C", 700: "#9C7C44",
          800: "#2B2723", 900: "#2B2723",
        },
        surface: { DEFAULT: "#F5F1EB", variant: "#EEE8DF", container: "#FBF8F3" },
        outline: "#E6DECF",
        accent: "#C78B73", // rose-clay
        sage: { DEFAULT: "#A9B39B", 100: "#E8ECE2", 700: "#6E7A60" },
        ink: "#2B2723", // body text
        brand: "#211D19", // dark brand background
        status: { available: "#6E7A60", waitlist: "#C78B73", full: "#8A8377" },
      },
      borderRadius: { card: "1.75rem", pill: "9999px" },
      boxShadow: {
        card: "0 8px 30px rgba(43,38,34,0.10), 0 2px 8px rgba(43,38,34,0.05)",
        sticky: "0 -2px 16px rgba(43,38,34,0.10)",
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
