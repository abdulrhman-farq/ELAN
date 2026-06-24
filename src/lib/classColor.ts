/** Maps a class name to a distinguishing accent colour (point #8).
 *  Keyword-based since class types are dynamic; falls back to gold. */
export function classAccent(name: string): string {
  const n = (name || "").toLowerCase();
  if (n.includes("reformer")) return "#B89B72"; // gold
  if (n.includes("mat")) return "#A9B39B"; // sage
  if (n.includes("private")) return "#B78A7A"; // clay
  if (n.includes("stretch")) return "#8DA8B8"; // blue
  if (n.includes("sculpt") || n.includes("tone")) return "#C78B73"; // rose-clay
  return "#B89B72";
}

/** Soft two-stop gradient for image-placeholder tiles. */
export function classGradient(name: string): string {
  const c = classAccent(name);
  return `linear-gradient(135deg, ${c}, ${c}99)`;
}

/** Optional Supabase Storage public base (e.g.
 *  https://<ref>.supabase.co/storage/v1/object/public/media). When set,
 *  images resolve to real photos there (<name>.jpg); otherwise they fall
 *  back to the bundled photos in /public/assets (<name>.jpg) — so photos
 *  can be uploaded/swapped from the Supabase dashboard with no redeploy. */
const MEDIA_BASE = process.env.NEXT_PUBLIC_ELAN_MEDIA_BASE?.replace(/\/$/, "");

function asset(name: string): string {
  return MEDIA_BASE ? `${MEDIA_BASE}/${name}.jpg` : `/assets/${name}.jpg`;
}

/** Photographic image per class type.
 *  TODO(media): "Power Reformer" and "Reformer Flow" currently resolve to two
 *  distinct keys (power-reformer / reformer-flow), but "Sculpt"/"Tone" reuses
 *  the power-reformer photo. Add a dedicated sculpt/tone asset when available
 *  so each class type has its own image. Do not invent assets meanwhile. */
export function classImage(name: string): string {
  const n = (name || "").toLowerCase();
  if (n.includes("power")) return asset("power-reformer");
  if (n.includes("reformer")) return asset("reformer-flow");
  if (n.includes("mat")) return asset("mat-pilates");
  if (n.includes("stretch")) return asset("stretching");
  if (n.includes("sculpt") || n.includes("tone")) return asset("power-reformer");
  return asset("reformer-flow");
}

export const HERO_IMAGE = asset("studio-hero");
export const INSTRUCTOR_IMAGE = asset("instructor-lina");
