# ÉLAN — Full Code Bundle (all source + config)

> Generated 2026-06-25. No secrets included. The Supabase ANON key in config is public by design.

## Config files

### package.json
```
{
  "name": "elan",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "setup": "node scripts/setup.mjs",
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@supabase/ssr": "^0.12.0",
    "@supabase/supabase-js": "^2.45.4",
    "next": "^15.1.6",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/node": "^22.7.4",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.47",
    "tailwindcss": "^3.4.13",
    "typescript": "^5.6.3",
    "vitest": "^2.1.2"
  }
}

```

### tsconfig.json
```
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}

```

### next.config.ts
```
import type { NextConfig } from "next";

/** Allow remote class/hero photos served from Supabase Storage
 *  (NEXT_PUBLIC_ELAN_MEDIA_BASE). Patterns are derived from the env host when
 *  set, with a *.supabase.co fallback so swapping the ref needs no code change. */
function remotePatterns(): NonNullable<NextConfig["images"]>["remotePatterns"] {
  const patterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [
    { protocol: "https", hostname: "**.supabase.co", pathname: "/storage/v1/object/public/**" },
  ];
  const base = process.env.NEXT_PUBLIC_ELAN_MEDIA_BASE;
  if (base) {
    try {
      const u = new URL(base);
      patterns.push({ protocol: u.protocol.replace(":", "") as "http" | "https", hostname: u.hostname, pathname: "/**" });
    } catch {
      /* ignore malformed base */
    }
  }
  return patterns;
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: { remotePatterns: remotePatterns() },
};

export default nextConfig;

```

### tailwind.config.ts
```
import type { Config } from "tailwindcss";

/** ÉLAN — warm cream quiet-luxury with charcoal + champagne-gold and dark
 *  photographic "brand moments" (per the reference). */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // ÉLAN brand identity (handoff §01): Peach Protein / Blush Beet / Honey Oatmilk
        // / Coconut Cream / Sage. Ink for text, Brass for lines & accent, Dark for
        // photographic "brand moments". Green is a sparing botanical accent only.
        primary: {
          DEFAULT: "#3B2D27", // Ink
          50: "#F8F5F1", // Coconut Cream
          100: "#F6EAD4", // Honey Oatmilk
          200: "#EFD7CF", // Peach Protein
          300: "#DDBAAE", // Blush Beet
          400: "#C8A98A", // brass-tinted fill
          500: "#3B2D27", // Ink
          600: "#5B4A41", // ink-soft
          700: "#846532", // deep brass — accessible accent text on cream
          800: "#2B2420", // Dark
          900: "#3B2D27", // Ink (headings)
        },
        surface: { DEFAULT: "#F4EBDD", variant: "#EFE0CF", container: "#FBF6EF", elevated: "#FBF6EF" },
        outline: "#E7D9C4", // brass line ~40%
        accent: "#B89B72", // Brass
        sage: { DEFAULT: "#818263", 100: "#E6E7DC", 700: "#5F6049" },
        ink: "#F8F5F1", // Coconut Cream text on dark / brass fills
        brand: "#2B2420", // Dark — hero + admin sidebar
        danger: "#9A5B3E", // warning / error
        status: { available: "#818263", waitlist: "#B89B72", full: "#6F5D52" },
      },
      borderRadius: {
        // Unified radius scale: sm 12 / md 16 / lg 20 / xl 28. `card` aliases xl.
        sm: "0.75rem", // 12px
        md: "1rem", // 16px
        lg: "1.25rem", // 20px
        xl: "1.75rem", // 28px
        card: "1.75rem", // alias of xl — heroes + major cards share this
        pill: "9999px",
      },
      fontSize: {
        // Role-based type scale.
        caption: ["0.75rem", { lineHeight: "1rem" }], // 12
        meta: ["0.8125rem", { lineHeight: "1.125rem" }], // 13
        body: ["0.9375rem", { lineHeight: "1.5rem" }], // 15
        lead: ["1.0625rem", { lineHeight: "1.6rem" }], // 17
        title: ["1.25rem", { lineHeight: "1.6rem" }], // 20
        "page-title": ["1.75rem", { lineHeight: "2.1rem" }], // 28
        hero: ["2.25rem", { lineHeight: "2.4rem" }], // 36
      },
      boxShadow: {
        card: "0 14px 44px rgba(58,51,47,0.10), 0 4px 12px rgba(58,51,47,0.05)",
        sticky: "0 8px 30px rgba(58,51,47,0.12)",
        glow: "0 16px 40px -16px rgba(184,151,102,0.4)",
      },
      fontFamily: {
        // Handoff §01: Amiri = Arabic headings (Display); Tajawal = Arabic body;
        // Bodoni Moda = wordmark, Latin & all numbers (prices, dates, counters).
        sans: ["'Tajawal'", "'IBM Plex Sans Arabic'", "system-ui", "sans-serif"],
        display: ["'Amiri'", "'Bodoni Moda'", "Georgia", "serif"],
        label: ["'Bodoni Moda'", "Georgia", "serif"],
        arabic: ["'Tajawal'", "sans-serif"],
        number: ["'Bodoni Moda'", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};
export default config;

```

### postcss.config.mjs
```
export default { plugins: { tailwindcss: {}, autoprefixer: {} } };

```

### .env.example
```
# Zero-config defaults — point at the seeded ELAN demo project.
# The anon key is public-safe (RLS enforced). Swap for your own to go live.
NEXT_PUBLIC_SUPABASE_URL=https://knldyssbwygrkxamttez.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtubGR5c3Nid3lncmt4YW10dGV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4NTg4MjIsImV4cCI6MjA5NzQzNDgyMn0.0Ol4bTSVAevhFNGmII13bAKKtdztnO_F4wd62ZzOnK8

# Optional — real photos from a public Supabase Storage "media" bucket.
# When set, images load from here (<name>.jpg); otherwise bundled SVG art is used.
# NEXT_PUBLIC_ELAN_MEDIA_BASE=https://<your-ref>.supabase.co/storage/v1/object/public/media

# Optional — set to false once a real backend is wired (disables demo/mock mode).
# NEXT_PUBLIC_ELAN_DEMO=false

# Optional — real providers switch on automatically when these exist.
# MOYASAR_SECRET_KEY=
# MOYASAR_PUBLISHABLE_KEY=
# WHATSAPP_ACCESS_TOKEN=
# WHATSAPP_PHONE_NUMBER_ID=
# SENTRY_DSN=

```

## middleware
_No middleware file (auth gating is in layouts + server actions)._

## Source files

### src/actions/admin.ts
```tsx
"use server";

import { revalidatePath } from "next/cache";
import { getServerSupabase, rpc } from "@/lib/supabase/server";

type Result = { ok: true } | { error: string };

async function ensureAdmin() {
  const supabase = await getServerSupabase();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { supabase, ok: false as const };
  const { data: isAdmin } = await rpc<boolean>(supabase, "is_admin");
  return { supabase, ok: Boolean(isAdmin) };
}

/** Mark a confirmed booking as a no-show (SECURITY DEFINER RPC, admin-gated server-side). */
export async function markNoShowAction(bookingId: string, classInstanceId: string): Promise<Result> {
  const { supabase, ok } = await ensureAdmin();
  if (!ok) return { error: "غير مصرّح" };
  const { error } = await rpc(supabase, "mark_no_show", { p_booking_id: bookingId });
  revalidatePath(`/admin/class/${classInstanceId}`);
  return error ? { error: error.message } : { ok: true };
}

/** Mark a confirmed booking as attended. Falls back to a direct update; RLS governs access. */
export async function markAttendedAction(bookingId: string, classInstanceId: string): Promise<Result> {
  const { supabase, ok } = await ensureAdmin();
  if (!ok) return { error: "غير مصرّح" };
  const { error } = await supabase.from("bookings").update({ status: "attended" }).eq("id", bookingId);
  revalidatePath(`/admin/class/${classInstanceId}`);
  return error ? { error: error.message } : { ok: true };
}

```

### src/actions/index.ts
```tsx
"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getServerSupabase, rpc } from "@/lib/supabase/server";
import { LOCALE_COOKIE, type Locale } from "@/lib/i18n";
import { DEMO } from "@/lib/demo";

/** True when a real subscriber (auth_user_id linked) is signed in. */
async function isRealMember(supabase: Awaited<ReturnType<typeof getServerSupabase>>): Promise<boolean> {
  const { data } = await rpc<string>(supabase, "current_member_id");
  return Boolean(data);
}

export async function bookAction(classInstanceId: string) {
  const supabase = await getServerSupabase();
  if (DEMO && !(await isRealMember(supabase))) {
    revalidatePath("/"); revalidatePath("/schedule"); revalidatePath("/bookings");
    return { ok: true as const, bookingId: "mock-bk-new" };
  }
  const { data, error } = await rpc<{ id: string }>(supabase, "book_class_self", { p_class_instance_id: classInstanceId, p_source: "web" });
  revalidatePath("/");
  revalidatePath("/schedule");
  revalidatePath(`/class/${classInstanceId}`);
  revalidatePath("/bookings");
  return error ? { error: error.message } : { ok: true as const, bookingId: data?.id ?? null };
}

export async function cancelAction(bookingId: string, classInstanceId?: string) {
  const supabase = await getServerSupabase();
  if (DEMO && !(await isRealMember(supabase))) {
    revalidatePath("/"); revalidatePath("/schedule"); revalidatePath("/bookings");
    if (classInstanceId) revalidatePath(`/class/${classInstanceId}`);
    return { ok: true };
  }
  const { error } = await rpc(supabase, "cancel_booking_self", { p_booking_id: bookingId });
  revalidatePath("/");
  revalidatePath("/schedule");
  revalidatePath("/bookings");
  if (classInstanceId) revalidatePath(`/class/${classInstanceId}`);
  return error ? { error: error.message } : { ok: true };
}

export async function purchaseAction(type: "membership" | "credit_pack", refId: string) {
  if (DEMO) {
    revalidatePath("/memberships"); revalidatePath("/profile");
    return { ok: true };
  }
  const supabase = await getServerSupabase();
  // Mock checkout: the PaymentProvider would redirect to Moyasar in production;
  // here we fulfill instantly via the sandbox RPC.
  const { error } = await rpc(supabase, "simulate_purchase", { p_type: type, p_ref_id: refId });
  revalidatePath("/memberships");
  revalidatePath("/profile");
  return error ? { error: error.message } : { ok: true };
}

export async function setLocaleAction(locale: Locale) {
  (await cookies()).set(LOCALE_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365 });
}

export async function signOutAction() {
  if (DEMO) redirect("/login");
  const supabase = await getServerSupabase();
  await supabase.auth.signOut();
  redirect("/login");
}

```

### src/admin-actions.ts
```tsx
"use server";

import { revalidatePath } from "next/cache";
import { getServerSupabase, rpc } from "@/lib/supabase/server";
import {
  computePrice,
  grossFromNet,
  DEFAULT_CLASS_NET_HALALAS,
  type DiscountType,
  type DiscountKind,
  type PricingSource,
} from "@/lib/pricing";

type ActionResult = { ok: true } | { ok: false; error: string };

async function adminClient() {
  const supabase = await getServerSupabase();
  const { data: isAdmin } = await rpc<boolean>(supabase, "is_admin");
  if (!isAdmin) return null;
  return supabase;
}

export async function createMemberAction(input: {
  full_name: string;
  phone?: string;
  email?: string;
  source?: string;
  lead_status?: string;
  recommended_class?: string;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const supabase = await adminClient();
  if (!supabase) return { ok: false, error: "forbidden" };
  const full_name = input.full_name?.trim();
  if (!full_name) return { ok: false, error: "name_required" };
  const { data, error } = await supabase
    .from("members")
    .insert({
      full_name,
      phone: input.phone?.trim() || null,
      email: input.email?.trim() || null,
      source: input.source?.trim() || null,
      lead_status: input.lead_status?.trim() || "lead",
      recommended_class: input.recommended_class?.trim() || null,
      role: "member",
    } as never)
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? "insert_failed" };
  revalidatePath("/admin/members");
  return { ok: true, id: data.id };
}

export async function updateMemberAction(
  memberId: string,
  input: { full_name: string; phone?: string; email?: string; source?: string; lead_status?: string },
): Promise<ActionResult> {
  const supabase = await adminClient();
  if (!supabase) return { ok: false, error: "forbidden" };
  const full_name = input.full_name?.trim();
  if (!full_name) return { ok: false, error: "name_required" };
  const { error } = await supabase
    .from("members")
    .update({
      full_name,
      phone: input.phone?.trim() || null,
      email: input.email?.trim() || null,
      source: input.source?.trim() || null,
      lead_status: input.lead_status?.trim() || null,
      modified: new Date().toISOString(),
    })
    .eq("id", memberId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/admin/members/${memberId}`);
  revalidatePath("/admin/members");
  return { ok: true };
}

export async function createTaskAction(memberId: string, title: string, dueDate?: string): Promise<ActionResult> {
  const supabase = await adminClient();
  if (!supabase) return { ok: false, error: "forbidden" };
  const t = title?.trim();
  if (!t) return { ok: false, error: "title_required" };
  const { data: auth } = await supabase.auth.getUser();
  const { error } = await (supabase as unknown as {
    from: (x: string) => { insert: (v: Record<string, unknown>) => Promise<{ error: { message: string } | null }> };
  })
    .from("member_tasks")
    .insert({ member_id: memberId, title: t, due_date: dueDate?.trim() || null, status: "open", created_by: auth.user?.id ?? null });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/admin/members/${memberId}`);
  revalidatePath("/admin");
  return { ok: true };
}

export async function setTaskStatusAction(taskId: string, status: "open" | "done", memberId: string): Promise<ActionResult> {
  const supabase = await adminClient();
  if (!supabase) return { ok: false, error: "forbidden" };
  const { error } = await (supabase as unknown as {
    from: (x: string) => { update: (v: Record<string, unknown>) => { eq: (c: string, val: string) => Promise<{ error: { message: string } | null }> } };
  })
    .from("member_tasks")
    .update({ status })
    .eq("id", taskId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/admin/members/${memberId}`);
  revalidatePath("/admin");
  return { ok: true };
}

export async function setLeadStatusAction(memberId: string, status: string): Promise<ActionResult> {
  const supabase = await adminClient();
  if (!supabase) return { ok: false, error: "forbidden" };
  const { error } = await supabase
    .from("members")
    .update({ lead_status: status || null, modified: new Date().toISOString() })
    .eq("id", memberId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/admin/members/${memberId}`);
  revalidatePath("/admin/members");
  return { ok: true };
}

export async function addNoteAction(memberId: string, body: string): Promise<ActionResult> {
  const supabase = await adminClient();
  if (!supabase) return { ok: false, error: "forbidden" };
  const text = body?.trim();
  if (!text) return { ok: false, error: "empty" };
  const { data: auth } = await supabase.auth.getUser();
  // member_notes is a new table not yet in the generated Database types.
  const { error } = await (supabase as unknown as {
    from: (t: string) => { insert: (v: Record<string, unknown>) => Promise<{ error: { message: string } | null }> };
  })
    .from("member_notes")
    .insert({ member_id: memberId, body: text, created_by: auth.user?.id ?? null });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/admin/members/${memberId}`);
  return { ok: true };
}

/* ──────────────────────────────────────────────────────────────────────────
   Class-value accounting: sales, discounts, comps, packages, promos, audit.
   Money in halalas; every mutation is gated by is_admin and written to
   pricing_audit (who / when / reason / old / new).
   ────────────────────────────────────────────────────────────────────────── */

/** Admin context with the acting user id (for the audit trail). */
async function adminCtx(): Promise<{ supabase: Awaited<ReturnType<typeof getServerSupabase>>; userId: string } | null> {
  const supabase = await getServerSupabase();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const { data: isAdmin } = await rpc<boolean>(supabase, "is_admin");
  if (!isAdmin) return null;
  return { supabase, userId: auth.user.id };
}

/** Untyped table accessor for tables/columns outside the generated Database types. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function tbl(supabase: Awaited<ReturnType<typeof getServerSupabase>>, name: string): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase as unknown as { from: (t: string) => any }).from(name);
}

async function writeAudit(
  supabase: Awaited<ReturnType<typeof getServerSupabase>>,
  actorId: string,
  e: { entity_type: string; entity_id?: string; action: string; field?: string; old_value?: string; new_value?: string; reason?: string | null },
): Promise<void> {
  await tbl(supabase, "pricing_audit").insert({ ...e, actor_id: actorId });
}

type PromoResolution = { ok: true; id: string; kind: DiscountKind; value: number } | { ok: false; error: string };

/** Validate a promo code against window, active flag, max and per-member limits. */
async function resolvePromo(
  supabase: Awaited<ReturnType<typeof getServerSupabase>>,
  code: string,
  memberId: string | null,
): Promise<PromoResolution> {
  const clean = code?.trim().toUpperCase();
  if (!clean) return { ok: false, error: "promo_required" };
  const { data: promo } = await tbl(supabase, "promo_codes").select("*").eq("code", clean).maybeSingle();
  if (!promo) return { ok: false, error: "promo_not_found" };
  if (!promo.active) return { ok: false, error: "promo_inactive" };
  const now = Date.now();
  if (promo.starts_at && new Date(promo.starts_at).getTime() > now) return { ok: false, error: "promo_not_started" };
  if (promo.expires_at && new Date(promo.expires_at).getTime() < now) return { ok: false, error: "promo_expired" };
  if (promo.max_redemptions != null) {
    const { count } = await tbl(supabase, "promo_redemptions").select("id", { count: "exact", head: true }).eq("promo_code_id", promo.id);
    if ((count ?? 0) >= promo.max_redemptions) return { ok: false, error: "promo_max_reached" };
  }
  if (promo.per_member_limit != null && memberId) {
    const { count } = await tbl(supabase, "promo_redemptions")
      .select("id", { count: "exact", head: true })
      .eq("promo_code_id", promo.id)
      .eq("member_id", memberId);
    if ((count ?? 0) >= promo.per_member_limit) return { ok: false, error: "promo_member_limit" };
  }
  return { ok: true, id: promo.id, kind: promo.discount_type as DiscountKind, value: promo.discount_value };
}

/** Resolve a discount input into an arithmetic kind/value (+ promo id). */
async function resolveDiscount(
  supabase: Awaited<ReturnType<typeof getServerSupabase>>,
  memberId: string | null,
  discountType: DiscountType,
  discountValue: number | undefined,
  promoCode: string | undefined,
): Promise<{ ok: true; kind: DiscountKind; value: number; promoId: string | null } | { ok: false; error: string }> {
  if (discountType === "promo_code") {
    const r = await resolvePromo(supabase, promoCode ?? "", memberId);
    if (!r.ok) return r;
    return { ok: true, kind: r.kind, value: r.value, promoId: r.id };
  }
  if (discountType === "percentage" || discountType === "fixed") {
    return { ok: true, kind: discountType, value: Math.max(0, discountValue ?? 0), promoId: null };
  }
  return { ok: true, kind: "none", value: 0, promoId: null };
}

export interface ClassSaleInput {
  pricingSource: PricingSource;
  discountType: DiscountType;
  discountValue?: number; // percentage -> bps; fixed -> halalas
  promoCode?: string;
  reason?: string;
}

/** Record a class booking with full value accounting (single cash / package credit / unlimited / comp / manual). */
export async function recordClassSaleAction(memberId: string, classInstanceId: string, input: ClassSaleInput): Promise<ActionResult> {
  const ctx = await adminCtx();
  if (!ctx) return { ok: false, error: "forbidden" };
  const { supabase, userId } = ctx;

  const { data: ci } = await tbl(supabase, "class_instances")
    .select("id, class_types(base_net_halalas,vat_bps)")
    .eq("id", classInstanceId)
    .maybeSingle();
  if (!ci) return { ok: false, error: "class_not_found" };
  const baseNet = ci.class_types?.base_net_halalas ?? DEFAULT_CLASS_NET_HALALAS;
  const vatBps = ci.class_types?.vat_bps ?? 1500;
  const listGross = grossFromNet(baseNet, vatBps);

  let storedType: DiscountType = input.discountType;
  let kind: DiscountKind = "none";
  let value = 0;
  let promoId: string | null = null;
  let reason = input.reason ?? null;

  if (input.pricingSource === "complimentary") {
    storedType = "manual";
    kind = "percentage";
    value = 10000; // 100%
    reason = reason ?? "complimentary";
  } else {
    const d = await resolveDiscount(supabase, memberId, input.discountType, input.discountValue, input.promoCode);
    if (!d.ok) return d;
    kind = d.kind;
    value = d.value;
    promoId = d.promoId;
  }

  // Package credit and unlimited membership: no cash for the class itself.
  let p;
  if (input.pricingSource === "package_credit" || input.pricingSource === "unlimited_membership") {
    p = {
      baseNetHalalas: baseNet,
      discountAmountHalalas: input.pricingSource === "package_credit" ? baseNet : 0,
      finalNetHalalas: 0,
      vatBps,
      vatAmountHalalas: 0,
      finalGrossHalalas: 0,
    };
  } else {
    p = computePrice({ baseNetHalalas: baseNet, vatBps, discountKind: kind, discountValue: value });
  }

  const cash = input.pricingSource === "single" || input.pricingSource === "manual";
  const audience = cash ? "payg" : "member";

  const { data: booking, error: bErr } = await tbl(supabase, "bookings")
    .insert({
      member_id: memberId,
      class_instance_id: classInstanceId,
      status: "confirmed",
      source: "admin",
      payment_audience: audience,
      credits_used: input.pricingSource === "package_credit" ? 1 : 0,
      base_net_halalas: p.baseNetHalalas,
      discount_type: storedType,
      discount_value: value,
      discount_amount_halalas: p.discountAmountHalalas,
      final_net_halalas: p.finalNetHalalas,
      vat_bps: vatBps,
      vat_amount_halalas: p.vatAmountHalalas,
      final_gross_halalas: p.finalGrossHalalas,
      currency: "SAR",
      pricing_source: input.pricingSource,
      list_value_halalas: listGross,
      effective_paid_halalas: cash ? p.finalGrossHalalas : null,
      discount_reason: reason,
      promo_code_id: promoId,
    })
    .select("id")
    .single();
  if (bErr || !booking) return { ok: false, error: bErr?.message ?? "booking_failed" };

  if (input.pricingSource === "package_credit") {
    const { data: bal } = await rpc<number>(supabase, "elan_credit_balance", { p_member: memberId });
    await tbl(supabase, "credit_ledger").insert({ member_id: memberId, change: -1, reason: "booking", balance_after: (bal ?? 0) - 1, ref_id: booking.id });
  }

  if (cash && p.finalGrossHalalas > 0) {
    const { data: pay } = await tbl(supabase, "payments")
      .insert({
        member_id: memberId,
        amount_sar: p.finalGrossHalalas / 100,
        sales_tax_sar: p.vatAmountHalalas / 100,
        currency: "SAR",
        status: "paid",
        type: "single_class",
        ref_id: booking.id,
        base_net_halalas: p.baseNetHalalas,
        discount_type: storedType,
        discount_value: value,
        discount_amount_halalas: p.discountAmountHalalas,
        net_halalas: p.finalNetHalalas,
        vat_amount_halalas: p.vatAmountHalalas,
        gross_halalas: p.finalGrossHalalas,
        promo_code_id: promoId,
      })
      .select("id")
      .single();
    if (promoId)
      await tbl(supabase, "promo_redemptions").insert({
        promo_code_id: promoId,
        member_id: memberId,
        booking_id: booking.id,
        payment_id: pay?.id ?? null,
        discount_amount_halalas: p.discountAmountHalalas,
      });
  } else if (promoId) {
    await tbl(supabase, "promo_redemptions").insert({ promo_code_id: promoId, member_id: memberId, booking_id: booking.id, discount_amount_halalas: p.discountAmountHalalas });
  }

  await writeAudit(supabase, userId, {
    entity_type: "booking",
    entity_id: booking.id,
    action: "sale",
    field: "final_gross_halalas",
    old_value: "0",
    new_value: String(p.finalGrossHalalas),
    reason: reason ?? input.pricingSource,
  });
  revalidatePath(`/admin/members/${memberId}`);
  revalidatePath("/admin/reports");
  return { ok: true };
}

/** Apply / change a discount on an existing booking (recomputes VAT + gross, audits old→new). */
export async function applyBookingDiscountAction(
  bookingId: string,
  input: { discountType: DiscountType; discountValue?: number; promoCode?: string; reason?: string },
): Promise<ActionResult> {
  const ctx = await adminCtx();
  if (!ctx) return { ok: false, error: "forbidden" };
  const { supabase, userId } = ctx;
  const { data: b } = await tbl(supabase, "bookings")
    .select("id,member_id,base_net_halalas,vat_bps,final_gross_halalas")
    .eq("id", bookingId)
    .maybeSingle();
  if (!b) return { ok: false, error: "not_found" };
  const baseNet = b.base_net_halalas ?? DEFAULT_CLASS_NET_HALALAS;
  const vatBps = b.vat_bps ?? 1500;
  const d = await resolveDiscount(supabase, b.member_id, input.discountType, input.discountValue, input.promoCode);
  if (!d.ok) return d;
  const p = computePrice({ baseNetHalalas: baseNet, vatBps, discountKind: d.kind, discountValue: d.value });
  const old = b.final_gross_halalas;
  await tbl(supabase, "bookings")
    .update({
      discount_type: input.discountType,
      discount_value: d.value,
      discount_amount_halalas: p.discountAmountHalalas,
      final_net_halalas: p.finalNetHalalas,
      vat_amount_halalas: p.vatAmountHalalas,
      final_gross_halalas: p.finalGrossHalalas,
      effective_paid_halalas: p.finalGrossHalalas,
      discount_reason: input.reason ?? null,
      promo_code_id: d.promoId,
    })
    .eq("id", bookingId);
  await writeAudit(supabase, userId, {
    entity_type: "booking",
    entity_id: bookingId,
    action: "discount_applied",
    field: "final_gross_halalas",
    old_value: String(old ?? ""),
    new_value: String(p.finalGrossHalalas),
    reason: input.reason,
  });
  revalidatePath(`/admin/members/${b.member_id}`);
  revalidatePath("/admin/reports");
  return { ok: true };
}

/** Comp a booking: list value retained for reporting, cash zeroed. */
export async function compBookingAction(bookingId: string, reason?: string): Promise<ActionResult> {
  const ctx = await adminCtx();
  if (!ctx) return { ok: false, error: "forbidden" };
  const { supabase, userId } = ctx;
  const { data: b } = await tbl(supabase, "bookings").select("id,member_id,base_net_halalas,vat_bps,final_gross_halalas").eq("id", bookingId).maybeSingle();
  if (!b) return { ok: false, error: "not_found" };
  const baseNet = b.base_net_halalas ?? DEFAULT_CLASS_NET_HALALAS;
  const vatBps = b.vat_bps ?? 1500;
  const old = b.final_gross_halalas;
  await tbl(supabase, "bookings")
    .update({
      pricing_source: "complimentary",
      discount_type: "manual",
      discount_value: 10000,
      discount_amount_halalas: baseNet,
      final_net_halalas: 0,
      vat_amount_halalas: 0,
      final_gross_halalas: 0,
      list_value_halalas: grossFromNet(baseNet, vatBps),
      effective_paid_halalas: 0,
      discount_reason: reason ?? "complimentary",
    })
    .eq("id", bookingId);
  await writeAudit(supabase, userId, {
    entity_type: "booking",
    entity_id: bookingId,
    action: "comp",
    field: "final_gross_halalas",
    old_value: String(old ?? ""),
    new_value: "0",
    reason: reason ?? "complimentary",
  });
  revalidatePath(`/admin/members/${b.member_id}`);
  revalidatePath("/admin/reports");
  return { ok: true };
}

export interface PackageSaleInput {
  credits: number;
  baseNetHalalas: number; // package net before discount
  discountType: DiscountType;
  discountValue?: number;
  promoCode?: string;
  reason?: string;
  startsAt?: string; // bundle start date (may be in the future); defaults to now
  paymentStatus?: "paid" | "pending"; // pending -> not counted as revenue until paid
  method?: string; // cash | mada | transfer | online | other
}

/** Sell a credit package with optional discount/promo; adds credits + records payment accounting. */
export async function sellPackageAction(memberId: string, input: PackageSaleInput): Promise<ActionResult> {
  const ctx = await adminCtx();
  if (!ctx) return { ok: false, error: "forbidden" };
  const { supabase, userId } = ctx;
  const credits = Math.max(1, Math.floor(input.credits || 0));
  if (!input.baseNetHalalas || input.baseNetHalalas < 0) return { ok: false, error: "price_required" };
  const d = await resolveDiscount(supabase, memberId, input.discountType, input.discountValue, input.promoCode);
  if (!d.ok) return d;
  const p = computePrice({ baseNetHalalas: input.baseNetHalalas, discountKind: d.kind, discountValue: d.value });
  const status = input.paymentStatus === "pending" ? "initiated" : "paid";

  const { data: pay, error: pErr } = await tbl(supabase, "payments")
    .insert({
      member_id: memberId,
      amount_sar: p.finalGrossHalalas / 100,
      sales_tax_sar: p.vatAmountHalalas / 100,
      currency: "SAR",
      status,
      method: input.method ?? null,
      starts_at: input.startsAt || new Date().toISOString(),
      type: "credit_pack",
      base_net_halalas: p.baseNetHalalas,
      discount_type: input.discountType,
      discount_value: d.value,
      discount_amount_halalas: p.discountAmountHalalas,
      net_halalas: p.finalNetHalalas,
      vat_amount_halalas: p.vatAmountHalalas,
      gross_halalas: p.finalGrossHalalas,
      promo_code_id: d.promoId,
    })
    .select("id")
    .single();
  if (pErr || !pay) return { ok: false, error: pErr?.message ?? "payment_failed" };

  const { data: bal } = await rpc<number>(supabase, "elan_credit_balance", { p_member: memberId });
  await tbl(supabase, "credit_ledger").insert({ member_id: memberId, change: credits, reason: "purchase", balance_after: (bal ?? 0) + credits, ref_id: pay.id });
  if (d.promoId)
    await tbl(supabase, "promo_redemptions").insert({ promo_code_id: d.promoId, member_id: memberId, payment_id: pay.id, discount_amount_halalas: p.discountAmountHalalas });

  await writeAudit(supabase, userId, {
    entity_type: "payment",
    entity_id: pay.id,
    action: "package_sale",
    field: "gross_halalas",
    old_value: "0",
    new_value: String(p.finalGrossHalalas),
    reason: input.reason ?? `${credits} credits · ${status}${input.method ? " · " + input.method : ""}`,
  });
  revalidatePath(`/admin/members/${memberId}`);
  revalidatePath("/admin/reports");
  return { ok: true };
}

export interface PromoInput {
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number; // percentage -> bps; fixed -> halalas
  startsAt?: string;
  expiresAt?: string;
  maxRedemptions?: number;
  perMemberLimit?: number;
}

export async function createPromoCodeAction(input: PromoInput): Promise<ActionResult> {
  const ctx = await adminCtx();
  if (!ctx) return { ok: false, error: "forbidden" };
  const { supabase, userId } = ctx;
  const code = input.code?.trim().toUpperCase();
  if (!code) return { ok: false, error: "code_required" };
  if (input.discountType !== "percentage" && input.discountType !== "fixed") return { ok: false, error: "bad_type" };
  const { error } = await tbl(supabase, "promo_codes").insert({
    code,
    discount_type: input.discountType,
    discount_value: Math.max(0, input.discountValue || 0),
    starts_at: input.startsAt || null,
    expires_at: input.expiresAt || null,
    max_redemptions: input.maxRedemptions ?? null,
    per_member_limit: input.perMemberLimit ?? null,
    active: true,
    created_by: userId,
  });
  if (error) return { ok: false, error: error.message };
  await writeAudit(supabase, userId, { entity_type: "promo", action: "promo_created", new_value: code });
  revalidatePath("/admin/promo");
  return { ok: true };
}

