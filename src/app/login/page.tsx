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

  return (
    <div dir="rtl" className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 p-6">
      <h1 className="text-center text-4xl font-bold text-primary-700">{dict.ar.appName}</h1>
      <div className="card space-y-4 p-6">
        <label className="block space-y-1">
          <span className="text-sm font-medium">{t.email}</span>
          <input dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-card border border-outline px-4 py-3 outline-none focus:border-primary" />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">{t.password}</span>
          <input dir="ltr" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-card border border-outline px-4 py-3 outline-none focus:border-primary" />
        </label>
        {err ? <p className="text-sm text-primary-600">{err}</p> : null}
        <button disabled={busy} onClick={() => signIn()}
          className="w-full rounded-pill bg-primary py-3 font-medium text-white disabled:opacity-50">{t.submit}</button>
        <div className="flex gap-2">
          <button disabled={busy} onClick={() => signIn("noor@elan.demo", "elan1234")}
            className="flex-1 rounded-pill border border-outline py-2 text-sm">{t.demo}</button>
          <button disabled={busy} onClick={() => signIn("owner@elan.demo", "elan1234")}
            className="flex-1 rounded-pill border border-outline py-2 text-sm">{t.demoAdmin}</button>
        </div>
        <p className="text-center text-xs text-status-full">{t.hint}</p>
      </div>
    </div>
  );
}
