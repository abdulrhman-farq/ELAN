/** Demo/showcase mode: serves mock data and bypasses auth. It must NEVER run in
 *  production. In development/test it is opt-in only (NEXT_PUBLIC_ELAN_DEMO=true);
 *  default is OFF everywhere. */
export const DEMO =
  process.env.NODE_ENV !== "production" &&
  process.env.NEXT_PUBLIC_ELAN_DEMO === "true";
