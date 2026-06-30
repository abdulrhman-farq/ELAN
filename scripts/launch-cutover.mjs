#!/usr/bin/env node
/**
 * Launch cutover helper — verifies what it can without secrets, and prints
 * the exact manual steps for Vercel/Supabase dashboard work.
 *
 * Usage:
 *   node scripts/launch-cutover.mjs verify
 *   node scripts/launch-cutover.mjs sql   # prints migration 0024 for copy/paste
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const STAGING = {
  url: "https://xpslluqnrvmeapfqkjsd.supabase.co",
  anon:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhwc2xsdXFucnZtZWFwZnFranNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2NDkzNzYsImV4cCI6MjA5ODIyNTM3Nn0.cQi0B9W88GjYKMICuCNhkgaQKDuguxUchIo3Ip4KIGU",
  ref: "xpslluqnrvmeapfqkjsd",
};
const PROD = {
  url: "https://knldyssbwygrkxamttez.supabase.co",
  anon:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtubGR5c3Nid3lncmt4YW10dGV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4NTg4MjIsImV4cCI6MjA5NzQzNDgyMn0.0Ol4bTSVAevhFNGmII13bAKKtdztnO_F4wd62ZzOnK8",
  ref: "knldyssbwygrkxamttez",
};

async function rest(base, anon, path) {
  const res = await fetch(`${base}/rest/v1/${path}`, {
    headers: { apikey: anon, Authorization: `Bearer ${anon}` },
  });
  const text = await res.text();
  return { ok: res.ok, status: res.status, text };
}

async function verify() {
  console.log("ÉLAN launch cutover — automated checks\n");
  for (const [name, cfg] of [
    ["staging", STAGING],
    ["production", PROD],
  ]) {
    const settings = await rest(cfg.url, cfg.anon, "studio_settings?select=id,name_ar,email&limit=1");
    const classes = await rest(
      cfg.url,
      cfg.anon,
      "class_instances?select=id&status=eq.scheduled&starts_at=gte." + encodeURIComponent(new Date().toISOString()) + "&limit=1",
    );
    console.log(`[${name}] project ref: ${cfg.ref}`);
    console.log(`  studio_settings: ${settings.ok ? "✓ readable" : "✗ " + settings.status} ${settings.text.slice(0, 120)}`);
    console.log(`  upcoming classes: ${classes.ok ? "✓" : "✗ " + classes.status}`);
  }

  const prodLogin = await fetch("https://elan-rosy.vercel.app/login");
  console.log(`\n[vercel] elan-rosy.vercel.app/login → ${prodLogin.status}`);

  console.log(`
Manual steps (require dashboard access — not available in this agent):
  1. Supabase SQL editor → run migration 0024 (node scripts/launch-cutover.mjs sql)
  2. Vercel → elan → Environment Variables:
     Preview: NEXT_PUBLIC_SUPABASE_URL + ANON_KEY (staging) + SERVICE_ROLE_KEY
     Production: SENTRY_DSN, RESEND_API_KEY, MOYASAR_SECRET_KEY (when ready)
  3. Vercel → Domains → add app.elan.sa (or your domain) + DNS CNAME
  4. GitHub → Settings → Secrets → E2E_* for acceptance workflow
`);
}

function sql() {
  const path = fileURLToPath(new URL("../supabase/migrations/0024_launch_readiness.sql", import.meta.url));
  console.log(readFileSync(path, "utf8"));
}

const cmd = process.argv[2] ?? "verify";
if (cmd === "sql") sql();
else verify().catch((e) => {
  console.error(e);
  process.exit(1);
});
