import { getLocale } from "@/lib/locale-server";
import { getServerSupabase } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-guard";
import { OffersManager, type OfferPack, type OfferPlan } from "@/components/admin/OffersManager";

export const dynamic = "force-dynamic";

export default async function AdminOffers() {
  await requireAdmin();
  const ar = (await getLocale()) === "ar";
  const supabase = await getServerSupabase();
  // first_time_only / featured are not yet in the generated DB types — read via
  // an untyped table accessor (mirrors the pattern in admin-actions.ts).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = (supabase as unknown as { from: (t: string) => any });
  const [{ data: packs }, { data: plans }] = await Promise.all([
    db.from("credit_packs").select("id,name_ar,name_en,price_sar,credits,active,first_time_only").order("price_sar"),
    db.from("membership_plans").select("id,name_ar,name_en,price_sar,active,featured,first_time_only").order("price_sar"),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-page-title font-medium text-primary-900">{ar ? "العروض والباقات" : "Offers & catalogue"}</h1>
        <p className="text-meta text-status-full">
          {ar
            ? "تحكّمي بالتفعيل، والأكثر شيوعًا، وعروض التجربة الأولى (متاحة للزائرة لأول مرة فقط)."
            : "Toggle active state, featured plan, and first-visit-only intro offers."}
        </p>
      </div>
      <OffersManager ar={ar} packs={(packs ?? []) as OfferPack[]} plans={(plans ?? []) as OfferPlan[]} />
    </div>
  );
}
