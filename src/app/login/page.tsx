"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { dict } from "@/lib/i18n";

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
    setBusy(true); setErr(null);
    const { error } = await supabase.auth.signInWithPassword({ email: e ?? email, password: p ?? password });
    setBusy(false);
    if (error) { setErr(error.message); return; }
    router.push("/"); router.refresh();
  }

  const field = "w-full rounded-[14px] border border-outline bg-surface-elevated px-4 py-3.5 text-[15px] outline-none focus:border-accent";
  const label = "mb-1.5 block text-[11px] uppercase tracking-[0.1em] text-status-full";

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
        {err ? <p className="text-sm text-accent">{err}</p> : null}

        <button disabled={busy} onClick={() => signIn()} className="w-full rounded-pill bg-primary py-4 text-base font-medium text-ink disabled:opacity-50">{t.submit}</button>
        <div className="flex gap-2.5">
          <button disabled={busy} onClick={() => signIn("noor@elan.demo", "elan1234")} className="flex-1 rounded-pill border border-outline py-3 text-[13px] text-primary-700 disabled:opacity-50">{t.demo}</button>
          <button disabled={busy} onClick={() => signIn("owner@elan.demo", "elan1234")} className="flex-1 rounded-pill border border-outline py-3 text-[13px] text-primary-700 disabled:opacity-50">{t.demoAdmin}</button>
        </div>
        <p className="text-center text-[13px] text-status-full">{t.hint}</p>
      </div>
    </div>
  );
}