export async function setPromoCodeActiveAction(id: string, active: boolean): Promise<ActionResult> {
  const ctx = await adminCtx();
  if (!ctx) return { ok: false, error: "forbidden" };
  const { supabase, userId } = ctx;
  const { error } = await tbl(supabase, "promo_codes").update({ active }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  await writeAudit(supabase, userId, { entity_type: "promo", entity_id: id, action: "promo_toggle", new_value: String(active) });
  revalidatePath("/admin/promo");
  return { ok: true };
}

/** Cancel a class instance (soft — keeps it visible as "cancelled", unbookable). */
export async function cancelClassAction(classInstanceId: string): Promise<ActionResult> {
  const ctx = await adminCtx();
  if (!ctx) return { ok: false, error: "forbidden" };
  const { supabase, userId } = ctx;
  const { error } = await tbl(supabase, "class_instances").update({ status: "cancelled" }).eq("id", classInstanceId);
  if (error) return { ok: false, error: error.message };
  await writeAudit(supabase, userId, { entity_type: "class_instance", entity_id: classInstanceId, action: "cancel_class" });
  revalidatePath("/admin/schedule");
  revalidatePath("/admin");
  revalidatePath("/schedule");
  return { ok: true };
}

/** Hard-delete a class instance — only when it has no bookings. */
export async function deleteClassAction(classInstanceId: string): Promise<ActionResult> {
  const ctx = await adminCtx();
  if (!ctx) return { ok: false, error: "forbidden" };
  const { supabase, userId } = ctx;
  const { count } = await tbl(supabase, "bookings")
    .select("id", { count: "exact", head: true })
    .eq("class_instance_id", classInstanceId)
    .in("status", ["confirmed", "waitlisted", "attended"]);
  if ((count ?? 0) > 0) return { ok: false, error: "has_bookings" };
  const { error } = await tbl(supabase, "class_instances").delete().eq("id", classInstanceId);
  if (error) return { ok: false, error: error.message };
  await writeAudit(supabase, userId, { entity_type: "class_instance", entity_id: classInstanceId, action: "delete_class" });
  revalidatePath("/admin/schedule");
  revalidatePath("/admin");
  revalidatePath("/schedule");
  return { ok: true };
}

export interface ScheduleGenInput {
  startDate: string; // YYYY-MM-DD (Riyadh)
  days: number;
  perDay: number;
  firstTime: string; // HH:MM (24h)
  durationMin: number;
  bufferMin: number; // cleaning time between classes
  capacity: number;
  classTypeIds: string[]; // rotated across slots
  instructorId?: string;
  skipWeekdays?: number[]; // 0=Sun … 6=Sat — these weekdays are skipped
}

const pad = (n: number) => String(n).padStart(2, "0");
function addDaysStr(dateStr: string, n: number): string {
  const d = new Date(dateStr + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Generate class instances (default: 8/day × 6 days, 09:00 start, 50min + cleaning). */
export async function generateScheduleAction(
  input: ScheduleGenInput,
): Promise<{ ok: true; created: number } | { ok: false; error: string }> {
  const ctx = await adminCtx();
  if (!ctx) return { ok: false, error: "forbidden" };
  const { supabase, userId } = ctx;

  const days = Math.min(31, Math.max(1, Math.floor(input.days || 0)));
  const perDay = Math.min(20, Math.max(1, Math.floor(input.perDay || 0)));
  const durationMin = Math.max(10, Math.floor(input.durationMin || 50));
  const bufferMin = Math.max(0, Math.floor(input.bufferMin || 0));
  const capacity = Math.max(1, Math.floor(input.capacity || 6));
  const typeIds = (input.classTypeIds || []).filter(Boolean);
  if (!input.startDate) return { ok: false, error: "start_required" };
  if (typeIds.length === 0) return { ok: false, error: "class_type_required" };
  const [fh, fm] = (input.firstTime || "09:00").split(":").map((x) => parseInt(x, 10));
  if (Number.isNaN(fh) || Number.isNaN(fm)) return { ok: false, error: "time_invalid" };

  // default level per class type
  const { data: cts } = await tbl(supabase, "class_types").select("id,default_level").in("id", typeIds);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const levelMap = new Map<string, string>((cts ?? []).map((c: any) => [c.id, c.default_level ?? "level_1"]));

  // skip slots that already exist (idempotent re-runs)
  const rangeStart = `${input.startDate}T00:00:00+03:00`;
  const rangeEnd = `${addDaysStr(input.startDate, days * 3 + 14)}T23:59:59+03:00`;
  const { data: existing } = await tbl(supabase, "class_instances").select("starts_at").gte("starts_at", rangeStart).lte("starts_at", rangeEnd);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const existingSet = new Set((existing ?? []).map((e: any) => new Date(e.starts_at).getTime()));

  const nowIso = new Date().toISOString();
  const skip = new Set(input.skipWeekdays ?? []);
  const rows: Record<string, unknown>[] = [];
  let rot = 0;
  // Produce `days` ACTIVE days, skipping excluded weekdays (e.g. Friday).
  let active = 0;
  for (let i = 0; active < days && i < days * 3 + 14; i++) {
    const dateStr = addDaysStr(input.startDate, i);
    const weekday = new Date(dateStr + "T12:00:00Z").getUTCDay();
    if (skip.has(weekday)) continue;
    active++;
    for (let s = 0; s < perDay; s++) {
      const startTotal = fh * 60 + fm + s * (durationMin + bufferMin);
      const startIso = `${dateStr}T${pad(Math.floor(startTotal / 60))}:${pad(startTotal % 60)}:00+03:00`;
      if (existingSet.has(new Date(startIso).getTime())) continue;
      const endTotal = startTotal + durationMin;
      const endIso = `${dateStr}T${pad(Math.floor(endTotal / 60))}:${pad(endTotal % 60)}:00+03:00`;
      const ctId = typeIds[rot % typeIds.length];
      rot++;
      rows.push({
        class_type_id: ctId,
        instructor_id: input.instructorId || null,
        starts_at: startIso,
        ends_at: endIso,
        capacity,
        level: levelMap.get(ctId) ?? "level_1",
        status: "scheduled",
        booking_opens_at: nowIso, // open for booking immediately
        booking_closes_at: startIso, // closes when the class starts
      });
    }
  }

  if (rows.length === 0) return { ok: true, created: 0 };
  const { error } = await tbl(supabase, "class_instances").insert(rows);
  if (error) return { ok: false, error: error.message };

  await writeAudit(supabase, userId, {
    entity_type: "schedule",
    action: "generate",
    field: "class_instances",
    old_value: "0",
    new_value: String(rows.length),
    reason: `${perDay}/day × ${days}d from ${input.startDate} ${input.firstTime}`,
  });
  revalidatePath("/admin/schedule");
  revalidatePath("/admin");
  revalidatePath("/schedule");
  return { ok: true, created: rows.length };
}

```

### src/app/(app)/bookings/page.tsx
```tsx
import { dict } from "@/lib/i18n";
import { getLocale } from "@/lib/locale-server";
import { getMyBookings } from "@/lib/queries";
import { fmtLongDateTime, fmtTime, fmtDayHeading } from "@/lib/format";
import { CancelLink } from "@/components/Buttons";
import { EmptyState } from "@/components/EmptyState";

export const dynamic = "force-dynamic";

export default async function BookingsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const locale = await getLocale();
  const t = dict[locale];
  const tab = (await searchParams).tab === "past" ? "past" : "upcoming";
  const all = await getMyBookings();
  const now = Date.now();
  const rows = all.filter((b) => {
    const upcoming = new Date(b.starts_at).getTime() >= now;
    const active = b.status === "confirmed" || b.status === "waitlisted";
    return tab === "upcoming" ? upcoming && active : !upcoming || !active;
  });

  return (
    <section className="space-y-6 p-6">
      <h1 className="font-display text-page-title font-medium text-primary-900">{t.bookings.title}</h1>
      <div className="flex gap-2">
        <a href="/bookings" className={`chip chip-md ${tab === "upcoming" ? "chip-selected" : "chip-outline"}`}>{t.bookings.upcoming}</a>
        <a href="/bookings?tab=past" className={`chip chip-md ${tab === "past" ? "chip-selected" : "chip-outline"}`}>{t.bookings.past}</a>
      </div>

      {rows.length === 0 ? (
        tab === "upcoming" ? (
          <EmptyState icon="event_available" title={t.empty.noBookings} hint={t.empty.noBookingsHint} ctaHref="/schedule" ctaLabel={t.empty.noBookingsCta} />
        ) : (
          <EmptyState icon="history" title={t.empty.noPast} hint={t.empty.noPastHint} />
        )
      ) : (
        <div className="space-y-3">
          {rows.map((b) => {
            const name = b.name_en; // class names always shown in English
            const instructor = locale === "ar" ? b.instructor_ar : b.instructor_en;
            const classMeta = b.starts_at ? `${name} · ${fmtDayHeading(b.starts_at, locale)} · ${fmtTime(b.starts_at, locale)}` : name;
            return (
              <div key={b.id} className="card space-y-2 p-5">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-display text-lead font-medium text-primary-900">{name}</h3>
                  <span className="chip chip-outline">{(t.bstatus as Record<string, string>)[b.status] ?? b.status}</span>
                </div>
                <p className="text-meta text-status-full">
                  {b.starts_at ? fmtLongDateTime(b.starts_at, b.ends_at, locale) : ""}{instructor ? ` · ${instructor}` : ""}
                </p>
                {tab === "upcoming" ? <CancelLink bookingId={b.id} label={t.common.cancel} locale={locale} classMeta={classMeta} /> : null}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

```

### src/app/(app)/class/[id]/page.tsx
```tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { dict } from "@/lib/i18n";
import { getLocale } from "@/lib/locale-server";
import { getClass } from "@/lib/queries";
import { fmtLongDateTime, levelLabel, fmtTime, fmtDayHeading } from "@/lib/format";
import { ctaState, type Eligibility } from "@/lib/cta";
import { CtaButton } from "@/components/Buttons";
import { Icon } from "@/components/Icon";
import { classImage } from "@/lib/classColor";

export const dynamic = "force-dynamic";

export default async function ClassDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const locale = await getLocale();
  const t = dict[locale];
  const result = await getClass(id);
  if (!result) notFound();
  const { card: c, eligibility } = result;

  const name = c.name_en; // class names always shown in English
  const instructor = locale === "ar" ? c.instructor_ar : c.instructor_en;
  const description = locale === "ar" ? c.description_ar : c.description_en;

  // Server-driven CTA state (pure, unit-tested in cta.ts).
  const cta = ctaState({ myStatus: c.my_status, eligibility: eligibility as Eligibility, displayStatus: c.display_status });
  const ctaLabels: Record<string, string> = {
    book: t.cta.book, joinWaitlist: t.cta.joinWaitlist, cancel: t.cta.cancel,
    leaveWaitlist: t.cta.leaveWaitlist, closed: t.cta.closed, levelTooLow: t.cta.levelTooLow,
    noCredits: t.cta.noCredits, fullyBooked: t.status.fully_booked,
  };
  const label = ctaLabels[cta.key];
  const variant = cta.variant;
  const disabled = cta.disabled;
  const bookingId = cta.isCancel ? c.my_booking_id : null;

  // One label component, elegant in both locales: Latin uppercase eyebrow vs
  // Arabic weight/colour label (no uppercase/heavy tracking).
  const heading = locale === "en" ? "eyebrow" : "eyebrow-ar";
  // Context for the cancel-confirm dialog (class name + date/time).
  const cancelMeta = `${name} · ${fmtDayHeading(c.starts_at, locale)} · ${fmtTime(c.starts_at, locale)}`;

  return (
    <section className="pb-44 md:pb-28">
      <div className="relative h-56 overflow-hidden rounded-b-xl md:mt-4 md:rounded-xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={classImage(c.name_en)} alt={name} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg,rgba(33,28,24,.15),rgba(33,28,24,.55))" }} />
        <Link href="/schedule" className="absolute start-3 top-3 inline-flex min-h-[44px] items-center rounded-pill bg-surface-elevated/85 px-3 text-body text-primary-900">‹ {t.common.back}</Link>
      </div>
      <div className="space-y-4 p-6">
        <h1 className="font-display text-page-title font-medium text-primary-900">{name}</h1>

        {c.display_status === "waitlist_open" && !c.my_status ? (
          <div className="flex items-center gap-2 rounded-lg border border-accent/40 bg-status-waitlist/10 px-4 py-2 text-body text-primary-900">
            <span aria-hidden className="h-2 w-2 shrink-0 rounded-full bg-accent" />
            {t.detail.waitlistBanner.replace("{n}", String(c.waitlist_count)).replace("{cap}", String(c.capacity))}
          </div>
        ) : null}

        <div><p className={heading}>{t.detail.time}</p><p className="text-body">{fmtLongDateTime(c.starts_at, c.ends_at, locale)}</p></div>
        {instructor ? <div><p className={heading}>{t.detail.instructor}</p><p className="flex items-center gap-1 text-body"><Icon name="person" className="text-base text-primary-400" />{instructor}</p></div> : null}
        <div><p className={heading}>{t.detail.level}</p><p className="text-body">{levelLabel(c.level, locale)}</p></div>
        {description ? <div><p className={heading}>{t.detail.description}</p><p className="text-body leading-relaxed">{description}</p></div> : null}
      </div>

      <div className="sticky-cta mx-auto max-w-md">
        <CtaButton classInstanceId={c.id} bookingId={bookingId} label={label} variant={variant} disabled={disabled} locale={locale} cancelMeta={cancelMeta} />
      </div>
    </section>
  );
}

```

### src/app/(app)/confirmation/[bookingId]/page.tsx
```tsx
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { dict } from "@/lib/i18n";
import { getLocale } from "@/lib/locale-server";
import { getBooking } from "@/lib/queries";
import { fmtDayHeading, fmtTime } from "@/lib/format";
import { Icon } from "@/components/Icon";
import { HERO_IMAGE, INSTRUCTOR_IMAGE } from "@/lib/classColor";

export const dynamic = "force-dynamic";

export default async function ConfirmationPage({ params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = await params;
  const locale = await getLocale();
  const t = dict[locale];
  const ar = locale === "ar";
  const b = await getBooking(bookingId);
  if (!b) notFound();

  const name = b.name_en; // class names always shown in English
  const instructor = ar ? b.instructor_ar : b.instructor_en;

  return (
    <section className="pb-10">
      <div className="relative h-56 overflow-hidden rounded-b-xl md:mt-4 md:rounded-xl">
        <Image src={HERO_IMAGE} alt="" fill sizes="(min-width:768px) 768px, 100vw" className="object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg,rgba(33,28,24,.25),rgba(33,28,24,.92))" }} />
        <div className="relative flex h-full flex-col items-center justify-center px-6 text-center text-ink">
          <div className="mb-3 flex h-[68px] w-[68px] items-center justify-center rounded-full border-2 border-accent text-accent">
            <Icon name="check" className="text-3xl" />
          </div>
          <h1 className="font-display text-page-title font-medium text-ink">{t.confirmation.title}</h1>
          <p className="mt-1.5 text-body text-ink/75">{t.confirmation.subtitle}</p>
        </div>
      </div>

      <div className="px-6">
        <div className="card relative -mt-10 p-6">
          <div className="flex items-center gap-3">
            <Image src={INSTRUCTOR_IMAGE} alt="" width={56} height={56} className="h-14 w-14 shrink-0 rounded-full object-cover ring-1 ring-outline" />
            <div className="min-w-0">
              <p className="font-display text-title font-medium leading-tight text-primary-900">{name}</p>
              {instructor ? <p className="mt-0.5 text-meta text-status-full">{t.confirmation.with} {instructor}</p> : null}
            </div>
          </div>
          <div className="mt-5 space-y-3.5 text-body">
            <Row label={t.confirmation.date} value={fmtDayHeading(b.starts_at, locale)} />
            <Row label={t.confirmation.time} value={`${fmtTime(b.starts_at, locale)} · ${b.duration} ${t.common.minutes}`} top />
            <Row label={t.confirmation.place} value={t.confirmation.studio} top />
          </div>
        </div>

        <Link href="/bookings" className="btn-primary mt-5 w-full">{t.confirmation.viewBookings}</Link>
        <Link href="/schedule" className="btn-outline mt-2.5 w-full">{t.timetable.title}</Link>
      </div>
    </section>
  );
}

function Row({ label, value, top }: { label: string; value: string; top?: boolean }) {
  return (
    <div className={`flex justify-between ${top ? "border-t border-outline pt-3.5" : ""}`}>
      <span className="text-status-full">{label}</span>
      <span className="text-primary-900">{value}</span>
    </div>
  );
}

```

### src/app/(app)/layout.tsx
```tsx
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerSupabase, rpc } from "@/lib/supabase/server";
import { dict } from "@/lib/i18n";
import { getLocale } from "@/lib/locale-server";
import { DEMO } from "@/lib/demo";
import { BottomTabs } from "@/components/BottomTabs";
import { MemberSidebar } from "@/components/MemberSidebar";
import { ToastProvider } from "@/components/Toast";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const supabase = await getServerSupabase();
  const { data: auth } = await supabase.auth.getUser();
  // Staff belong in the admin console — never show them the member app (which
  // would otherwise fall back to the demo member "نور العتيبي").
  if (auth.user) {
    const { data: isAdmin } = await rpc<boolean>(supabase, "is_admin");
    if (isAdmin) redirect("/admin");
  } else if (!DEMO) {
    redirect("/login");
  }

  const locale = await getLocale();
  return (
    <ToastProvider dismissLabel={dict[locale].toast.dismiss}>
      <div className="md:flex md:min-h-screen">
        <MemberSidebar labels={dict[locale].tabs} />
        <div className="mx-auto w-full max-w-md pb-24 md:max-w-3xl md:pb-10">{children}</div>
        <BottomTabs labels={dict[locale].tabs} />
      </div>
    </ToastProvider>
  );
}

```

### src/app/(app)/memberships/page.tsx
```tsx
import { dict } from "@/lib/i18n";
import { getLocale } from "@/lib/locale-server";
import { getCatalogue, getMemberContext } from "@/lib/queries";
import { BuyButton } from "@/components/Buttons";
import { EmptyState } from "@/components/EmptyState";

export const dynamic = "force-dynamic";

export default async function MembershipsPage() {
  const locale = await getLocale();
  const t = dict[locale];
  const ar = locale === "ar";
  const [{ plans, packs }, ctx] = await Promise.all([getCatalogue(), getMemberContext()]);
  const planName = ctx.membership?.membership_plans
    ? ar ? ctx.membership.membership_plans.name_ar : ctx.membership.membership_plans.name_en
    : null;

  return (
    <section className="space-y-6 p-6">
      <h1 className="font-display text-page-title font-medium text-primary-900">{t.memberships.title}</h1>

      <div className="card-ink space-y-1 p-6">
        <p className="font-display text-title">{planName ?? t.memberships.noMembership}</p>
        <p className="text-body text-ink/70">
          {ctx.balance > 0 ? t.memberships.credits.replace("{n}", String(ctx.balance)) : t.memberships.noCredits}
        </p>
      </div>

      {plans.length === 0 && packs.length === 0 ? (
        <EmptyState icon="card_membership" title={t.empty.noMemberships} hint={t.empty.noMembershipsHint} />
      ) : null}

      {plans.length > 0 ? (
        <div>
          <h2 className="mb-3 font-display text-lead font-medium text-primary-900">{t.memberships.plans}</h2>
          <div className="space-y-3">
            {plans.map((p) => (
              <div key={p.id} className="card flex items-center justify-between gap-3 p-5">
                <div className="min-w-0">
                  <p className="font-display text-lead font-medium text-primary-900">{ar ? p.name_ar : p.name_en}</p>
                  <p className="truncate text-caption text-status-full">{ar ? p.description_ar : p.description_en}</p>
                  <p className="mt-1 text-body font-number font-semibold text-primary-700">{p.price_sar} {t.common.sar}</p>
                </div>
                <BuyButton type="membership" refId={p.id} label={t.common.buy} locale={locale} />
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {packs.length > 0 ? (
        <div>
          <h2 className="mb-3 font-display text-lead font-medium text-primary-900">{t.memberships.packs}</h2>
          <div className="space-y-3">
            {packs.map((p) => (
              <div key={p.id} className="card flex items-center justify-between gap-3 p-5">
                <div className="min-w-0">
                  <p className="font-display text-lead font-medium text-primary-900">{ar ? p.name_ar : p.name_en}</p>
                  <p className="truncate text-caption text-status-full">
                    {t.memberships.credits.replace("{n}", String(p.credits))} · {t.memberships.validDays.replace("{n}", String(p.valid_days))}
                  </p>
                  <p className="mt-1 text-body font-number font-semibold text-primary-700">{p.price_sar} {t.common.sar}</p>
                </div>
                <BuyButton type="credit_pack" refId={p.id} label={t.common.buy} locale={locale} />
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

```

### src/app/(app)/page.tsx
```tsx
import Link from "next/link";
import Image from "next/image";
import { dict } from "@/lib/i18n";
import { getLocale } from "@/lib/locale-server";
import { getMemberContext, getMyBookings, getTimetable } from "@/lib/queries";
import { fmtTime, todayInRiyadh } from "@/lib/format";
import { classImage, HERO_IMAGE, INSTRUCTOR_IMAGE } from "@/lib/classColor";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const locale = await getLocale();
  const t = dict[locale];
  const ar = locale === "ar";
  const [ctx, bookings, todays] = await Promise.all([getMemberContext(), getMyBookings(), getTimetable(todayInRiyadh())]);

  const now = Date.now();
  const next =
    bookings
      .filter((b) => (b.status === "confirmed" || b.status === "waitlisted") && new Date(b.starts_at).getTime() >= now)
      .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())[0] ?? null;
  const attended = bookings.filter((b) => b.status === "attended").length;
  const discover = todays.filter((c) => c.display_status === "available").slice(0, 2);
  const fullName = ctx.member?.full_name ?? t.appName;
  const initial = (fullName.trim()[0] ?? "·").toUpperCase();

  return (
    <section className="pb-6">
      <div className="relative h-[300px] overflow-hidden rounded-b-xl md:mt-4 md:rounded-xl">
        <Image src={HERO_IMAGE} alt="" fill priority sizes="(min-width:768px) 768px, 100vw" className="object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg,rgba(33,28,24,.12),rgba(33,28,24,.9))" }} />
        <div className="relative flex h-full flex-col p-6 text-ink">
          <div className="flex items-start justify-between">
            <div className="wordmark text-3xl text-ink">ÉLAN</div>
            <Link href="/profile" className="flex h-12 w-12 items-center justify-center rounded-full border border-accent/50 bg-surface-elevated font-display text-lead text-accent">{initial}</Link>
          </div>
          <div className="mt-auto pb-14">
            <p className="text-body text-ink/80">{t.home.greeting}</p>
            <h1 className="font-display text-hero font-medium leading-tight text-ink">{fullName}</h1>
            <p className="mt-1 text-meta text-ink/70">{next ? `${t.home.nextClass} · ${t.common.today}` : t.home.none}</p>
          </div>
        </div>
      </div>

      <div className="space-y-5 px-6">
        {next ? (
          <Link href="/bookings" className="card relative -mt-16 flex items-center gap-3 p-4">
            <Image src={classImage(next.name_en)} alt="" width={80} height={80} className="h-20 w-20 shrink-0 rounded-lg object-cover" />
            <div className="min-w-0 flex-1">
              <h3 className="font-display text-title font-medium text-primary-900">{next.name_en}</h3>
              <p className="mt-0.5 truncate text-caption text-status-full">
                {(ar ? next.instructor_ar : next.instructor_en) ? `${ar ? next.instructor_ar : next.instructor_en} · ` : ""}{fmtTime(next.starts_at, locale)}
              </p>
              <span className="mt-2 inline-block rounded-pill bg-accent px-4 py-2 text-caption font-medium text-primary-900">{t.home.viewDetails}</span>
            </div>
            <Image src={INSTRUCTOR_IMAGE} alt="" width={48} height={48} className="h-12 w-12 shrink-0 self-start rounded-full object-cover ring-1 ring-outline" />
          </Link>
        ) : (
          <Link href="/schedule" className="btn-primary -mt-8 w-full">{t.timetable.title}</Link>
        )}

        <div className="flex gap-3">
          <div className="card flex-1 p-5 text-center">
            <div className="font-number text-3xl text-primary-700">{ctx.balance}</div>
            <div className="text-caption text-status-full">{t.home.balance}</div>
          </div>
          <div className="card flex-1 p-5 text-center">
            <div className="font-number text-3xl text-sage">{attended}</div>
            <div className="text-caption text-status-full">{t.home.attended}</div>
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lead font-medium text-primary-900">{t.home.discover}</h2>
            <Link href="/schedule" className="text-meta text-primary-700">{t.home.all}</Link>
          </div>
          {discover.length === 0 ? (
            <p className="text-body text-status-full">{t.empty.noClasses}</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {discover.map((c) => (
                <Link key={c.id} href={`/class/${c.id}`} className="relative h-36 overflow-hidden rounded-lg">
                  <Image src={classImage(c.name_en)} alt="" fill sizes="(min-width:768px) 360px, 50vw" className="object-cover" />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(180deg,transparent 25%,rgba(17,13,10,.88))" }} />
                  <div className="absolute inset-x-3 bottom-3 text-ink">
                    <div className="font-display text-body font-medium">{c.name_en}</div>
                    <div className="truncate text-caption text-ink/80">
                      {(ar ? c.instructor_ar : c.instructor_en) ?? ""} · {fmtTime(c.starts_at, locale)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

```

### src/app/(app)/profile/page.tsx
```tsx
import Link from "next/link";
import Image from "next/image";
import { dict } from "@/lib/i18n";
import { getLocale } from "@/lib/locale-server";
import { getMemberContext, getMyBookings } from "@/lib/queries";
import { LangToggle, LogoutButton } from "@/components/Buttons";
import { HERO_IMAGE } from "@/lib/classColor";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const locale = await getLocale();
  const t = dict[locale];
  const ar = locale === "ar";
  const [ctx, bookings] = await Promise.all([getMemberContext(), getMyBookings()]);
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

      <div className="card overflow-hidden">
        <Row label={t.profile.personalData} />
        <Row label={t.profile.payment} />
        <Row label={t.profile.notifications} />
        <div className="flex items-center justify-between px-5 py-4">
          <span className="text-body">{t.profile.language}</span>
          <LangToggle current={locale} />
        </div>
      </div>

      {ctx.isAdmin ? (
        <Link href="/admin" className="card flex items-center justify-between px-5 py-4">
          <span>{t.profile.admin}</span><span className="chevron text-status-full">›</span>
        </Link>
      ) : null}

      <LogoutButton label={t.profile.logout} />
      <p className="text-center text-xs text-status-full">{t.profile.version} 0.1.0</p>
      </div>
    </section>
  );
}

function Row({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-between border-b border-outline px-5 py-4 text-body">
      <span>{label}</span><span className="chevron text-status-full">›</span>
    </div>
  );
}

```

### src/app/(app)/schedule/page.tsx
```tsx
import { dict } from "@/lib/i18n";
import { getLocale } from "@/lib/locale-server";
import { getTimetable } from "@/lib/queries";
import { todayInRiyadh } from "@/lib/format";
import { DateStrip } from "@/components/DateStrip";
import { ClassCard } from "@/components/ClassCard";
import { EmptyState } from "@/components/EmptyState";

export const dynamic = "force-dynamic";

export default async function SchedulePage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const locale = await getLocale();
  const t = dict[locale];
  const date = (await searchParams).date ?? todayInRiyadh();
  const classes = await getTimetable(date);

  return (
    <section className="space-y-6 p-6">
      <h1 className="font-display text-page-title font-medium text-primary-900">{t.timetable.title}</h1>
      <DateStrip selected={date} locale={locale} todayLabel={t.common.today} />

      {classes.length === 0 ? (
        <EmptyState icon="self_improvement" title={t.empty.noClasses} hint={t.empty.noClassesHint} />
      ) : (
        <div className="space-y-3">
          {classes.map((c) => (
            <ClassCard
              key={c.id}
              card={c}
              locale={locale}
              statusLabels={t.status}
              ctaLabels={{ book: t.cta.book, joinWaitlist: t.cta.joinWaitlist }}
            />
          ))}
        </div>
      )}
    </section>
  );
}

```

### src/app/admin/class/[id]/page.tsx
```tsx
import { notFound } from "next/navigation";
import { getLocale } from "@/lib/locale-server";
import { getClassRoster, type RosterEntry } from "@/lib/admin";
import { fmtLongDateTime, levelLabel } from "@/lib/format";
import { AttendanceButtons } from "@/components/admin/AttendanceButtons";

export const dynamic = "force-dynamic";

const statusLabel = (s: string, ar: boolean): string => {
  const m: Record<string, [string, string]> = {
    confirmed: ["مؤكد", "Confirmed"],
    attended: ["تم الحضور", "Attended"],
    no_show: ["لم تحضر", "No-show"],
    waitlisted: ["قائمة الانتظار", "Waitlisted"],
  };
  return (m[s]?.[ar ? 0 : 1]) ?? s;
};

export default async function AdminClassRosterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const locale = await getLocale();
  const ar = locale === "ar";
  const roster = await getClassRoster(id);
  if (!roster) notFound();

  return (
    <div className="space-y-5">
      <section className="card space-y-1 p-5">
        <h2 className="text-lg font-bold text-primary-900">
          {ar ? roster.name_ar : roster.name_en}
          {roster.status === "cancelled" ? ` · ${ar ? "ملغاة" : "Cancelled"}` : ""}
        </h2>
        <p className="text-sm text-status-full">{fmtLongDateTime(roster.starts_at, roster.ends_at, locale)}</p>
        <p className="text-sm text-status-full">
          {levelLabel(roster.level, locale)}
          {(ar ? roster.instructor_ar : roster.instructor_en) ? ` · ${ar ? roster.instructor_ar : roster.instructor_en}` : ""}
          {` · ${roster.confirmed.length}/${roster.capacity}`}
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="font-semibold text-primary-800">
          {ar ? "المسجّلات" : "Booked"} ({roster.confirmed.length}/{roster.capacity})
        </h3>
        <div className="card divide-y divide-outline">
          {roster.confirmed.length === 0 ? (
            <p className="p-6 text-center text-status-full">{ar ? "لا توجد حجوزات." : "No bookings."}</p>
          ) : (
            roster.confirmed.map((e) => (
              <Row key={e.booking_id} e={e} ar={ar} locale={locale} classInstanceId={id} actionable={e.status === "confirmed"} />
            ))
          )}
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="font-semibold text-primary-800">
          {ar ? "قائمة الانتظار" : "Waitlist"} ({roster.waitlisted.length})
        </h3>
        <div className="card divide-y divide-outline">
          {roster.waitlisted.length === 0 ? (
            <p className="p-6 text-center text-status-full">{ar ? "لا أحد في الانتظار." : "Nobody waitlisted."}</p>
          ) : (
            roster.waitlisted.map((e) => (
              <div key={e.booking_id} className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium text-primary-900">
                    {e.waitlist_position ? `${e.waitlist_position}. ` : ""}{e.full_name}
                  </p>
                  <p className="text-xs text-status-full">{e.phone ?? ""} · {levelLabel(e.level, locale)}</p>
                </div>
                <span className="chip bg-status-waitlist/10 text-status-waitlist">{statusLabel("waitlisted", ar)}</span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function Row({
  e, ar, locale, classInstanceId, actionable,
}: {
  e: RosterEntry;
  ar: boolean;
  locale: "ar" | "en";
  classInstanceId: string;
  actionable: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 p-4">
      <div className="min-w-0">
        <p className="truncate font-medium text-primary-900">{e.full_name}</p>
        <p className="truncate text-xs text-status-full">{e.phone ?? ""} · {levelLabel(e.level, locale)}</p>
      </div>
      {actionable ? (
        <AttendanceButtons
          bookingId={e.booking_id}
          classInstanceId={classInstanceId}
          attendedLabel={ar ? "حضرت" : "Attended"}
          noShowLabel={ar ? "لم تحضر" : "No-show"}
        />
      ) : (
        <span className={`chip ${e.status === "attended" ? "bg-primary-100 text-primary-700" : "bg-status-full/15 text-status-full"}`}>
          {statusLabel(e.status, ar)}
        </span>
      )}
    </div>
  );
}

```

### src/app/admin/layout.tsx
```tsx
import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSupabase, rpc } from "@/lib/supabase/server";
import { getLocale } from "@/lib/locale-server";
import { dirFor } from "@/lib/i18n";
import { AdminNav } from "@/components/admin/AdminNav";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  // The admin console is a real management tool — always require a real admin
  // session (the member-facing app stays in demo mode independently).
  const supabase = await getServerSupabase();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");
  const { data: isAdmin } = await rpc<boolean>(supabase, "is_admin");
  if (!isAdmin) redirect("/");

  const locale = await getLocale();
  const ar = locale === "ar";
  const nav = [
    { href: "/admin", label: ar ? "لوحة التحكم" : "Dashboard" },
    { href: "/admin/schedule", label: ar ? "الجدول والحصص" : "Schedule" },
    { href: "/admin/members", label: ar ? "الأعضاء" : "Members" },
    { href: "/admin/trainers", label: ar ? "المدرّبات" : "Trainers" },
    { href: "/admin/reports", label: ar ? "التقارير المالية" : "Reports" },
    { href: "/admin/promo", label: ar ? "أكواد الخصم" : "Promo codes" },
    { href: "/admin/settings", label: ar ? "الإعدادات" : "Settings" },
  ];

  return (
    <div dir={dirFor(locale)} className="mx-auto flex min-h-screen max-w-[1200px] flex-col md:flex-row">
      <aside className="flex flex-col gap-8 border-b border-white/10 bg-brand p-7 text-ink md:w-[230px] md:shrink-0 md:border-b-0 md:border-e">
        <div className="wordmark text-3xl text-accent">ÉLAN</div>
        <AdminNav items={nav} />
        <div className="mt-auto flex items-center gap-3 border-t border-white/10 pt-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent font-display text-base text-primary-900">م</div>
          <div>
            <div className="text-[13px] text-ink">{ar ? "مديرة الاستوديو" : "Studio manager"}</div>
            <div className="text-[11px] text-ink/50">{ar ? "الرياض" : "Riyadh"}</div>
          </div>
        </div>
        <Link href="/" className="text-sm text-ink/60 hover:text-ink">{ar ? "التطبيق ›" : "App ›"}</Link>
      </aside>
      <main className="flex-1 space-y-6 p-6 md:p-8">{children}</main>
    </div>
  );
}

```

### src/app/admin/members/[id]/page.tsx
```tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { getLocale } from "@/lib/locale-server";
import { getMemberDetail, getMemberTasks, getMemberFinancials } from "@/lib/admin";
import { fmtLongDateTime, levelLabel } from "@/lib/format";
import { fmtHalalas } from "@/lib/pricing";
import { CLASS_INFO, type ClassRec } from "@/lib/quiz";
import { MemberStatusSelect } from "@/components/admin/MemberStatusSelect";
import { AddNoteForm } from "@/components/admin/AddNoteForm";
import { EditMemberDialog } from "@/components/admin/EditMemberDialog";
import { WhatsAppActions } from "@/components/admin/WhatsAppActions";
import { MemberTasks } from "@/components/admin/MemberTasks";
import { SellBundleDialog, BookingMoneyControls } from "@/components/admin/MemberMoney";

export const dynamic = "force-dynamic";

const bstatusLabel = (s: string, ar: boolean): string => {
  const m: Record<string, [string, string]> = {
    confirmed: ["مؤكد", "Confirmed"],
    waitlisted: ["قائمة الانتظار", "Waitlisted"],
    attended: ["تم الحضور", "Attended"],
    cancelled: ["ملغي", "Cancelled"],
    late_cancelled: ["إلغاء متأخر", "Late cancelled"],
    no_show: ["لم تحضر", "No-show"],
  };
  return m[s]?.[ar ? 0 : 1] ?? s;
};

function fmtDateTime(iso: string, ar: boolean): string {
  return new Intl.DateTimeFormat(ar ? "ar-SA" : "en-GB", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(new Date(iso));
}

export default async function AdminMemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const locale = await getLocale();
  const ar = locale === "ar";
  const [detail, tasks, fin] = await Promise.all([getMemberDetail(id), getMemberTasks(id), getMemberFinancials(id)]);
  if (!detail) notFound();
  const { member, balance, notes } = detail;
  const plan = ar ? detail.membershipPlanAr : detail.membershipPlanEn;
  const sar = (h: number) => `${fmtHalalas(h, ar ? "ar" : "en")} ${ar ? "ر.س" : "SAR"}`;

  return (
    <div className="space-y-6">
      <Link href="/admin/members" className="inline-flex min-h-[44px] items-center text-meta text-primary-700">
        ‹ {ar ? "كل العميلات" : "All clients"}
      </Link>

      <section className="card space-y-3 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-display text-title font-medium text-primary-900">{member.full_name}</h2>
            <p className="text-meta text-status-full">
              {member.phone ?? "—"}{member.email ? ` · ${member.email}` : ""}
            </p>
            <p className="text-meta text-status-full">
              {levelLabel(member.level, locale)}
              {detail.source ? ` · ${ar ? "المصدر" : "Source"}: ${detail.source}` : ""}
            </p>
            {detail.recommendedClass ? (
              <p className="text-meta text-primary-700">
                {ar ? "الكلاس المنصوح: " : "Recommended class: "}
                {CLASS_INFO[detail.recommendedClass as ClassRec]?.name_ar ?? detail.recommendedClass}
              </p>
            ) : null}
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="text-caption text-status-full">{ar ? "حالة المتابعة" : "Follow-up status"}</span>
            <MemberStatusSelect memberId={member.id} current={detail.leadStatus} ar={ar} />
            <EditMemberDialog
              memberId={member.id}
              ar={ar}
              initial={{
                full_name: member.full_name,
                phone: member.phone ?? "",
                email: member.email ?? "",
                source: detail.source ?? "",
                lead_status: detail.leadStatus ?? "lead",
              }}
            />
          </div>
        </div>

        <div className="border-t border-outline pt-3">
          <p className="mb-2 text-caption text-status-full">{ar ? "تواصل واتساب سريع" : "WhatsApp quick actions"}</p>
          <WhatsAppActions phone={member.phone} name={member.full_name} ar={ar} />
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="font-display text-lead font-medium text-primary-900">{ar ? "مهام المتابعة" : "Follow-up tasks"}</h3>
        <div className="card p-5">
          <MemberTasks memberId={member.id} ar={ar} tasks={tasks} />
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <div className="card p-5 text-center">
          <p className="font-number text-3xl text-primary-700">{balance}</p>
          <p className="text-caption text-status-full">{ar ? "رصيد الحصص" : "Credits"}</p>
        </div>
        <div className="card p-5 text-center">
          <p className="truncate font-display text-lead text-primary-700">{plan ?? (ar ? "لا توجد عضوية" : "No membership")}</p>
          <p className="text-caption text-status-full">{ar ? "العضوية" : "Membership"}</p>
          {detail.membershipEnd ? (
            <p className="mt-1 font-number text-caption text-status-full">
              {ar ? "ينتهي: " : "Expires: "}
              {new Intl.DateTimeFormat(ar ? "ar-SA" : "en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(detail.membershipEnd))}
            </p>
          ) : null}
        </div>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lead font-medium text-primary-900">{ar ? "الملخص المالي" : "Financial summary"}</h3>
          <SellBundleDialog memberId={member.id} ar={ar} />
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          <MoneyStat label={ar ? "إجمالي المدفوع" : "Total paid"} value={sar(fin.totalPaidHalalas)} />
          <MoneyStat label={ar ? "إجمالي الخصومات" : "Total discount"} value={sar(fin.totalDiscountHalalas)} />
          <MoneyStat label={ar ? "قيمة الحصص المحضورة" : "Attended value"} value={sar(fin.attendedValueHalalas)} />
          <MoneyStat label={ar ? "قيمة الرصيد المتبقي" : "Remaining package value"} value={sar(fin.remainingPackageHalalas)} />
          <MoneyStat label={ar ? "قيمة عدم الحضور" : "No-show value"} value={sar(fin.noShowValueHalalas)} />
          <MoneyStat label={ar ? "قيمة الحصص المجانية" : "Complimentary value"} value={sar(fin.compValueHalalas)} />
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="font-display text-lead font-medium text-primary-900">{ar ? "سجل المتابعة" : "Follow-up log"}</h3>
        <div className="card space-y-3 p-5">
          <AddNoteForm memberId={member.id} ar={ar} />
          {notes.length === 0 ? (
            <p className="py-2 text-meta text-status-full">{ar ? "لا توجد ملاحظات بعد." : "No notes yet."}</p>
          ) : (
            <ul className="divide-y divide-outline">
              {notes.map((n) => (
                <li key={n.id} className="py-3">
                  <p className="whitespace-pre-wrap text-body text-primary-900">{n.body}</p>
                  <p className="mt-1 font-number text-caption text-status-full">{fmtDateTime(n.created_at, ar)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="font-display text-lead font-medium text-primary-900">{ar ? "آخر الحجوزات" : "Recent bookings"}</h3>
        <div className="card divide-y divide-outline">
          {detail.bookings.length === 0 ? (
            <p className="p-6 text-center text-body text-status-full">{ar ? "لا توجد حجوزات." : "No bookings."}</p>
          ) : (
            detail.bookings.map((b) => (
              <div key={b.id} className="flex items-center justify-between gap-2 p-4">
                <div className="min-w-0">
                  <p className="truncate font-medium text-primary-900">{ar ? b.name_ar : b.name_en}</p>
                  <p className="truncate text-caption text-status-full">
                    {b.starts_at ? fmtLongDateTime(b.starts_at, b.ends_at, locale) : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <BookingMoneyControls bookingId={b.id} ar={ar} />
                  <span className="chip bg-surface-variant text-primary-700">{bstatusLabel(b.status, ar)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function MoneyStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4">
      <p className="text-caption text-status-full">{label}</p>
      <p className="mt-1 font-number text-lead text-primary-900">{value}</p>
    </div>
  );
}

```

### src/app/admin/members/export/route.ts
```tsx
import { NextResponse } from "next/server";
import { getServerSupabase, rpc } from "@/lib/supabase/server";
import { getMembersForExport } from "@/lib/admin";

export const dynamic = "force-dynamic";

function cell(v: unknown): string {
  const s = String(v ?? "");
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET() {
  const supabase = await getServerSupabase();
  const { data: isAdmin } = await rpc<boolean>(supabase, "is_admin");
  if (!isAdmin) return new NextResponse("Forbidden", { status: 403 });

  const rows = await getMembersForExport();
  const header = ["Name", "Phone", "Email", "Status", "Source", "Membership", "Credits", "Created"];
  const body = rows.map((r) => [
    r.full_name,
    r.phone ?? "",
    r.email ?? "",
    r.lead_status ?? "",
    r.source ?? "",
    r.membership_status,
    String(r.credits),
    r.created_at.slice(0, 10),
  ]);
  // Prepend BOM so Excel reads UTF-8 (Arabic) correctly.
  const csv = "﻿" + [header, ...body].map((line) => line.map(cell).join(",")).join("\r\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="elan-members.csv"',
    },
  });
}

```

### src/app/admin/members/page.tsx
```tsx
import Link from "next/link";
import { getLocale } from "@/lib/locale-server";
import { getMembersOverview, type MemberListRow } from "@/lib/admin";
import { NewMemberDialog } from "@/components/admin/NewMemberDialog";

export const dynamic = "force-dynamic";

const FILTERS = [
  { key: "", ar: "الكل", en: "All" },
  { key: "lead", ar: "مهتمة", en: "Leads" },
  { key: "trial", ar: "تجريبية", en: "Trials" },
  { key: "active", ar: "نشطة", en: "Active" },
  { key: "lapsed", ar: "منقطعة", en: "Lapsed" },
];

const STATUS_LABEL: Record<string, [string, string]> = {
  lead: ["مهتمة", "Lead"],
  trial: ["تجريبية", "Trial"],
  active: ["نشطة", "Active"],
  lapsed: ["منقطعة", "Lapsed"],
};
const STATUS_TONE: Record<string, string> = { lead: "#8DA8B8", trial: "#C78B73", active: "#8A9272", lapsed: "#B9544A" };

function effectiveStatus(m: MemberListRow): string {
  if (m.lead_status && STATUS_LABEL[m.lead_status]) return m.lead_status;
  return m.period_end || m.credits > 0 ? "active" : "lead";
}

function fmtDate(iso: string | null, ar: boolean): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat(ar ? "ar-SA" : "en-GB", { day: "numeric", month: "short" }).format(new Date(iso));
}

function isExpiringSoon(iso: string | null): boolean {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  return t >= Date.now() && t <= Date.now() + 7 * 86400000;
}

function expiryLabel(iso: string | null, ar: boolean): string {
  if (!iso) return ar ? "بلا اشتراك" : "No plan";
  const t = new Date(iso).getTime();
  const days = Math.ceil((t - Date.now()) / 86400000);
  if (days < 0) return ar ? "منتهٍ" : "Expired";
  const d = fmtDate(iso, ar);
  return ar ? `${d} · باقي ${days} يوم` : `${d} · ${days}d left`;
}

export default async function AdminMembers({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const sp = await searchParams;
  const ar = (await getLocale()) === "ar";
  const { kpis, rows } = await getMembersOverview(sp.q, sp.status);
  const q = sp.q ?? "";
  const active = sp.status ?? "";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-page-title font-medium text-primary-900">{ar ? "العميلات" : "Members"}</h1>
          <p className="text-meta text-status-full">
            {ar
              ? `${kpis.total} عميلة · ${kpis.newWeek} جديدة هذا الأسبوع`
              : `${kpis.total} clients · ${kpis.newWeek} new this week`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <form className="flex">
            {active ? <input type="hidden" name="status" value={active} /> : null}
            <input
              name="q"
              defaultValue={q}
              placeholder={ar ? "بحث بالاسم أو الجوال أو البريد" : "Search name / phone / email"}
              className="min-h-[44px] w-44 rounded-lg border border-outline bg-surface-container px-4 text-sm text-primary-900 outline-none focus:border-accent md:w-56"
            />
          </form>
          <a
            href="/admin/members/export"
            className="inline-flex min-h-[44px] items-center rounded-lg border border-outline px-4 text-sm text-primary-700"
          >
            {ar ? "تصدير CSV" : "Export CSV"}
          </a>
          <NewMemberDialog ar={ar} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label={ar ? "إجمالي العميلات" : "Total clients"} value={kpis.total} />
        <Kpi label={ar ? "عضويات نشطة" : "Active"} value={kpis.active} />
        <Kpi label={ar ? "تنتهي قريبًا" : "Expiring soon"} value={kpis.expiring} tone="#C78B73" />
        <Kpi label={ar ? "تجريبية" : "Trials"} value={kpis.trials} tone="#8DA8B8" />
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const href = `/admin/members?${new URLSearchParams({ ...(f.key ? { status: f.key } : {}), ...(q ? { q } : {}) }).toString()}`;
          const on = active === f.key;
          return (
            <Link
              key={f.key || "all"}
              href={href}
              className={`chip min-h-[44px] items-center ${on ? "bg-primary text-ink" : "border border-outline text-primary-700"}`}
            >
              {ar ? f.ar : f.en}
            </Link>
          );
        })}
      </div>

      <div className="card p-6">
        <div className="overflow-x-auto">
          <div className="min-w-[640px]">
            <div className="flex items-center gap-3 border-b border-outline pb-3 text-meta text-status-full">
              <span className="flex-1">{ar ? "العميلة" : "Client"}</span>
              <span className="w-28 shrink-0">{ar ? "العضوية" : "Plan"}</span>
              <span className="w-24 shrink-0">{ar ? "الحصص المتبقية" : "Remaining"}</span>
              <span className="w-36 shrink-0">{ar ? "ينتهي الاشتراك" : "Expires"}</span>
              <span className="w-28 shrink-0">{ar ? "الحالة" : "Status"}</span>
            </div>

            {rows.length === 0 ? (
              <p className="py-10 text-center text-body text-status-full">
                {ar ? "لا توجد عميلات مطابقة. سجّلي عميلة جديدة للبدء." : "No matching clients. Register one to begin."}
              </p>
            ) : (
              rows.map((m) => {
                const st = effectiveStatus(m);
                const initial = (m.full_name.trim()[0] ?? "·").toUpperCase();
                return (
                  <Link
                    key={m.id}
                    href={`/admin/members/${m.id}`}
                    className="flex items-center gap-3 border-b border-outline py-3.5 text-body last:border-0 hover:bg-surface-variant/40"
                  >
                    <div className="flex flex-1 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-variant font-display text-sm text-primary-700">{initial}</div>
                      <div className="min-w-0">
                        <div className="truncate text-primary-900">{m.full_name}</div>
                        <div className="truncate text-caption text-status-full">{m.email ?? m.phone ?? "—"}</div>
                      </div>
                    </div>
                    <span className="w-28 shrink-0 truncate text-status-full">{(ar ? m.plan_ar : m.plan_en) ?? "—"}</span>
                    <span className="w-24 shrink-0 text-primary-900"><span className="font-number">{m.credits}</span>{ar ? " حصة" : ""}</span>
                    <span className={`w-36 shrink-0 font-number ${isExpiringSoon(m.period_end) ? "text-danger" : "text-status-full"}`}>{expiryLabel(m.period_end, ar)}</span>
                    <span className="flex w-28 shrink-0 items-center gap-1.5">
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: STATUS_TONE[st] }} />
                      <span className="truncate text-primary-900">{STATUS_LABEL[st]?.[ar ? 0 : 1]}</span>
                      {isExpiringSoon(m.period_end) ? (
                        <span className="rounded-pill bg-status-waitlist/15 px-1.5 text-caption text-primary-700">{ar ? "تنتهي قريبًا" : "soon"}</span>
                      ) : null}
                    </span>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <div className="card p-5 text-center">
      <div className="font-number text-3xl" style={tone ? { color: tone } : { color: "#3A332F" }}>{value}</div>
      <div className="text-caption text-status-full">{label}</div>
    </div>
  );
}

```

### src/app/admin/page.tsx
```tsx
import Link from "next/link";
import { getLocale } from "@/lib/locale-server";
import { getDashboard, getOverdueTasks } from "@/lib/admin";
import { fmtTime } from "@/lib/format";
import { classImage } from "@/lib/classColor";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const locale = await getLocale();
  const ar = locale === "ar";
  const date = new Intl.DateTimeFormat(ar ? "ar-SA" : "en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date());
  const [d, overdue] = await Promise.all([getDashboard(), getOverdueTasks()]);
  const dueFmt = (iso: string | null) => (iso ? new Intl.DateTimeFormat(ar ? "ar-SA" : "en-GB", { day: "numeric", month: "short" }).format(new Date(iso)) : "");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-page-title font-medium text-primary-900">{ar ? "لوحة التحكم" : "Dashboard"}</h1>
          <p className="font-number text-meta text-status-full">{date}</p>
        </div>
        <Link href="/admin/members" className="inline-flex min-h-[44px] items-center rounded-lg bg-primary px-5 text-sm font-semibold text-ink">{ar ? "إدارة العميلات" : "Manage clients"}</Link>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label={ar ? "حجوزات اليوم" : "Bookings today"} value={String(d.bookingsToday)} note={ar ? `${d.today.length} حصص اليوم` : `${d.today.length} classes today`} />
        <Kpi label={ar ? "نسبة الإشغال" : "Fill rate"} value={d.fillRate === null ? "—" : `${d.fillRate}٪`} note={ar ? "اليوم" : "today"} />
        <Kpi label={ar ? "عضوات جدد" : "New members"} value={String(d.newMembersWeek)} note={ar ? "هذا الأسبوع" : "this week"} good />
        <div className="card-ink p-5">
          <div className="text-caption text-primary-200">{ar ? "إيراد الشهر" : "Revenue (month)"}</div>
          <div className="mt-2 font-number text-3xl">{d.revenueMonth.toLocaleString(ar ? "ar-SA" : "en-US")}</div>
          <div className="text-caption text-ink/70">{ar ? "ريال سعودي" : "SAR"}</div>
        </div>
      </div>

      {(() => {
        const full = d.today.filter((c) => c.booked >= c.capacity);
        const almost = d.today.filter((c) => c.capacity - c.booked === 1);
        if (full.length === 0 && almost.length === 0 && d.newBookingsToday === 0) return null;
        return (
          <section className="card border-s-4 border-s-accent p-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-lead font-medium text-primary-900">{ar ? "تنبيهات الحصص" : "Class alerts"}</h2>
              <span className="font-number rounded-pill bg-sage/15 px-2.5 py-0.5 text-caption text-sage">
                {ar ? `${d.newBookingsToday} حجز جديد اليوم` : `${d.newBookingsToday} new today`}
              </span>
            </div>
            <ul className="space-y-2">
              {full.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 text-body">
                  <span className="text-primary-900">{c.name_en} · <span className="font-number">{fmtTime(c.starts_at, locale)}</span></span>
                  <span className="rounded-pill bg-danger/10 px-2.5 py-0.5 text-caption text-danger">{ar ? "اكتملت" : "Full"}</span>
                </li>
              ))}
              {almost.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 text-body">
                  <span className="text-primary-900">{c.name_en} · <span className="font-number">{fmtTime(c.starts_at, locale)}</span></span>
                  <span className="rounded-pill bg-status-waitlist/15 px-2.5 py-0.5 text-caption text-primary-700">{ar ? "باقي مقعد واحد" : "1 seat left"}</span>
                </li>
              ))}
            </ul>
          </section>
        );
      })()}

      {overdue.length > 0 ? (
        <section className="card border-s-4 border-s-danger p-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lead font-medium text-primary-900">{ar ? "مهام متابعة مستحقة" : "Due follow-up tasks"}</h2>
            <span className="font-number rounded-pill bg-danger/10 px-2.5 py-0.5 text-caption text-danger">{overdue.length}</span>
          </div>
          <ul className="divide-y divide-outline">
            {overdue.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-body text-primary-900">{t.title}</p>
                  <Link href={`/admin/members/${t.member_id}`} className="text-caption text-primary-700">{t.member_name}</Link>
                </div>
                <span className="font-number shrink-0 text-caption text-danger">{dueFmt(t.due_date)}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <section className="card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lead font-medium text-primary-900">{ar ? "حصص اليوم" : "Today's classes"}</h2>
            <Link href="/admin/schedule" className="text-meta text-primary-700">{ar ? "الجدول الكامل" : "Full schedule"}</Link>
          </div>
          {d.today.length === 0 ? (
            <p className="py-8 text-center text-body text-status-full">{ar ? "لا توجد حصص مجدولة اليوم." : "No classes scheduled today."}</p>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[460px] text-body">
                <div className="flex items-center gap-2 border-b border-outline pb-2 text-caption text-status-full">
                  <span className="w-16 shrink-0">{ar ? "الوقت" : "Time"}</span>
                  <span className="flex-1">{ar ? "الحصة" : "Class"}</span>
                  <span className="w-16 shrink-0">{ar ? "المدرّبة" : "Coach"}</span>
                  <span className="w-14 shrink-0">{ar ? "الحجز" : "Booked"}</span>
                  <span className="w-16 shrink-0">{ar ? "الحالة" : "Status"}</span>
                </div>
                {d.today.map((c) => (
                  <div key={c.id} className="flex items-center gap-2 border-b border-outline py-3 last:border-0">
                    <span className="w-16 shrink-0 font-number text-primary-900">{fmtTime(c.starts_at, locale)}</span>
                    <span className="flex flex-1 items-center gap-2 text-primary-900">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={classImage(c.name_en)} alt="" className="h-8 w-8 rounded-md object-cover" />
                      {c.name_en}
                    </span>
                    <span className="w-16 shrink-0 text-status-full">{(ar ? c.instructor_ar : c.instructor_en) ?? "—"}</span>
                    <span className="w-14 shrink-0 font-number text-status-full">{c.booked} / {c.capacity}</span>
                    <span className={`w-16 shrink-0 ${!c.open ? "text-danger" : c.capacity - c.booked === 1 ? "text-primary-700" : "text-sage"}`}>
                      {!c.open ? (ar ? "مكتملة" : "Full") : c.capacity - c.booked === 1 ? (ar ? "باقي مقعد" : "1 left") : ar ? "مفتوحة" : "Open"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="card p-6">
          <h2 className="mb-4 font-display text-lead font-medium text-primary-900">{ar ? "قائمة الانتظار" : "Waitlist"}</h2>
          {d.waitlist.length === 0 ? (
            <p className="py-2 text-body text-status-full">{ar ? "لا أحد في قائمة الانتظار اليوم." : "No one on the waitlist today."}</p>
          ) : (
            <div className="space-y-4">
              {d.waitlist.map((w, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-variant font-display text-sm text-primary-700">{(w.name.trim()[0] ?? "·").toUpperCase()}</div>
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-body text-primary-900">{w.name}</div>
                    <div className="truncate text-caption text-status-full">{(ar ? w.class_ar : w.class_en)}{w.starts_at ? ` · ${fmtTime(w.starts_at, locale)}` : ""}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-5 border-t border-outline pt-4">
            <div className="mb-2 font-display text-body text-primary-900">{ar ? "الأعلى إشغالًا اليوم" : "Top fill today"}</div>
            {d.topClass ? (
              <div className="flex justify-between text-body text-status-full"><span>{d.topClass.name_en}</span><span className="font-number text-primary-700">{d.topClass.pct}٪</span></div>
            ) : (
              <p className="text-meta text-status-full">—</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function Kpi({ label, value, note, good }: { label: string; value: string; note: string; good?: boolean }) {
  return (
    <div className="card p-5">
      <div className="text-caption text-status-full">{label}</div>
      <div className="mt-2 font-number text-3xl text-primary-900">{value}</div>
      <div className={`text-caption ${good ? "text-sage" : "text-status-full"}`}>{note}</div>
    </div>
  );
}

```

### src/app/admin/promo/page.tsx
```tsx
import { getLocale } from "@/lib/locale-server";
import { getPromoCodes } from "@/lib/admin";
import { PromoManager } from "@/components/admin/PromoManager";

export const dynamic = "force-dynamic";

export default async function AdminPromo() {
  const ar = (await getLocale()) === "ar";
  const promos = await getPromoCodes();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-page-title font-medium text-primary-900">{ar ? "أكواد الخصم" : "Promo codes"}</h1>
        <p className="text-meta text-status-full">{ar ? "خصومات نسبة أو مبلغ ثابت تُطبَّق على السعر الصافي قبل الضريبة" : "Percentage or fixed discounts, applied to net before VAT"}</p>
      </div>
      <PromoManager ar={ar} promos={promos} />
    </div>
  );
}

```

### src/app/admin/reports/page.tsx
```tsx
import { getLocale } from "@/lib/locale-server";
import { getReports } from "@/lib/admin";
import { fmtHalalas } from "@/lib/pricing";

export const dynamic = "force-dynamic";

const BSTATUS: Record<string, [string, string]> = {
  confirmed: ["مؤكد", "Confirmed"],
  waitlisted: ["قائمة الانتظار", "Waitlisted"],
  attended: ["تم الحضور", "Attended"],
  cancelled: ["ملغي", "Cancelled"],
  late_cancelled: ["إلغاء متأخر", "Late cancelled"],
  no_show: ["لم تحضر", "No-show"],
};

const PTYPE: Record<string, [string, string]> = {
  membership: ["العضويات", "Memberships"],
  credit_pack: ["باقات الحصص", "Credit packs"],
  single_class: ["حصص مفردة", "Single classes"],
  private_session: ["جلسات خاصة", "Private sessions"],
  penalty: ["الغرامات", "Penalties"],
};

export default async function AdminReports() {
  const locale = await getLocale();
  const ar = locale === "ar";
  const r = await getReports();
  const sar = (h: number) => `${fmtHalalas(h, ar ? "ar" : "en")} ${ar ? "ر.س" : "SAR"}`;
  const bookings = Object.entries(r.bookingsByStatus).sort((a, b) => b[1] - a[1]);
  const types = Object.entries(r.revenueByType).sort((a, b) => b[1] - a[1]);
  const maxType = Math.max(1, ...types.map(([, v]) => v));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-page-title font-medium text-primary-900">{ar ? "التقارير المالية" : "Financial reports"}</h1>
        <p className="text-meta text-status-full">{ar ? "آخر ٣٠ يومًا · الأرقام بالريال شاملة منطق ضريبة القيمة المضافة" : "Last 30 days · VAT-aware"}</p>
      </div>

      {/* Cash sales breakdown */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label={ar ? "المبيعات الإجمالية (شامل الضريبة)" : "Gross sales (incl. VAT)"} value={sar(r.grossHalalas)} strong />
        <Kpi label={ar ? "المبيعات الصافية" : "Net sales"} value={sar(r.netHalalas)} />
        <Kpi label={ar ? "ضريبة القيمة المضافة" : "VAT collected"} value={sar(r.vatHalalas)} />
        <Kpi label={ar ? "إجمالي الخصومات" : "Discounts given"} value={sar(r.discountsHalalas)} />
      </div>

      {/* Value flows that are NOT cash revenue */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label={ar ? "استهلاك باقات الحصص" : "Package utilization"} value={sar(r.packageUtilHalalas)} sub />
        <Kpi label={ar ? "استهلاك العضويات غير المحدودة" : "Unlimited utilization"} value={sar(r.unlimitedUtilHalalas)} sub />
        <Kpi label={ar ? "قيمة الحصص المجانية" : "Complimentary value"} value={sar(r.compValueHalalas)} sub />
        <Kpi label={ar ? "قيمة عدم الحضور المفقودة" : "No-show lost value"} value={sar(r.noShowLostHalalas)} sub />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <section className="card p-6">
          <h2 className="mb-5 font-display text-lead font-medium text-primary-900">{ar ? "الإيراد حسب النوع" : "Revenue by type"}</h2>
          {types.length === 0 ? (
            <p className="py-6 text-center text-body text-status-full">{ar ? "لا توجد مدفوعات في آخر ٣٠ يومًا." : "No payments in the last 30 days."}</p>
          ) : (
            <div className="space-y-4">
              {types.map(([type, v]) => (
                <div key={type}>
                  <div className="mb-1.5 flex justify-between text-body">
                    <span className="text-primary-900">{PTYPE[type]?.[ar ? 0 : 1] ?? type}</span>
                    <span className="font-number text-primary-700">{sar(v)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-pill bg-surface-variant">
                    <div className="h-full rounded-pill" style={{ width: `${Math.round((v / maxType) * 100)}%`, background: "linear-gradient(90deg,#B89B72,#C8A98A)" }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="card p-6">
          <h2 className="mb-5 font-display text-lead font-medium text-primary-900">{ar ? "الحجوزات حسب الحالة" : "Bookings by status"}</h2>
          {bookings.length === 0 ? (
            <p className="py-6 text-center text-body text-status-full">{ar ? "لا توجد حجوزات في آخر ٣٠ يومًا." : "No bookings in the last 30 days."}</p>
          ) : (
            <div className="space-y-3">
              {bookings.map(([status, count]) => (
                <div key={status} className="flex items-center justify-between border-b border-outline pb-2 text-body last:border-0">
                  <span className="text-primary-900">{BSTATUS[status]?.[ar ? 0 : 1] ?? status}</span>
                  <span className="font-number text-primary-700">{count}</span>
                </div>
              ))}
              <div className="flex items-center justify-between pt-1 text-body">
                <span className="text-status-full">{ar ? "قيمة الإلغاءات" : "Cancellation value"}</span>
                <span className="font-number text-status-full">{sar(r.cancellationValueHalalas)}</span>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Kpi({ label, value, strong, sub }: { label: string; value: string; strong?: boolean; sub?: boolean }) {
  return (
    <div className={sub ? "card p-5 bg-surface-variant/40" : "card p-5"}>
      <div className="text-caption text-status-full">{label}</div>
      <div className={`mt-2 font-number ${strong ? "text-2xl text-primary-900" : "text-xl text-primary-900"}`}>{value}</div>
    </div>
  );
}

```

### src/app/admin/schedule/page.tsx
```tsx
import { getLocale } from "@/lib/locale-server";
import { getAdminSchedule, getScheduleFormOptions, type ScheduleRow } from "@/lib/admin";
import { fmtTime, fmtDayHeading } from "@/lib/format";
import { classImage } from "@/lib/classColor";
import { ScheduleGenerator } from "@/components/admin/ScheduleGenerator";
import { ClassRowActions } from "@/components/admin/ClassRowActions";

export const dynamic = "force-dynamic";

export default async function AdminSchedule() {
  const locale = await getLocale();
  const ar = locale === "ar";
  const [rows, opts] = await Promise.all([getAdminSchedule(14), getScheduleFormOptions()]);

  // Group by calendar day.
  const groups = new Map<string, ScheduleRow[]>();
  for (const r of rows) {
    const key = r.starts_at.slice(0, 10);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(r);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-page-title font-medium text-primary-900">{ar ? "الجدول والحصص" : "Schedule"}</h1>
          <p className="text-meta text-status-full">{ar ? "حصص الأسبوعين القادمين" : "Classes for the next two weeks"}</p>
        </div>
        <ScheduleGenerator ar={ar} classTypes={opts.classTypes} instructors={opts.instructors} />
      </div>

      {rows.length === 0 ? (
        <div className="card p-10 text-center text-body text-status-full">
          {ar ? "لا توجد حصص مجدولة. أضيفي حصصًا لتظهر هنا." : "No classes scheduled yet."}
        </div>
      ) : (
        [...groups.entries()].map(([day, list]) => (
          <section key={day} className="space-y-3">
            <h2 className="font-display text-lead font-medium text-primary-900">{fmtDayHeading(list[0].starts_at, locale)}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {list.map((c) => {
                const full = c.confirmed >= c.capacity;
                return (
                  <div key={c.id} className="card overflow-hidden p-0">
                    <div className="relative h-24">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={classImage(c.name_en)} alt="" className="absolute inset-0 h-full w-full object-cover" />
                      <div className="absolute inset-0" style={{ background: "linear-gradient(180deg,transparent 30%,rgba(17,13,10,.85))" }} />
                      <span className={`absolute end-3 top-3 rounded-pill px-2.5 py-1 text-caption font-medium ${c.status === "cancelled" ? "bg-danger text-ink" : full ? "bg-surface-elevated/90 text-primary-700" : "bg-sage text-ink"}`}>
                        {c.status === "cancelled" ? (ar ? "ملغاة" : "Cancelled") : full ? (ar ? "مكتملة" : "Full") : ar ? "مفتوحة" : "Open"}
                      </span>
                      <h3 className="absolute inset-x-4 bottom-3 font-display text-lead font-medium text-ink">{c.name_en}</h3>
                    </div>
                    <div className="p-5">
                      <p className="font-number text-meta text-status-full">{fmtTime(c.starts_at, locale)}</p>
                      <div className="mt-3 flex items-center gap-3 border-t border-outline pt-3">
                        <span className="flex-1 text-body text-primary-900">{(ar ? c.instructor_ar : c.instructor_en) ?? "—"}</span>
                        <div className="text-end">
                          <div className="text-caption text-status-full">{ar ? "الإشغال" : "Booked"}{c.waitlist > 0 ? ` · ${c.waitlist} ${ar ? "بالانتظار" : "waiting"}` : ""}</div>
                          <div className="font-number text-body text-primary-900">{c.confirmed} / {c.capacity}</div>
                        </div>
                      </div>
                      <ClassRowActions id={c.id} confirmed={c.confirmed} cancelled={c.status === "cancelled"} ar={ar} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))
      )}
    </div>
  );
}

```

### src/app/admin/settings/page.tsx
```tsx
import { getLocale } from "@/lib/locale-server";

export const dynamic = "force-dynamic";

// Studio configuration. Static for now — wire to a settings table when needed.
const S = {
  name: "ÉLAN — استوديو بيلاتس للسيدات",
  city: "الرياض",
  phone: "+966 11 234 5678",
  bookingWindow: "٧ أيام",
  cancellation: "قبل ٤ ساعات",
  maxBookings: "٣ حصص",
  notifications: ["تذكير قبل الحصة بساعة", "إشعار قائمة الانتظار", "تنبيه انتهاء الباقة"],
};

export default async function AdminSettings() {
  const ar = (await getLocale()) === "ar";
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-medium text-primary-900">{ar ? "الإعدادات" : "Settings"}</h1>
        <p className="text-[13px] text-status-full">{ar ? "إدارة معلومات الاستوديو والحجز والإشعارات" : "Studio info, booking and notifications"}</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Section title={ar ? "معلومات الاستوديو" : "Studio info"}>
          <Row label={ar ? "اسم الاستوديو" : "Studio name"} value={S.name} />
          <Row label={ar ? "المدينة" : "City"} value={S.city} />
          <Row label={ar ? "الهاتف" : "Phone"} value={S.phone} />
        </Section>

        <Section title={ar ? "سياسة الحجز" : "Booking policy"}>
          <Row label={ar ? "فتح الحجز قبل الحصة بـ" : "Booking opens before"} value={S.bookingWindow} />
          <Row label={ar ? "الإلغاء المجاني حتى" : "Free cancellation until"} value={S.cancellation} />
          <Row label={ar ? "الحد الأقصى للحجوزات المتزامنة" : "Max concurrent bookings"} value={S.maxBookings} />
        </Section>

        <Section title={ar ? "الإشعارات" : "Notifications"}>
          {S.notifications.map((n, i) => (
            <div key={i} className="flex items-center justify-between border-b border-outline py-3 text-[14px] text-primary-900 last:border-0">
              <span>{n}</span>
              <span className="flex h-5 w-9 items-center rounded-pill bg-primary px-0.5"><span className="ms-auto h-4 w-4 rounded-full bg-ink" /></span>
            </div>
          ))}
        </Section>

        <Section title={ar ? "اللغة والمظهر" : "Language & appearance"}>
          <div className="flex items-center justify-between border-b border-outline py-3 text-[14px]">
            <span className="text-primary-900">{ar ? "لغة الواجهة" : "Interface language"}</span>
            <span className="flex gap-2">
              <span className="rounded-pill bg-primary px-3 py-1 text-[12px] text-ink">العربية</span>
              <span className="rounded-pill border border-outline px-3 py-1 text-[12px] text-status-full">English</span>
            </span>
          </div>
          <div className="flex items-center justify-between py-3 text-[14px]">
            <span className="text-primary-900">{ar ? "لون العلامة" : "Brand colour"}</span>
            <span className="h-6 w-6 rounded-full" style={{ background: "#B89B72" }} />
          </div>
        </Section>
      </div>

      <button className="rounded-[10px] bg-primary px-6 py-3 text-sm font-semibold text-ink">{ar ? "حفظ التغييرات" : "Save changes"}</button>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card p-6">
      <h2 className="mb-3 font-display text-lg font-medium text-primary-900">{title}</h2>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-outline py-3 text-[14px] last:border-0">
      <span className="text-status-full">{label}</span>
      <span className="text-primary-900">{value}</span>
    </div>
  );
}

```

### src/app/admin/trainers/page.tsx
```tsx
import { getLocale } from "@/lib/locale-server";
import { getInstructors } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function AdminTrainers() {
  const ar = (await getLocale()) === "ar";
  const trainers = await getInstructors();
  const totalClasses = trainers.reduce((s, t) => s + t.classesThisWeek, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-page-title font-medium text-primary-900">{ar ? "المدرّبات" : "Trainers"}</h1>
        <p className="text-meta text-status-full">
          {ar ? `${trainers.length} مدرّبات · ${totalClasses} حصة هذا الأسبوع` : `${trainers.length} trainers · ${totalClasses} classes this week`}
        </p>
      </div>

      {trainers.length === 0 ? (
        <div className="card p-10 text-center text-body text-status-full">{ar ? "لا توجد مدرّبات." : "No trainers yet."}</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {trainers.map((tr) => {
            const name = ar ? tr.name_ar : tr.name_en;
            const bio = ar ? tr.bio_ar : tr.bio_en;
            return (
              <div key={tr.id} className="card flex items-center gap-4 p-5">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-surface-variant font-display text-2xl text-primary-700">
                  {(name?.trim()[0] ?? "·").toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-lead text-primary-900">{name}</h3>
                  {bio ? <p className="mt-0.5 truncate text-meta text-status-full">{bio}</p> : null}
                  <p className="mt-2 text-meta text-primary-700">
                    {ar ? `${tr.classesThisWeek} حصة هذا الأسبوع` : `${tr.classesThisWeek} classes this week`}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

```

### src/app/auth/callback/route.ts
```tsx
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

/** Magic-link / OTP callback: exchange the code for a session and persist the
 *  session cookies ON the redirect response, then link the member by email. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const res = NextResponse.redirect(new URL("/", url.origin));
  if (!code) return res;

  const cookieStore = await cookies();
  const supabase = createServerClient<unknown>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      // Write the refreshed session cookies onto the redirect response so the
      // session actually persists (a bare NextResponse.redirect would drop them).
      setAll: (toSet) => toSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options)),
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(new URL(`/login?error=link`, url.origin));

  // Link this auth user to the admin-created member row (matched by email) so the
  // self booking RPCs (auth_user_id = auth.uid()) resolve her member.
  const { data: auth } = await supabase.auth.getUser();
  if (auth.user?.email) {
    await (supabase.from("members") as unknown as {
      update: (v: Record<string, unknown>) => {
        ilike: (c: string, p: string) => { is: (c: string, v: null) => Promise<unknown> };
      };
    })
      .update({ auth_user_id: auth.user.id })
      .ilike("email", auth.user.email)
      .is("auth_user_id", null);
  }
  return res;
}

```

### src/app/globals.css
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body { @apply bg-surface text-primary-900 antialiased leading-relaxed; margin: 0; }
  html, body { height: 100%; }
  [dir="rtl"] .chevron { transform: scaleX(-1); }
  ::selection { background: #B89B72; color: #F8F5F1; }

  /* Numbers (prices, dates, counters) — always Bodoni Moda with Latin digits, per handoff §01. */
  .num { font-family: "Bodoni Moda", Georgia, serif; font-variant-numeric: tabular-nums lining-nums; direction: ltr; unicode-bidi: isolate; }

  .material-symbols-rounded {
    font-family: "Material Symbols Rounded";
    font-weight: normal;
    font-style: normal;
    line-height: 1;
    letter-spacing: normal;
    text-transform: none;
    white-space: nowrap;
    word-wrap: normal;
    direction: ltr;
    font-feature-settings: "liga";
    -webkit-font-smoothing: antialiased;
    font-variation-settings: "opsz" 24;
  }
}

@layer components {
  /* Concierge card — warm cream, generous radius, soft shadow. */
  .card { @apply rounded-card border border-outline bg-surface-container shadow-card; }
  /* Dark photographic "brand moment" — hero, membership, sidebar. */
  .card-ink {
    @apply rounded-card;
    color: #F8F5F1;
    background: linear-gradient(150deg, #3B2D27 0%, #2B2420 100%);
    border: 1px solid rgba(184, 155, 114, 0.28);
    box-shadow: 0 18px 48px rgba(43, 36, 32, 0.30);
  }
  /* One chip system. Sizes keep a ≥44px tap target via min-height where interactive. */
  .chip { @apply inline-flex items-center justify-center rounded-pill px-3 py-1 text-caption font-medium; }
  .chip-md { @apply min-h-[44px] px-4 text-meta; }
  .chip-selected { @apply bg-primary text-ink; }
  .chip-outline { @apply border border-outline text-primary-700; }

  /* Sculpted pill buttons. One system, three sizes; consistent disabled state. */
  .btn { @apply inline-flex items-center justify-center gap-2 rounded-pill text-center font-medium transition-opacity disabled:cursor-not-allowed disabled:opacity-50; }
  .button-sm { @apply min-h-[44px] px-5 py-2.5 text-meta; }
  .button-md { @apply min-h-[48px] px-6 py-3.5 text-body; }
  .button-lg { @apply min-h-[52px] px-6 py-4 text-body; }
  .btn-primary { @apply btn button-md bg-primary text-ink; }
  .btn-outline { @apply btn button-md border border-outline bg-surface-elevated text-primary-900; }
  .btn-danger { @apply btn button-md text-danger; }
  .sticky-cta { @apply fixed inset-x-0 bottom-[4.75rem] z-40 px-4 md:bottom-0 md:start-[240px] md:border-t md:border-outline md:bg-surface-elevated md:pb-[max(1rem,env(safe-area-inset-bottom))] md:pt-3 md:shadow-sticky; }

  /* Brand helpers. eyebrow = Latin label (uppercase/tracking). eyebrow-ar = Arabic
     label (no uppercase/heavy tracking — weight+colour carry it instead). */
  .eyebrow { @apply font-label text-caption uppercase tracking-[0.18em] text-status-full; }
  .eyebrow-ar { @apply text-meta font-semibold tracking-normal text-status-full; }
  /* Wordmark + Latin lockup use Bodoni Moda (handoff §01). */
  .wordmark { font-family: "Bodoni Moda", Georgia, serif; @apply tracking-[0.08em]; }
  /* Architectural arch motif for image tiles. */
  .arch { border-radius: 9999px 9999px 1rem 1rem; }

  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* Subtle loading spinner — no layout shift, inherits currentColor. */
  .spinner { @apply inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent opacity-70; }

  /* Premium toast — calm cream/charcoal with a thin gold accent rule. */
  .toast {
    @apply pointer-events-auto flex items-start gap-3 rounded-lg border border-outline bg-surface-container px-4 py-3 text-meta text-primary-900 shadow-card;
    border-inline-start: 3px solid #B89B72;
  }
  .toast-error { border-inline-start-color: #9A5B3E; }
}

```

### src/app/layout.tsx
```tsx
import type { ReactNode } from "react";
import type { Metadata } from "next";
import "./globals.css";
import { dirFor, dict } from "@/lib/i18n";
import { getLocale } from "@/lib/locale-server";

export const metadata: Metadata = {
  title: "ÉLAN",
  description: "ÉLAN — women's Pilates studio booking, Riyadh.",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale} dir={dirFor(locale)}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400;1,700&family=Tajawal:wght@300;400;500;700&family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;0,6..96,500;1,6..96,400&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,0,0&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans">
        <div data-app={dict[locale].appName}>{children}</div>
      </body>
    </html>
  );
}

```

### src/app/login/page.tsx
```tsx
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

```

### src/components/BottomTabs.tsx
```tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./Icon";

const TABS = [
  { href: "/", key: "home", icon: "home" },
  { href: "/schedule", key: "timetable", icon: "calendar_month" },
  { href: "/bookings", key: "bookings", icon: "event_available" },
  { href: "/memberships", key: "memberships", icon: "card_membership" },
  { href: "/profile", key: "profile", icon: "person" },
] as const;

export function BottomTabs({ labels }: { labels: Record<string, string> }) {
  const path = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-outline bg-surface-elevated pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-sticky md:hidden">
      <ul className="mx-auto flex max-w-md items-stretch justify-around">
        {TABS.map((t) => {
          const active = t.href === "/" ? path === "/" : path.startsWith(t.href);
          const anchor = t.key === "timetable"; // Schedule = most-used action, visual anchor
          return (
            <li key={t.href} className="flex-1">
              <Link
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={`relative flex min-h-[44px] flex-col items-center justify-center gap-0.5 py-1.5 text-caption ${
                  active ? "font-medium text-primary-900" : anchor ? "text-primary-900/80" : "text-status-full"
                }`}
              >
                {/* gold indicator dot — active state does not rely on low-contrast gold text */}
                <span
                  aria-hidden
                  className={`absolute top-0 h-1 w-1 rounded-full bg-accent transition-opacity ${active ? "opacity-100" : "opacity-0"}`}
                />
                <Icon name={t.icon} filled={active || anchor} className={anchor ? "text-[24px]" : "text-[20px]"} />
                <span>{labels[t.key]}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

```

### src/components/Buttons.tsx
```tsx
"use client";
import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { bookAction, cancelAction, purchaseAction, setLocaleAction, signOutAction } from "@/actions";
import { dict, type Locale } from "@/lib/i18n";
import { useToast } from "./Toast";
import { ConfirmDialog } from "./ConfirmDialog";

/** Booking CTA on class detail. Handles book + (confirmed) cancel.
 *  Cancel is gated behind a confirm dialog. Errors use the danger token. */
export function CtaButton({
  classInstanceId, bookingId, label, variant, disabled, locale, cancelMeta,
}: {
  classInstanceId: string;
  bookingId: string | null;
  label: string;
  variant: "primary" | "muted" | "disabled";
  disabled?: boolean;
  locale: Locale;
  cancelMeta?: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const t = dict[locale];
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const doCancel = () =>
    start(async () => {
      setErr(null);
      const res = await cancelAction(bookingId!, classInstanceId);
      if ("error" in res && res.error) {
        setErr(t.toast.cancelFailed);
        toast.error(t.toast.cancelFailed);
        return;
      }
      setConfirmOpen(false);
      toast.success(t.toast.cancelled);
      router.refresh();
    });

  const doBook = () =>
    start(async () => {
      setErr(null);
      const res = await bookAction(classInstanceId);
      if ("bookingId" in res) {
        toast.success(t.toast.booked);
        if (res.bookingId) router.push(`/confirmation/${res.bookingId}`);
        else router.refresh();
      } else {
        setErr(t.toast.bookFailed);
        toast.error(t.toast.bookFailed);
      }
    });

  const onClick = () => {
    if (bookingId) setConfirmOpen(true);
    else doBook();
  };

  const cls =
    variant === "primary" ? "bg-primary text-ink"
    : variant === "muted" ? "bg-status-full text-primary-900"
    : "bg-status-full/40 text-primary-900";

  return (
    <div>
      {err ? <p className="mb-2 text-center text-meta text-danger" role="alert">{err}</p> : null}
      <button
        type="button"
        disabled={disabled || pending}
        onClick={onClick}
        className={`btn button-lg w-full ${cls}`}
      >
        {pending && !bookingId ? <span className="spinner" aria-hidden /> : label}
      </button>
      <ConfirmDialog
        open={confirmOpen}
        title={t.cancelDialog.title}
        body={t.cancelDialog.body}
        meta={cancelMeta}
        confirmLabel={t.cancelDialog.confirm}
        cancelLabel={t.cancelDialog.keep}
        danger
        pending={pending}
        onConfirm={doCancel}
        onClose={() => !pending && setConfirmOpen(false)}
      />
    </div>
  );
}

/** Cancel link in the bookings list. Gated behind a confirm dialog + success toast. */
export function CancelLink({
  bookingId, label, locale, classMeta,
}: {
  bookingId: string;
  label: string;
  locale: Locale;
  classMeta?: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const t = dict[locale];
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);

  const doCancel = () =>
    start(async () => {
      const res = await cancelAction(bookingId);
      if (res && "error" in res && res.error) {
        toast.error(t.toast.cancelFailed);
        return;
      }
      setOpen(false);
      toast.success(t.toast.cancelled);
      router.refresh();
    });

  return (
    <>
      <button
        type="button"
        disabled={pending}
        onClick={() => setOpen(true)}
        className="-mx-2 inline-flex min-h-[44px] items-center px-2 text-meta text-danger disabled:opacity-50"
      >
        {label}
      </button>
      <ConfirmDialog
        open={open}
        title={t.cancelDialog.title}
        body={t.cancelDialog.body}
        meta={classMeta}
        confirmLabel={t.cancelDialog.confirm}
        cancelLabel={t.cancelDialog.keep}
        danger
        pending={pending}
        onConfirm={doCancel}
        onClose={() => !pending && setOpen(false)}
      />
    </>
  );
}

export function BuyButton({
  type, refId, label, locale,
}: {
  type: "membership" | "credit_pack";
  refId: string;
  label: string;
  locale: Locale;
}) {
  const router = useRouter();
  const toast = useToast();
  const t = dict[locale];
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await purchaseAction(type, refId);
          if (res && "error" in res && res.error) toast.error(t.toast.purchaseFailed);
          else {
            toast.success(t.toast.purchased);
            router.refresh();
          }
        })
      }
      className="btn button-sm shrink-0 bg-primary text-ink"
    >
      {pending ? <span className="spinner" aria-hidden /> : label}
    </button>
  );
}

export function LangToggle({ current }: { current: Locale }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const set = (loc: Locale) => start(async () => { await setLocaleAction(loc); router.refresh(); });
  return (
    <div className="inline-flex rounded-pill border border-outline p-0.5 text-meta">
      {(["ar", "en"] as const).map((loc) => (
        <button
          key={loc}
          type="button"
          disabled={pending}
          onClick={() => set(loc)}
          className={`flex min-h-[44px] items-center rounded-pill px-4 ${current === loc ? "bg-primary text-ink" : "text-status-full"}`}
        >
          {loc === "ar" ? "عربي" : "EN"}
        </button>
      ))}
    </div>
  );
}

export function LogoutButton({ label }: { label: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(() => signOutAction())}
      className="btn button-md w-full text-danger"
    >
      {pending ? <span className="spinner" aria-hidden /> : label}
    </button>
  );
}

```

### src/components/ClassCard.tsx
```tsx
import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import type { Locale } from "@/lib/i18n";
import type { ClassCardData } from "@/lib/queries";
import { fmtTime } from "@/lib/format";
import { classImage } from "@/lib/classColor";

export function ClassCard({
  card,
  locale,
  statusLabels,
  ctaLabels,
}: {
  card: ClassCardData;
  locale: Locale;
  statusLabels: Record<string, string>;
  ctaLabels: { book: string; joinWaitlist: string };
}) {
  const name = card.name_en; // class names always shown in English
  const instructor = locale === "ar" ? card.instructor_ar : card.instructor_en;
  const booked = card.my_status === "confirmed";
  const waitlisted = card.my_status === "waitlisted";
  const dim = (card.display_status === "fully_booked" || card.display_status === "booking_closed") && !card.my_status;

  let right: ReactNode;
  if (booked) right = <span className="chip shrink-0 self-center whitespace-nowrap bg-sage text-ink">{statusLabels.booked} ✓</span>;
  else if (waitlisted) right = <span className="chip chip-outline shrink-0 self-center whitespace-nowrap text-status-full">{statusLabels.waitlisted}</span>;
  else if (card.display_status === "available") right = <span className="chip shrink-0 self-center whitespace-nowrap bg-primary px-4 text-ink">{ctaLabels.book}</span>;
  else if (card.display_status === "waitlist_open") right = <span className="chip shrink-0 self-center whitespace-nowrap border border-accent bg-accent/10 px-4 text-primary-900">{ctaLabels.joinWaitlist}</span>;
  else right = <span className="shrink-0 self-center whitespace-nowrap text-caption text-status-full">{statusLabels.fully_booked}</span>;

  const seats = card.display_status === "available" ? `${card.spots_left} ${statusLabels.available}` : null;
  const meta = [instructor, seats].filter(Boolean).join(" · ");

  return (
    <Link href={`/class/${card.id}`} className={`card flex items-center gap-3 p-3.5 ${dim ? "opacity-60" : ""}`}>
      <div className="min-w-[2.5rem] shrink-0 text-center">
        <div className="font-number text-lead font-medium text-primary-900">{fmtTime(card.starts_at, locale)}</div>
      </div>
      <Image src={classImage(name)} alt="" width={56} height={56} className="h-14 w-14 shrink-0 rounded-md object-cover ring-1 ring-outline" />
      <div className="min-w-0 flex-1">
        <div className="font-display text-body font-medium leading-tight text-primary-900">{name}</div>
        <div className="mt-0.5 truncate text-caption text-status-full">{meta}</div>
      </div>
      {right}
    </Link>
  );
}

```

### src/components/ConfirmDialog.tsx
```tsx
"use client";
import { useEffect, useRef } from "react";

/** Accessible confirm sheet/dialog. Used to gate destructive actions
 *  (e.g. cancelling a booking). Focus-trapped lightly, Esc to dismiss. */
export function ConfirmDialog({
  open,
  title,
  body,
  meta,
  confirmLabel,
  cancelLabel,
  danger,
  pending,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  body: string;
  meta?: string;
  confirmLabel: string;
  cancelLabel: string;
  danger?: boolean;
  pending?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    confirmRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !pending) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, pending, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center" role="presentation">
      <div
        className="absolute inset-0 bg-brand/40 backdrop-blur-[2px]"
        onClick={() => !pending && onClose()}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-body"
        className="relative m-4 w-full max-w-sm animate-[fadeInUp_.22s_ease-out] rounded-xl border border-outline bg-surface-container p-6 shadow-card"
      >
        <h2 id="confirm-title" className="font-display text-title font-medium text-primary-900">
          {title}
        </h2>
        <p id="confirm-body" className="mt-2 text-meta text-status-full">
          {body}
        </p>
        {meta ? <p className="mt-2 text-meta font-medium text-primary-900">{meta}</p> : null}
        <div className="mt-6 flex flex-col gap-2.5">
          <button
            ref={confirmRef}
            type="button"
            disabled={pending}
            onClick={onConfirm}
            className={`btn button-md ${danger ? "bg-danger text-ink" : "bg-primary text-ink"}`}
          >
            {pending ? <span className="spinner" aria-hidden /> : confirmLabel}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={onClose}
            className="btn button-md border border-outline bg-surface-elevated text-primary-900"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

```

### src/components/DateStrip.tsx
```tsx
"use client";
import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/i18n";
import { fmtDayNum, fmtWeekday, todayInRiyadh, upcomingDays } from "@/lib/format";

export function DateStrip({ selected, locale, todayLabel }: { selected: string; locale: Locale; todayLabel: string }) {
  const router = useRouter();
  const days = upcomingDays(7);
  const today = todayInRiyadh();
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {days.map((d) => {
        const isSel = d === selected;
        return (
          <button
            key={d}
            onClick={() => router.push(d === today ? "/schedule" : `/schedule?date=${d}`)}
            className={`flex min-h-[44px] min-w-[3.25rem] flex-col items-center justify-center rounded-md px-3 py-2 ${isSel ? "bg-primary text-ink" : "border border-outline bg-surface-variant text-primary-900"}`}
          >
            <span className="text-caption opacity-70">{d === today ? todayLabel : fmtWeekday(d, locale)}</span>
            <span className="font-number text-lead font-medium leading-tight">{fmtDayNum(d)}</span>
          </button>
        );
      })}
    </div>
  );
}

```

### src/components/EmptyState.tsx
```tsx
import Link from "next/link";
import { Icon } from "./Icon";

/** Warm, useful empty state: short elegant line + helpful hint + optional CTA. */
export function EmptyState({
  icon,
  title,
  hint,
  ctaHref,
  ctaLabel,
}: {
  icon?: string;
  title: string;
  hint?: string;
  ctaHref?: string;
  ctaLabel?: string;
}) {
  return (
    <div className="card flex flex-col items-center gap-2 p-6 text-center">
      {icon ? <Icon name={icon} className="text-4xl text-primary-300" /> : null}
      <p className="font-display text-lead font-medium text-primary-900">{title}</p>
      {hint ? <p className="max-w-[28ch] text-meta text-status-full">{hint}</p> : null}
      {ctaHref && ctaLabel ? (
        <Link href={ctaHref} className="btn button-sm mt-2 bg-primary text-ink">
          {ctaLabel}
        </Link>
      ) : null}
    </div>
  );
}

```

### src/components/Icon.tsx
```tsx
/** Material Symbols (Rounded) icon. Size/colour via Tailwind text-* classes. */
export function Icon({
  name,
  className,
  filled,
}: {
  name: string;
  className?: string;
  filled?: boolean;
}) {
  return (
    <span
      aria-hidden
      className={`material-symbols-rounded select-none leading-none ${className ?? ""}`}
      style={filled ? { fontVariationSettings: "'FILL' 1, 'opsz' 24" } : undefined}
    >
      {name}
    </span>
  );
}

```

### src/components/MemberSidebar.tsx
```tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./Icon";

const TABS = [
  { href: "/", key: "home", icon: "home" },
  { href: "/schedule", key: "timetable", icon: "calendar_month" },
  { href: "/bookings", key: "bookings", icon: "event_available" },
  { href: "/memberships", key: "memberships", icon: "card_membership" },
  { href: "/profile", key: "profile", icon: "person" },
] as const;

/** Desktop-only left nav for the member app (mobile uses BottomTabs). */
export function MemberSidebar({ labels }: { labels: Record<string, string> }) {
  const path = usePathname();
  return (
    <aside className="sticky top-0 hidden h-screen shrink-0 flex-col gap-8 border-e border-outline bg-surface-elevated p-7 md:flex md:w-[240px]">
      <div className="wordmark text-3xl text-primary-900">ÉLAN</div>
      <nav className="flex flex-col gap-1.5">
        {TABS.map((t) => {
          const active = t.href === "/" ? path === "/" : path.startsWith(t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`flex items-center gap-3 rounded-sm px-4 py-3 text-body ${active ? "bg-primary text-ink" : "text-primary-900/70 hover:text-primary-900"}`}
            >
              <Icon name={t.icon} filled={active} className="text-[20px]" />
              <span>{labels[t.key]}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

```

### src/components/StatusChip.tsx
```tsx
import type { DisplayStatus } from "@/lib/queries";

export function StatusChip({
  displayStatus, spotsLeft, myStatus, labels,
}: {
  displayStatus: DisplayStatus;
  spotsLeft: number;
  myStatus: "confirmed" | "waitlisted" | null;
  labels: Record<string, string>;
}) {
  if (myStatus === "confirmed") return <span className="chip bg-primary-100 text-primary-700">{labels.booked}</span>;
  if (myStatus === "waitlisted") return <span className="chip bg-status-waitlist/10 text-status-waitlist">{labels.waitlisted}</span>;
  if (displayStatus === "available") return <span className="chip bg-primary-100 text-primary-700">{spotsLeft} {labels.available}</span>;
  if (displayStatus === "waitlist_open") return <span className="chip bg-status-waitlist/10 text-status-waitlist">{labels.waitlist_open}</span>;
  if (displayStatus === "booking_closed") return <span className="chip bg-status-full/15 text-status-full">{labels.booking_closed}</span>;
  return <span className="chip bg-status-full/15 text-status-full">{labels.fully_booked}</span>;
}

```

### src/components/Toast.tsx
```tsx
"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

type ToastVariant = "success" | "error";
type Toast = { id: number; message: string; variant: ToastVariant };

type ToastApi = {
  success: (message: string) => void;
  error: (message: string) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

const AUTO_DISMISS_MS = 4000;

/** App-wide toast provider. Mount once (member layout). Calm, accessible
 *  snackbars with role="status" + aria-live polite, auto-dismiss, no layout shift. */
export function ToastProvider({ children, dismissLabel }: { children: ReactNode; dismissLabel: string }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((message: string, variant: ToastVariant) => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, message, variant }]);
  }, []);

  const api = useRef<ToastApi>({
    success: (m) => push(m, "success"),
    error: (m) => push(m, "error"),
  });

  return (
    <ToastContext.Provider value={api.current}>
      {children}
      <div
        aria-live="polite"
        role="status"
        className="pointer-events-none fixed inset-x-0 bottom-[5.5rem] z-50 mx-auto flex max-w-md flex-col items-stretch gap-2 px-4 md:bottom-6 md:start-[240px] md:max-w-sm md:px-6"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={() => remove(t.id)} dismissLabel={dismissLabel} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDismiss, dismissLabel }: { toast: Toast; onDismiss: () => void; dismissLabel: string }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className={`toast animate-[fadeInUp_.22s_ease-out] ${toast.variant === "error" ? "toast-error" : ""}`}>
      <span className="flex-1">{toast.message}</span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label={dismissLabel}
        className="-me-1 shrink-0 self-center text-status-full transition-opacity hover:opacity-70"
      >
        ✕
      </button>
    </div>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  // Safe no-op fallback so components render outside a provider (e.g. tests).
  return ctx ?? { success: () => {}, error: () => {} };
}

```

### src/components/admin/AddNoteForm.tsx
```tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addNoteAction } from "@/admin-actions";

export function AddNoteForm({ memberId, ar }: { memberId: string; ar: boolean }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [pending, start] = useTransition();

  const submit = () => {
    if (!body.trim()) return;
    start(async () => {
      const res = await addNoteAction(memberId, body);
      if (res.ok) {
        setBody("");
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-2">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={2}
        placeholder={ar ? "أضيفي ملاحظة متابعة…" : "Add a follow-up note…"}
        className="w-full rounded-md border border-outline bg-surface-container px-4 py-3 text-body text-primary-900 outline-none focus:border-accent"
      />
      <button
        disabled={pending || !body.trim()}
        onClick={submit}
        className="inline-flex min-h-[44px] items-center rounded-pill bg-primary px-5 text-sm font-medium text-ink disabled:opacity-50"
      >
        {pending ? (ar ? "جارٍ الإضافة…" : "Adding…") : ar ? "إضافة ملاحظة" : "Add note"}
      </button>
    </div>
  );
}

```

### src/components/admin/AdminNav.tsx
```tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export interface AdminNavItem {
  href: string;
  label: string;
}

export function AdminNav({ items }: { items: AdminNavItem[] }) {
  const path = usePathname();
  return (
    <nav className="flex flex-row gap-1.5 overflow-x-auto text-sm md:flex-col">
      {items.map((it) => {
        const active = it.href === "/admin" ? path === "/admin" : path.startsWith(it.href);
        return (
          <Link
            key={it.href}
            href={it.href}
            className={`whitespace-nowrap rounded-[10px] px-3.5 py-3 ${active ? "bg-white/10 text-accent" : "text-ink/60 hover:text-ink"}`}
          >
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}

```

### src/components/admin/AttendanceButtons.tsx
```tsx
"use client";
import { useState, useTransition } from "react";
import { markAttendedAction, markNoShowAction } from "@/actions/admin";

export function AttendanceButtons({
  bookingId,
  classInstanceId,
  attendedLabel,
  noShowLabel,
}: {
  bookingId: string;
  classInstanceId: string;
  attendedLabel: string;
  noShowLabel: string;
}) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const run = (fn: typeof markAttendedAction) =>
    start(async () => {
      setErr(null);
      const res = await fn(bookingId, classInstanceId);
      if ("error" in res) setErr(res.error);
    });

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-2">
        <button
          disabled={pending}
          onClick={() => run(markAttendedAction)}
          className="rounded-pill bg-primary px-3 py-1 text-xs font-medium text-ink disabled:opacity-50"
        >
          {attendedLabel}
        </button>
        <button
          disabled={pending}
          onClick={() => run(markNoShowAction)}
          className="rounded-pill border border-outline px-3 py-1 text-xs font-medium text-status-full disabled:opacity-50"
        >
          {noShowLabel}
        </button>
      </div>
      {err ? <p className="text-xs text-primary-600">{err}</p> : null}
    </div>
  );
}

```

### src/components/admin/ClassQuiz.tsx
```tsx
"use client";

import { useState } from "react";
import { QUIZ_QUESTIONS, CLASS_INFO, scoreQuiz, type QuizKey, type ClassRec } from "@/lib/quiz";

const KEYS: QuizKey[] = ["a", "b", "c", "d"];
const KEY_LABEL: Record<QuizKey, string> = { a: "أ", b: "ب", c: "ج", d: "د" };

/** 7-question class-fit quiz. Reports the recommended class up via onResult. */
export function ClassQuiz({ onResult }: { onResult: (rec: ClassRec) => void }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<QuizKey[]>([]);
  const done = answers.length === QUIZ_QUESTIONS.length;
  const result = done ? scoreQuiz(answers) : null;

  const pick = (k: QuizKey) => {
    const next = [...answers.slice(0, step), k];
    setAnswers(next);
    if (next.length === QUIZ_QUESTIONS.length) {
      onResult(scoreQuiz(next).primary);
    } else {
      setStep(step + 1);
    }
  };

  const restart = () => {
    setAnswers([]);
    setStep(0);
  };

  if (result) {
    const primary = CLASS_INFO[result.primary];
    const secondary = result.secondary ? CLASS_INFO[result.secondary] : null;
    return (
      <div className="space-y-3 rounded-md border border-accent/40 bg-surface-variant/40 p-4">
        <p className="text-caption text-status-full">الكلاس المنصوح به</p>
        <h3 className="font-display text-title text-primary-900">{primary.name_ar}</h3>
        <p className="text-body text-primary-900/90">{primary.advice_ar}</p>
        {secondary ? (
          <p className="text-meta text-status-full">خيار ثانٍ مقترح (تعادل): <span className="text-primary-900">{secondary.name_ar}</span></p>
        ) : null}
        <button type="button" onClick={restart} className="text-meta text-primary-700 underline">إعادة الاختبار</button>
      </div>
    );
  }

  const cur = QUIZ_QUESTIONS[step];
  return (
    <div className="space-y-3 rounded-md border border-outline bg-surface-variant/30 p-4">
      <div className="flex items-center justify-between">
        <span className="text-caption text-status-full">اختبار الكلاس المناسب</span>
        <span className="font-number text-caption text-primary-700">{step + 1} / {QUIZ_QUESTIONS.length}</span>
      </div>
      <p className="text-body font-medium text-primary-900">{cur.q}</p>
      <div className="space-y-2">
        {KEYS.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => pick(k)}
            className="flex w-full items-start gap-2 rounded-md border border-outline bg-surface-elevated px-3 py-2.5 text-start text-body text-primary-900 hover:border-accent"
          >
            <span className="font-display text-primary-700">{KEY_LABEL[k]}</span>
            <span className="flex-1">{cur.options[k]}</span>
          </button>
        ))}
      </div>
      {step > 0 ? (
        <button type="button" onClick={() => setStep(step - 1)} className="text-meta text-status-full">‹ رجوع</button>
      ) : null}
    </div>
  );
}

```

### src/components/admin/ClassRowActions.tsx
```tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cancelClassAction, deleteClassAction } from "@/admin-actions";

/** Per-class admin controls on the schedule: cancel (soft) or delete (if empty). */
export function ClassRowActions({ id, confirmed, cancelled, ar }: { id: string; confirmed: number; cancelled: boolean; ar: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const cancel = () =>
    start(async () => {
      setErr(null);
      const res = await cancelClassAction(id);
      if (!res.ok) setErr(ar ? "تعذّر الإلغاء" : "Failed");
      else router.refresh();
    });

  const remove = () =>
    start(async () => {
      setErr(null);
      const res = await deleteClassAction(id);
      if (!res.ok) setErr(res.error === "has_bookings" ? (ar ? "فيها حجوزات" : "Has bookings") : ar ? "تعذّر الحذف" : "Failed");
      else router.refresh();
    });

  if (cancelled) return null;

  return (
    <div className="mt-2 flex items-center gap-2">
      <button disabled={pending} onClick={cancel} className="rounded-pill border border-outline px-2.5 py-1 text-caption text-primary-700">
        {ar ? "إلغاء الحصة" : "Cancel"}
      </button>
      {confirmed === 0 ? (
        <button disabled={pending} onClick={remove} className="rounded-pill border border-outline px-2.5 py-1 text-caption text-danger">
          {ar ? "حذف" : "Delete"}
        </button>
      ) : null}
      {err ? <span className="text-caption text-danger">{err}</span> : null}
    </div>
  );
}

```

### src/components/admin/EditMemberDialog.tsx
```tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateMemberAction } from "@/admin-actions";

const STATUSES: { v: string; ar: string; en: string }[] = [
  { v: "lead", ar: "مهتمة", en: "Lead" },
  { v: "trial", ar: "تجريبية", en: "Trial" },
  { v: "active", ar: "نشطة", en: "Active" },
  { v: "lapsed", ar: "منقطعة", en: "Lapsed" },
];

export function EditMemberDialog({
  memberId,
  ar,
  initial,
}: {
  memberId: string;
  ar: boolean;
  initial: { full_name: string; phone: string; email: string; source: string; lead_status: string };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [f, setF] = useState(initial);
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));

  const field = "w-full rounded-md border border-outline bg-surface-container px-4 py-3 text-body text-primary-900 outline-none focus:border-accent";
  const lab = "mb-1 block text-meta text-status-full";

  const submit = () =>
    start(async () => {
      setErr(null);
      const res = await updateMemberAction(memberId, f);
      if (!res.ok) {
        setErr(res.error === "name_required" ? (ar ? "الاسم مطلوب" : "Name is required") : ar ? "تعذّر الحفظ" : "Couldn't save");
        return;
      }
      setOpen(false);
      router.refresh();
    });

  return (
    <>
      <button onClick={() => setOpen(true)} className="inline-flex min-h-[44px] items-center rounded-md border border-outline px-4 text-sm text-primary-700">
        {ar ? "تعديل البيانات" : "Edit"}
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 md:items-center md:p-4" role="dialog" aria-modal="true" onClick={() => !pending && setOpen(false)}>
          <div dir={ar ? "rtl" : "ltr"} className="w-full max-w-md space-y-4 rounded-t-xl bg-surface-elevated p-6 md:rounded-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display text-title font-medium text-primary-900">{ar ? "تعديل بيانات العميلة" : "Edit client"}</h2>

            <div>
              <label className={lab}>{ar ? "الاسم الكامل" : "Full name"} *</label>
              <input autoFocus value={f.full_name} onChange={(e) => set("full_name", e.target.value)} className={field} />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className={lab}>{ar ? "الجوال" : "Phone"}</label>
                <input dir="ltr" value={f.phone} onChange={(e) => set("phone", e.target.value)} className={field} />
              </div>
              <div className="flex-1">
                <label className={lab}>{ar ? "البريد" : "Email"}</label>
                <input dir="ltr" value={f.email} onChange={(e) => set("email", e.target.value)} className={field} />
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className={lab}>{ar ? "المصدر" : "Source"}</label>
                <input value={f.source} onChange={(e) => set("source", e.target.value)} className={field} />
              </div>
              <div className="flex-1">
                <label className={lab}>{ar ? "الحالة" : "Status"}</label>
                <select value={f.lead_status || "lead"} onChange={(e) => set("lead_status", e.target.value)} className={field}>
                  {STATUSES.map((s) => (
                    <option key={s.v} value={s.v}>{ar ? s.ar : s.en}</option>
                  ))}
                </select>
              </div>
            </div>

            {err ? <p className="text-meta text-danger" role="alert">{err}</p> : null}

            <div className="flex gap-2 pt-1">
              <button disabled={pending} onClick={submit} className="btn-primary flex-1 disabled:opacity-50">
                {pending ? (ar ? "جارٍ الحفظ…" : "Saving…") : ar ? "حفظ" : "Save"}
              </button>
              <button disabled={pending} onClick={() => setOpen(false)} className="btn-outline flex-1 disabled:opacity-50">
                {ar ? "إلغاء" : "Cancel"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

```

### src/components/admin/MemberMoney.tsx
```tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { sellPackageAction, compBookingAction, applyBookingDiscountAction } from "@/admin-actions";

/** Bundle presets — canonical ÉLAN model (net halalas, 150 SAR/class list). Prices editable by admin. */
const BUNDLES: { key: string; ar: string; en: string; credits: number; netHalalas: number }[] = [
  { key: "single", ar: "حصة مفردة", en: "Single class", credits: 1, netHalalas: 15000 },
  { key: "pack8", ar: "باقة 8 حصص", en: "8-class pack", credits: 8, netHalalas: 112000 },
  { key: "pack12", ar: "باقة 12 حصة", en: "12-class pack", credits: 12, netHalalas: 156000 },
];

export function SellBundleDialog({ memberId, ar }: { memberId: string; ar: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [bundle, setBundle] = useState("pack8");
  const preset = BUNDLES.find((b) => b.key === bundle) ?? BUNDLES[0];
  const [credits, setCredits] = useState(String(preset.credits));
  const [netSar, setNetSar] = useState(String(preset.netHalalas / 100));
  const [discountType, setDiscountType] = useState("none");
  const [discountVal, setDiscountVal] = useState("");
  const [promo, setPromo] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [payStatus, setPayStatus] = useState("paid");
  const [method, setMethod] = useState("cash");

  const pick = (key: string) => {
    const b = BUNDLES.find((x) => x.key === key) ?? BUNDLES[0];
    setBundle(key);
    setCredits(String(b.credits));
    setNetSar(String(b.netHalalas / 100));
  };

  const field = "w-full rounded-md border border-outline bg-surface-container px-3 py-2.5 text-body text-primary-900 outline-none focus:border-accent";
  const lab = "mb-1 block text-meta text-status-full";

  const submit = () =>
    start(async () => {
      setErr(null);
      const value = discountType === "percentage" ? Math.round(Number(discountVal || 0) * 100) : Math.round(Number(discountVal || 0) * 100);
      const res = await sellPackageAction(memberId, {
        credits: Number(credits),
        baseNetHalalas: Math.round(Number(netSar) * 100),
        discountType: discountType as "none" | "percentage" | "fixed" | "promo_code",
        discountValue: discountType === "none" || discountType === "promo_code" ? undefined : value,
        promoCode: discountType === "promo_code" ? promo : undefined,
        startsAt: startsAt || undefined,
        paymentStatus: payStatus as "paid" | "pending",
        method,
      });
      if (!res.ok) {
        setErr(ar ? `تعذّر البيع: ${res.error}` : `Sale failed: ${res.error}`);
        return;
      }
      setOpen(false);
      router.refresh();
    });

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary">{ar ? "بيع باقة / حصص" : "Sell bundle"}</button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 md:items-center md:p-4" role="dialog" aria-modal="true" onClick={() => !pending && setOpen(false)}>
          <div dir={ar ? "rtl" : "ltr"} className="w-full max-w-md space-y-4 rounded-t-xl bg-surface-elevated p-6 md:rounded-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display text-title font-medium text-primary-900">{ar ? "بيع باقة للعميلة" : "Sell a bundle"}</h2>
            <div>
              <label className={lab}>{ar ? "الباقة" : "Bundle"}</label>
              <select value={bundle} onChange={(e) => pick(e.target.value)} className={field}>
                {BUNDLES.map((b) => (
                  <option key={b.key} value={b.key}>{ar ? b.ar : b.en}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className={lab}>{ar ? "عدد الحصص" : "Credits"}</label>
                <input dir="ltr" value={credits} onChange={(e) => setCredits(e.target.value)} className={field} inputMode="numeric" />
              </div>
              <div className="flex-1">
                <label className={lab}>{ar ? "الصافي (ر.س)" : "Net (SAR)"}</label>
                <input dir="ltr" value={netSar} onChange={(e) => setNetSar(e.target.value)} className={field} inputMode="decimal" />
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className={lab}>{ar ? "خصم" : "Discount"}</label>
                <select value={discountType} onChange={(e) => setDiscountType(e.target.value)} className={field}>
                  <option value="none">{ar ? "بدون" : "None"}</option>
                  <option value="percentage">{ar ? "نسبة %" : "Percent %"}</option>
                  <option value="fixed">{ar ? "مبلغ ثابت" : "Fixed"}</option>
                  <option value="promo_code">{ar ? "كود خصم" : "Promo code"}</option>
                </select>
              </div>
              <div className="flex-1">
                {discountType === "promo_code" ? (
                  <>
                    <label className={lab}>{ar ? "الكود" : "Code"}</label>
                    <input value={promo} onChange={(e) => setPromo(e.target.value.toUpperCase())} className={field} />
                  </>
                ) : discountType !== "none" ? (
                  <>
                    <label className={lab}>{discountType === "percentage" ? "%" : ar ? "ر.س" : "SAR"}</label>
                    <input dir="ltr" value={discountVal} onChange={(e) => setDiscountVal(e.target.value)} className={field} inputMode="decimal" />
                  </>
                ) : null}
              </div>
            </div>
            <div>
              <label className={lab}>{ar ? "تاريخ بداية الباقة" : "Bundle start date"}</label>
              <input type="date" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className={field} />
              <p className="mt-1 text-caption text-status-full">{ar ? "اتركيه فارغاً = يبدأ اليوم. يمكن اختيار تاريخ مستقبلي." : "Empty = starts today. A future date is allowed."}</p>
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className={lab}>{ar ? "حالة الدفع" : "Payment status"}</label>
                <select value={payStatus} onChange={(e) => setPayStatus(e.target.value)} className={field}>
                  <option value="paid">{ar ? "مدفوع" : "Paid"}</option>
                  <option value="pending">{ar ? "معلّق (غير مدفوع)" : "Pending"}</option>
                </select>
              </div>
              <div className="flex-1">
                <label className={lab}>{ar ? "طريقة الدفع" : "Payment method"}</label>
                <select value={method} onChange={(e) => setMethod(e.target.value)} className={field}>
                  <option value="cash">{ar ? "نقد" : "Cash"}</option>
                  <option value="mada">{ar ? "مدى" : "Mada"}</option>
                  <option value="transfer">{ar ? "تحويل" : "Transfer"}</option>
                  <option value="online">{ar ? "أونلاين" : "Online"}</option>
                  <option value="other">{ar ? "أخرى" : "Other"}</option>
                </select>
              </div>
            </div>
            <p className="text-caption text-status-full">
              {ar ? "تُضاف الضريبة 15% فوق الصافي بعد الخصم. «معلّق» لا يُحتسب في الإيراد حتى يُدفع." : "VAT 15% on net after discount. Pending sales aren't counted in revenue until paid."}
            </p>
            {err ? <p className="text-meta text-danger" role="alert">{err}</p> : null}
            <div className="flex gap-2 pt-1">
              <button disabled={pending} onClick={submit} className="btn-primary flex-1 disabled:opacity-50">{pending ? "…" : ar ? "تأكيد البيع" : "Confirm sale"}</button>
              <button disabled={pending} onClick={() => setOpen(false)} className="btn-outline flex-1">{ar ? "إلغاء" : "Cancel"}</button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

/** Compact comp / percentage-discount controls on a single booking row. */
export function BookingMoneyControls({ bookingId, ar }: { bookingId: string; ar: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [showDisc, setShowDisc] = useState(false);
  const [pct, setPct] = useState("10");

  const comp = () =>
    start(async () => {
      await compBookingAction(bookingId, "comp");
      router.refresh();
    });
  const discount = () =>
    start(async () => {
      await applyBookingDiscountAction(bookingId, { discountType: "percentage", discountValue: Math.round(Number(pct || 0) * 100) });
      setShowDisc(false);
      router.refresh();
    });

  return (
    <div className="flex items-center gap-1.5">
      {showDisc ? (
        <>
          <input dir="ltr" value={pct} onChange={(e) => setPct(e.target.value)} className="w-12 rounded-md border border-outline bg-surface-container px-2 py-1 text-caption" inputMode="decimal" />
          <button disabled={pending} onClick={discount} className="rounded-pill bg-primary px-2.5 py-1 text-caption text-ink">%</button>
          <button onClick={() => setShowDisc(false)} className="text-caption text-status-full">×</button>
        </>
      ) : (
        <>
          <button disabled={pending} onClick={() => setShowDisc(true)} className="rounded-pill border border-outline px-2.5 py-1 text-caption text-primary-700">{ar ? "خصم" : "Disc."}</button>
          <button disabled={pending} onClick={comp} className="rounded-pill border border-outline px-2.5 py-1 text-caption text-primary-700">{ar ? "مجانية" : "Comp"}</button>
        </>
      )}
    </div>
  );
}

```

### src/components/admin/MemberSearch.tsx
```tsx
"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function MemberSearch({ initial, placeholder }: { initial: string; placeholder: string }) {
  const router = useRouter();
  const [value, setValue] = useState(initial);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        router.push(value.trim() ? `/admin/members?q=${encodeURIComponent(value.trim())}` : "/admin/members");
      }}
    >
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-card border border-outline bg-surface px-4 py-2 text-sm outline-none focus:border-primary"
      />
    </form>
  );
}

```

### src/components/admin/MemberStatusSelect.tsx
```tsx
"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setLeadStatusAction } from "@/admin-actions";

const STATUSES: { v: string; ar: string; en: string }[] = [
  { v: "lead", ar: "مهتمة", en: "Lead" },
  { v: "trial", ar: "تجريبية", en: "Trial" },
  { v: "active", ar: "نشطة", en: "Active" },
  { v: "lapsed", ar: "منقطعة", en: "Lapsed" },
];

export function MemberStatusSelect({ memberId, current, ar }: { memberId: string; current: string | null; ar: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <select
      disabled={pending}
      value={current ?? "lead"}
      onChange={(e) =>
        start(async () => {
          await setLeadStatusAction(memberId, e.target.value);
          router.refresh();
        })
      }
      aria-label={ar ? "حالة المتابعة" : "Follow-up status"}
      className="min-h-[44px] rounded-md border border-outline bg-surface-container px-3 text-meta text-primary-900 outline-none focus:border-accent disabled:opacity-50"
    >
      {STATUSES.map((s) => (
        <option key={s.v} value={s.v}>{ar ? s.ar : s.en}</option>
      ))}
    </select>
  );
}

```

### src/components/admin/MemberTasks.tsx
```tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createTaskAction, setTaskStatusAction } from "@/admin-actions";

type Task = { id: string; title: string; due_date: string | null; status: string };

function fmtDue(iso: string | null, ar: boolean): string {
  if (!iso) return "";
  return new Intl.DateTimeFormat(ar ? "ar-SA" : "en-GB", { day: "numeric", month: "short" }).format(new Date(iso));
}

export function MemberTasks({ memberId, ar, tasks }: { memberId: string; ar: boolean; tasks: Task[] }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [pending, start] = useTransition();
  const todayStr = new Date().toISOString().slice(0, 10);

  const add = () => {
    if (!title.trim()) return;
    start(async () => {
      const res = await createTaskAction(memberId, title, due);
      if (res.ok) {
        setTitle("");
        setDue("");
        router.refresh();
      }
    });
  };

  const toggle = (t: Task) =>
    start(async () => {
      await setTaskStatusAction(t.id, t.status === "done" ? "open" : "done", memberId);
      router.refresh();
    });

  const field = "rounded-md border border-outline bg-surface-container px-3 py-2.5 text-body text-primary-900 outline-none focus:border-accent";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={ar ? "مهمة متابعة (مثال: اتصال تجديد)" : "Follow-up task (e.g. renewal call)"}
          className={`${field} min-w-0 flex-1`}
        />
        <input type="date" value={due} onChange={(e) => setDue(e.target.value)} className={field} aria-label={ar ? "تاريخ الاستحقاق" : "Due date"} />
        <button disabled={pending || !title.trim()} onClick={add} className="inline-flex min-h-[44px] items-center rounded-pill bg-primary px-5 text-sm font-medium text-ink disabled:opacity-50">
          {ar ? "إضافة" : "Add"}
        </button>
      </div>

      {tasks.length === 0 ? (
        <p className="py-1 text-meta text-status-full">{ar ? "لا توجد مهام متابعة." : "No follow-up tasks."}</p>
      ) : (
        <ul className="divide-y divide-outline">
          {tasks.map((t) => {
            const done = t.status === "done";
            const overdue = !done && t.due_date && t.due_date <= todayStr;
            return (
              <li key={t.id} className="flex items-center gap-3 py-3">
                <button
                  onClick={() => toggle(t)}
                  disabled={pending}
                  aria-label={done ? (ar ? "إعادة فتح" : "Reopen") : ar ? "إكمال" : "Complete"}
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${done ? "border-sage bg-sage text-ink" : "border-outline text-transparent"}`}
                >
                  <span className="material-symbols-rounded text-[16px]" aria-hidden>check</span>
                </button>
                <div className="min-w-0 flex-1">
                  <p className={`text-body ${done ? "text-status-full line-through" : "text-primary-900"}`}>{t.title}</p>
                  {t.due_date ? (
                    <p className={`text-caption ${overdue ? "text-danger" : "text-status-full"}`}>
                      {ar ? "الاستحقاق: " : "Due: "}{fmtDue(t.due_date, ar)}{overdue ? (ar ? " · متأخرة" : " · overdue") : ""}
                    </p>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

```

### src/components/admin/NewMemberDialog.tsx
```tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createMemberAction, sellPackageAction } from "@/admin-actions";
import { ClassQuiz } from "@/components/admin/ClassQuiz";
import { CLASS_INFO, type ClassRec } from "@/lib/quiz";

const STATUSES: { v: string; ar: string; en: string }[] = [
  { v: "lead", ar: "مهتمة", en: "Lead" },
  { v: "trial", ar: "تجريبية", en: "Trial" },
  { v: "active", ar: "نشطة", en: "Active" },
  { v: "lapsed", ar: "منقطعة", en: "Lapsed" },
];

/** Bundle presets — canonical ÉLAN model (net halalas, 150 SAR/class list). */
const BUNDLES: { v: string; ar: string; en: string; credits: number; netHalalas: number }[] = [
  { v: "none", ar: "بدون باقة", en: "No bundle", credits: 0, netHalalas: 0 },
  { v: "single", ar: "حصة مفردة", en: "Single class", credits: 1, netHalalas: 15000 },
  { v: "pack8", ar: "باقة 8 حصص", en: "8-class pack", credits: 8, netHalalas: 112000 },
  { v: "pack12", ar: "باقة 12 حصة", en: "12-class pack", credits: 12, netHalalas: 156000 },
];

export function NewMemberDialog({ ar }: { ar: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [f, setF] = useState({ full_name: "", phone: "", email: "", source: "", lead_status: "lead" });
  const [bundle, setBundle] = useState("none");
  const [showQuiz, setShowQuiz] = useState(false);
  const [rec, setRec] = useState<ClassRec | "">("");
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));

  const field = "w-full rounded-md border border-outline bg-surface-container px-4 py-3 text-body text-primary-900 outline-none focus:border-accent";
  const lab = "mb-1 block text-meta text-status-full";

  const submit = () =>
    start(async () => {
      setErr(null);
      const res = await createMemberAction({ ...f, recommended_class: rec || undefined });
      if (!res.ok) {
        setErr(res.error === "name_required" ? (ar ? "الاسم مطلوب" : "Name is required") : ar ? "تعذّر الحفظ — تأكدي من صلاحية الدخول" : "Couldn't save — check you're signed in as admin");
        return;
      }
      const b = BUNDLES.find((x) => x.v === bundle);
      if (b && b.credits > 0) {
        const sale = await sellPackageAction(res.id, { credits: b.credits, baseNetHalalas: b.netHalalas, discountType: "none" });
        if (!sale.ok) {
          setErr(ar ? "أُنشئت العميلة لكن تعذّر تسجيل الباقة." : "Client created but bundle sale failed.");
          router.refresh();
          return;
        }
      }
      setF({ full_name: "", phone: "", email: "", source: "", lead_status: "lead" });
      setBundle("none");
      setRec("");
      setShowQuiz(false);
      setOpen(false);
      router.refresh();
    });

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex min-h-[44px] items-center rounded-lg bg-primary px-4 text-sm font-semibold text-ink"
      >
        {ar ? "+ عميلة جديدة" : "+ New client"}
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 md:items-center md:p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => !pending && setOpen(false)}
        >
          <div
            dir={ar ? "rtl" : "ltr"}
            className="w-full max-w-md space-y-4 rounded-t-xl bg-surface-elevated p-6 md:rounded-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-display text-title font-medium text-primary-900">{ar ? "تسجيل عميلة جديدة" : "Register new client"}</h2>

            <div>
              <label className={lab}>{ar ? "الاسم الكامل" : "Full name"} *</label>
              <input autoFocus value={f.full_name} onChange={(e) => set("full_name", e.target.value)} className={field} />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className={lab}>{ar ? "الجوال" : "Phone"}</label>
                <input dir="ltr" value={f.phone} onChange={(e) => set("phone", e.target.value)} className={field} />
              </div>
              <div className="flex-1">
                <label className={lab}>{ar ? "البريد" : "Email"}</label>
                <input dir="ltr" value={f.email} onChange={(e) => set("email", e.target.value)} className={field} />
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className={lab}>{ar ? "المصدر" : "Source"}</label>
                <input value={f.source} onChange={(e) => set("source", e.target.value)} placeholder={ar ? "إنستغرام، توصية…" : "Instagram, referral…"} className={field} />
              </div>
              <div className="flex-1">
                <label className={lab}>{ar ? "الحالة" : "Status"}</label>
                <select value={f.lead_status} onChange={(e) => set("lead_status", e.target.value)} className={field}>
                  {STATUSES.map((s) => (
                    <option key={s.v} value={s.v}>{ar ? s.ar : s.en}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className={lab}>{ar ? "الكلاس المناسب (اختبار قصير)" : "Class fit (quick quiz)"}</label>
              {rec ? (
                <div className="flex items-center justify-between gap-2 rounded-md border border-accent/40 bg-surface-variant/40 px-3 py-2.5">
                  <span className="text-body text-primary-900">{ar ? "المنصوح: " : "Recommended: "}<span className="font-medium">{CLASS_INFO[rec].name_ar}</span></span>
                  <button type="button" onClick={() => { setRec(""); setShowQuiz(true); }} className="text-meta text-primary-700 underline">{ar ? "إعادة" : "Redo"}</button>
                </div>
              ) : showQuiz ? (
                <ClassQuiz onResult={(r) => { setRec(r); setShowQuiz(false); }} />
              ) : (
                <button type="button" onClick={() => setShowQuiz(true)} className="w-full rounded-md border border-outline bg-surface-container px-4 py-3 text-body text-primary-700 hover:border-accent">
                  {ar ? "ابدئي اختبار الكلاس المناسب" : "Start the class-fit quiz"}
                </button>
              )}
            </div>

            <div>
              <label className={lab}>{ar ? "الباقة (تُحتسب ضمن الإيراد)" : "Bundle (counts in revenue)"}</label>
              <select value={bundle} onChange={(e) => setBundle(e.target.value)} className={field}>
                {BUNDLES.map((b) => (
                  <option key={b.v} value={b.v}>
                    {(ar ? b.ar : b.en) + (b.netHalalas ? ` — ${(b.netHalalas / 100).toLocaleString(ar ? "ar-SA" : "en-US")} ${ar ? "ر.س صافي" : "SAR net"}` : "")}
                  </option>
                ))}
              </select>
            </div>

            {err ? <p className="text-meta text-danger" role="alert">{err}</p> : null}

            <div className="flex gap-2 pt-1">
              <button disabled={pending} onClick={submit} className="btn-primary flex-1 disabled:opacity-50">
                {pending ? (ar ? "جارٍ الحفظ…" : "Saving…") : ar ? "حفظ" : "Save"}
              </button>
              <button disabled={pending} onClick={() => setOpen(false)} className="btn-outline flex-1 disabled:opacity-50">
                {ar ? "إلغاء" : "Cancel"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

```

### src/components/admin/PromoManager.tsx
```tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createPromoCodeAction, setPromoCodeActiveAction } from "@/admin-actions";
import { fmtHalalas } from "@/lib/pricing";

type Promo = {
  id: string;
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  starts_at: string | null;
  expires_at: string | null;
  max_redemptions: number | null;
  per_member_limit: number | null;
  active: boolean;
  redemptions: number;
};

function describe(p: Promo, ar: boolean): string {
  return p.discount_type === "percentage"
    ? `${p.discount_value / 100}%`
    : `${fmtHalalas(p.discount_value, ar ? "ar" : "en")} ${ar ? "ر.س" : "SAR"}`;
}

export function PromoManager({ ar, promos }: { ar: boolean; promos: Promo[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [f, setF] = useState({ code: "", discountType: "percentage", value: "", startsAt: "", expiresAt: "", maxRedemptions: "", perMemberLimit: "" });
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));
  const field = "w-full rounded-md border border-outline bg-surface-container px-3 py-2.5 text-body text-primary-900 outline-none focus:border-accent";
  const lab = "mb-1 block text-meta text-status-full";

  const submit = () =>
    start(async () => {
      setErr(null);
      if (!f.code.trim() || !f.value.trim()) {
        setErr(ar ? "الكود والقيمة مطلوبان" : "Code and value required");
        return;
      }
      // percentage -> basis points (10% => 1000); fixed -> halalas (50 SAR => 5000)
      const num = Number(f.value);
      const discountValue = f.discountType === "percentage" ? Math.round(num * 100) : Math.round(num * 100);
      const res = await createPromoCodeAction({
        code: f.code,
        discountType: f.discountType as "percentage" | "fixed",
        discountValue,
        startsAt: f.startsAt || undefined,
        expiresAt: f.expiresAt || undefined,
        maxRedemptions: f.maxRedemptions ? Number(f.maxRedemptions) : undefined,
        perMemberLimit: f.perMemberLimit ? Number(f.perMemberLimit) : undefined,
      });
      if (!res.ok) {
        setErr(res.error === "code_required" ? (ar ? "الكود مطلوب" : "Code required") : ar ? "تعذّر الإنشاء (قد يكون الكود مكرّرًا)" : "Couldn't create (code may exist)");
        return;
      }
      setF({ code: "", discountType: "percentage", value: "", startsAt: "", expiresAt: "", maxRedemptions: "", perMemberLimit: "" });
      router.refresh();
    });

  const toggle = (p: Promo) =>
    start(async () => {
      await setPromoCodeActiveAction(p.id, !p.active);
      router.refresh();
    });

  return (
    <div className="space-y-6">
      <section className="card p-6">
        <h2 className="mb-4 font-display text-lead font-medium text-primary-900">{ar ? "إنشاء كود خصم" : "Create promo code"}</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className={lab}>{ar ? "الكود" : "Code"}</label>
            <input value={f.code} onChange={(e) => set("code", e.target.value.toUpperCase())} placeholder="WELCOME10" className={field} />
          </div>
          <div>
            <label className={lab}>{ar ? "نوع الخصم" : "Type"}</label>
            <select value={f.discountType} onChange={(e) => set("discountType", e.target.value)} className={field}>
              <option value="percentage">{ar ? "نسبة %" : "Percentage %"}</option>
              <option value="fixed">{ar ? "مبلغ ثابت (ر.س)" : "Fixed (SAR)"}</option>
            </select>
          </div>
          <div>
            <label className={lab}>{f.discountType === "percentage" ? (ar ? "النسبة %" : "Percent %") : ar ? "المبلغ (ر.س)" : "Amount (SAR)"}</label>
            <input dir="ltr" value={f.value} onChange={(e) => set("value", e.target.value)} className={field} inputMode="decimal" />
          </div>
          <div>
            <label className={lab}>{ar ? "يبدأ" : "Starts"}</label>
            <input type="date" value={f.startsAt} onChange={(e) => set("startsAt", e.target.value)} className={field} />
          </div>
          <div>
            <label className={lab}>{ar ? "ينتهي" : "Expires"}</label>
            <input type="date" value={f.expiresAt} onChange={(e) => set("expiresAt", e.target.value)} className={field} />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className={lab}>{ar ? "حد الاستخدام" : "Max uses"}</label>
              <input dir="ltr" value={f.maxRedemptions} onChange={(e) => set("maxRedemptions", e.target.value)} className={field} inputMode="numeric" />
            </div>
            <div className="flex-1">
              <label className={lab}>{ar ? "لكل عميلة" : "Per member"}</label>
              <input dir="ltr" value={f.perMemberLimit} onChange={(e) => set("perMemberLimit", e.target.value)} className={field} inputMode="numeric" />
            </div>
          </div>
        </div>
        {err ? <p className="mt-3 text-meta text-danger" role="alert">{err}</p> : null}
        <button disabled={pending} onClick={submit} className="btn-primary mt-4 disabled:opacity-50">
          {pending ? (ar ? "جارٍ…" : "Saving…") : ar ? "إنشاء" : "Create"}
        </button>
      </section>

      <section className="card p-6">
        <h2 className="mb-4 font-display text-lead font-medium text-primary-900">{ar ? "الأكواد" : "Codes"}</h2>
        {promos.length === 0 ? (
          <p className="py-2 text-body text-status-full">{ar ? "لا توجد أكواد بعد." : "No promo codes yet."}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[640px] w-full text-body">
              <thead>
                <tr className="border-b border-outline text-start text-caption text-status-full">
                  <th className="py-2 text-start">{ar ? "الكود" : "Code"}</th>
                  <th className="py-2 text-start">{ar ? "الخصم" : "Discount"}</th>
                  <th className="py-2 text-start">{ar ? "الصلاحية" : "Window"}</th>
                  <th className="py-2 text-start">{ar ? "الاستخدام" : "Uses"}</th>
                  <th className="py-2 text-start">{ar ? "الحالة" : "Status"}</th>
                </tr>
              </thead>
              <tbody>
                {promos.map((p) => (
                  <tr key={p.id} className="border-b border-outline last:border-0">
                    <td className="py-3 font-display text-primary-900">{p.code}</td>
                    <td className="py-3 font-number text-status-full">{describe(p, ar)}</td>
                    <td className="py-3 font-number text-caption text-status-full">
                      {(p.starts_at?.slice(0, 10) ?? "—") + " → " + (p.expires_at?.slice(0, 10) ?? "∞")}
                    </td>
                    <td className="py-3 font-number text-status-full">
                      {p.redemptions}
                      {p.max_redemptions != null ? ` / ${p.max_redemptions}` : ""}
                    </td>
                    <td className="py-3">
                      <button
                        onClick={() => toggle(p)}
                        disabled={pending}
                        className={`rounded-pill px-3 py-1 text-caption ${p.active ? "bg-sage/15 text-sage" : "bg-surface-variant text-status-full"}`}
                      >
                        {p.active ? (ar ? "فعّال — إيقاف" : "Active — disable") : ar ? "موقوف — تفعيل" : "Off — enable"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

```

### src/components/admin/ScheduleGenerator.tsx
```tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { generateScheduleAction } from "@/admin-actions";

type Opt = { id: string; name_ar: string; name_en: string };

export function ScheduleGenerator({ ar, classTypes, instructors }: { ar: boolean; classTypes: Opt[]; instructors: Opt[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const today = new Date().toISOString().slice(0, 10);

  const [f, setF] = useState({
    startDate: today,
    days: "6",
    perDay: "8",
    firstTime: "09:00",
    durationMin: "50",
    bufferMin: "10",
    capacity: "6",
    instructorId: "",
  });
  const [types, setTypes] = useState<string[]>(classTypes.map((c) => c.id));
  const [skip, setSkip] = useState<number[]>([]);
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));
  const toggleType = (id: string) => setTypes((t) => (t.includes(id) ? t.filter((x) => x !== id) : [...t, id]));
  const toggleSkip = (d: number) => setSkip((s) => (s.includes(d) ? s.filter((x) => x !== d) : [...s, d]));
  const WEEKDAYS = ar
    ? ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"]
    : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const field = "w-full rounded-md border border-outline bg-surface-container px-3 py-2.5 text-body text-primary-900 outline-none focus:border-accent";
  const lab = "mb-1 block text-meta text-status-full";

  // Validation — generation is blocked until every condition is met.
  const nDays = Number(f.days);
  const nPer = Number(f.perDay);
  const nDur = Number(f.durationMin);
  const nBuf = Number(f.bufferMin);
  const nCap = Number(f.capacity);
  const timeOk = /^([01]\d|2[0-3]):[0-5]\d$/.test(f.firstTime);
  const allSkipped = skip.length >= 7;
  const problems: string[] = [];
  if (!f.startDate) problems.push(ar ? "تاريخ البداية" : "start date");
  if (!Number.isFinite(nDays) || nDays < 1) problems.push(ar ? "عدد الأيام (١ فأكثر)" : "days ≥ 1");
  if (!Number.isFinite(nPer) || nPer < 1) problems.push(ar ? "حصص/يوم (١ فأكثر)" : "per day ≥ 1");
  if (!timeOk) problems.push(ar ? "وقت أول حصة (HH:MM)" : "first time");
  if (!Number.isFinite(nDur) || nDur < 10) problems.push(ar ? "المدة (١٠ دقائق فأكثر)" : "duration ≥ 10");
  if (!Number.isFinite(nBuf) || nBuf < 0) problems.push(ar ? "وقت التنظيف (٠ فأكثر)" : "cleaning ≥ 0");
  if (!Number.isFinite(nCap) || nCap < 1) problems.push(ar ? "السعة (١ فأكثر)" : "capacity ≥ 1");
  if (types.length === 0) problems.push(ar ? "نوع حصة واحد على الأقل" : "≥ 1 class type");
  if (allSkipped) problems.push(ar ? "يوم عمل واحد على الأقل" : "≥ 1 working day");
  const valid = problems.length === 0;

  const submit = () =>
    start(async () => {
      setMsg(null);
      if (!valid) {
        setMsg((ar ? "أكملي: " : "Complete: ") + problems.join("، "));
        return;
      }
      const res = await generateScheduleAction({
        startDate: f.startDate,
        days: Number(f.days),
        perDay: Number(f.perDay),
        firstTime: f.firstTime,
        durationMin: Number(f.durationMin),
        bufferMin: Number(f.bufferMin),
        capacity: Number(f.capacity),
        classTypeIds: types,
        instructorId: f.instructorId || undefined,
        skipWeekdays: skip,
      });
      if (!res.ok) {
        setMsg(ar ? `تعذّر التوليد: ${res.error}` : `Failed: ${res.error}`);
        return;
      }
      setMsg(ar ? `تم إنشاء ${res.created} حصة.` : `Created ${res.created} classes.`);
      router.refresh();
    });

  return (
    <>
      <button onClick={() => setOpen(true)} className="inline-flex min-h-[44px] items-center rounded-lg bg-primary px-4 text-sm font-semibold text-ink">
        {ar ? "توليد جدول" : "Generate schedule"}
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 md:items-center md:p-4" role="dialog" aria-modal="true" onClick={() => !pending && setOpen(false)}>
          <div dir={ar ? "rtl" : "ltr"} className="max-h-[90vh] w-full max-w-md space-y-4 overflow-y-auto rounded-t-xl bg-surface-elevated p-6 md:rounded-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display text-title font-medium text-primary-900">{ar ? "توليد جدول الحصص" : "Generate class schedule"}</h2>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className={lab}>{ar ? "تاريخ البداية" : "Start date"}</label>
                <input type="date" value={f.startDate} onChange={(e) => set("startDate", e.target.value)} className={field} />
              </div>
              <div className="flex-1">
                <label className={lab}>{ar ? "عدد الأيام" : "Days"}</label>
                <input dir="ltr" value={f.days} onChange={(e) => set("days", e.target.value)} className={field} inputMode="numeric" />
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className={lab}>{ar ? "حصص/يوم" : "Per day"}</label>
                <input dir="ltr" value={f.perDay} onChange={(e) => set("perDay", e.target.value)} className={field} inputMode="numeric" />
              </div>
              <div className="flex-1">
                <label className={lab}>{ar ? "أول حصة" : "First class"}</label>
                <input type="time" value={f.firstTime} onChange={(e) => set("firstTime", e.target.value)} className={field} />
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className={lab}>{ar ? "مدة الحصة (د)" : "Duration (min)"}</label>
                <input dir="ltr" value={f.durationMin} onChange={(e) => set("durationMin", e.target.value)} className={field} inputMode="numeric" />
              </div>
              <div className="flex-1">
                <label className={lab}>{ar ? "وقت التنظيف (د)" : "Cleaning (min)"}</label>
                <input dir="ltr" value={f.bufferMin} onChange={(e) => set("bufferMin", e.target.value)} className={field} inputMode="numeric" />
              </div>
              <div className="flex-1">
                <label className={lab}>{ar ? "السعة" : "Capacity"}</label>
                <input dir="ltr" value={f.capacity} onChange={(e) => set("capacity", e.target.value)} className={field} inputMode="numeric" />
              </div>
            </div>

            <div>
              <label className={lab}>{ar ? "المدرّبة" : "Instructor"}</label>
              <select value={f.instructorId} onChange={(e) => set("instructorId", e.target.value)} className={field}>
                <option value="">{ar ? "بدون تحديد" : "Unassigned"}</option>
                {instructors.map((i) => (
                  <option key={i.id} value={i.id}>{ar ? i.name_ar : i.name_en}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={lab}>{ar ? "أنواع الحصص (تتناوب على الفترات)" : "Class types (rotated across slots)"}</label>
              <div className="flex flex-wrap gap-2">
                {classTypes.map((c) => {
                  const on = types.includes(c.id);
                  return (
                    <button key={c.id} type="button" onClick={() => toggleType(c.id)} className={`rounded-pill px-3 py-1.5 text-meta ${on ? "bg-primary text-ink" : "border border-outline text-primary-700"}`}>
                      {ar ? c.name_ar : c.name_en}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className={lab}>{ar ? "أيام الإجازة (تُستثنى)" : "Days off (skipped)"}</label>
              <div className="flex flex-wrap gap-1.5">
                {WEEKDAYS.map((d, i) => {
                  const on = skip.includes(i);
                  return (
                    <button key={i} type="button" onClick={() => toggleSkip(i)} className={`rounded-pill px-2.5 py-1.5 text-caption ${on ? "bg-danger/15 text-danger" : "border border-outline text-primary-700"}`}>
                      {d}
                    </button>
                  );
                })}
              </div>
              <p className="mt-1 text-caption text-status-full">{ar ? "«عدد الأيام» = أيام عمل فعلية بعد استثناء الإجازات." : "“Days” counts active days after skipping days off."}</p>
            </div>

            <p className="text-caption text-status-full">
              {ar
                ? "الفاصل بين الحصص = المدة + وقت التنظيف. تُفتح كل الحصص للحجز فوراً وتُغلق عند بدايتها. التكرارات تُتجاهل."
                : "Slot interval = duration + cleaning. Classes open for booking now and close at start; duplicates are skipped."}
            </p>
            {!valid ? (
              <p className="text-caption text-danger">{(ar ? "مطلوب لإتمام التوليد: " : "Required: ") + problems.join("، ")}</p>
            ) : null}
            {msg ? <p className="text-meta text-primary-700" role="status">{msg}</p> : null}

            <div className="flex gap-2 pt-1">
              <button disabled={pending || !valid} onClick={submit} className="btn-primary flex-1 disabled:opacity-50">{pending ? (ar ? "جارٍ…" : "…") : ar ? "توليد" : "Generate"}</button>
              <button disabled={pending} onClick={() => setOpen(false)} className="btn-outline flex-1">{ar ? "إغلاق" : "Close"}</button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

```

### src/components/admin/WhatsAppActions.tsx
```tsx
"use client";

/** Normalise a Saudi phone number to international digits for wa.me. */
function waPhone(phone: string | null): string {
  let p = (phone ?? "").replace(/\D/g, "");
  if (!p) return "";
  if (p.startsWith("00")) p = p.slice(2);
  if (p.startsWith("966")) return p;
  if (p.startsWith("0")) p = p.slice(1);
  if (p.length === 9 && p.startsWith("5")) return "966" + p;
  return p;
}

export function WhatsAppActions({ phone, name, ar }: { phone: string | null; name: string; ar: boolean }) {
  const num = waPhone(phone);
  const first = (name || "").trim().split(/\s+/)[0] || (ar ? "عميلتنا" : "there");

  const templates: { key: string; label: string; msg: string }[] = ar
    ? [
        { key: "followup", label: "متابعة", msg: `مرحباً ${first} 🌸 معكِ فريق ÉLAN، حبينا نطمئن عليكِ ونساعدك بحجز حصتك القادمة. بانتظارك 💛` },
        { key: "trial", label: "تذكير الحصة التجريبية", msg: `مرحباً ${first} 🌸 تذكير لطيف بحصتك التجريبية في ÉLAN. ننتظرك! لأي استفسار أو تغيير الموعد تواصلي معنا.` },
        { key: "renewal", label: "تذكير التجديد", msg: `مرحباً ${first} 🌸 عضويتك في ÉLAN قاربت على الانتهاء. جددي الآن لتستمري في حصصك دون انقطاع. يسعدنا تجديدك 💛` },
        { key: "reactivate", label: "إعادة تفعيل", msg: `اشتقنالك ${first} 🌸 صار لنا فترة ما شفناكِ في ÉLAN. رجعتك تفرحنا — احجزي حصتك ولكِ ترحيب خاص بالعودة 💛` },
      ]
    : [
        { key: "followup", label: "Follow-up", msg: `Hi ${first} 🌸 It's the ÉLAN team — just checking in and happy to help you book your next class. We'd love to see you 💛` },
        { key: "trial", label: "Trial reminder", msg: `Hi ${first} 🌸 A gentle reminder about your trial class at ÉLAN. We're looking forward to it! Reach out to reschedule anytime.` },
        { key: "renewal", label: "Renewal reminder", msg: `Hi ${first} 🌸 Your ÉLAN membership is almost up. Renew now to keep your sessions going — we'd love to have you continue 💛` },
        { key: "reactivate", label: "Reactivation", msg: `We've missed you ${first} 🌸 It's been a while since we saw you at ÉLAN. Come back and book a class — a warm welcome awaits 💛` },
      ];

  if (!num) {
    return <p className="text-meta text-status-full">{ar ? "أضيفي رقم جوال لتفعيل رسائل واتساب." : "Add a phone number to enable WhatsApp messages."}</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {templates.map((t) => (
        <a
          key={t.key}
          href={`https://wa.me/${num}?text=${encodeURIComponent(t.msg)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-pill border border-outline px-4 text-sm text-primary-700 hover:border-accent"
        >
          <span className="material-symbols-rounded text-[18px] text-sage" aria-hidden>chat</span>
          {t.label}
        </a>
      ))}
    </div>
  );
}

```

### src/lib/__tests__/logic.test.ts
```tsx
import { describe, it, expect } from "vitest";
import { ctaState, levelRank } from "../cta";
import { dayBoundsUtc } from "../format";
import { getInvoiceProvider } from "../providers";

describe("ctaState — server-driven booking button", () => {
  it("shows Cancel when the member is confirmed", () => {
    expect(ctaState({ myStatus: "confirmed", eligibility: "ALREADY_BOOKED", displayStatus: "available" }))
      .toMatchObject({ key: "cancel", isCancel: true });
  });
  it("shows Leave waitlist when waitlisted", () => {
    expect(ctaState({ myStatus: "waitlisted", eligibility: "ALREADY_BOOKED", displayStatus: "waitlist_open" }))
      .toMatchObject({ key: "leaveWaitlist", isCancel: true });
  });
  it("disables with reason when booking is closed", () => {
    expect(ctaState({ myStatus: null, eligibility: "BOOKING_CLOSED", displayStatus: "available" }))
      .toMatchObject({ key: "closed", disabled: true });
  });
  it("disables when the member's level is too low", () => {
    expect(ctaState({ myStatus: null, eligibility: "LEVEL_TOO_LOW", displayStatus: "available" }))
      .toMatchObject({ key: "levelTooLow", disabled: true });
  });
  it("disables when there are no credits", () => {
    expect(ctaState({ myStatus: null, eligibility: "NO_CREDITS", displayStatus: "available" }))
      .toMatchObject({ key: "noCredits", disabled: true });
  });
  it("offers Join waitlist when full but waitlist open", () => {
    expect(ctaState({ myStatus: null, eligibility: "ELIGIBLE", displayStatus: "waitlist_open" }))
      .toMatchObject({ key: "joinWaitlist", disabled: false });
  });
  it("offers Book when eligible and spots remain", () => {
    expect(ctaState({ myStatus: null, eligibility: "ELIGIBLE", displayStatus: "available" }))
      .toMatchObject({ key: "book", variant: "primary", disabled: false });
  });
});

describe("levelRank — progression 1 < 1.5 < 2", () => {
  it("orders levels correctly", () => {
    expect(levelRank("level_1")).toBeLessThan(levelRank("level_1_5"));
    expect(levelRank("level_1_5")).toBeLessThan(levelRank("level_2"));
  });
});

describe("dayBoundsUtc — Riyadh day window", () => {
  it("spans 24h from local midnight (+03:00)", () => {
    const { start, end } = dayBoundsUtc("2026-06-20");
    expect(start).toBe("2026-06-19T21:00:00.000Z");
    expect(new Date(end).getTime() - new Date(start).getTime()).toBe(86400000);
  });
});

describe("MockInvoiceProvider — ZATCA-style VAT split", () => {
  it("extracts 15% VAT from a gross amount", async () => {
    const inv = await getInvoiceProvider().generate({ amountSar: 115, taxPct: 15, buyer: "X", description: "Pack" });
    expect(inv.totalSar).toBe(115);
    expect(inv.vatSar).toBeCloseTo(15, 2);
    expect(inv.subtotalSar).toBeCloseTo(100, 2);
    expect(inv.number).toMatch(/^ELAN-/);
    expect(inv.qr.length).toBeGreaterThan(0);
  });
});

```

### src/lib/__tests__/pricing.test.ts
```tsx
import { describe, it, expect } from "vitest";
import {
  computePrice,
  grossFromNet,
  netFromGross,
  sarToHalalas,
  halalasToSar,
  DEFAULT_CLASS_NET_HALALAS,
  VAT_BPS,
} from "../pricing";

describe("computePrice — class value accounting (halalas)", () => {
  it("dossier default: net 150 SAR + 15% VAT = 172.50 gross", () => {
    expect(computePrice({ baseNetHalalas: DEFAULT_CLASS_NET_HALALAS })).toEqual({
      baseNetHalalas: 15000,
      discountAmountHalalas: 0,
      finalNetHalalas: 15000,
      vatBps: VAT_BPS,
      vatAmountHalalas: 2250,
      finalGrossHalalas: 17250,
    });
  });

  it("percentage discount applies to net before VAT", () => {
    const r = computePrice({ baseNetHalalas: 15000, discountKind: "percentage", discountValue: 1000 }); // 10%
    expect(r.discountAmountHalalas).toBe(1500);
    expect(r.finalNetHalalas).toBe(13500);
    expect(r.vatAmountHalalas).toBe(2025);
    expect(r.finalGrossHalalas).toBe(15525);
  });

  it("fixed discount applies to net before VAT", () => {
    const r = computePrice({ baseNetHalalas: 15000, discountKind: "fixed", discountValue: 5000 }); // 50 SAR
    expect(r.finalNetHalalas).toBe(10000);
    expect(r.vatAmountHalalas).toBe(1500);
    expect(r.finalGrossHalalas).toBe(11500);
  });

  it("final net can never go below 0 (fixed discount clamped)", () => {
    const r = computePrice({ baseNetHalalas: 15000, discountKind: "fixed", discountValue: 20000 });
    expect(r.discountAmountHalalas).toBe(15000);
    expect(r.finalNetHalalas).toBe(0);
    expect(r.vatAmountHalalas).toBe(0);
    expect(r.finalGrossHalalas).toBe(0);
  });

  it("100% percentage discount (complimentary) zeroes net and VAT", () => {
    const r = computePrice({ baseNetHalalas: 15000, discountKind: "percentage", discountValue: 10000 });
    expect(r.finalNetHalalas).toBe(0);
    expect(r.finalGrossHalalas).toBe(0);
  });

  it("percentage above 100% is capped at 100%", () => {
    const r = computePrice({ baseNetHalalas: 15000, discountKind: "percentage", discountValue: 50000 });
    expect(r.finalNetHalalas).toBe(0);
  });

  it("negative / NaN base is treated as 0", () => {
    expect(computePrice({ baseNetHalalas: -100 }).finalGrossHalalas).toBe(0);
    expect(computePrice({ baseNetHalalas: NaN }).finalGrossHalalas).toBe(0);
  });
});

describe("VAT helpers", () => {
  it("grossFromNet matches the engine", () => {
    expect(grossFromNet(15000)).toBe(17250);
  });
  it("netFromGross inverts a VAT-inclusive price", () => {
    expect(netFromGross(17250)).toBe(15000);
  });
  it("sar/halalas round-trip", () => {
    expect(sarToHalalas(172.5)).toBe(17250);
    expect(halalasToSar(17250)).toBe(172.5);
  });
});

```

### src/lib/__tests__/quiz.test.ts
```tsx
import { describe, it, expect } from "vitest";
import { scoreQuiz, QUIZ_QUESTIONS, CLASS_INFO, type QuizKey } from "../quiz";

describe("scoreQuiz — class recommendation", () => {
  it("all 'a' → reformer", () => {
    expect(scoreQuiz(Array(7).fill("a") as QuizKey[])).toEqual({ primary: "reformer", secondary: null });
  });
  it("all 'b' → sculpt", () => {
    expect(scoreQuiz(Array(7).fill("b") as QuizKey[]).primary).toBe("sculpt");
  });
  it("all 'c' → center", () => {
    expect(scoreQuiz(Array(7).fill("c") as QuizKey[]).primary).toBe("center");
  });
  it("all 'd' → cardio_power", () => {
    expect(scoreQuiz(Array(7).fill("d") as QuizKey[]).primary).toBe("cardio_power");
  });
  it("majority wins", () => {
    expect(scoreQuiz(["a", "a", "a", "a", "b", "c", "d"]).primary).toBe("reformer");
  });
  it("tie surfaces a secondary", () => {
    const r = scoreQuiz(["a", "a", "a", "b", "b", "b", "c"]);
    expect(r.primary).toBe("reformer");
    expect(r.secondary).toBe("sculpt");
  });
});

describe("quiz content", () => {
  it("has 7 questions, each with 4 options", () => {
    expect(QUIZ_QUESTIONS).toHaveLength(7);
    for (const q of QUIZ_QUESTIONS) expect(Object.keys(q.options)).toEqual(["a", "b", "c", "d"]);
  });
  it("has advice for every class", () => {
    for (const k of ["reformer", "sculpt", "center", "cardio_power"] as const) {
      expect(CLASS_INFO[k].advice_ar.length).toBeGreaterThan(20);
    }
  });
});

```

### src/lib/admin.ts
```tsx
import "server-only";
import { getServerSupabase, rpc } from "./supabase/server";
import { dayBoundsUtc, todayInRiyadh } from "./format";
import { grossFromNet, DEFAULT_CLASS_NET_HALALAS } from "./pricing";

type ServerSupabase = Awaited<ReturnType<typeof getServerSupabase>>;

/** Untyped table accessor for tables/columns outside the generated Database types. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function anyFrom(supabase: ServerSupabase, name: string): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase as unknown as { from: (t: string) => any }).from(name);
}

/** Returns ISO bounds for "now minus N days" up to now. */
function lastDaysIso(days: number) {
  const end = new Date();
  const start = new Date(end.getTime() - days * 86400000);
  return { start: start.toISOString(), end: end.toISOString() };
}

/** Returns ISO bounds from the start of today (Riyadh) for the next N days. */
function nextDaysIso(days: number) {
  const { start } = dayBoundsUtc(todayInRiyadh());
  const end = new Date(new Date(start).getTime() + days * 86400000).toISOString();
  return { start, end };
}

export interface AdminOverview {
  classesToday: number;
  fillRateToday: number | null;
  revenueToday: number;
  revenueWeek: number;
  membersCount: number;
  upcomingClasses: number;
}

export async function getAdminOverview(): Promise<AdminOverview> {
  const supabase = await getServerSupabase();
  const today = dayBoundsUtc(todayInRiyadh());
  const week = lastDaysIso(7);
  const upcoming = nextDaysIso(7);

  const { data: classes } = await supabase
    .from("class_instances")
    .select("id,capacity")
    .gte("starts_at", today.start)
    .lt("starts_at", today.end)
    .eq("status", "scheduled");
  const todayClasses = classes ?? [];

  const { data: avail } = await supabase
    .from("class_instance_availability")
    .select("class_instance_id,confirmed_count")
    .in("class_instance_id", todayClasses.map((c) => c.id));
  const confirmedById = new Map((avail ?? []).map((a) => [a.class_instance_id, a.confirmed_count ?? 0]));

  const booked = todayClasses.reduce((s, c) => s + (confirmedById.get(c.id) ?? 0), 0);
  const cap = todayClasses.reduce((s, c) => s + c.capacity, 0);

  const [{ data: payToday }, { data: payWeek }, { count: membersCount }, { count: upcomingClasses }] =
    await Promise.all([
      supabase.from("payments").select("amount_sar").eq("status", "paid").gte("created_at", today.start),
      supabase.from("payments").select("amount_sar").eq("status", "paid").gte("created_at", week.start),
      supabase.from("members").select("id", { count: "exact", head: true }),
      supabase
        .from("class_instances")
        .select("id", { count: "exact", head: true })
        .gte("starts_at", upcoming.start)
        .lt("starts_at", upcoming.end)
        .eq("status", "scheduled"),
    ]);

  const sum = (rows: { amount_sar: number }[] | null) => (rows ?? []).reduce((s, p) => s + Number(p.amount_sar), 0);

  return {
    classesToday: todayClasses.length,
    fillRateToday: cap ? Math.round((booked / cap) * 100) : null,
    revenueToday: sum(payToday),
    revenueWeek: sum(payWeek),
    membersCount: membersCount ?? 0,
    upcomingClasses: upcomingClasses ?? 0,
  };
}

export interface ScheduleRow {
  id: string;
  starts_at: string;
  ends_at: string;
  name_ar: string;
  name_en: string;
  instructor_ar: string | null;
  instructor_en: string | null;
  level: "level_1" | "level_1_5" | "level_2";
  status: "scheduled" | "cancelled";
  capacity: number;
  confirmed: number;
  waitlist: number;
}

export async function getAdminSchedule(days = 14): Promise<ScheduleRow[]> {
  const supabase = await getServerSupabase();
  const { start, end } = nextDaysIso(days);
  const { data: rows } = await supabase
    .from("class_instances")
    .select("id,starts_at,ends_at,level,capacity,status,class_types(name_ar,name_en),instructors(name_ar,name_en)")
    .gte("starts_at", start)
    .lt("starts_at", end)
    .order("starts_at", { ascending: true });
  const classes = rows ?? [];
  if (classes.length === 0) return [];

  const { data: avail } = await supabase
    .from("class_instance_availability")
    .select("class_instance_id,confirmed_count,waitlist_count")
    .in("class_instance_id", classes.map((c) => c.id));
  const am = new Map((avail ?? []).map((a) => [a.class_instance_id, a]));

  return classes.map((c) => {
    const a = am.get(c.id);
    return {
      id: c.id,
      starts_at: c.starts_at,
      ends_at: c.ends_at,
      name_ar: c.class_types?.name_ar ?? "",
      name_en: c.class_types?.name_en ?? "",
      instructor_ar: c.instructors?.name_ar ?? null,
      instructor_en: c.instructors?.name_en ?? null,
      level: c.level,
      status: c.status,
      capacity: c.capacity,
      confirmed: a?.confirmed_count ?? 0,
      waitlist: a?.waitlist_count ?? 0,
    };
  });
}

export interface RosterEntry {
  booking_id: string;
  status: "confirmed" | "waitlisted" | "cancelled" | "attended" | "no_show" | "late_cancelled";
  waitlist_position: number | null;
  member_id: string;
  full_name: string;
  phone: string | null;
  level: "level_1" | "level_1_5" | "level_2";
}

export interface ClassRoster {
  id: string;
  starts_at: string;
  ends_at: string;
  name_ar: string;
  name_en: string;
  instructor_ar: string | null;
  instructor_en: string | null;
  level: "level_1" | "level_1_5" | "level_2";
  status: "scheduled" | "cancelled";
  capacity: number;
  confirmed: RosterEntry[];
  waitlisted: RosterEntry[];
}

export async function getClassRoster(id: string): Promise<ClassRoster | null> {
  const supabase = await getServerSupabase();
  const { data: c } = await supabase
    .from("class_instances")
    .select("id,starts_at,ends_at,level,capacity,status,class_types(name_ar,name_en),instructors(name_ar,name_en)")
    .eq("id", id)
    .maybeSingle();
  if (!c) return null;

  const { data: rows } = await supabase
    .from("bookings")
    .select("id,status,waitlist_position,members(id,full_name,phone,level)")
    .eq("class_instance_id", id)
    .order("waitlist_position", { ascending: true });

  const entries: RosterEntry[] = (rows ?? []).map((b) => ({
    booking_id: b.id,
    status: b.status,
    waitlist_position: b.waitlist_position,
    member_id: b.members?.id ?? "",
    full_name: b.members?.full_name ?? "—",
    phone: b.members?.phone ?? null,
    level: b.members?.level ?? "level_1",
  }));

  return {
    id: c.id,
    starts_at: c.starts_at,
    ends_at: c.ends_at,
    name_ar: c.class_types?.name_ar ?? "",
    name_en: c.class_types?.name_en ?? "",
    instructor_ar: c.instructors?.name_ar ?? null,
    instructor_en: c.instructors?.name_en ?? null,
    level: c.level,
    status: c.status,
    capacity: c.capacity,
    confirmed: entries.filter((e) => e.status === "confirmed" || e.status === "attended" || e.status === "no_show"),
    waitlisted: entries.filter((e) => e.status === "waitlisted"),
  };
}

export interface MemberRow {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  level: "level_1" | "level_1_5" | "level_2";
  created_at: string;
}

export async function getMembersDirectory(search?: string): Promise<MemberRow[]> {
  const supabase = await getServerSupabase();
  let q = supabase
    .from("members")
    .select("id,full_name,phone,email,level,created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (search && search.trim()) {
    const s = search.trim().replace(/[%,()]/g, " ");
    q = q.or(`full_name.ilike.%${s}%,phone.ilike.%${s}%,email.ilike.%${s}%`);
  }
  const { data } = await q;
  return (data ?? []) as MemberRow[];
}

export interface MemberNote {
  id: string;
  body: string;
  created_at: string;
}

export interface MemberDetail {
  member: MemberRow & { locale: string | null };
  leadStatus: string | null;
  source: string | null;
  recommendedClass: string | null;
  balance: number;
  membershipPlanAr: string | null;
  membershipPlanEn: string | null;
  membershipEnd: string | null;
  notes: MemberNote[];
  bookings: {
    id: string;
    status: string;
    starts_at: string;
    ends_at: string;
    name_ar: string;
    name_en: string;
  }[];
}

/** member_notes is a new table not yet in the generated Database types. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function notesTable(supabase: ServerSupabase): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase as unknown as { from: (t: string) => any }).from("member_notes");
}

export async function getMemberDetail(id: string): Promise<MemberDetail | null> {
  const supabase = await getServerSupabase();
  const { data: member } = await anyFrom(supabase, "members")
    .select("id,full_name,phone,email,level,locale,created_at,lead_status,source,recommended_class")
    .eq("id", id)
    .maybeSingle();
  if (!member) return null;

  const [{ data: balance }, { data: membership }, { data: bookings }, { data: notes }] = await Promise.all([
    rpc<number>(supabase, "elan_credit_balance", { p_member: id }),
    supabase
      .from("member_memberships")
      .select("current_period_end,membership_plans(name_ar,name_en)")
      .eq("member_id", id)
      .eq("status", "active")
      .order("current_period_end", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("bookings")
      .select("id,status,created_at,class_instances(starts_at,ends_at,class_types(name_ar,name_en))")
      .eq("member_id", id)
      .order("created_at", { ascending: false })
      .limit(20),
    notesTable(supabase)
      .select("id,body,created_at")
      .eq("member_id", id)
      .order("created_at", { ascending: false }),
  ]);

  return {
    member: member as MemberRow & { locale: string | null },
    leadStatus: (member as { lead_status: string | null }).lead_status ?? null,
    source: (member as { source: string | null }).source ?? null,
    recommendedClass: (member as { recommended_class: string | null }).recommended_class ?? null,
    balance: balance ?? 0,
    membershipPlanAr: membership?.membership_plans?.name_ar ?? null,
    membershipPlanEn: membership?.membership_plans?.name_en ?? null,
    membershipEnd: membership?.current_period_end ?? null,
    notes: (notes ?? []) as MemberNote[],
    bookings: (bookings ?? []).map((b) => ({
      id: b.id,
      status: b.status,
      starts_at: b.class_instances?.starts_at ?? "",
      ends_at: b.class_instances?.ends_at ?? "",
      name_ar: b.class_instances?.class_types?.name_ar ?? "",
      name_en: b.class_instances?.class_types?.name_en ?? "",
    })),
  };
}

export interface AdminReports {
  // Cash sales (from payments, last 30 days) — halalas
  grossHalalas: number;
  netHalalas: number;
  vatHalalas: number;
  discountsHalalas: number;
  paymentsCount: number;
  revenueByType: Record<string, number>; // gross halalas per payment type
  // Booking-derived value (last 30 days, by list value) — halalas
  compValueHalalas: number;
  packageUtilHalalas: number;
  unlimitedUtilHalalas: number;
  noShowLostHalalas: number;
  cancellationValueHalalas: number;
  bookingsByStatus: Record<string, number>;
}

export async function getReports(): Promise<AdminReports> {
  const supabase = await getServerSupabase();
  const { start } = lastDaysIso(30);

  const [{ data: pays }, { data: books }] = await Promise.all([
    anyFrom(supabase, "payments")
      .select("type,amount_sar,gross_halalas,net_halalas,vat_amount_halalas,discount_amount_halalas")
      .eq("status", "paid")
      .gte("created_at", start),
    anyFrom(supabase, "bookings").select("status,pricing_source,list_value_halalas").gte("created_at", start),
  ]);

  let grossHalalas = 0,
    netHalalas = 0,
    vatHalalas = 0,
    discountsHalalas = 0;
  const revenueByType: Record<string, number> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const p of (pays ?? []) as any[]) {
    const g = p.gross_halalas ?? Math.round(Number(p.amount_sar || 0) * 100);
    grossHalalas += g;
    netHalalas += p.net_halalas ?? 0;
    vatHalalas += p.vat_amount_halalas ?? 0;
    discountsHalalas += p.discount_amount_halalas ?? 0;
    revenueByType[p.type] = (revenueByType[p.type] ?? 0) + g;
  }

  let compValueHalalas = 0,
    packageUtilHalalas = 0,
    unlimitedUtilHalalas = 0,
    noShowLostHalalas = 0,
    cancellationValueHalalas = 0;
  const bookingsByStatus: Record<string, number> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const b of (books ?? []) as any[]) {
    const lv = b.list_value_halalas ?? 0;
    bookingsByStatus[b.status] = (bookingsByStatus[b.status] ?? 0) + 1;
    if (b.pricing_source === "complimentary") compValueHalalas += lv;
    if (b.pricing_source === "package_credit") packageUtilHalalas += lv;
    if (b.pricing_source === "unlimited_membership") unlimitedUtilHalalas += lv;
    if (b.status === "no_show") noShowLostHalalas += lv;
    if (b.status === "cancelled" || b.status === "late_cancelled") cancellationValueHalalas += lv;
  }

  return {
    grossHalalas,
    netHalalas,
    vatHalalas,
    discountsHalalas,
    paymentsCount: (pays ?? []).length,
    revenueByType,
    compValueHalalas,
    packageUtilHalalas,
    unlimitedUtilHalalas,
    noShowLostHalalas,
    cancellationValueHalalas,
    bookingsByStatus,
  };
}

export interface MemberFinancials {
  totalPaidHalalas: number;
  totalDiscountHalalas: number;
  attendedValueHalalas: number;
  remainingPackageHalalas: number;
  noShowValueHalalas: number;
  compValueHalalas: number;
}

export async function getMemberFinancials(memberId: string): Promise<MemberFinancials> {
  const supabase = await getServerSupabase();
  const [{ data: pays }, { data: books }, { data: bal }] = await Promise.all([
    anyFrom(supabase, "payments").select("gross_halalas,amount_sar,discount_amount_halalas").eq("member_id", memberId).eq("status", "paid"),
    anyFrom(supabase, "bookings").select("status,pricing_source,list_value_halalas").eq("member_id", memberId),
    rpc<number>(supabase, "elan_credit_balance", { p_member: memberId }),
  ]);
  let totalPaidHalalas = 0,
    totalDiscountHalalas = 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const p of (pays ?? []) as any[]) {
    totalPaidHalalas += p.gross_halalas ?? Math.round(Number(p.amount_sar || 0) * 100);
    totalDiscountHalalas += p.discount_amount_halalas ?? 0;
  }
  let attendedValueHalalas = 0,
    noShowValueHalalas = 0,
    compValueHalalas = 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const b of (books ?? []) as any[]) {
    const lv = b.list_value_halalas ?? 0;
    if (b.status === "attended") attendedValueHalalas += lv;
    if (b.status === "no_show") noShowValueHalalas += lv;
    if (b.pricing_source === "complimentary") compValueHalalas += lv;
  }
  return {
    totalPaidHalalas,
    totalDiscountHalalas,
    attendedValueHalalas,
    remainingPackageHalalas: (bal ?? 0) * grossFromNet(DEFAULT_CLASS_NET_HALALAS),
    noShowValueHalalas,
    compValueHalalas,
  };
}

export interface PromoCodeRow {
  id: string;
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  starts_at: string | null;
  expires_at: string | null;
  max_redemptions: number | null;
  per_member_limit: number | null;
  active: boolean;
  redemptions: number;
}

export async function getPromoCodes(): Promise<PromoCodeRow[]> {
  const supabase = await getServerSupabase();
  const { data } = await anyFrom(supabase, "promo_codes").select("*").order("created_at", { ascending: false });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const list = (data ?? []) as any[];
  const ids = list.map((p) => p.id);
  const counts = new Map<string, number>();
  if (ids.length) {
    const { data: reds } = await anyFrom(supabase, "promo_redemptions").select("promo_code_id").in("promo_code_id", ids);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const r of (reds ?? []) as any[]) counts.set(r.promo_code_id, (counts.get(r.promo_code_id) ?? 0) + 1);
  }
  return list.map((p) => ({
    id: p.id,
    code: p.code,
    discount_type: p.discount_type,
    discount_value: p.discount_value,
    starts_at: p.starts_at,
    expires_at: p.expires_at,
    max_redemptions: p.max_redemptions,
    per_member_limit: p.per_member_limit,
    active: p.active,
    redemptions: counts.get(p.id) ?? 0,
  }));
}

export interface DashboardData {
  bookingsToday: number;
  fillRate: number | null;
  newMembersWeek: number;
  revenueMonth: number;
  today: {
    id: string;
    starts_at: string;
    name_ar: string;
    name_en: string;
    instructor_ar: string | null;
    instructor_en: string | null;
    booked: number;
    capacity: number;
    open: boolean;
  }[];
  waitlist: { name: string; class_ar: string; class_en: string; starts_at: string }[];
  topClass: { name_en: string; pct: number } | null;
  newBookingsToday: number;
}

export async function getDashboard(): Promise<DashboardData> {
  const supabase = await getServerSupabase();
  const today = dayBoundsUtc(todayInRiyadh());
  const weekAgoIso = new Date(Date.now() - 7 * 86400000).toISOString();
  const d = new Date();
  const monthStartIso = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString();

  const { data: classes } = await supabase
    .from("class_instances")
    .select("id,starts_at,capacity,class_types(name_ar,name_en),instructors(name_ar,name_en)")
    .gte("starts_at", today.start)
    .lt("starts_at", today.end)
    .eq("status", "scheduled")
    .order("starts_at", { ascending: true });
  const cls = classes ?? [];
  const ids = cls.map((c) => c.id);

  const [{ data: avail }, { data: wl }, { count: newMembersWeek }, { data: pays }, { count: newBookingsToday }] = await Promise.all([
    ids.length
      ? supabase.from("class_instance_availability").select("class_instance_id,confirmed_count").in("class_instance_id", ids)
      : Promise.resolve({ data: [] as { class_instance_id: string; confirmed_count: number | null }[] }),
    ids.length
      ? supabase
          .from("bookings")
          .select("id,members(full_name),class_instances(starts_at,class_types(name_ar,name_en))")
          .eq("status", "waitlisted")
          .in("class_instance_id", ids)
      : Promise.resolve({ data: [] as { members: { full_name: string } | null; class_instances: { starts_at: string; class_types: { name_ar: string; name_en: string } | null } | null }[] }),
    supabase.from("members").select("id", { count: "exact", head: true }).gte("created_at", weekAgoIso),
    supabase.from("payments").select("amount_sar").eq("status", "paid").gte("created_at", monthStartIso),
    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("status", "confirmed")
      .gte("created_at", today.start)
      .lt("created_at", today.end),
  ]);

  const conf = new Map((avail ?? []).map((a) => [a.class_instance_id, a.confirmed_count ?? 0]));
  const booked = cls.reduce((s, c) => s + (conf.get(c.id) ?? 0), 0);
  const cap = cls.reduce((s, c) => s + c.capacity, 0);

  let topClass: { name_en: string; pct: number } | null = null;
  for (const c of cls) {
    const pct = c.capacity ? Math.round(((conf.get(c.id) ?? 0) / c.capacity) * 100) : 0;
    if (!topClass || pct > topClass.pct) topClass = { name_en: c.class_types?.name_en ?? "", pct };
  }

  return {
    bookingsToday: booked,
    fillRate: cap ? Math.round((booked / cap) * 100) : null,
    newMembersWeek: newMembersWeek ?? 0,
    revenueMonth: (pays ?? []).reduce((s, p) => s + Number(p.amount_sar), 0),
    today: cls.map((c) => {
      const b = conf.get(c.id) ?? 0;
      return {
        id: c.id,
        starts_at: c.starts_at,
        name_ar: c.class_types?.name_ar ?? "",
        name_en: c.class_types?.name_en ?? "",
        instructor_ar: c.instructors?.name_ar ?? null,
        instructor_en: c.instructors?.name_en ?? null,
        booked: b,
        capacity: c.capacity,
        open: b < c.capacity,
      };
    }),
    waitlist: (wl ?? []).map((w) => ({
      name: w.members?.full_name ?? "—",
      class_ar: w.class_instances?.class_types?.name_ar ?? "",
      class_en: w.class_instances?.class_types?.name_en ?? "",
      starts_at: w.class_instances?.starts_at ?? "",
    })),
    topClass,
    newBookingsToday: newBookingsToday ?? 0,
  };
}

export interface TrainerRow {
  id: string;
  name_ar: string;
  name_en: string;
  bio_ar: string | null;
  bio_en: string | null;
  classesThisWeek: number;
}

export async function getInstructors(): Promise<TrainerRow[]> {
  const supabase = await getServerSupabase();
  const week = nextDaysIso(7);
  const [{ data: trainers }, { data: cls }] = await Promise.all([
    supabase.from("instructors").select("id,name_ar,name_en,bio_ar,bio_en").eq("active", true).order("name_en"),
    supabase.from("class_instances").select("instructor_id").gte("starts_at", week.start).lt("starts_at", week.end).eq("status", "scheduled"),
  ]);
  const counts = new Map<string, number>();
  for (const c of cls ?? []) if (c.instructor_id) counts.set(c.instructor_id, (counts.get(c.instructor_id) ?? 0) + 1);
  return (trainers ?? []).map((t) => ({
    id: t.id,
    name_ar: t.name_ar,
    name_en: t.name_en,
    bio_ar: t.bio_ar,
    bio_en: t.bio_en,
    classesThisWeek: counts.get(t.id) ?? 0,
  }));
}

export interface ScheduleFormOptions {
  classTypes: { id: string; name_ar: string; name_en: string }[];
  instructors: { id: string; name_ar: string; name_en: string }[];
}

export async function getScheduleFormOptions(): Promise<ScheduleFormOptions> {
  const supabase = await getServerSupabase();
  const [{ data: types }, { data: instructors }] = await Promise.all([
    supabase.from("class_types").select("id,name_ar,name_en").order("name_en"),
    supabase.from("instructors").select("id,name_ar,name_en").eq("active", true).order("name_en"),
  ]);
  return { classTypes: types ?? [], instructors: instructors ?? [] };
}

export interface MemberListRow {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  lead_status: string | null;
  source: string | null;
  credits: number;
  plan_ar: string | null;
  plan_en: string | null;
  period_end: string | null;
  last_seen: string | null;
  created_at: string;
}

export interface MembersKpis {
  total: number;
  active: number;
  expiring: number;
  trials: number;
  newWeek: number;
}

export interface MembersOverview {
  kpis: MembersKpis;
  rows: MemberListRow[];
}

/** Real members directory + KPIs for the admin console (gated by RLS is_admin). */
export async function getMembersOverview(search?: string, status?: string): Promise<MembersOverview> {
  const supabase = await getServerSupabase();
  const now = Date.now();
  const weekAgoIso = new Date(now - 7 * 86400000).toISOString();
  const nowIso = new Date(now).toISOString();
  const soonIso = new Date(now + 7 * 86400000).toISOString();

  // KPIs across ALL members (independent of the filtered list).
  const [{ count: total }, { count: newWeek }, { count: trials }, { count: active }, { count: expiring }] =
    await Promise.all([
      supabase.from("members").select("id", { count: "exact", head: true }),
      supabase.from("members").select("id", { count: "exact", head: true }).gte("created_at", weekAgoIso),
      supabase.from("members").select("id", { count: "exact", head: true }).eq("lead_status", "trial"),
      supabase.from("member_memberships").select("id", { count: "exact", head: true }).eq("status", "active"),
      supabase
        .from("member_memberships")
        .select("id", { count: "exact", head: true })
        .eq("status", "active")
        .gte("current_period_end", nowIso)
        .lte("current_period_end", soonIso),
    ]);

  // Filtered list.
  let q = supabase
    .from("members")
    .select("id,full_name,email,phone,lead_status,source,created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (status && status.trim()) q = q.eq("lead_status", status.trim());
  if (search && search.trim()) {
    const s = search.trim().replace(/[%,()]/g, " ");
    q = q.or(`full_name.ilike.%${s}%,phone.ilike.%${s}%,email.ilike.%${s}%`);
  }
  const { data: members } = await q;
  const list = members ?? [];
  const ids = list.map((m) => m.id);

  const [memberships, lastSeenRows, balances] = await Promise.all([
    ids.length
      ? supabase
          .from("member_memberships")
          .select("member_id,current_period_end,membership_plans(name_ar,name_en)")
          .eq("status", "active")
          .in("member_id", ids)
      : Promise.resolve({ data: [] as { member_id: string; current_period_end: string | null; membership_plans: { name_ar: string; name_en: string } | { name_ar: string; name_en: string }[] | null }[] }),
    ids.length
      ? supabase.from("bookings").select("member_id,created_at").in("member_id", ids)
      : Promise.resolve({ data: [] as { member_id: string; created_at: string }[] }),
    Promise.all(list.map((m) => rpc<number>(supabase, "elan_credit_balance", { p_member: m.id }).then((r) => r.data ?? 0))),
  ]);

  const mmById = new Map<string, { current_period_end: string | null; plan_ar: string | null; plan_en: string | null }>();
  for (const mm of memberships.data ?? []) {
    if (mmById.has(mm.member_id)) continue;
    const planRaw = mm.membership_plans;
    const plan = Array.isArray(planRaw) ? planRaw[0] : planRaw;
    mmById.set(mm.member_id, { current_period_end: mm.current_period_end, plan_ar: plan?.name_ar ?? null, plan_en: plan?.name_en ?? null });
  }
  const lastById = new Map<string, string>();
  for (const b of lastSeenRows.data ?? []) {
    const prev = lastById.get(b.member_id);
    if (!prev || new Date(b.created_at) > new Date(prev)) lastById.set(b.member_id, b.created_at);
  }

  const rows: MemberListRow[] = list.map((m, i) => {
    const mm = mmById.get(m.id);
    return {
      id: m.id,
      full_name: m.full_name,
      email: m.email,
      phone: m.phone,
      lead_status: m.lead_status,
      source: m.source,
      credits: balances[i] ?? 0,
      plan_ar: mm?.plan_ar ?? null,
      plan_en: mm?.plan_en ?? null,
      period_end: mm?.current_period_end ?? null,
      last_seen: lastById.get(m.id) ?? null,
      created_at: m.created_at,
    };
  });

  return {
    kpis: {
      total: total ?? 0,
      active: active ?? 0,
      expiring: expiring ?? 0,
      trials: trials ?? 0,
      newWeek: newWeek ?? 0,
    },
    rows,
  };
}

export interface MemberExportRow {
  full_name: string;
  phone: string | null;
  email: string | null;
  lead_status: string | null;
  source: string | null;
  membership_status: string;
  credits: number;
  created_at: string;
}

export async function getMembersForExport(): Promise<MemberExportRow[]> {
  const supabase = await getServerSupabase();
  const { data: members } = await supabase
    .from("members")
    .select("id,full_name,phone,email,lead_status,source,created_at")
    .order("created_at", { ascending: false });
  const list = members ?? [];
  const ids = list.map((m) => m.id);
  const [memberships, balances] = await Promise.all([
    ids.length
      ? supabase.from("member_memberships").select("member_id,status,current_period_end").in("member_id", ids)
      : Promise.resolve({ data: [] as { member_id: string; status: string; current_period_end: string | null }[] }),
    Promise.all(list.map((m) => rpc<number>(supabase, "elan_credit_balance", { p_member: m.id }).then((r) => r.data ?? 0))),
  ]);
  const now = Date.now();
  const byMember = new Map<string, { active: boolean; any: boolean }>();
  for (const mm of memberships.data ?? []) {
    const cur = byMember.get(mm.member_id) ?? { active: false, any: false };
    cur.any = true;
    if (mm.status === "active" && mm.current_period_end && new Date(mm.current_period_end).getTime() > now) cur.active = true;
    byMember.set(mm.member_id, cur);
  }
  return list.map((m, i) => {
    const ms = byMember.get(m.id);
    return {
      full_name: m.full_name,
      phone: m.phone,
      email: m.email,
      lead_status: m.lead_status,
      source: m.source,
      membership_status: ms?.active ? "active" : ms?.any ? "expired" : "none",
      credits: balances[i] ?? 0,
      created_at: m.created_at,
    };
  });
}

export interface MemberTask {
  id: string;
  title: string;
  due_date: string | null;
  status: string;
  member_id?: string;
  member_name?: string;
}

/** member_tasks is a new table not yet in the generated Database types. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function tasksTable(supabase: ServerSupabase): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase as unknown as { from: (t: string) => any }).from("member_tasks");
}

export async function getMemberTasks(memberId: string): Promise<MemberTask[]> {
  const supabase = await getServerSupabase();
  const { data } = await tasksTable(supabase)
    .select("id,title,due_date,status")
    .eq("member_id", memberId)
    .order("status", { ascending: true })
    .order("due_date", { ascending: true, nullsFirst: false });
  return (data ?? []) as MemberTask[];
}

export async function getOverdueTasks(): Promise<MemberTask[]> {
  const supabase = await getServerSupabase();
  const today = todayInRiyadh();
  const { data } = await tasksTable(supabase)
    .select("id,title,due_date,status,member_id,members(full_name)")
    .eq("status", "open")
    .not("due_date", "is", null)
    .lte("due_date", today)
    .order("due_date", { ascending: true })
    .limit(20);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data ?? []) as any[]).map((t) => ({
    id: t.id,
    title: t.title,
    due_date: t.due_date,
    status: t.status,
    member_id: t.member_id,
    member_name: t.members?.full_name ?? "—",
  }));
}

```

### src/lib/classColor.ts
```tsx
/** Maps a class name to a distinguishing accent colour (point #8).
 *  Keyword-based since class types are dynamic; falls back to gold. */
export function classAccent(name: string): string {
  const n = (name || "").toLowerCase();
  if (n.includes("reformer")) return "#B89B72"; // gold
  if (n.includes("mat")) return "#A9B39B"; // sage
  if (n.includes("private")) return "#B78A7A"; // clay
  if (n.includes("stretch")) return "#8DA8B8"; // blue
  if (n.includes("sculpt") || n.includes("tone")) return "#C78B73"; // rose-clay
  return "#B89B72";
}

/** Soft two-stop gradient for image-placeholder tiles. */
export function classGradient(name: string): string {
  const c = classAccent(name);
  return `linear-gradient(135deg, ${c}, ${c}99)`;
}

/** Optional Supabase Storage public base (e.g.
 *  https://<ref>.supabase.co/storage/v1/object/public/media). When set,
 *  images resolve to real photos there (<name>.jpg); otherwise they fall
 *  back to the bundled photos in /public/assets (<name>.jpg) — so photos
 *  can be uploaded/swapped from the Supabase dashboard with no redeploy. */
const MEDIA_BASE = process.env.NEXT_PUBLIC_ELAN_MEDIA_BASE?.replace(/\/$/, "");

function asset(name: string): string {
  return MEDIA_BASE ? `${MEDIA_BASE}/${name}.jpg` : `/assets/${name}.jpg`;
}

/** Photographic image per class type.
 *  TODO(media): "Power Reformer" and "Reformer Flow" currently resolve to two
 *  distinct keys (power-reformer / reformer-flow), but "Sculpt"/"Tone" reuses
 *  the power-reformer photo. Add a dedicated sculpt/tone asset when available
 *  so each class type has its own image. Do not invent assets meanwhile. */
export function classImage(name: string): string {
  const n = (name || "").toLowerCase();
  if (n.includes("power")) return asset("power-reformer");
  if (n.includes("reformer")) return asset("reformer-flow");
  if (n.includes("mat")) return asset("mat-pilates");
  if (n.includes("stretch")) return asset("stretching");
  if (n.includes("sculpt") || n.includes("tone")) return asset("power-reformer");
  return asset("reformer-flow");
}

export const HERO_IMAGE = asset("studio-hero");
export const INSTRUCTOR_IMAGE = asset("instructor-lina");

```

### src/lib/cta.ts
```tsx
/** Pure mapping from server state to the class-detail sticky button state.
 * Kept side-effect-free so it can be unit-tested without a database. */
import type { DisplayStatus } from "./queries";

export type Eligibility = "ELIGIBLE" | "LEVEL_TOO_LOW" | "NO_CREDITS" | "ALREADY_BOOKED" | "BOOKING_CLOSED";
export type CtaKey = "book" | "joinWaitlist" | "cancel" | "leaveWaitlist" | "closed" | "levelTooLow" | "noCredits" | "fullyBooked";

export interface CtaState {
  key: CtaKey;
  variant: "primary" | "muted" | "disabled";
  disabled: boolean;
  isCancel: boolean;
}

export function ctaState(input: {
  myStatus: "confirmed" | "waitlisted" | null;
  eligibility: Eligibility;
  displayStatus: DisplayStatus;
}): CtaState {
  const { myStatus, eligibility, displayStatus } = input;
  if (myStatus === "confirmed") return { key: "cancel", variant: "muted", disabled: false, isCancel: true };
  if (myStatus === "waitlisted") return { key: "leaveWaitlist", variant: "muted", disabled: false, isCancel: true };
  if (eligibility === "BOOKING_CLOSED") return { key: "closed", variant: "disabled", disabled: true, isCancel: false };
  if (eligibility === "LEVEL_TOO_LOW") return { key: "levelTooLow", variant: "disabled", disabled: true, isCancel: false };
  if (eligibility === "NO_CREDITS") return { key: "noCredits", variant: "disabled", disabled: true, isCancel: false };
  if (displayStatus === "waitlist_open") return { key: "joinWaitlist", variant: "primary", disabled: false, isCancel: false };
  if (displayStatus === "fully_booked") return { key: "fullyBooked", variant: "disabled", disabled: true, isCancel: false };
  return { key: "book", variant: "primary", disabled: false, isCancel: false };
}

/** Level progression rank: Level 1 < 1.5 < 2. Mirrors the SQL _elan_level_rank. */
export function levelRank(level: "level_1" | "level_1_5" | "level_2"): number {
  return level === "level_1" ? 1 : level === "level_1_5" ? 2 : 3;
}

```

### src/lib/demo.ts
```tsx
/** Demo mode: when on, the app runs entirely on mock data and skips all
 *  Supabase calls (auth + queries + actions). Default ON; set
 *  NEXT_PUBLIC_ELAN_DEMO=false once a real backend is wired. */
export const DEMO = process.env.NEXT_PUBLIC_ELAN_DEMO !== "false";

```

### src/lib/format.ts
```tsx
import type { Locale } from "./i18n";

const TZ = "Asia/Riyadh";

export function dayBoundsUtc(date: string) {
  const start = new Date(`${date}T00:00:00+03:00`);
  return { start: start.toISOString(), end: new Date(start.getTime() + 86400000).toISOString() };
}

export function todayInRiyadh(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());
}

export function upcomingDays(count: number): string[] {
  const base = new Date(`${todayInRiyadh()}T00:00:00+03:00`);
  return Array.from({ length: count }, (_, i) =>
    new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date(base.getTime() + i * 86400000)),
  );
}

export function fmtTime(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", {
    timeZone: TZ, hour: "numeric", minute: "2-digit", hour12: true,
  }).format(new Date(iso));
}

export function fmtDayNum(date: string): string {
  return String(new Date(`${date}T00:00:00+03:00`).getUTCDate());
}

export function fmtWeekday(date: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", { timeZone: TZ, weekday: "short" })
    .format(new Date(`${date}T00:00:00+03:00`));
}

export function fmtLongDateTime(startIso: string, endIso: string, locale: Locale): string {
  const day = new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", {
    timeZone: TZ, weekday: "long", day: "numeric", month: "long",
  }).format(new Date(startIso));
  return `${day}، ${fmtTime(startIso, locale)} – ${fmtTime(endIso, locale)}`;
}

export function fmtDayHeading(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", {
    timeZone: TZ, weekday: "long", day: "numeric", month: "long",
  }).format(new Date(iso));
}

export function levelLabel(level: "level_1" | "level_1_5" | "level_2", locale: Locale): string {
  if (locale === "ar") return level === "level_1" ? "المستوى 1" : level === "level_1_5" ? "المستوى 1.5" : "المستوى 2";
  return level === "level_1" ? "Level 1" : level === "level_1_5" ? "Level 1.5" : "Level 2";
}

```

### src/lib/i18n.ts
```tsx
export type Locale = "ar" | "en";
export const DEFAULT_LOCALE: Locale = "ar";
export const LOCALE_COOKIE = "elan_locale";

export function dirFor(locale: Locale): "rtl" | "ltr" {
  return locale === "ar" ? "rtl" : "ltr";
}

/** Translation dictionary. All copy lives here — none hardcoded in components. */
export const dict = {
  ar: {
    appName: "ÉLAN",
    tagline: "استوديو بيلاتس للسيدات · الرياض",
    tabs: { home: "الرئيسية", timetable: "الجدول", bookings: "حجوزاتي", memberships: "العضويات", profile: "حسابي" },
    home: { greeting: "مساء الخير،", nextClass: "حصتك القادمة", viewDetails: "عرض التفاصيل", none: "لا توجد حصة قادمة", balance: "رصيد الحصص", attended: "حصص تم حضورها", discover: "اكتشفي الحصص", all: "الكل" },
    confirmation: { title: "تم تأكيد حجزك", subtitle: "أرسلنا لكِ تذكيرًا قبل الموعد بساعة", date: "التاريخ", time: "الوقت", place: "المكان", with: "مع المدربة", addCalendar: "إضافة إلى التقويم", viewBookings: "عرض حجوزاتي", studio: "الرياض" },
    common: { loading: "جارٍ التحميل…", error: "حدث خطأ", today: "اليوم", sar: "ر.س", buy: "شراء", cancel: "إلغاء", minutes: "دقيقة", back: "رجوع" },
    timetable: { title: "الجدول", filters: "تصفية", empty: "لا توجد حصص في هذا اليوم." },
    status: { available: "مقاعد متاحة", waitlist_open: "قائمة الانتظار متاحة", fully_booked: "مكتمل", booking_closed: "الحجز مغلق", booked: "محجوز", waitlisted: "في قائمة الانتظار" },
    detail: { time: "الوقت", instructor: "المدربة", level: "المستوى", description: "الوصف", waitlistBanner: "{n}/{cap} في قائمة الانتظار" },
    cta: { book: "احجزي", joinWaitlist: "انضمي لقائمة الانتظار", cancel: "إلغاء الحجز", leaveWaitlist: "مغادرة قائمة الانتظار", closed: "الحجز مغلق", levelTooLow: "المستوى غير مناسب", noCredits: "لا يوجد رصيد" },
    bookings: { title: "حجوزاتي", upcoming: "القادمة", past: "السابقة", empty: "لا توجد حجوزات." },
    bstatus: { confirmed: "مؤكد", waitlisted: "قائمة الانتظار", attended: "تم الحضور", cancelled: "ملغي", late_cancelled: "إلغاء متأخر", no_show: "لم تحضر" },
    memberships: { title: "العضويات", noMembership: "لا توجد عضوية", noCredits: "لا يوجد رصيد حصص", plans: "باقات العضوية", packs: "باقات الحصص", credits: "{n} حصة", validDays: "صالحة {n} يوم", bought: "تم الشراء بنجاح" },
    profile: { title: "حسابي", attended: "{n} حصة تم حضورها", language: "اللغة", logout: "تسجيل الخروج", admin: "لوحة الإدارة", version: "الإصدار", active: "فعّالة", renews: "تتجدد في {d}", personalData: "بياناتي الشخصية", payment: "طريقة الدفع", notifications: "الإشعارات" },
    login: { title: "تسجيل الدخول", email: "البريد الإلكتروني", password: "كلمة المرور", submit: "دخول", demo: "دخول كعضوة تجريبية", demoAdmin: "دخول كمسؤولة", hint: "للتجربة: noor@elan.demo / elan1234", error: "تعذّر تسجيل الدخول، يرجى المحاولة مرة أخرى." },
    toast: {
      booked: "تم تأكيد حجزكِ",
      bookFailed: "تعذّر إتمام الحجز، يرجى المحاولة مرة أخرى.",
      cancelled: "تم إلغاء الحجز",
      cancelFailed: "تعذّر إلغاء الحجز، يرجى المحاولة مرة أخرى.",
      purchased: "تم الشراء بنجاح",
      purchaseFailed: "تعذّر إتمام الشراء، يرجى المحاولة مرة أخرى.",
      dismiss: "إغلاق",
    },
    cancelDialog: {
      title: "تأكيد إلغاء الحجز",
      body: "هل تريدين إلغاء حجزكِ في هذه الحصة؟",
      confirm: "إلغاء الحجز",
      keep: "الاحتفاظ بالحجز",
    },
    empty: {
      noBookings: "لا توجد حجوزات حالياً",
      noBookingsHint: "تصفّحي الجدول واحجزي حصتكِ القادمة عندما يناسبكِ.",
      noBookingsCta: "استعراض الجدول",
      noClasses: "لا توجد حصص متاحة الآن",
      noClassesHint: "سنضيف مواعيد جديدة قريباً.",
      noMemberships: "لا توجد باقات متاحة حالياً",
      noMembershipsHint: "سنضيف باقات عضوية ورصيد قريباً.",
      noPast: "لا توجد حجوزات سابقة",
      noPastHint: "ستظهر حصصكِ المنتهية هنا.",
    },
  },
  en: {
    appName: "ÉLAN",
    tagline: "Women's Pilates Studio · Riyadh",
    tabs: { home: "Home", timetable: "Schedule", bookings: "Bookings", memberships: "Memberships", profile: "Profile" },
    home: { greeting: "Good evening,", nextClass: "Your next class", viewDetails: "View details", none: "No upcoming class", balance: "Credits", attended: "Classes attended", discover: "Discover classes", all: "All" },
    confirmation: { title: "Booking confirmed", subtitle: "We'll remind you an hour before.", date: "Date", time: "Time", place: "Location", with: "with", addCalendar: "Add to calendar", viewBookings: "View my bookings", studio: "Riyadh" },
    common: { loading: "Loading…", error: "Something went wrong", today: "Today", sar: "SAR", buy: "Buy", cancel: "Cancel", minutes: "mins", back: "Back" },
    timetable: { title: "Timetable", filters: "Filters", empty: "No classes scheduled for this day." },
    status: { available: "spots left", waitlist_open: "Waitlist open", fully_booked: "Fully booked", booking_closed: "Booking closed", booked: "Booked", waitlisted: "Waitlisted" },
    detail: { time: "TIME", instructor: "INSTRUCTOR", level: "LEVEL", description: "DESCRIPTION", waitlistBanner: "{n}/{cap} on the waitlist" },
    cta: { book: "Book", joinWaitlist: "Join waitlist", cancel: "Cancel booking", leaveWaitlist: "Leave waitlist", closed: "Booking closed", levelTooLow: "Level too low", noCredits: "No credits" },
    bookings: { title: "Bookings", upcoming: "Upcoming", past: "Past", empty: "No bookings yet." },
    bstatus: { confirmed: "Confirmed", waitlisted: "Waitlisted", attended: "Attended", cancelled: "Cancelled", late_cancelled: "Late cancelled", no_show: "No-show" },
    memberships: { title: "Memberships", noMembership: "No membership", noCredits: "No credits remaining", plans: "Membership plans", packs: "Credit packs", credits: "{n} credits", validDays: "Valid {n} days", bought: "Purchase successful" },
    profile: { title: "Profile", attended: "{n} classes attended", language: "Language", logout: "Log out", admin: "Admin panel", version: "Version", active: "Active", renews: "Renews {d}", personalData: "Personal details", payment: "Payment method", notifications: "Notifications" },
    login: { title: "Sign in", email: "Email", password: "Password", submit: "Sign in", demo: "Enter as demo member", demoAdmin: "Enter as admin", hint: "Demo: noor@elan.demo / elan1234", error: "Couldn't sign in. Please try again." },
    toast: {
      booked: "Your booking is confirmed",
      bookFailed: "We couldn't complete your booking. Please try again.",
      cancelled: "Booking cancelled",
      cancelFailed: "We couldn't cancel your booking. Please try again.",
      purchased: "Purchase successful",
      purchaseFailed: "We couldn't complete your purchase. Please try again.",
      dismiss: "Dismiss",
    },
    cancelDialog: {
      title: "Cancel booking",
      body: "Would you like to cancel your spot in this class?",
      confirm: "Cancel booking",
      keep: "Keep booking",
    },
    empty: {
      noBookings: "No bookings yet",
      noBookingsHint: "Browse the schedule and book your next class whenever suits you.",
      noBookingsCta: "View schedule",
      noClasses: "No classes available right now",
      noClassesHint: "We'll add new times soon.",
      noMemberships: "No plans available right now",
      noMembershipsHint: "We'll add memberships and credit packs soon.",
      noPast: "No past bookings",
      noPastHint: "Your completed classes will appear here.",
    },
  },
} as const;

export type Dict = (typeof dict)["en"];

```

### src/lib/locale-server.ts
```tsx
import "server-only";
import { cookies } from "next/headers";
import { LOCALE_COOKIE, type Locale } from "./i18n";

/** Reads the locale cookie in Server Components / Actions. */
export async function getLocale(): Promise<Locale> {
  const c = (await cookies()).get(LOCALE_COOKIE)?.value;
  return c === "en" ? "en" : "ar";
}

```

### src/lib/mock.ts
```tsx
import "server-only";
import type { ClassCardData } from "./queries";
import { todayInRiyadh } from "./format";

/** Mock data so the app demonstrates the design when the backend is empty.
 *  Each query falls back to these when it returns no rows. */

function iso(date: string, hhmm: string, addMin = 0): string {
  const d = new Date(`${date}T${hhmm}:00+03:00`);
  return new Date(d.getTime() + addMin * 60000).toISOString();
}

export function mockClasses(date: string): ClassCardData[] {
  const mk = (
    id: string,
    h: string,
    name_en: string,
    name_ar: string,
    instr_en: string,
    instr_ar: string,
    over: Partial<ClassCardData> = {},
  ): ClassCardData => ({
    id,
    starts_at: iso(date, h),
    ends_at: iso(date, h, 50),
    level: "level_1",
    name_ar,
    name_en,
    description_ar: "تمارين بيلاتس مدروسة لبناء القوة والتوازن والمرونة.",
    description_en: "Mindful Pilates to build strength, balance and flexibility.",
    duration_minutes: 50,
    instructor_ar: instr_ar,
    instructor_en: instr_en,
    display_status: "available",
    spots_left: 3,
    waitlist_count: 0,
    capacity: 12,
    is_bookable_now: true,
    my_status: null,
    my_booking_id: null,
    ...over,
  });

  return [
    mk("mock-1", "07:00", "Power Reformer", "باور ريفورمر", "Noura", "نورة", { spots_left: 3 }),
    mk("mock-2", "09:30", "Mat Pilates", "مات بيلاتس", "Sarah", "سارة", {
      my_status: "confirmed",
      my_booking_id: "mock-bk-2",
      spots_left: 0,
    }),
    mk("mock-3", "17:30", "Reformer Flow", "ريفورمر فلو", "Lina", "لينا", { spots_left: 1 }),
    mk("mock-4", "19:00", "Stretching", "إطالة", "Reem", "ريم", {
      display_status: "waitlist_open",
      spots_left: 0,
      waitlist_count: 2,
    }),
  ];
}

export function mockClassById(id: string) {
  const all = mockClasses(todayInRiyadh());
  const card = all.find((c) => c.id === id) ?? all[0];
  return { card: { ...card, id }, eligibility: "ELIGIBLE" };
}

export function mockBookings() {
  const today = todayInRiyadh();
  const past = new Date(Date.now() - 5 * 86400000).toISOString().slice(0, 10);
  return [
    {
      id: "mock-bk-3",
      status: "confirmed",
      waitlist_position: null,
      starts_at: iso(today, "17:30"),
      ends_at: iso(today, "17:30", 50),
      name_ar: "ريفورمر فلو",
      name_en: "Reformer Flow",
      instructor_ar: "لينا",
      instructor_en: "Lina",
    },
    {
      id: "mock-bk-2",
      status: "confirmed",
      waitlist_position: null,
      starts_at: iso(today, "09:30"),
      ends_at: iso(today, "09:30", 50),
      name_ar: "مات بيلاتس",
      name_en: "Mat Pilates",
      instructor_ar: "سارة",
      instructor_en: "Sarah",
    },
    {
      id: "mock-bk-1",
      status: "attended",
      waitlist_position: null,
      starts_at: iso(past, "07:00"),
      ends_at: iso(past, "07:00", 50),
      name_ar: "باور ريفورمر",
      name_en: "Power Reformer",
      instructor_ar: "نورة",
      instructor_en: "Noura",
    },
  ];
}

export function mockMemberContext() {
  return {
    member: { id: "mock-member", full_name: "نور العتيبي", phone: "0500000000", email: "noor@elan.demo" },
    balance: 2,
    membership: {
      current_period_end: new Date(Date.now() + 30 * 86400000).toISOString(),
      membership_plans: { name_ar: "عضوية بريميَم", name_en: "Premium membership" },
    },
    isAdmin: true,
  };
}

export function mockCatalogue() {
  return {
    plans: [
      { id: "mock-plan-1", name_ar: "عضوية بريميَم", name_en: "Premium", description_ar: "١٠ حصص شهريًا", description_en: "10 classes / month", price_sar: 950 },
      { id: "mock-plan-2", name_ar: "عضوية أساسية", name_en: "Essential", description_ar: "٨ حصص شهريًا", description_en: "8 classes / month", price_sar: 750 },
    ],
    packs: [
      { id: "mock-pack-1", name_ar: "باقة ١٠ حصص", name_en: "10-class pack", credits: 10, valid_days: 60, price_sar: 1000 },
      { id: "mock-pack-2", name_ar: "باقة ٥ حصص", name_en: "5-class pack", credits: 5, valid_days: 45, price_sar: 550 },
    ],
  };
}

export function mockBooking(id: string) {
  const today = todayInRiyadh();
  return {
    id,
    status: "confirmed",
    starts_at: iso(today, "17:30"),
    ends_at: iso(today, "17:30", 50),
    duration: 50,
    name_ar: "ريفورمر فلو",
    name_en: "Reformer Flow",
    instructor_ar: "لينا",
    instructor_en: "Lina",
  };
}

```

### src/lib/pricing.ts
```tsx
/**
 * ÉLAN pricing engine — class-value accounting with discounts.
 *
 * All money is stored and computed in HALALAS (integer, 1 SAR = 100 halalas)
 * to avoid floating-point drift. Canonical figures come from the ÉLAN dossier:
 *   • single group class: net 150.00 SAR (15,000 halalas)
 *   • VAT: 15%
 *   • single class gross: 172.50 SAR (17,250 halalas)
 *
 * Discount rules (dossier + handoff):
 *   • percentage and fixed discounts apply to the NET price, before VAT
 *   • VAT is calculated AFTER the discount
 *   • final net can never be below 0
 *   • final gross = final net + VAT
 */

export const VAT_BPS = 1500; // 15% expressed in basis points (1500 / 10000)
export const DEFAULT_CLASS_NET_HALALAS = 15000; // 150.00 SAR

/** How the discount amount is derived. Stored on the booking as discount_type. */
export type DiscountType = "none" | "percentage" | "fixed" | "promo_code" | "manual";

/** Where the class value comes from. Stored on the booking as pricing_source. */
export type PricingSource =
  | "single"
  | "package_credit"
  | "unlimited_membership"
  | "manual"
  | "complimentary";

/** The arithmetic kind of a discount, regardless of how it was sourced. */
export type DiscountKind = "none" | "percentage" | "fixed";

export interface PriceArgs {
  /** Base net amount before any discount, in halalas. */
  baseNetHalalas: number;
  /** VAT rate in basis points. Defaults to 15%. */
  vatBps?: number;
  /** Arithmetic kind of discount. */
  discountKind?: DiscountKind;
  /** For percentage: basis points (1000 = 10%). For fixed: halalas. */
  discountValue?: number;
}

export interface PriceBreakdown {
  baseNetHalalas: number;
  discountAmountHalalas: number;
  finalNetHalalas: number;
  vatBps: number;
  vatAmountHalalas: number;
  finalGrossHalalas: number;
}

/** Core engine: net → discount → VAT → gross, all in halalas. Pure + deterministic. */
export function computePrice(args: PriceArgs): PriceBreakdown {
  const vatBps = args.vatBps ?? VAT_BPS;
  const base = Math.max(0, Math.round(args.baseNetHalalas || 0));
  const kind = args.discountKind ?? "none";
  const value = Math.max(0, Math.round(args.discountValue || 0));

  let discount = 0;
  if (kind === "percentage") {
    const bps = Math.min(value, 10000); // cap at 100%
    discount = Math.round((base * bps) / 10000);
  } else if (kind === "fixed") {
    discount = value;
  }
  discount = Math.min(discount, base); // final net can never be below 0

  const finalNet = base - discount;
  const vatAmount = Math.round((finalNet * vatBps) / 10000);
  return {
    baseNetHalalas: base,
    discountAmountHalalas: discount,
    finalNetHalalas: finalNet,
    vatBps,
    vatAmountHalalas: vatAmount,
    finalGrossHalalas: finalNet + vatAmount,
  };
}

/** Gross (incl. VAT) from a net amount, in halalas. */
export function grossFromNet(netHalalas: number, vatBps: number = VAT_BPS): number {
  const net = Math.max(0, Math.round(netHalalas));
  return net + Math.round((net * vatBps) / 10000);
}

/** Net (excl. VAT) from a VAT-inclusive gross amount, in halalas. */
export function netFromGross(grossHalalas: number, vatBps: number = VAT_BPS): number {
  const gross = Math.max(0, Math.round(grossHalalas));
  return Math.round((gross * 10000) / (10000 + vatBps));
}

export function sarToHalalas(sar: number): number {
  return Math.round(sar * 100);
}

export function halalasToSar(halalas: number): number {
  return halalas / 100;
}

/** Format halalas as a SAR string, e.g. 17250 → "172.50". */
export function fmtHalalas(halalas: number, locale: "ar" | "en" = "en"): string {
  return (halalas / 100).toLocaleString(locale === "ar" ? "ar-SA" : "en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Map a stored DiscountType to its arithmetic kind. promo_code/manual resolve to a concrete kind upstream. */
export function discountKindFor(type: DiscountType, resolved?: DiscountKind): DiscountKind {
  if (type === "none") return "none";
  if (type === "percentage") return "percentage";
  if (type === "fixed") return "fixed";
  return resolved ?? "fixed"; // promo_code / manual carry a resolved kind
}

```

### src/lib/providers/index.ts
```tsx
/**
 * External-service interfaces. Everything is MOCKED by default so the app runs
 * with zero configuration; real providers switch on automatically when their
 * env keys are present.
 */

// ---------------- Payments ----------------
export interface PaymentProvider {
  readonly name: string;
  createCheckout(input: { amountSar: number; description: string; refId: string; type: string }): Promise<{ checkoutUrl: string; paymentId: string }>;
}

class MockPaymentProvider implements PaymentProvider {
  name = "mock";
  async createCheckout(input: { refId: string; type: string }) {
    // Instant fake success — the UI fulfills via the simulate_purchase RPC.
    return { checkoutUrl: `/memberships?paid=1&ref=${input.refId}`, paymentId: `mock_${input.type}_${input.refId}` };
  }
}

export function getPaymentProvider(): PaymentProvider {
  // if (process.env.MOYASAR_SECRET_KEY) return new MoyasarProvider(...)
  return new MockPaymentProvider();
}

// ---------------- Messaging (WhatsApp / SMS) ----------------
export interface MessageProvider {
  readonly name: string;
  send(input: { to: string; template: string; locale: string; vars: Record<string, unknown> }): Promise<{ status: "sent" | "skipped" }>;
}

class ConsoleMessageProvider implements MessageProvider {
  name = "console";
  async send(input: { to: string; template: string; locale: string; vars: Record<string, unknown> }) {
    console.info("[message:console]", JSON.stringify(input));
    return { status: "sent" as const };
  }
}

export function getMessageProvider(): MessageProvider {
  // if (process.env.WHATSAPP_ACCESS_TOKEN) return new WhatsAppCloudProvider(...)
  return new ConsoleMessageProvider();
}

// ---------------- Invoicing (ZATCA simplified tax invoice) ----------------
export interface InvoiceProvider {
  readonly name: string;
  generate(input: { amountSar: number; taxPct: number; buyer: string; description: string }): Promise<{
    number: string; subtotalSar: number; vatSar: number; totalSar: number; qr: string;
  }>;
}

class MockInvoiceProvider implements InvoiceProvider {
  name = "mock";
  async generate(input: { amountSar: number; taxPct: number }) {
    const total = input.amountSar;
    const vat = +(total - total / (1 + input.taxPct / 100)).toFixed(2);
    return {
      number: `ELAN-${Date.now().toString(36).toUpperCase()}`,
      subtotalSar: +(total - vat).toFixed(2),
      vatSar: vat,
      totalSar: total,
      // Placeholder for the ZATCA TLV/base64 QR until a real provider is wired.
      qr: Buffer.from(`ELAN|${total}|${vat}`).toString("base64"),
    };
  }
}

export function getInvoiceProvider(): InvoiceProvider {
  return new MockInvoiceProvider();
}

```

### src/lib/queries.ts
```tsx
import "server-only";
import { getServerSupabase, rpc } from "./supabase/server";
import { dayBoundsUtc } from "./format";
import { DEMO } from "./demo";
import { mockBooking, mockBookings, mockCatalogue, mockClassById, mockClasses, mockMemberContext } from "./mock";

export type DisplayStatus = "available" | "waitlist_open" | "fully_booked" | "booking_closed";

/** Member id for a real signed-in subscriber (resolved via auth_user_id link).
 *  Null when logged out or admin. When non-null the member app uses real data
 *  + real booking RPCs; otherwise it falls back to the demo showcase. */
async function currentRealMemberId(): Promise<string | null> {
  try {
    const supabase = await getServerSupabase();
    const { data } = await rpc<string>(supabase, "current_member_id");
    return (data as string | null) ?? null;
  } catch {
    return null;
  }
}

export interface ClassCardData {
  id: string;
  starts_at: string;
  ends_at: string;
  level: "level_1" | "level_1_5" | "level_2";
  name_ar: string; name_en: string;
  description_ar: string | null; description_en: string | null;
  duration_minutes: number;
  instructor_ar: string | null; instructor_en: string | null;
  display_status: DisplayStatus;
  spots_left: number; waitlist_count: number; capacity: number;
  is_bookable_now: boolean;
  my_status: "confirmed" | "waitlisted" | null;
  my_booking_id: string | null;
}

async function fetchBetween(startIso: string, endIso: string): Promise<ClassCardData[]> {
 try {
  const supabase = await getServerSupabase();
  const { data: rows } = await supabase
    .from("class_instances")
    .select("id,starts_at,ends_at,level,capacity,class_types(name_ar,name_en,description_ar,description_en,duration_minutes),instructors(name_ar,name_en)")
    .gte("starts_at", startIso).lt("starts_at", endIso)
    .order("starts_at", { ascending: true });
  if (!rows || rows.length === 0) return [];

  const ids = rows.map((r) => r.id);
  const [{ data: avail }, { data: mine }] = await Promise.all([
    supabase.from("class_instance_availability").select("*").in("class_instance_id", ids),
    supabase.from("bookings").select("id,status,class_instance_id").in("class_instance_id", ids).in("status", ["confirmed", "waitlisted"]),
  ]);
  const am = new Map((avail ?? []).map((a) => [a.class_instance_id, a]));
  const bm = new Map((mine ?? []).map((b) => [b.class_instance_id, b]));

  return rows.map((r) => {
    const a = am.get(r.id); const b = bm.get(r.id);
    return {
      id: r.id, starts_at: r.starts_at, ends_at: r.ends_at, level: r.level,
      name_ar: r.class_types?.name_ar ?? "", name_en: r.class_types?.name_en ?? "",
      description_ar: r.class_types?.description_ar ?? null, description_en: r.class_types?.description_en ?? null,
      duration_minutes: r.class_types?.duration_minutes ?? 0,
      instructor_ar: r.instructors?.name_ar ?? null, instructor_en: r.instructors?.name_en ?? null,
      display_status: (a?.display_status as DisplayStatus) ?? "available",
      spots_left: a?.spots_left ?? r.capacity, waitlist_count: a?.waitlist_count ?? 0, capacity: a?.capacity ?? r.capacity,
      is_bookable_now: a?.is_bookable_now ?? false,
      my_status: (b?.status as "confirmed" | "waitlisted" | undefined) ?? null,
      my_booking_id: b?.id ?? null,
    };
  });
 } catch (e) {
  console.error("fetchBetween failed", e);
  return [];
 }
}

export async function getTimetable(date: string) {
  const realId = await currentRealMemberId();
  if (!realId && DEMO) return mockClasses(date);
  const { start, end } = dayBoundsUtc(date);
  const rows = await fetchBetween(start, end);
  if (realId) return rows; // real subscriber: show real timetable (even if empty)
  return rows.length ? rows : mockClasses(date);
}

export async function getClass(id: string): Promise<{ card: ClassCardData; eligibility: string }> {
  const realId = await currentRealMemberId();
  if (!realId && DEMO) return mockClassById(id);
  try {
    const now = Date.now();
    const all = await fetchBetween(new Date(now - 30 * 86400000).toISOString(), new Date(now + 90 * 86400000).toISOString());
    const card = all.find((c) => c.id === id);
    if (!card) return mockClassById(id);
    const supabase = await getServerSupabase();
    const { data: elig } = await rpc<string>(supabase, "booking_eligibility_self", { p_class_instance_id: id });
    return { card, eligibility: elig ?? "NO_CREDITS" };
  } catch (e) {
    console.error("getClass failed", e);
    return mockClassById(id);
  }
}

export async function getMyBookings() {
  const realId = await currentRealMemberId();
  if (!realId && DEMO) return mockBookings();
  try {
    const supabase = await getServerSupabase();
    const { data } = await supabase
      .from("bookings")
      .select("id,status,waitlist_position,created_at,class_instances(starts_at,ends_at,class_types(name_ar,name_en),instructors(name_ar,name_en))")
      .order("created_at", { ascending: false });
    const rows = (data ?? []).map((b) => ({
      id: b.id, status: b.status as string, waitlist_position: b.waitlist_position as number | null,
      starts_at: b.class_instances?.starts_at ?? "", ends_at: b.class_instances?.ends_at ?? "",
      name_ar: b.class_instances?.class_types?.name_ar ?? "", name_en: b.class_instances?.class_types?.name_en ?? "",
      instructor_ar: b.class_instances?.instructors?.name_ar ?? null, instructor_en: b.class_instances?.instructors?.name_en ?? null,
    }));
    if (realId) return rows; // real subscriber: show real bookings (even if empty)
    return rows.length ? rows : mockBookings();
  } catch (e) {
    console.error("getMyBookings failed", e);
    return mockBookings();
  }
}

export async function getMemberContext() {
  // Resolve a real authenticated subscriber first — by email — so the app shows
  // her real name/credits even while the timetable showcase stays in demo mode.
  try {
    const supabase = await getServerSupabase();
    const { data: auth } = await supabase.auth.getUser();
    const email = auth.user?.email;
    if (email) {
      const { data: isAdmin } = await rpc<boolean>(supabase, "is_admin");
      if (!isAdmin) {
        // Prefer the linked member (unique via auth_user_id); fall back to email.
        const { data: mid } = await rpc<string>(supabase, "current_member_id");
        let real: { id: string; full_name: string; phone: string | null; email: string | null } | null = null;
        if (mid) {
          const { data } = await supabase.from("members").select("id,full_name,phone,email").eq("id", mid).maybeSingle();
          real = data ?? null;
        }
        if (!real) {
          const { data } = await supabase
            .from("members")
            .select("id,full_name,phone,email")
            .ilike("email", email)
            .order("created_at", { ascending: true })
            .limit(1);
          real = data?.[0] ?? null;
        }
        if (real) {
          const [{ data: bal }, { data: mem }] = await Promise.all([
            rpc<number>(supabase, "elan_credit_balance", { p_member: real.id }),
            supabase
              .from("member_memberships")
              .select("status,current_period_end,membership_plans(name_ar,name_en)")
              .eq("member_id", real.id)
              .eq("status", "active")
              .order("current_period_end", { ascending: false })
              .limit(1)
              .maybeSingle(),
          ]);
          const planRaw = (mem as { membership_plans?: unknown } | null)?.membership_plans;
          const plan = Array.isArray(planRaw) ? planRaw[0] : planRaw;
          const membership = mem
            ? { current_period_end: (mem as { current_period_end: string }).current_period_end, membership_plans: (plan as { name_ar: string; name_en: string } | null) ?? null }
            : null;
          return { member: real, balance: bal ?? 0, membership, isAdmin: false };
        }
      }
    }
  } catch (e) {
    console.error("getMemberContext (real) failed", e);
  }

  if (DEMO) return mockMemberContext();
  try {
    const supabase = await getServerSupabase();
    const { data: member } = await supabase.from("members").select("id,full_name,phone,email").maybeSingle();
    if (!member) return mockMemberContext();
    const [{ data: balance }, { data: membership }, { data: isAdmin }] = await Promise.all([
      rpc<number>(supabase, "elan_credit_balance", { p_member: member.id }),
      supabase.from("member_memberships").select("status,current_period_end,membership_plans(name_ar,name_en)").eq("status", "active").order("current_period_end", { ascending: false }).limit(1).maybeSingle(),
      rpc<boolean>(supabase, "is_admin"),
    ]);
    // Supabase may type the embed as an array; normalise to a single object.
    const planRaw = (membership as { membership_plans?: unknown } | null)?.membership_plans;
    const plan = Array.isArray(planRaw) ? planRaw[0] : planRaw;
    const normalized = membership
      ? { current_period_end: (membership as { current_period_end: string }).current_period_end, membership_plans: (plan as { name_ar: string; name_en: string } | null) ?? null }
      : null;
    return { member, balance: balance ?? 0, membership: normalized, isAdmin: Boolean(isAdmin) };
  } catch (e) {
    console.error("getMemberContext failed", e);
    return mockMemberContext();
  }
}

export async function getCatalogue() {
  if (DEMO) return mockCatalogue();
  try {
    const supabase = await getServerSupabase();
    const [{ data: plans }, { data: packs }] = await Promise.all([
      supabase.from("membership_plans").select("*").eq("active", true).order("price_sar"),
      supabase.from("credit_packs").select("*").eq("active", true).order("price_sar"),
    ]);
    if ((plans?.length ?? 0) === 0 && (packs?.length ?? 0) === 0) return mockCatalogue();
    return { plans: plans ?? [], packs: packs ?? [] };
  } catch (e) {
    console.error("getCatalogue failed", e);
    return mockCatalogue();
  }
}

export async function getBooking(id: string) {
 if (DEMO) return mockBooking(id);
 try {
  const supabase = await getServerSupabase();
  const { data } = await supabase
    .from("bookings")
    .select("id,status,class_instances(starts_at,ends_at,class_types(name_ar,name_en,duration_minutes),instructors(name_ar,name_en))")
    .eq("id", id)
    .maybeSingle();
  if (!data) return mockBooking(id);
  return {
    id: data.id,
    status: data.status,
    starts_at: data.class_instances?.starts_at ?? "",
    ends_at: data.class_instances?.ends_at ?? "",
    duration: data.class_instances?.class_types?.duration_minutes ?? 0,
    name_ar: data.class_instances?.class_types?.name_ar ?? "",
    name_en: data.class_instances?.class_types?.name_en ?? "",
    instructor_ar: data.class_instances?.instructors?.name_ar ?? null,
    instructor_en: data.class_instances?.instructors?.name_en ?? null,
  };
 } catch (e) {
  console.error("getBooking failed", e);
  return mockBooking(id);
 }
}

```

### src/lib/quiz.ts
```tsx
/**
 * ÉLAN "which class suits you" quiz — 7 multiple-choice questions mapping to
 * one of four class types. Pure logic so it can be unit-tested.
 *   answer a → Reformer · b → Sculpt · c → Center · d → Cardio/Power
 */

export type QuizKey = "a" | "b" | "c" | "d";
export type ClassRec = "reformer" | "sculpt" | "center" | "cardio_power";

export interface QuizQuestion {
  q: string;
  options: Record<QuizKey, string>;
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    q: "ما هو طبيعة نشاطكِ اليومي أو وظيفتكِ؟",
    options: {
      a: "أجلس لساعات طويلة خلف المكتب وأشعر بتيبس في رقبتي وأكتافي.",
      b: "أتحرك باستمرار لكنني أفتقد لتمارين تقوية العضلات المستهدفة والنحت.",
      c: "أعاني من ضعف في عضلات الظهر والبطن، وأشعر أحياناً بعدم اتزان في قامتي.",
      d: "نشيطة جداً وأحب التمارين، لكنني أبحث عن تمرين يدمج الكارديو مع القوة.",
    },
  },
  {
    q: "عند ممارسة التمرين، ما الذي يحفزكِ ويجعلكِ مستمتعة؟",
    options: {
      a: "الحركات الانسيابية والمطاطية التي تجعل جسمي مرناً ومفروداً.",
      b: "التكرارات التي تجعلني أشعر بحرارة مميزة في عضلات معينة (الأرداف أو البطن).",
      c: "التركيز الشديد في الحركة والتنفس والاتصال الذهني العضلي.",
      d: "الموسيقى الحماسية، والتعرق، ورفع نبضات القلب لأعلى مستوى.",
    },
  },
  {
    q: "كيف تصفين مستوى لياقتكِ وقوتكِ الحالية؟",
    options: {
      a: "متوسطة؛ أستطيع مجاراة التمارين لكنني أحتاج لجهاز يدعم حركتي ويوجهها.",
      b: "جيدة؛ أريد تمريناً يتحدى عضلاتي بأوزان خفيفة ومعدات مقاومة إضافية.",
      c: "مبتدئة أو عائدة من انقطاع؛ أحتاج للتركيز على الأساسيات وتقوية المركز أولاً.",
      d: "عالية؛ أبحث عن تحدٍّ بدني قوي يختبر قوة تحمّلي العضلية والتنفسية.",
    },
  },
  {
    q: "ما هي الأداة أو المعدة التي تفضلين الاعتماد عليها في الكلاس؟",
    options: {
      a: "جهاز الريفورمر (السرير المتحرك بالنوابض) لتوفير المقاومة والدعم معاً.",
      b: "الأوزان الخفيفة، أربطة الكاحل، وحبال المقاومة المرنة.",
      c: "وزن جسمي فقط مع أدوات ثبات صغيرة (الكرة الصغيرة، الطوق، البلوك).",
      d: "الدمج بين جهاز الريفورمر والقفز (Jumpboard) أو الحركات السريعة.",
    },
  },
  {
    q: "أي عبارة تصف هدف القوام الذي تحلمين به؟",
    options: {
      a: "قوام ممشوق، عضلات طويلة ومرنة، وجسم مشدود بالكامل.",
      b: "قوام مصقول ومحدد بدقة مع إبراز تفاصيل عضلات الجسم.",
      c: "بطن مسطح وقوي، ظهر مستقيم محمي من الآلام، وتوازن مثالي.",
      d: "جسم رياضي، قليل الدهون، ممتلئ بالطاقة واللياقة العالية.",
    },
  },
  {
    q: "ما الأسلوب الذهني الذي تفضلينه خلال الـ50 دقيقة؟",
    options: {
      a: "الانفصال التام عن ضغوط اليوم والاستمتاع بحركات وتمددات انسيابية.",
      b: "التركيز على استهداف عضلات معينة وتحدي قدرتي على تحمّل حرق العضلة.",
      c: "التركيز العميق مع إشارات المدربة (التنفس، سحب السرة، وضعية الحوض).",
      d: "تفريغ الطاقات عبر حركة سريعة ومتواصلة تحرّك كل إنش في الجسم.",
    },
  },
  {
    q: "إذا تخيلتِ شكلكِ بعد الكلاس مباشرة، ماذا تفضلين أن تكون النتيجة؟",
    options: {
      a: "أشعر أن جسمي أصبح أطول ومفاصل متحررة ومرنة.",
      b: "أشعر برعشة خفيفة وضخ دم قوي في العضلات المستهدفة بالوزن.",
      c: "أشعر بالخفة والأمان في حركتي والقدرة على التحكم في قوامي طوال اليوم.",
      d: "أشعر بإرهاق بطعم الإنجاز وجسمي يفرز الإندورفين من قوة الكارديو.",
    },
  },
];

export const CLASS_INFO: Record<ClassRec, { name_ar: string; name_en: string; advice_ar: string }> = {
  reformer: {
    name_ar: "ريفورمر بيلاتس",
    name_en: "Reformer Pilates",
    advice_ar:
      "جهاز الريفورمر بنوابضه يمنحكِ تمدداً طولياً يطيل العضلات ويحرّر المفاصل، ويقوّي الظهر والرقبة بدعمٍ آمن — مثالي لتخفيف تيبس الجلوس الطويل وبناء قوام ممشوق ومرن.",
  },
  sculpt: {
    name_ar: "سكالبت بيلاتس",
    name_en: "Sculpt Pilates",
    advice_ar:
      "مع الأوزان الخفيفة وحبال المقاومة سننحت ونرسم تفاصيل عضلاتكِ (الأرداف والبطن والذراعين) — تكرارات مركّزة تمنحكِ ذلك القوام المصقول والمحدد الذي تطمحين له.",
  },
  center: {
    name_ar: "سنتر بيلاتس",
    name_en: "Center Pilates",
    advice_ar:
      "سنركّز على تقوية المركز (الكور) وعضلات البطن العميقة والظهر — أساسٌ يمنحكِ بطناً مسطحاً، قواماً مستقيماً واثقاً، وتوازناً وحمايةً من الآلام طوال يومكِ.",
  },
  cardio_power: {
    name_ar: "كارديو / باور بيلاتس",
    name_en: "Cardio/Power Pilates",
    advice_ar:
      "استعدّي للتحدّي! حركة سريعة وقفزٌ على الريفورمر يرفع نبضكِ ويحرق الدهون ويصعد بلياقتكِ — طاقة وتعرّق وإندورفين بطعم الإنجاز.",
  },
};

const KEY_TO_CLASS: Record<QuizKey, ClassRec> = { a: "reformer", b: "sculpt", c: "center", d: "cardio_power" };
const ORDER: ClassRec[] = ["reformer", "sculpt", "center", "cardio_power"];

export interface QuizResult {
  primary: ClassRec;
  /** Present only on a tie with the primary. */
  secondary: ClassRec | null;
}

/** Majority vote across answers; ties surface a secondary recommendation. */
export function scoreQuiz(answers: QuizKey[]): QuizResult {
  const counts: Record<ClassRec, number> = { reformer: 0, sculpt: 0, center: 0, cardio_power: 0 };
  for (const a of answers) {
    const cls = KEY_TO_CLASS[a];
    if (cls) counts[cls] += 1;
  }
  const max = Math.max(...ORDER.map((c) => counts[c]));
  const winners = ORDER.filter((c) => counts[c] === max);
  return { primary: winners[0], secondary: winners.length > 1 ? winners[1] : null };
}

```

### src/lib/supabase/client.ts
```tsx
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "../database.types";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config";

/** Browser Supabase client (used by client components, e.g. login). */
export function getBrowserSupabase() {
  return createBrowserClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
}

```

### src/lib/supabase/config.ts
```tsx
/**
 * Supabase connection config. Reads from env when provided; otherwise falls
 * back to the public ELAN demo project so the app works online with zero
 * configuration. The anon key is public and safe to ship — Row Level Security
 * enforces all access. Swap the env vars to point at your own project.
 */
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://knldyssbwygrkxamttez.supabase.co";

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtubGR5c3Nid3lncmt4YW10dGV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4NTg4MjIsImV4cCI6MjA5NzQzNDgyMn0.0Ol4bTSVAevhFNGmII13bAKKtdztnO_F4wd62ZzOnK8";

```

### src/lib/supabase/server.ts
```tsx
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "../database.types";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config";

type RpcResult<T> = { data: T | null; error: { message: string } | null };

/**
 * Calls a Postgres RPC. The SSR client's rpc arg typing is over-narrow for our
 * SECURITY DEFINER wrappers; argument types are enforced by Postgres itself, so
 * we cast at this single boundary rather than scattering casts through the app.
 */
type ServerClient = Awaited<ReturnType<typeof getServerSupabase>>;

export async function rpc<T = unknown>(
  supabase: ServerClient,
  fn: string,
  args?: Record<string, unknown>,
): Promise<RpcResult<T>> {
  // Call .rpc as a method ON the client so `this` stays bound — detaching it
  // (const call = supabase.rpc) makes supabase-js read `this.rest` off undefined.
  const client = supabase as unknown as {
    rpc: (f: string, a?: Record<string, unknown>) => PromiseLike<unknown>;
  };
  return (await client.rpc(fn, args)) as RpcResult<T>;
}

/** Cookie-bound Supabase client for Server Components and Server Actions. */
export async function getServerSupabase() {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) => {
          try {
            toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Called from a Server Component (read-only cookies) — safe to ignore.
          }
        },
      },
    },
  );
}

```
