import { getLocale } from "@/lib/locale-server";
import { getPromoCodes } from "@/lib/admin";
import { PromoManager } from "@/components/admin/PromoManager";

export const dynamic = "force-dynamic";

export default async function AdminPromo() {
  const ar = (await getLocale()) === "ar";
  const promos = await getPromoCodes();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-page-title font-medium text-primary-900">{ar ? "أكواد الخصم" : "Promo codes"}</h1>
        <p className="text-meta text-status-full">{ar ? "خصومات نسبة أو مبلغ ثابت تُطبَّق على السعر الصافي قبل الضريبة" : "Percentage or fixed discounts, applied to net before VAT"}</p>
      </div>
      <PromoManager ar={ar} promos={promos} />
    </div>
  );
}
