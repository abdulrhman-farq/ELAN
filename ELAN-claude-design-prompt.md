# ELAN (إيلان) — Claude Design Prompt

> **How to use this file:** The first two sections (**Project Intro** and **Design System**) set
> global context — paste them into Claude Design first, or keep them pinned. Then paste **one screen
> block at a time** (each is self-contained). Instructions are in English; all Arabic UI strings are
> reproduced **exactly** as they appear in the live ELAN codebase — do not translate or rewrite them.
> Anything not present in the code is marked **[assumption]**.

---

## Project Intro

ELAN (**إيلان**) is a booking app for a **women's Pilates studio in Riyadh, Saudi Arabia**. It is
**Arabic-first and RTL by default** (English is a secondary toggle). The visual language is
**Material Design 3**, with a calm, elegant, premium, minimal feel — a soft rose accent on warm
off-white surfaces, generous rounded corners, and gentle shadows. The product has two surfaces:

- **Member app** — a mobile-first app (max width ~420px / `max-w-md`) with a bottom tab bar. Members
  browse the class timetable, open a class, book or join a waitlist, manage their bookings, buy
  memberships / credit packs, and manage their profile.
- **Admin app** — a slightly wider dashboard (max width ~768px / `max-w-3xl`) for the studio owner,
  showing today's classes, occupancy, and revenue.

**Screens to design (7 total):**

| # | Screen | Route | App |
|---|--------|-------|-----|
| 1 | Login / Sign in | `/login` | Member |
| 2 | Timetable (home) | `/` | Member |
| 3 | Class detail | `/class/[id]` | Member |
| 4 | My bookings | `/bookings` | Member |
| 5 | Memberships | `/memberships` | Member |
| 6 | Profile | `/profile` | Member |
| 7 | Admin dashboard | `/admin` | Admin |

---

## Design System

Use these **real tokens** taken from the ELAN Tailwind config and global CSS. Treat them as the
single source of truth across every screen.

### Color tokens

**Primary (rose accent)** — `primary.DEFAULT = #B0656F`
| Step | Hex | Typical use |
|------|-----|-------------|
| 50 | `#FBF1F2` | faint tints |
| 100 | `#F6E1E4` | image/avatar placeholder backgrounds, "booked" chip bg |
| 200 | `#EAC2C8` | |
| 300 | `#DD9CA6` | |
| 400 | `#C97D88` | |
| 500 | `#B0656F` | = DEFAULT |
| 600 | `#934E58` | secondary/inline links, error text |
| 700 | `#763E47` | emphasis text, prices, chip text |
| 800 | `#5A2F35` | section headings |
| 900 | `#3E2024` | primary body text |

**Surfaces & lines**
- `surface.DEFAULT = #FFFBFA` (app background, sticky bars, bottom nav)
- `surface.variant = #F3EDEC` (subtle chips / unselected pills)
- `surface.container = #FAF3F2` (card background)
- `outline = #E4DAD9` (borders, dividers)

**Status colors** (used for class availability and booking states)
- `status.available = #B0656F` (same as primary rose — "spots left")
- `status.waitlist = #2E7D5B` (green — waitlist states)
- `status.full = #9A9494` (warm grey — muted/secondary text, "fully booked", "booking closed")

> Status chips use **10–15% tint backgrounds** of these colors with the solid color as text:
> e.g. waitlist chip = `status.waitlist @ 10%` bg + `status.waitlist` text; full/closed chip =
> `status.full @ 15%` bg + `status.full` text; available & "booked" chips = `primary-100` bg +
> `primary-700` text.

### Shape & elevation
- **Card radius:** `1.25rem` (20px) — token name `rounded-card`.
- **Pill radius:** `9999px` — token name `rounded-pill` (all buttons, chips, toggles).
- **Card shadow:** `0 1px 3px rgba(58,32,36,0.08), 0 1px 2px rgba(58,32,36,0.04)` (very soft).
- **Sticky bar shadow:** `0 -2px 12px rgba(58,32,36,0.08)` (upward, for bottom sticky CTA).

### Typography
- **Font family:** **Tajawal** (Google Fonts, weights **400 / 500 / 700**), fallback `system-ui, sans-serif`.
  Tajawal covers **both Arabic and Latin**, so use it for Arabic and English alike — it keeps the
  bilingual UI visually consistent. [assumption] If a distinct Latin display face is wanted later,
  pair Tajawal (Arabic) with a humanist sans (Latin); not currently in the code.
