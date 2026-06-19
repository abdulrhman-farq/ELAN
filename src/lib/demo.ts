/** Demo mode: when on, the app runs entirely on mock data and skips all
 *  Supabase calls (auth + queries + actions). Default ON; set
 *  NEXT_PUBLIC_ELAN_DEMO=false once a real backend is wired. */
export const DEMO = process.env.NEXT_PUBLIC_ELAN_DEMO !== "false";
