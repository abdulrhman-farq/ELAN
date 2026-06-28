/** App version, sourced from package.json at build time via next.config's
 *  `env.NEXT_PUBLIC_APP_VERSION` so it never drifts from the real release. */
export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? "0.0.0-dev";
