// `npm run setup` — zero-config bootstrap. Creates .env.local from the committed
// public defaults if it's missing, then verifies the app is ready to run.
// The demo Supabase project is already migrated and seeded.
import { copyFileSync, existsSync, readFileSync } from "node:fs";

const local = new URL("../.env.local", import.meta.url);
const example = new URL("../.env.example", import.meta.url);

if (!existsSync(local)) {
  copyFileSync(example, local);
  console.log("✓ Created .env.local from .env.example (public demo defaults).");
}

const env = readFileSync(local, "utf8");
let ok = true;
for (const key of ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"]) {
  if (!new RegExp(`^${key}=.+`, "m").test(env)) {
    console.error(`✗ ${key} is not set in .env.local`);
    ok = false;
  }
}

if (!ok) process.exit(1);
console.log("✓ ELAN is ready. Run `npm run dev` and open http://localhost:3000");
console.log("  Demo member:  noor@elan.demo  / elan1234");
console.log("  Demo admin:   owner@elan.demo / elan1234  (visit /admin)");
