import { dict } from "@/lib/i18n";
import { getLocale } from "@/lib/locale-server";
import { getCatalogue, getMemberContext, getMyFirstTime } from "@/lib/queries";
import { MembershipCards } from "@/components/MembershipCards";
import { EmptyState } from "@/components/EmptyState";

export const dynamic = "force-dynamic";

export default async function MembershipsPage() {
  const locale = await getLocale();
  const t = dict[locale];
  const ar = locale === "ar";
  const [{ plans, packs }, ctx, firstTime] = await Promise.all([getCatalogue(), getMemberContext(), getMyFirstTime()]);
  const planName = ctx.membership?.membership_plans
    ? ar ? ctx.membership.membership_plans.name_ar : ctx.membership.membership_plans.name_en
    : null;

  // First-visit-only offers are hidden from members who are no longer first-time.
  // (first_time_only is not yet in the generated DB types — read via a cast.)
  const isIntro = (p: unknown) => Boolean((p as { first_time_only?: boolean }).first_time_only);
  const planItems = plans
    .filter((p) => firstTime || !isIntro(p))
    .map((p) => ({
      id: p.id,
      name: ar ? p.name_ar : p.name_en,
      meta: (ar ? p.description_ar : p.description_en) ?? "",
      price: p.price_sar,
      featured: Boolean((p as { featured?: boolean }).featured),
      intro: isIntro(p),
    }));
  const packItems = packs
    .filter((p) => firstTime || !isIntro(p))
    .map((p) => {
      const desc = (ar ? (p as { description_ar?: string }).description_ar : (p as { description_en?: string }).description_en) ?? "";
      const line1 = `${t.memberships.credits.replace("{n}", String(p.credits))} · ${t.memberships.validDays.replace("{n}", String(p.valid_days))}`;
      return {
        id: p.id,
        name: ar ? p.name_ar : p.name_en,
        meta: desc ? `${line1}\n${desc}` : line1,
        price: p.price_sar,
        intro: isIntro(p),
      };
    });

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
          <MembershipCards kind="membership" items={planItems} locale={locale} />
        </div>
      ) : null}

      {packs.length > 0 ? (
        <div>
          <h2 className="mb-3 font-display text-lead font-medium text-primary-900">{t.memberships.packs}</h2>
          <MembershipCards kind="credit_pack" items={packItems} locale={locale} />
        </div>
      ) : null}
    </section>
  );
}
