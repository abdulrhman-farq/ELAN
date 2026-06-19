import { dict } from "@/lib/i18n";
import { getLocale } from "@/lib/locale-server";
import { getCatalogue, getMemberContext } from "@/lib/queries";
import { BuyButton } from "@/components/Buttons";

export const dynamic = "force-dynamic";

export default async function MembershipsPage() {
  const locale = await getLocale();
  const t = dict[locale];
  const [{ plans, packs }, ctx] = await Promise.all([getCatalogue(), getMemberContext()]);
  const planName = ctx.membership?.membership_plans
    ? locale === "ar" ? ctx.membership.membership_plans.name_ar : ctx.membership.membership_plans.name_en
    : null;

  return (
    <section className="space-y-5 p-4">
      <h1 className="text-xl font-bold text-primary-800">{t.memberships.title}</h1>

      <div className="card space-y-1 p-5">
        <p className="font-medium">{planName ?? t.memberships.noMembership}</p>
        <p className="text-sm text-status-full">
          {ctx.balance > 0 ? t.memberships.credits.replace("{n}", String(ctx.balance)) : t.memberships.noCredits}
        </p>
      </div>

      <div>
        <h2 className="mb-2 font-semibold text-primary-800">{t.memberships.plans}</h2>
        <div className="space-y-3">
          {plans.map((p) => (
            <div key={p.id} className="card flex items-center justify-between p-4">
              <div className="min-w-0">
                <p className="font-bold text-primary-900">{locale === "ar" ? p.name_ar : p.name_en}</p>
                <p className="truncate text-xs text-status-full">{locale === "ar" ? p.description_ar : p.description_en}</p>
                <p className="mt-1 text-sm font-semibold text-primary-700">{p.price_sar} {t.common.sar}</p>
              </div>
              <BuyButton type="membership" refId={p.id} label={t.common.buy} />
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-2 font-semibold text-primary-800">{t.memberships.packs}</h2>
        <div className="space-y-3">
          {packs.map((p) => (
            <div key={p.id} className="card flex items-center justify-between p-4">
              <div className="min-w-0">
                <p className="font-bold text-primary-900">{locale === "ar" ? p.name_ar : p.name_en}</p>
                <p className="truncate text-xs text-status-full">
                  {t.memberships.credits.replace("{n}", String(p.credits))} • {t.memberships.validDays.replace("{n}", String(p.valid_days))}
                </p>
                <p className="mt-1 text-sm font-semibold text-primary-700">{p.price_sar} {t.common.sar}</p>
              </div>
              <BuyButton type="credit_pack" refId={p.id} label={t.common.buy} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
