"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { dict, dirFor, type Locale } from "@/lib/i18n";
import { DEMO } from "@/lib/demo";
import { Captcha } from "@/components/Captcha";

const CAPTCHA_ENABLED = Boolean(process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY);

/** Login form. The member path (email magic link) is the PRIMARY action; staff
 *  password sign-in is secondary, behind a disclosure. Locale-aware; all copy
 *  comes from the dictionary. */
export function LoginForm({ locale }: { locale: Locale }) {
  const L = dict[locale];
  const t = L.login;
  const router = useRouter();
  const supabase = getBrowserSupabase();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [showStaff, setShowStaff] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  // Member login: email magic link (OTP). No password — the admin creates the
  // client with her email and she signs in via the link.
  async function memberMagicLink() {
    if (!email.trim()) { setErr(t.error); return; }
    if (CAPTCHA_ENABLED && !captchaToken) { setErr(L.captcha.failed); return; }
    setBusy(true); setErr(null);
    const base = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${base}/auth/callback`, captchaToken: captchaToken ?? undefined },
    });
    setBusy(false);
    if (error) { setErr(error.message || t.error); return; }
    setSent(true);
  }

  // Real Supabase auth — required for the admin/trainer consoles.
  async function signIn(e?: string, p?: string) {
    if (CAPTCHA_ENABLED && !captchaToken) { setErr(L.captcha.failed); return; }
    setBusy(true); setErr(null);
    const { error } = await supabase.auth.signInWithPassword({
      email: e ?? email,
      password: p ?? password,
      options: { captchaToken: captchaToken ?? undefined },
    });
    if (error) { setBusy(false); setErr(t.error); return; }
    const [{ data: isAdmin }, { data: isInstructor }] = await Promise.all([
      supabase.rpc("is_admin"),
      // is_instructor is a newer RPC not in the generated Database types yet.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.rpc as any)("is_instructor"),
    ]);
    setBusy(false);
    router.push(isAdmin ? "/admin" : isInstructor ? "/trainer" : "/"); router.refresh();
  }

  function demoMember() {
    if (DEMO) { router.push("/"); router.refresh(); return; }
    void signIn("noor@elan.demo", "elan1234");
  }

  const field = "w-full rounded-sm border border-outline bg-surface-elevated px-4 py-3.5 text-body outline-none focus:border-accent";
  const label = "mb-1.5 block text-meta font-medium text-status-full";

  return (
    <div dir={dirFor(locale)} className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-8 p-9">
      <div className="text-center">
        <div className="wordmark text-6xl font-medium text-primary-900">{L.appName}</div>
        <div className="mx-auto my-5 h-px w-10 bg-primary" />
        <div className="text-[15px] text-status-full">{L.tagline}</div>
      </div>

      <div className="space-y-5">
        <label className="block">
          <span className={label}>{t.email}</span>
          <input dir="ltr" inputMode="email" autoComplete="email" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className={field} />
        </label>
        {err ? <p className="text-meta text-danger" role="alert">{err}</p> : null}

        <Captcha onToken={setCaptchaToken} />

        {sent ? (
          <p className="rounded-sm border border-outline bg-surface-variant px-4 py-3 text-center text-meta text-sage-700" role="status">{t.magicLinkSent}</p>
        ) : (
          <button type="button" disabled={busy} onClick={memberMagicLink} className="btn button-lg w-full bg-primary text-ink disabled:opacity-50">
            {busy ? <span className="spinner" aria-hidden /> : t.magicLink}
          </button>
        )}
        <p className="text-center text-caption text-status-full">{t.memberHint}</p>

        {DEMO ? (
          <div className="flex gap-2.5">
            <button type="button" disabled={busy} onClick={demoMember} className="btn button-sm flex-1 border border-outline text-primary-700">{t.demo}</button>
            <button type="button" disabled={busy} onClick={() => signIn("owner@elan.demo", "elan1234")} className="btn button-sm flex-1 border border-outline text-primary-700">{t.demoAdmin}</button>
          </div>
        ) : null}

        <div className="border-t border-outline pt-4">
          {showStaff ? (
            <div className="space-y-4">
              <label className="block">
                <span className={label}>{t.password}</span>
                <input dir="ltr" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className={field} />
              </label>
              <button type="button" disabled={busy} onClick={() => signIn()} className="btn button-md w-full border border-outline text-primary-700 disabled:opacity-50">
                {busy ? <span className="spinner" aria-hidden /> : t.submit}
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => setShowStaff(true)} className="block w-full text-center text-meta text-status-full underline">
              {t.staffSignIn}
            </button>
          )}
        </div>

        {DEMO ? <p className="text-center text-meta text-status-full">{t.hint}</p> : null}

        <nav className="flex justify-center gap-4 pt-2 text-caption text-status-full">
          <Link href="/privacy">{L.legal.privacy}</Link>
          <Link href="/terms">{L.legal.terms}</Link>
          <Link href="/contact">{L.legal.contact}</Link>
        </nav>
      </div>
    </div>
  );
}
