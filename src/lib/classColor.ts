/** Maps a class name to a distinguishing accent colour (point #8).
 *  Keyword-based since class types are dynamic; falls back to gold. */
export function classAccent(name: string): string {
  const n = (name || "").toLowerCase();
  if (n.includes("reformer")) return "#D6B47A"; // gold
  if (n.includes("mat")) return "#A9B39B"; // sage
  if (n.includes("private")) return "#B78A7A"; // clay
  if (n.includes("stretch")) return "#8DA8B8"; // blue
  if (n.includes("sculpt") || n.includes("tone")) return "#C78B73"; // rose-clay
  return "#D6B47A";
}

/** Soft two-stop gradient for image-placeholder tiles. */
export function classGradient(name: string): string {
  const c = classAccent(name);
  return `linear-gradient(135deg, ${c}, ${c}99)`;
}
