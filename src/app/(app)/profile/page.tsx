import Link from "next/link";
import Image from "next/image";
import { dict } from "@/lib/i18n";
import { getLocale } from "@/lib/locale-server";
import { getMemberContext, getMyBookings, getMyCreditHistory, getMyNotifications, getMyUnreadCount, getMyCheckinCode, getMyPoints } from "@/lib/queries";
import { LangToggle, LogoutButton } from "@/components/Buttons";
import { MarkNotificationsRead } from "@/components/MarkNotificationsRead";
import { LegalLinks } from "@/components/LegalLinks";
import { HERO_IMAGE } from "@/lib/classColor";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const locale = await getLocale();
  const t = dict[locale];
  const ar = locale === "ar";
  const [ctx, bookings, credits, notifications, unread, checkinCode, points] = await Promise.all([getMemberContext(), getMyBookings(), getMyCreditHistory(30), getMyNotifications(30), getMyUnreadCount(), getMyCheckinCode(), getMyPoints()]);
  const attended = bookings.filter((b) => b.status === "attended").length;
  const fullName = ctx.member?.full_name ?? t.profile.title;
  const initial = (fullName.trim()[0] ?? "·").toUpperCase();
  const planName = ctx.membership?.membership_plans ? (ar ? ctx.membership.membership_plans.name_ar : ctx.membership.membership_plans.name_en) : null;
  const renews = ctx.membership?.current_period_end
    ? new Intl.DateTimeFormat(ar ? "ar-SA" : "en-US", { day: "numeric", month: "long", year: "numeric" }).format(new Date(ctx.membership.current_period_end))
    : null;

  return (
    <section className="pb-6">
      <div className="relative h-36 overflow-hidden rounded-b-xl md:mt-4 md:rounded-xl">
        <Image src={HERO_IMAGE} alt="" fill sizes="(min-width:768px) 768px, 100vw" className="object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg,rgba(33,28,24,.1),rgba(33,28,24,.45))" }} />
      </div>
      <div className="space-y-6 px-6">
        <header className="text-center">
          <div className="mx-auto -mt-12 mb-3 flex h-24 w-24 items-center justify-center rounded-full border-[6px] border-surface bg-surface-variant font-display text-3xl text-accent">{initial}</div>
          <h1 className="font-display text-page-title font-medium text-primary-900">{fullName}</h1>
          <p className="text-meta text-status-full">{ctx.member?.email ?? t.appName}</p>
        </header>

      <div className="card-ink space-y-3 p-5">
        <div className="flex items-center justify-between">
          <p className="font-display text-lead">{planName ?? t.memberships.noMembership}</p>
          {planName ? <span className="rounded-pill border border-white/25 px-3 py-1 text-caption text-primary-200">{t.profile.active}</span> : null}
        </div>
        <p className="text-meta text-ink/70">
          {ctx.balance > 0 ? t.memberships.credits.replace("{n}", String(ctx.balance)) : t.memberships.noCredits}
          {` · ${t.profile.attended.replace("{n}", String(attended))}`}
        </p>
        {renews ? <p className="text-caption text-ink/50">{t.profile.renews.replace("{d}", renews)}</p> : null}
      </div>

      <div className="card flex items-center justify-between gap-4 p-5">
        <div className="min-w-0">
          <p className="text-meta font-medium text-primary-900">{t.profile.points}</p>
          <p className="mt-0.5 text-caption text-status-full">{t.profile.pointsHint}</p>
        </div>
        <span className="shrink-0 font-number text-2xl font-medium text-accent">{points}</span>
      </div>

      {checkinCode ? (
        <div className="card flex items-center justify-between gap-4 p-5">
          <div className="min-w-0">
            <p className="text-meta font-medium text-primary-900">{t.profile.checkinCode}</p>
            <p className="mt-0.5 text-caption text-status-full">{t.profile.checkinHint}</p>
          </div>
          <span className="shrink-0 rounded-lg bg-surface-variant px-4 py-2 font-number text-2xl font-medium tracking-[0.3em] text-primary-900">{checkinCode}</span>
        </div>
      ) : null}

      <div className="card overflow-hidden">
        <RowLink label={t.legal.privacy} href="/privacy" />
        <RowLink label={t.legal.terms} href="/terms" />
        <div className="flex items-center justify-between px-5 py-4">
          <span className="text-body">{t.profile.language}</span>
          <LangToggle current={locale} />
        </div>
      </div>

      {/* Credit history (#7) — full transparency on credit movements */}
      <div className="card overflow-hidden">
        <div className="border-b border-outline px-5 py-3 text-meta font-medium text-status-full">{t.profile.creditHistory}</div>
        {credits.length === 0 ? (
          <p className="px-5 py-5 text-center text-meta text-status-full">{t.profile.noCreditHistory}</p>
        ) : (
          credits.map((c, i) => {
            const reason = (t.ledger as Record<string, string>)[c.reason] ?? c.reason;
            const when = new Intl.DateTimeFormat(ar ? "ar-SA" : "en-US", { day: "numeric", month: "short" }).format(new Date(c.created_at));
            const positive = c.change > 0;
            return (
              <div key={i} className="flex items-center justify-between border-b border-outline px-5 py-3 text-body last:border-0">
                <span className="text-primary-900">{reason}</span>
                <span className="flex items-center gap-3">
                  <span className={`font-number font-medium ${positive ? "text-sage-700" : "text-danger"}`}>{positive ? "+" : ""}{c.change}</span>
                  <span className="text-caption text-status-full">{when}</span>
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* In-app notifications inbox (#17/#19) */}
      <MarkNotificationsRead hasUnread={unread > 0} />
      <div className="card overflow-hidden">
        <div className="border-b border-outline px-5 py-3 text-meta font-medium text-status-full">{t.profile.inbox}</div>
        {notifications.length === 0 ? (
          <p className="px-5 py-5 text-center text-meta text-status-full">{t.profile.noNotifications}</p>
        ) : (
          notifications.map((n, i) => {
            const when = new Intl.DateTimeFormat(ar ? "ar-SA" : "en-US", { day: "numeric", month: "short" }).format(new Date(n.created_at));
            const title = n.template === "broadcast"
              ? (n.payload?.title || (t.notif as Record<string, string>).broadcast)
              : (t.notif as Record<string, string>)[n.template] ?? n.template;
            const body = n.template === "broadcast" ? n.payload?.message ?? "" : "";
            return (
              <div key={i} className="border-b border-outline px-5 py-3 last:border-0">
                <div className="flex items-center justify-between">
                  <span className="text-body text-primary-900">{title}</span>
                  <span className="text-caption text-status-full">{when}</span>
                </div>
                {body ? <p className="mt-1 text-meta text-status-full">{body}</p> : null}
              </div>
            );
          })
        )}
      </div>

      {ctx.isAdmin ? (
        <Link href="/admin" className="card flex items-center justify-between px-5 py-4">
          <span>{t.profile.admin}</span><span className="chevron text-status-full">›</span>
        </Link>
      ) : null}

      <LogoutButton label={t.profile.logout} />
      <LegalLinks locale={locale} className="pb-2" />
      <p className="text-center text-xs text-status-full">{t.profile.version} 0.1.0</p>
      </div>
    </section>
  );
}

function RowLink({ label, href }: { label: string; href: string }) {
  return (
    <Link href={href} className="flex items-center justify-between border-b border-outline px-5 py-4 text-body last:border-0">
      <span>{label}</span><span className="chevron text-status-full">›</span>
    </Link>
  );
}
