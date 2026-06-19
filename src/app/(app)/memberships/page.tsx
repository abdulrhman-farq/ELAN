import { dict } from "@/lib/i18n";
import { getLocale } from "@/lib/locale-server";
import { getCatalogue, getMemberContext } from "@/lib/queries";
import { BuyButton } from "@/components/Buttons";

export const dynamic = "force-dynamic";

export default async function MembershipsPage() {
  const locale = await getLocale();
  const t = dict[locale];
  const ar = locale === "ar";
  const [{ plans, packs }, ctx] = await Promise.all([getCatalogue(), getMemberContext()]);
  const planName = ctx.membership?.membership_plans
    ? ar ? ctx.membership.membership_plans.name_ar : ctx.membership.membership_plans.name_en
    : null;

  return (
    <section className="space-y-6 p-6">
      <h1 className="font-display text-2xl font-medium text-primary-900">{t.memberships.title}</h1>

      <div className="card-ink space-y-1 p-6">
        <p className="font-display text-xl">{planName ?? t.memberships.noMembership}</p>
        <p className="text-sm text-primary-900/70">
          {ctx.balance > 0 ? t.memberships.credits.replace("{n}", String(ctx.balance)) : t.memberships.noCredits}
        </p>
      </div>

      <div>
        <h2 className="mb-3 font-display text-lg font-medium text-primary-900">{t.memberships.plans}</h2>
        <div className="space-y-3">
          {plans.map((p) => (
            <div key={p.id} className="card flex items-center justify-between gap-3 p-5">
              <div className="min-w-0">
                <p className="font-display text-lg font-medium text-primary-900">{ar ? p.name_ar : p.name_en}</p>
                <p className="truncate text-xs text-status-full">{ar ? p.description_ar : p.description_en}</p>
                <p className="mt-1 text-sm font-semibold text-primary-700">{p.price_sar} {t.common.sar}</p>
              </div>
              <BuyButton type="membership" refId={p.id} label={t.common.buy} />
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-3 font-display text-lg font-medium text-primary-900">{t.memberships.packs}</h2>
        <div className="space-y-3">
          {packs.map((p) => (
            <div key={p.id} className="card flex items-center justify-between gap-3 p-5">
              <div className="min-w-0">
                <p className="font-display text-lg font-medium text-primary-900">{ar ? p.name_ar : p.name_en}</p>
                <p className="truncate text-xs text-status-full">
                  {t.memberships.credits.replace("{n}", String(p.credits))} · {t.memberships.validDays.replace("{n}", String(p.valid_days))}
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