- **Type scale in use:** page title `text-xl`/`text-2xl` bold; section heading `font-semibold`;
  card title `font-bold`; meta/secondary `text-sm` or `text-xs` in `status.full` grey;
  field/section eyebrow labels `text-xs font-semibold tracking-wide` in `status.full` grey
  (often UPPERCASE in English, e.g. `TIME`, `INSTRUCTOR`, `LEVEL`, `DESCRIPTION`).

### Reusable components to define
- **Card** — `surface.container` bg, `rounded-card`, soft card shadow, padding ~16px (`p-4`).
- **Chip** — pill, `px-3 py-1`, `text-xs font-medium`; variants: rose (primary-100/700),
  green waitlist, grey full, and filled-selected (`bg-primary` + white).
- **Pill button** — full-width primary (`bg-primary`, white text), muted (grey `status.full`),
  disabled (`status.full @ 50%` or `opacity-50`); secondary/outline (`border-outline`, text only).
- **Sticky bottom CTA bar** — fixed to bottom, `border-t border-outline`, `surface` bg, upward
  shadow, safe-area padding; contains one full-width pill button.
- **Bottom tab bar** (member) — fixed bottom, 4 tabs, active = `primary`, inactive = `status.full`.
- **Date chip** (timetable) — vertical stack: weekday (small) over day-number (bold); selected =
  `bg-primary` white, unselected = `surface.container`.
- **Status chip** (class availability) — see status color rules above.
- **Language toggle** — inline pill segmented control with `عربي` / `EN`.

### Iconography
The codebase currently uses **emoji as placeholders**: 📅 timetable, 🎟️ bookings, 💳 memberships,
👤 profile/avatar, 🧘‍♀️ class image, 👩‍🏫 instructor, ‹ / › chevrons. **[assumption]** For the design,
replace these with clean **Material Symbols (rounded)** line icons in the same positions, keeping the
calm/minimal tone. Class images and avatars are currently solid `primary-100` placeholder tiles —
design them as soft rose placeholder tiles (real photography can slot in later).

### Global RTL rules (apply to every screen)
- Default direction is **RTL** (`dir="rtl"`, `lang="ar"`). Design the Arabic layouts as the primary
  artboards; provide LTR/English as mirrored variants.
- **Mirror everything horizontally:** text alignment (start = right in Arabic), card content order,
  the bottom tab order, the timetable **date strip scrolls/reads right-to-left**, and section
  layouts where label sits at the start (right) and value/control at the end (left).
- **Flip directional icons:** chevrons/arrows point **left** to indicate "forward/next" in Arabic
  (the code mirrors `.chevron` with `scaleX(-1)` under RTL). Back affordance reads `‹ رجوع`.
- Numerals: times render via Arabic locale (`ar-SA`) — expect Arabic-Indic digits in the Arabic UI
  for clock times and dates; Latin digits in the English UI.
- Email/password inputs stay **LTR** (`dir="ltr"`) even inside the RTL login screen.

---

## Screen 1 — Login / Sign in  (`/login`)

**Context:** Member entry screen. Always rendered **RTL with Arabic copy** in the code (locale-agnostic,
defaults to Arabic). Vertically centered, single column, `max-w-md`, padding ~24px (`p-6`), background
= `surface`.

**Layout (top → bottom):**
1. **Wordmark** — centered, large bold text **`إيلان`** in `primary-700`, `text-4xl`.
2. **Card** (`surface.container`, rounded-card, soft shadow, `p-6`) containing:
   - **Email field** — label **`البريد الإلكتروني`**; input is **LTR**, outlined (`border-outline`,
     rounded-card), focus border = primary. Prefilled demo value `noor@elan.demo`.
   - **Password field** — label **`كلمة المرور`**; LTR, type=password, prefilled `elan1234`.
   - Optional **error line** — small text in `primary-600` (only when sign-in fails).
   - **Primary button** (full-width pill, `bg-primary`, white): **`دخول`**.
   - **Two secondary outline pill buttons** side by side (`flex gap-2`):
     - **`دخول كعضوة تجريبية`** (enter as demo member)
     - **`دخول كمسؤولة`** (enter as admin)
   - **Hint line** — centered `text-xs` in `status.full`: **`للتجربة: noor@elan.demo / elan1234`**.

