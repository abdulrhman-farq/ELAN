import { dict } from "@/lib/i18n";
import { getLocale } from "@/lib/locale-server";
import { getCatalogue, getMemberContext } from "@/lib/queries";
import { BuyButton } from "@/components/Buttons";
import { EmptyState } from "@/components/EmptyState";

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
      <h1 className="font-display text-page-title font-medium text-primary-900">{t.memberships.title}</h1>

      <div className="card-ink space-y-1 p-6">
        <p className="font-display text-title">{planName ?? t.memberships.noMembership}</p>
        <p className="text-body text-ink/70">
          {ctx.balance > 0 ? t.memberships.credits.replace("{n}", String(ctx.balance)) : t.memberships.noCredits}
        </p>
      </div>

      {plans.length === 0 && packs.length === 0 ? (
        <EmptyState icon="card_membership" title={t.empty.noMemberships} hint={t.empty.noMembershipsHint} />
      ) : null}

      {plans.length > 0 ? (
        <div>
          <h2 className="mb-3 font-display text-lead font-medium text-primary-900">{t.memberships.plans}</h2>
          <div className="space-y-3">
            {plans.map((p) => (
              <div key={p.id} className="card flex items-center justify-between gap-3 p-5">
                <div className="min-w-0">
                  <p className="font-display text-lead font-medium text-primary-900">{ar ? p.name_ar : p.name_en}</p>
                  <p className="truncate text-caption text-status-full">{ar ? p.description_ar : p.description_en}</p>
                  <p className="mt-1 text-body font-number font-semibold text-primary-700">{p.price_sar} {t.common.sar}</p>
                </div>
                <BuyButton type="membership" refId={p.id} label={t.common.buy} locale={locale} />
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {packs.length > 0 ? (
        <div>
          <h2 className="mb-3 font-display text-lead font-medium text-primary-900">{t.memberships.packs}</h2>
          <div className="space-y-3">
            {packs.map((p) => (
              <div key={p.id} className="card flex items-center justify-between gap-3 p-5">
                <div className="min-w-0">
                  <p className="font-display text-lead font-medium text-primary-900">{ar ? p.name_ar : p.name_en}</p>
                  <p className="truncate text-caption text-status-full">
                    {t.memberships.credits.replace("{n}", String(p.credits))} · {t.memberships.validDays.replace("{n}", String(p.valid_days))}
                  </p>
                  <p className="mt-1 text-body font-number font-semibold text-primary-700">{p.price_sar} {t.common.sar}</p>
                </div>
                <BuyButton type="credit_pack" refId={p.id} label={t.common.buy} locale={locale} />
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
