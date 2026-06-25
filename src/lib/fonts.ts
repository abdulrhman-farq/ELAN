import { Amiri, Tajawal, Bodoni_Moda } from "next/font/google";

/** Self-hosted, non-render-blocking fonts via next/font (handoff §01):
 *  Amiri = Arabic headings (Display); Tajawal = Arabic body (sans);
 *  Bodoni Moda = wordmark, Latin & all numbers. Each exposes a CSS variable
 *  that globals.css / Tailwind's font-family stacks resolve to. */

export const tajawal = Tajawal({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-tajawal",
  display: "swap",
});

export const amiri = Amiri({
  subsets: ["arabic", "latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-amiri",
  display: "swap",
});

export const bodoni = Bodoni_Moda({
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  variable: "--font-bodoni",
  display: "swap",
});

/** Combined variable classNames to apply on <html>. */
export const fontVariables = `${tajawal.variable} ${amiri.variable} ${bodoni.variable}`;
