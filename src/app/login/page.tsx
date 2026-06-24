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
  const [email, setEmail] = useState("noor@elan.demo");
  const [password, setPassword] = useState("elan1234");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function signIn(e?: string, p?: string) {
    if (DEMO) { router.push("/"); router.refresh(); return; }
    setBusy(true); setErr(null);
    const { error } = await supabase.auth.signInWithPassword({ email: e ?? email, password: p ?? password });
    setBusy(false);
    if (error) { setErr(t.error); return; }
    router.push("/"); router.refresh();
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
          <input dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} className={field} />
        </label>
        <label className="block">
          <span className={label}>{t.password}</span>
          <input dir="ltr" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={field} />
        </label>
        {err ? <p className="text-meta text-danger" role="alert">{err}</p> : null}

        <button type="button" disabled={busy} onClick={() => signIn()} className="btn button-lg w-full bg-primary text-ink">{busy ? <span className="spinner" aria-hidden /> : t.submit}</button>
        <div className="flex gap-2.5">
          <button type="button" disabled={busy} onClick={() => signIn("noor@elan.demo", "elan1234")} className="btn button-sm flex-1 border border-outline text-primary-700">{t.demo}</button>
          <button type="button" disabled={busy} onClick={() => signIn("owner@elan.demo", "elan1234")} className="btn button-sm flex-1 border border-outline text-primary-700">{t.demoAdmin}</button>
        </div>
        <p className="text-center text-meta text-status-full">{t.hint}</p>
      </div>
    </div>
  );
}
