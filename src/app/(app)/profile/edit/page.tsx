import Link from "next/link";
import { dict } from "@/lib/i18n";
import { getLocale } from "@/lib/locale-server";
import { getMemberContext } from "@/lib/queries";
import { EditProfileForm } from "@/components/EditProfileForm";

export const dynamic = "force-dynamic";

export default async function EditProfilePage() {
  const locale = await getLocale();
  const t = dict[locale];
  const ctx = await getMemberContext();

  return (
    <section className="px-6 pb-10 pt-6">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/profile" className="chevron text-status-full" aria-label={t.common.back}>‹</Link>
        <h1 className="font-display text-page-title font-medium text-primary-900">{t.profile.editTitle}</h1>
      </div>
      <EditProfileForm
        initialName={ctx.member?.full_name ?? ""}
        initialPhone={ctx.member?.phone ?? ""}
        email={ctx.member?.email ?? null}
        labels={{
          fullName: t.profile.fullName,
          phone: t.profile.phone,
          emailLabel: t.profile.emailLabel,
          emailLocked: t.profile.emailLocked,
          save: t.profile.save,
          saved: t.profile.saved,
          saveFailed: t.profile.saveFailed,
        }}
      />
    </section>
  );
}
