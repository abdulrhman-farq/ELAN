"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { dict } from "@/lib/i18n";
import { DEMO } from "@/lib/demo";

export default function LoginPage() {
  // Login is locale-agnostic; default to Arabic copy.
  const t = dict.ar.login;
  const router = useRouter();
  const supabase = getBrowserSupabase();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  // Subscriber login: email magic link. Admin creates the client with her email;
  // she signs in via the link and the app resolves her real profile by email.
  async function memberMagicLink() {
    if (!email.trim()) { setErr(t.error); return; }
    setBusy(true); setErr(null);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setBusy(false);
    if (error) { setErr(error.message || t.error); return; }
    setSent(true);
  }

  // Real Supabase auth — required for the admin console; routes admins to /admin.
  async function signIn(e?: string, p?: string) {
    setBusy(true); setErr(null);
    const { error } = await supabase.auth.signInWithPassword({ email: e ?? email, password: p ?? password });
    if (error) { setBusy(false); setErr(t.error); return; }
    const { data: isAdmin } = await supabase.rpc("is_admin");
    setBusy(false);
    router.push(isAdmin ? "/admin" : "/"); router.refresh();
  }

  // The member-facing app is a demo showcase — quick entry without real auth.
  function demoMember() {
    if (DEMO) { router.push("/"); router.refresh(); return; }
    void signIn("noor@elan.demo", "elan1234");
  }

  const field = "w-full rounded-sm border border-outline bg-surface-elevated px-4 py-3.5 text-body outline-none focus:border-accent";
  const label = "eyebrow-ar mb-1.5 block";

  return (
    <div dir="rtl" className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-8 p-9">
      <div className="text-center">
        <div className="wordmark text-6xl font-medium text-primary-900">{dict.ar.appName}</div>
        <div className="mx-auto my-5 h-px w-10 bg-primary" />
        <div className="text-[15px] text-status-full">{dict.ar.tagline}</div>
      </div>

      <div className="space-y-5">
        <label className="block">
          <span className={label}>{t.email}</span>
          <input dir="ltr" inputMode="email" autoComplete="email" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className={field} />
        </label>
        <label className="block">
          <span className={label}>{t.password}</span>
          <input dir="ltr" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={field} />
        </label>
        {err ? <p className="text-meta text-danger" role="alert">{err}</p> : null}

        <button type="button" disabled={busy} onClick={() => signIn()} className="btn button-lg w-full bg-primary text-ink">{busy ? <span className="spinner" aria-hidden /> : t.submit}</button>
        <div className="flex gap-2.5">
          <button type="button" disabled={busy} onClick={demoMember} className="btn button-sm flex-1 border border-outline text-primary-700">{t.demo}</button>
          <button type="button" disabled={busy} onClick={() => signIn("owner@elan.demo", "elan1234")} className="btn button-sm flex-1 border border-outline text-primary-700">{t.demoAdmin}</button>
        </div>

        <div className="border-t border-outline pt-4">
          {sent ? (
            <p className="text-center text-meta text-sage" role="status">تم إرسال رابط الدخول إلى بريدك ✦ افتحيه من جوالك للدخول.</p>
          ) : (
            <button type="button" disabled={busy} onClick={memberMagicLink} className="btn button-md w-full border border-outline text-primary-700">
              دخول العميلة برابط عبر البريد
            </button>
          )}
        </div>

        <p className="text-center text-meta text-status-full">{t.hint}</p>
      </div>
    </div>
  );
}
