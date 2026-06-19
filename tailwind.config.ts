import type { Config } from "tailwindcss";

/** Material Design 3 tokens for ELAN — a calm rose accent + status colours. */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#B0656F", 50: "#FBF1F2", 100: "#F6E1E4", 200: "#EAC2C8",
          300: "#DD9CA6", 400: "#C97D88", 500: "#B0656F", 600: "#934E58",
          700: "#763E47", 800: "#5A2F35", 900: "#3E2024",
        },
        surface: { DEFAULT: "#FFFBFA", variant: "#F3EDEC", container: "#FAF3F2" },
        outline: "#E4DAD9",
        status: { available: "#B0656F", waitlist: "#2E7D5B", full: "#9A9494" },
      },
      borderRadius: { card: "1.25rem", pill: "9999px" },
      boxShadow: {
        card: "0 1px 3px rgba(58,32,36,0.08), 0 1px 2px rgba(58,32,36,0.04)",
        sticky: "0 -2px 12px rgba(58,32,36,0.08)",
      },
      fontFamily: { sans: ["Tajawal", "system-ui", "sans-serif"] },
    },
  },
  plugins: [],
};
export default config;
