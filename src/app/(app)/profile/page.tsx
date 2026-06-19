import Link from "next/link";
import { dict } from "@/lib/i18n";
import { getLocale } from "@/lib/locale-server";
import { getMemberContext, getMyBookings } from "@/lib/queries";
import { LangToggle, LogoutButton } from "@/components/Buttons";
import { Icon } from "@/components/Icon";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const locale = await getLocale();
  const t = dict[locale];
  const [ctx, bookings] = await Promise.all([getMemberContext(), getMyBookings()]);
  const attended = bookings.filter((b) => b.status === "attended").length;

  return (
    <section className="space-y-4 p-4">
      <header className="flex items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-100"><Icon name="person" className="text-2xl text-primary-500" /></div>
        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold text-primary-800">{ctx.member?.full_name ?? t.profile.title}</h1>
          <p className="text-sm text-status-full">{t.appName}</p>
        </div>
      </header>

      <div className="card p-4">
        <p className="text-xs font-semibold tracking-wide text-status-full">{t.profile.title}</p>
        <p className="mt-1 text-sm">{t.profile.attended.replace("{n}", String(attended))}</p>
        <p className="text-sm text-status-full">
          {ctx.balance > 0 ? t.memberships.credits.replace("{n}", String(ctx.balance)) : t.memberships.noCredits}
        </p>
      </div>

      <div className="card flex items-center justify-between p-4">
        <span className="text-sm font-medium">{t.profile.language}</span>
        <LangToggle current={locale} />
      </div>

      {ctx.isAdmin ? (
        <Link href="/admin" className="card flex items-center justify-between p-4">
          <span>{t.profile.admin}</span><span className="chevron text-status-full">›</span>
        </Link>
      ) : null}

      <LogoutButton label={t.profile.logout} />
      <p className="text-center text-xs text-status-full">{t.profile.version} 0.1.0</p>
    </section>
  );
}
