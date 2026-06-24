# ÉLAN — Front-end Layout Spec & Review Checklist

A reference for the app's visual system so changes stay consistent and we
don't reintroduce overlap/clearance bugs. Check this before merging any UI
change.

## 1. Shells & widths

| Surface | Mobile | Desktop (`md:` ≥768px) |
|---|---|---|
| Member content column | `max-w-md` (448px), `pb-24` (clears bottom tabs) | `max-w-3xl` (768px), `pb-10`, left sidebar `w-[240px]` |
| Admin content | full width, stacked | `max-w-[1200px]`, sidebar `w-[230px]` |
| Bottom tab bar | visible (`md:hidden`), height ≈ 64px + safe-area | hidden |

Member pages must keep `pb-24` on mobile (or a sticky CTA offset) so content
never hides behind the bottom tabs.

## 2. Image heroes (the overlap rule ⚠️)

All photographic heroes share one pattern. **This is where the name-overlap
bug happened — read carefully.**

| Page | Hero height | Has text in hero? | Overlapping element | Overlap |
|---|---|---|---|---|
| Home | `h-[300px]` | yes — greeting + name (bottom) | next-class card | `-mt-16` (64px) |
| Class detail | `h-56` (224px) | no (back button only) | none | — |
| Confirmation | `h-56` | yes — centered title | info card | `-mt-10` (40px) |
| Profile | `h-36` (144px) | no | avatar | `-mt-12` (48px) |

**Rule — when a hero has bottom-anchored text AND an element overlaps it:**
> The text block must reserve bottom clearance **greater than the overlap**.
> Clearance = hero padding (`p-6` = 24px) + the text block's `pb-*`.
> It must exceed the overlap (`-mt-*`) by ≥ 8px.

Worked example (Home): overlap `-mt-16` = 64px → text needs ≥ 72px clearance →
`p-6` (24) + `pb-14` (56) = **80px** ✓ (16px gap). This is why the greeting
block is `mt-auto pb-14`. If you change either number, re-check this sum.

Heroes that have **centered** text (Confirmation) or **no** text (Profile,
Class detail) are safe regardless of overlap — the rule only applies to
bottom-anchored text.

### Hero desktop consistency
Every member image hero uses the same desktop treatment so they all become
floating rounded cards:
```
rounded-b-[30px] md:mt-4 md:rounded-[30px]
```
Apply this to ALL four heroes (home, class detail, confirmation, profile).

## 3. Radii (border-radius scale)

| Token / value | Used for |
|---|---|
| `rounded-[30px]` | image heroes / covers |
| `rounded-card` (≈20px) | `.card`, status banners |
| `rounded-[20px]` | discover tiles |
| `rounded-[18px]` | next-class thumbnail |
| `rounded-[16px]` | schedule row thumbnail, date chips |
| `rounded-[12px]`/`rounded-[10px]` | nav items (member / admin) |
| `rounded-pill` | buttons, badges, status pills |
| `rounded-full` | avatars |

Keep image thumbnails in the 16–20px range; don't introduce new radii.

## 4. Spacing rhythm

- Page section vertical rhythm: `space-y-5` (member) / `space-y-6` (admin).
- Card inner padding: `p-5` (compact) or `p-6` (feature). List rows: `px-5 py-4`.
- Horizontal page padding: `px-6` (member), `p-6`/`p-8` (admin).
- Grid gaps: `gap-3` (tiles) / `gap-4` (admin KPI) / `gap-5` (sections).

## 5. Type scale

- Display (Cormorant, `font-display`): page titles `text-2xl`–`text-3xl`,
  card titles `text-lg`–`text-xl`, KPI numbers `text-3xl`.
- Body (IBM Plex Sans / Arabic): base 14–15px; meta `text-[12px]`/`text-[13px]`;
  micro `text-[11px]`.
- Headings/eyebrows for field labels: `text-xs font-semibold tracking-wide text-status-full`.

## 6. Color tokens (use tokens, never raw hex in components)

`primary` / `primary-700/900/200` · `accent` (champagne gold) · `sage` ·
`ink` (on-dark text) · `surface` / `surface-elevated` / `surface-variant` ·
`outline` (borders) · `status-full` (muted meta) · `status-waitlist` ·
`danger` (destructive). Dark "brand moments" use `card-ink` / `bg-brand`.

## 7. RTL / i18n rules

- App is RTL-first (`dir="rtl"` for Arabic). **Use logical properties**
  (`ms-*`/`me-*`, `start-*`/`end-*`, `text-start`), never `ml/mr/left/right`,
  and avoid `float-*` for layout — use flex/grid (the confirmation card was
  fixed for this reason).
- **Class names always render in English** (`name_en`) on every screen by
  design; instructor names follow locale (`instructor_ar`/`instructor_en`).
- Member proper-name in Arabic next to an English UI string is expected, not a bug.
- All copy comes from `src/lib/i18n.ts` (`dict[locale]`). No hard-coded
  user-facing strings in components.

## 8. Images

- Resolver: `src/lib/classColor.ts` → `asset()`. Remote (Supabase Storage,
  `NEXT_PUBLIC_ELAN_MEDIA_BASE`) takes precedence; local fallback is
  `/public/assets/<name>.jpg`.
- Six required keys: `studio-hero`, `reformer-flow`, `power-reformer`,
  `mat-pilates`, `stretching`, `instructor-lina`.
- Every `<img>` uses `object-cover`; keep subjects centered (tiles crop to
  square AND wide). Sizes: hero 1600×1000, class 1200×900, portrait 600×600.

## Pre-merge visual checklist

- [ ] Any hero with bottom text + overlap satisfies the clearance rule (§2).
- [ ] New image heroes include `md:mt-4 md:rounded-[30px]`.
- [ ] No `ml/mr/left/right`/`float` for layout — logical props only (§7).
- [ ] Radii, spacing, type, and colors use the existing scale/tokens (§3–6).
- [ ] Member pages keep bottom-tab clearance (`pb-24`/sticky offset) (§1).
- [ ] No hard-coded strings or raw hex — use `dict` and tokens.
- [ ] `npm run build` green; sanity-check home/schedule/class/confirmation/profile.
