import Link from "next/link";
import { dict } from "@/lib/i18n";
import { getLocale } from "@/lib/locale-server";
import { getMemberContext, getMyBookings } from "@/lib/queries";
import { LangToggle, LogoutButton } from "@/components/Buttons";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const locale = await getLocale();
  const t = dict[locale];
  const ar = locale === "ar";
  const [ctx, bookings] = await Promise.all([getMemberContext(), getMyBookings()]);
  const attended = bookings.filter((b) => b.status === "attended").length;
  const fullName = ctx.member?.full_name ?? t.profile.title;
  const initial = (fullName.trim()[0] ?? "·").toUpperCase();
  const planName = ctx.membership?.membership_plans ? (ar ? ctx.membership.membership_plans.name_ar : ctx.membership.membership_plans.name_en) : null;
  const renews = ctx.membership?.current_period_end
    ? new Intl.DateTimeFormat(ar ? "ar-SA" : "en-US", { day: "numeric", month: "long", year: "numeric" }).format(new Date(ctx.membership.current_period_end))
    : null;

  return (
    <section className="space-y-5 p-6">
      <header className="pt-2 text-center">
        <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full border border-primary-200 bg-primary-100 font-display text-3xl text-primary">{initial}</div>
        <h1 className="font-display text-2xl font-medium text-primary-900">{fullName}</h1>
        <p className="text-[13px] text-status-full">{ctx.member?.email ?? t.appName}</p>
      </header>

      <div className="card-ink space-y-3 p-5">
        <div className="flex items-center justify-between">
          <p className="font-display text-lg">{planName ?? t.memberships.noMembership}</p>
          {planName ? <span className="rounded-pill border border-white/25 px-3 py-1 text-[11px] text-primary-200">{t.profile.active}</span> : null}
        </div>
        <p className="text-[13px] text-surface/70">
          {ctx.balance > 0 ? t.memberships.credits.replace("{n}", String(ctx.balance)) : t.memberships.noCredits}
          {` · ${t.profile.attended.replace("{n}", String(attended))}`}
        </p>
        {renews ? <p className="text-[11px] text-surface/50">{t.profile.renews.replace("{d}", renews)}</p> : null}
      </div>

      <div className="card overflow-hidden">
        <Row label={t.profile.personalData} />
        <Row label={t.profile.payment} />
        <Row label={t.profile.notifications} />
        <div className="flex items-center justify-between px-5 py-4">
          <span className="text-[15px]">{t.profile.language}</span>
          <LangToggle current={locale} />
        </div>
      </div>

      {ctx.isAdmin ? (
        <Link href="/admin" className="card flex items-center justify-between px-5 py-4">
          <span>{t.profile.admin}</span><span className="chevron text-status-full">›</span>
        </Link>
      ) : null}

      <LogoutButton label={t.profile.logout} />
      <p className="text-center text-xs text-status-full">{t.profile.version} 0.1.0</p>
    </section>
  );
}

function Row({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-between border-b border-outline px-5 py-4 text-[15px]">
      <span>{label}</span><span className="chevron text-status-full">›</span>
    </div>
  );
}