**Button states:** default; **busy/disabled** (all buttons `opacity-50` while submitting, primary may
show `…`).

**English equivalents (for the LTR variant):** title `Sign in`, `Email`, `Password`, submit `Sign in`,
`Enter as demo member`, `Enter as admin`, hint `Demo: noor@elan.demo / elan1234`. App name `ELAN`.

**RTL:** Card content right-aligned; labels above inputs; the two secondary buttons sit in a row that
reads right-to-left (first button on the right). Inputs themselves are LTR for credentials. **[assumption]**
No logo image or background art exists in code — keep it minimal (text wordmark on plain surface),
or add a subtle rose gradient/hero only as an optional flourish.

---

## Screen 2 — Timetable (home)  (`/`)

**Context:** Default member tab. Mobile, `max-w-md`, padding ~16px (`p-4`), `space-y-4`. Shows the
class schedule for a selected day. Bottom tab bar present (Timetable active).

**Layout (top → bottom):**
1. **Header row** (space-between): page title **`الجدول`** (`text-xl` bold, `primary-800`) on the
   start side; a **`تصفية`** (Filters) chip (`surface.variant` bg, `primary-700` text) on the end side.
2. **Date strip** — horizontally scrollable row of **7 day chips** (today + next 6 days). Each chip
   is a vertical stack: weekday short name on top, day-of-month number (bold) below. Today's chip
   shows the label **`اليوم`** instead of the weekday. Selected chip = `bg-primary` white; others =
   `surface.container` with `primary-800` text.
3. **Class list** — vertical stack (`space-y-3`) of **Class Cards**, OR an **empty state**.

**Class Card (real component — repeated):** a tappable card (`surface.container`, rounded-card, soft
shadow, `p-3`, horizontal layout):
- **Leading image tile** — 64×64 rounded square, `primary-100` bg, 🧘‍♀️ placeholder.
- **Middle (flex-1):**
  - Top row (space-between): **class name** (bold, `primary-900`, truncated) + **Status chip** (end).
  - Meta line (`text-xs`, `status.full`, truncated): **`{duration} دقيقة`** • **instructor name** •
    **level label** (`المستوى 1` / `المستوى 1.5` / `المستوى 2`). The instructor segment is omitted if
    there's no instructor.
- **Trailing:** **start time** (`text-sm font-semibold`, `primary-700`), e.g. Arabic-formatted clock.
- **Dimmed state:** when a class is `fully_booked` or `booking_closed` **and** the member has no
  booking on it, the whole card is shown at `opacity-60`.

**Status chip values (design all of these):**
| Condition | Arabic label | Style |
|-----------|--------------|-------|
| `available` | **`{n} مقاعد متاحة`** (n = spots left, shown before the label) | `primary-100` bg / `primary-700` text |
| `waitlist_open` | **`قائمة الانتظار متاحة`** | `status.waitlist` 10% bg / green text |
| `fully_booked` | **`مكتمل`** | `status.full` 15% bg / grey text |
| `booking_closed` | **`الحجز مغلق`** | `status.full` 15% bg / grey text |
| member is confirmed | **`محجوز`** | `primary-100` bg / `primary-700` text |
| member is waitlisted | **`في قائمة الانتظار`** | `status.waitlist` 10% bg / green text |

> Member-specific chips (`محجوز` / `في قائمة الانتظار`) override the availability chip when present.

**Empty state:** a card (`p-10`, centered, `status.full` text) with a large 🧘‍♀️ glyph above the line
**`لا توجد حصص في هذا اليوم.`**

**English equivalents:** title `Timetable`, filters `Filters`, today `Today`, minutes `mins`,
levels `Level 1 / 1.5 / 2`, statuses `{n} spots left / Waitlist open / Fully booked / Booking closed /
Booked / Waitlisted`, empty `No classes scheduled for this day.`

