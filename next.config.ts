import type { NextConfig } from "next";

/** Allow remote class/hero photos served from Supabase Storage
 *  (NEXT_PUBLIC_ELAN_MEDIA_BASE). Patterns are derived from the env host when
 *  set, with a *.supabase.co fallback so swapping the ref needs no code change. */
function remotePatterns(): NonNullable<NextConfig["images"]>["remotePatterns"] {
  const patterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [
    { protocol: "https", hostname: "**.supabase.co", pathname: "/storage/v1/object/public/**" },
  ];
  const base = process.env.NEXT_PUBLIC_ELAN_MEDIA_BASE;
  if (base) {
    try {
      const u = new URL(base);
      patterns.push({ protocol: u.protocol.replace(":", "") as "http" | "https", hostname: u.hostname, pathname: "/**" });
    } catch {
      /* ignore malformed base */
    }
  }
  return patterns;
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: { remotePatterns: remotePatterns() },
};

export default nextConfig;