**RTL:** Header title on the right, Filters chip on the left. Date strip **reads and scrolls
right-to-left** (today's chip at the right edge, future days extend left). In each card the image tile
is on the **right**, text block fills toward the left, and the start time sits at the **left** end.
Status chip aligns to the inner-left of the name row. Bottom tab bar mirrored.

---

## Screen 3 — Class detail  (`/class/[id]`)

**Context:** Opened from a Class Card. Mobile, `max-w-md`. Full-bleed image header, scrollable detail
body, and a **sticky bottom CTA bar**. Bottom padding leaves room for the sticky bar (`pb-28`).

**Layout (top → bottom):**
1. **Image header** — full-width band, height ~192px (`h-48`), `primary-100` bg, large centered 🧘‍♀️
   placeholder. A **back pill** floats in the top-start corner: `surface @ 80%` bg, rounded pill,
   text **`‹ رجوع`**.
2. **Body** (`p-4`, `space-y-4`):
   - **Class name** — `text-2xl` bold, `primary-900`.
   - **Waitlist banner** *(only when class is `waitlist_open` and member has no booking)* — a rounded
     tinted strip (`status.waitlist @ 10%` bg, green text, `text-sm`) reading
     **`{n}/{cap} في قائمة الانتظار`** (n = current waitlist count, cap = capacity).
   - **Detail rows** — each is an eyebrow label (`text-xs font-semibold tracking-wide`, `status.full`)
     above its value:
     - **`الوقت`** → long localized date + time range, e.g. weekday، start – end.
     - **`المدربة`** → 👩‍🏫 instructor name *(row omitted if no instructor)*.
     - **`المستوى`** → level label (`المستوى 1` / `1.5` / `2`).
     - **`الوصف`** → description paragraph (`text-sm leading-relaxed`) *(omitted if no description)*.
3. **Sticky bottom CTA bar** — fixed, centered `max-w-md`, holds **one full-width pill button** whose
   label/state is driven by booking logic.

**CTA button — every real state (design all):**
| State key | Arabic label | Variant | Enabled? |
|-----------|--------------|---------|----------|
| member confirmed → cancel | **`إلغاء الحجز`** | muted (grey) | enabled |
| member waitlisted → leave | **`مغادرة قائمة الانتظار`** | muted (grey) | enabled |
| booking closed | **`الحجز مغلق`** | disabled | disabled |
| level too low | **`المستوى غير مناسب`** | disabled | disabled |
| no credits | **`لا يوجد رصيد`** | disabled | disabled |
| waitlist available → join | **`انضمي لقائمة الانتظار`** | primary | enabled |
| fully booked | **`مكتمل`** | disabled | disabled |
| default → book | **`احجزي`** | primary | enabled |

> Variant styling: **primary** = `bg-primary` white; **muted** = solid `status.full` grey, white text;
> **disabled** = `status.full @ 50%`, `opacity-50`. A pending press may show `…`. An inline error line
> (small, `primary-600`) can appear just above the button.

**English equivalents:** back `Back`; eyebrows `TIME / INSTRUCTOR / LEVEL / DESCRIPTION`; waitlist
banner `{n}/{cap} on the waitlist`; CTAs `Book / Join waitlist / Cancel booking / Leave waitlist /
Booking closed / Level too low / No credits / Fully booked`.

**RTL:** Back pill sits at the **top-right** corner; its chevron points **left** (`‹ رجوع`,
mirrored). Eyebrow labels and values are right-aligned. Detail rows stack with label above value.
Sticky CTA button is full-width (direction-neutral) but its container respects RTL centering.

---

## Screen 4 — My bookings  (`/bookings`)

**Context:** Member tab. Mobile, `max-w-md`, `p-4`, `space-y-4`. Two segmented tabs split bookings
into upcoming vs past. Bottom tab bar present (Bookings active).

**Layout (top → bottom):**
1. **Page title** — **`حجوزاتي`** (`text-xl` bold, `primary-800`).
2. **Segmented tabs** (two chips, `flex gap-2`): **`القادمة`** (Upcoming) and **`السابقة`** (Past).
   Selected tab = `bg-primary` white; unselected = `surface.variant` + `primary-700`.
3. **Bookings list** (`space-y-3`) of **Booking Cards**, OR empty state.

**Booking Card** (`surface.container`, rounded-card, `p-4`, `space-y-2`):
- Top row (space-between): **class name** (bold, `primary-900`) + a **status chip**
  (`surface.variant` bg, `primary-700` text).
- Meta line (`text-sm`, `status.full`): **localized date + time range** • **instructor name**
  (instructor appended only if present).
- **On the Upcoming tab only:** a **cancel action** — text button **`إلغاء`** in `primary-600`
  (`text-sm`); shows `…` while pending.

**Booking status chip values (design all):**
| Status | Arabic label |
|--------|--------------|
| confirmed | **`مؤكد`** |
| waitlisted | **`قائمة الانتظار`** |
| attended | **`تم الحضور`** |
| cancelled | **`ملغي`** |
| late_cancelled | **`إلغاء متأخر`** |
| no_show | **`لم تحضر`** |

**Empty state:** a card (`p-10`, centered, `status.full`) with **`لا توجد حجوزات.`**

**English equivalents:** title `Bookings`; tabs `Upcoming / Past`; cancel `Cancel`; statuses
`Confirmed / Waitlisted / Attended / Cancelled / Late cancelled / No-show`; empty `No bookings yet.`

**RTL:** Title right-aligned; tab chips read right-to-left (Upcoming on the right). In each card the
class name is on the **right**, status chip on the **left**; meta line right-aligned; the cancel text
button sits at the **start (right)** below the meta. Bottom tab bar mirrored.

---

## Screen 5 — Memberships  (`/memberships`)

**Context:** Member tab. Mobile, `max-w-md`, `p-4`, `space-y-5`. Shows current membership/credit
status, then two purchasable catalogues. Bottom tab bar present (Memberships active).

**Layout (top → bottom):**
1. **Page title** — **`العضويات`** (`text-xl` bold, `primary-800`).
2. **Current status card** (`surface.container`, `p-5`, `space-y-1`):
   - **Plan name** (medium weight) — the active plan's name, or **`لا توجد عضوية`** if none.
   - **Credit line** (`text-sm`, `status.full`) — **`{n} حصة`** when balance > 0, otherwise
     **`لا يوجد رصيد حصص`**.
3. **Section: Membership plans** — heading **`باقات العضوية`** (`font-semibold`, `primary-800`),
   then a `space-y-3` list of **plan cards**.
4. **Section: Credit packs** — heading **`باقات الحصص`**, then a `space-y-3` list of **pack cards**.

**Plan card** (`surface.container`, `p-4`, row, space-between):
- Left/content block (min-w-0): **plan name** (bold, `primary-900`); **description** (`text-xs`,
  `status.full`, truncated); **price** line (`text-sm font-semibold`, `primary-700`):
  **`{price} ر.س`**.
- Trailing: **Buy button** — solid rose pill (`bg-primary`, white, `px-5 py-2 text-sm`): **`شراء`**.

**Pack card** (same shape as plan card) — content block shows: **pack name** (bold); a combined meta
line (`text-xs`, `status.full`, truncated): **`{n} حصة • صالحة {d} يوم`** (credits • valid days);
**price** **`{price} ر.س`**; trailing **`شراء`** Buy button.

**Button states:** Buy default; **pending/disabled** (`opacity-50`, may show `…`). **[assumption]**
There is no explicit "purchase success" screen in the UI, but the string **`تم الشراء بنجاح`**
(Purchase successful) exists — design a lightweight success **toast/snackbar** using it.

**English equivalents:** title `Memberships`; `No membership`; credits `{n} credits` /
`No credits remaining`; sections `Membership plans` / `Credit packs`; `{n} credits` •
`Valid {n} days`; price unit `SAR`; buy `Buy`; success `Purchase successful`.

**RTL:** Title and section headings right-aligned. In every card the **text/content block sits on the
right** and the **Buy pill on the left**. Price uses `ر.س` after the number in Arabic. Bottom tab bar
mirrored.

---

## Screen 6 — Profile  (`/profile`)

**Context:** Member tab. Mobile, `max-w-md`, `p-4`, `space-y-4`. Account summary, language toggle,
optional admin entry, logout. Bottom tab bar present (Profile active).

**Layout (top → bottom):**
1. **Profile header** (row, `gap-3`): a **circular avatar** (56×56, `primary-100` bg, 👤 placeholder);
   beside it a stack with the **member full name** (`text-lg` bold, `primary-800`, truncated; falls
   back to **`حسابي`**) over the app name **`إيلان`** (`text-sm`, `status.full`).
2. **Stats card** (`surface.container`, `p-4`):
   - Eyebrow (`text-xs font-semibold tracking-wide`, `status.full`): **`حسابي`**.
   - **`{n} حصة تم حضورها`** (classes attended count).
   - Credit line (`text-sm`, `status.full`): **`{n} حصة`** when balance > 0, else **`لا يوجد رصيد حصص`**.
3. **Language row card** (`p-4`, row, space-between): label **`اللغة`** + **Language toggle** segmented
   pill control showing **`عربي`** / **`EN`** (active segment = `bg-primary` white; inactive =
   `status.full` text).
4. **Admin link card** *(only if the member is an admin)* — row, space-between: **`لوحة الإدارة`** with
   a trailing **chevron `›`** (`status.full`). Navigates to `/admin`.
5. **Logout button** — full-width, `rounded-card`, centered text in `primary-600`: **`تسجيل الخروج`**.
6. **Version line** — centered `text-xs`, `status.full`: **`الإصدار 0.1.0`**.

**English equivalents:** title `Profile`; `{n} classes attended`; language `Language`; admin
`Admin panel`; logout `Log out`; version `Version`.

**RTL:** Avatar sits on the **right**, name/app-name stack to its left. In the language and admin rows
the **label is on the right**, control/chevron on the **left**; the admin chevron points **left**
(mirrored `›`). Logout and version are centered. Bottom tab bar mirrored.

---

## Screen 7 — Admin dashboard  (`/admin`)

**Context:** Owner-only dashboard (separate from the member tab bar — **no bottom tabs**). Wider
container, `max-w-3xl`, `p-6`, `space-y-5`. Explicitly direction-aware (`dir` set from locale).

**Layout (top → bottom):**
1. **Header row** (space-between): title **`لوحة الإدارة · إيلان`** (`text-2xl` bold, `primary-800`);
   a trailing text link back to the member app **`التطبيق ›`** (`text-sm`, `primary-600`).
2. **Stat tiles** — a 3-column grid (`grid-cols-3 gap-3`) of stat cards. Each tile (`surface.container`,
   `p-4`, centered): big value (`text-2xl` bold, `primary-700`) over a small label (`text-xs`,
   `status.full`):
   - **`حصص اليوم`** (Classes today) → count.
   - **`نسبة الإشغال`** (Fill rate) → percentage, or **`—`** if no capacity.
   - **`إيراد اليوم`** (Revenue today) → **`{amount} ر.س`**.
3. **Today's classes list** — a single card with **divided rows** (`divide-y divide-outline`). Each row
   (`p-4`, space-between):
   - Left/content: **class type name** (medium, `primary-900`) over **start time** (`text-xs`,
     `status.full`).
   - Trailing (`text-sm`, `status.full`): **`{confirmed}/{capacity}`**, with an optional waitlist
     suffix **`· +{n} انتظار`** when there's a waitlist.
   - **Empty state:** a single centered row **`لا توجد حصص اليوم.`** (`status.full`).
4. **Footer note** — centered `text-xs`, `status.full`:
   **`هذه نسخة عرض للوحة الإدارة. إدارة الجدول والأعضاء والتقارير قيد الإكمال.`**

**English equivalents:** title `Admin · ELAN`; back link `App ›`; tiles `Classes today / Fill rate /
Revenue today`; revenue unit `SAR`; row waitlist suffix `· +{n} wait`; empty `No classes today.`;
footer `Read-only admin preview. Schedule, members, and reports management are in progress.`

**RTL:** Title on the right, `التطبيق ›` link on the left with its chevron pointing **left**
(mirrored). Stat grid order mirrors right-to-left. In each class row the name/time block is on the
**right**, the count/waitlist figure on the **left**. Revenue and counts use `ر.س` / Arabic numerals
in the Arabic view. **[assumption]** Admin is intentionally minimal/read-only today — design it clean
and data-dense but in the same calm rose system; future management controls can extend it.

---

## Closing note for Claude Design

Keep **all seven screens visually consistent** with the Design System above: the same rose primary
scale, warm off-white surfaces, `rounded-card` (20px) cards with the soft card shadow, pill buttons
and chips, the Tajawal type scale, and the status-color rules for every chip and CTA. **Arabic-first
RTL is the default** for every screen — design the Arabic artboards as primary and provide mirrored
LTR/English variants using the English strings supplied per screen. Preserve all Arabic copy exactly
as written here. Aim for a minimal, elegant, premium women's-studio feel: lots of breathing room,
gentle contrast, soft shadows, no harsh borders.
