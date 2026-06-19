# ELAN (إيلان) — Admin Console · Claude Design Prompt

> Companion to **`ELAN-claude-design-prompt.md`**. That file's **Project Intro** and **Design System**
> apply here unchanged — paste them first (same rose tokens, surfaces, status colors, `rounded-card`
> 20px, soft shadows, Tajawal type, RTL rules). This file adds the **admin console** screens, taken
> directly from the live admin code. Instructions are in English; **Arabic UI strings are reproduced
> exactly** — do not translate them. `[assumption]` marks anything not literally in the code.

The admin console is the **studio owner's** surface. It is **wider than the member app**
(`max-w-3xl` / ~768px, desktop-or-tablet first), has **no bottom tab bar**, and is **Arabic-first
RTL** like the rest of ELAN. All admin screens share one shell (header + section nav) and then render
their own body.

**Admin screens (6):**

| # | Screen | Route |
|---|--------|-------|
| A0 | Admin shell (header + nav) — wraps all admin screens | `/admin/*` |
| A1 | Dashboard | `/admin` |
| A2 | Schedule | `/admin/schedule` |
| A3 | Class roster | `/admin/class/[id]` |
| A4 | Members directory | `/admin/members` |
| A5 | Member detail | `/admin/members/[id]` |
| A6 | Reports | `/admin/reports` |

---

## A0 — Admin shell (header + section nav)

**Context:** A persistent wrapper around every admin screen. Container `max-w-3xl`, padding ~24px
(`p-6`), vertical rhythm `space-y-5`, direction set from locale (RTL default).

**Layout (top → bottom):**
1. **Header row** (space-between):
   - Title **`لوحة الإدارة · إيلان`** (`text-2xl` bold, `primary-800`).
   - Trailing text link back to the member app **`التطبيق ›`** (`text-sm`, `primary-600`).
2. **Section nav** — a row of **pill chips** (`flex flex-wrap gap-2`): **`اللوحة`** (Dashboard),
   **`الجدول`** (Schedule), **`الأعضاء`** (Members), **`التقارير`** (Reports). Active chip =
   `bg-primary` white; inactive = `surface.variant` bg + `primary-700` text.
3. **Screen body** (one of A1–A6) renders below.

**English equivalents:** title `Admin · ELAN`; back `App ›`; nav `Dashboard / Schedule / Members /
Reports`.

**RTL:** Title on the **right**, `التطبيق ›` link on the **left** with its chevron pointing **left**
(mirrored). Nav chips read **right-to-left** (Dashboard chip at the right edge).

---

## A1 — Dashboard  (`/admin`)

**Context:** Landing admin screen inside the shell. Two parts: a KPI grid and today's class list.

**Layout:**
1. **KPI grid** — `grid-cols-3 gap-3` of **stat tiles** (each: `card`, `p-4`, centered; big value
   `text-2xl` bold `primary-700` over a small `text-xs` `status.full` label). Six tiles, in order:
   - **`حصص اليوم`** (Classes today) → count
   - **`نسبة الإشغال`** (Fill rate) → `NN%` or **`—`** when there's no capacity
   - **`إيراد اليوم`** (Revenue today) → **`{amount} ر.س`**
   - **`إيراد الأسبوع`** (Revenue, 7d) → **`{amount} ر.س`**
   - **`الأعضاء`** (Members) → count
   - **`حصص قادمة (7 أيام)`** (Upcoming, 7d) → count
2. **Today's classes** section:
   - Section header row (space-between): **`حصص اليوم`** (`font-semibold`, `primary-800`) +
     trailing link **`كل الجدول ›`** (`text-sm`, `primary-600`) → schedule.
   - A single **`card`** with divided rows (`divide-y divide-outline`). Each row is tappable → roster:
     - Left/content: **class name** (medium, `primary-900`); meta line (`text-xs`, `status.full`):
       **time · level · instructor** (instructor appended only if present; level e.g. `المستوى 1`).
     - Trailing (`text-sm`, `status.full`): **`{confirmed}/{capacity}`**, optional waitlist suffix
       **`· +{n} انتظار`**, then a **chevron `›`**.
   - **Empty state:** centered row **`لا توجد حصص اليوم.`**

**English equivalents:** tiles `Classes today / Fill rate / Revenue today / Revenue (7d) / Members /
Upcoming (7d)`; section `Today's classes`; link `Full schedule ›`; waitlist suffix `· +{n} wait`;
empty `No classes today.`; revenue unit `SAR`.

**RTL:** KPI grid fills right-to-left. In each class row the name/meta block is on the **right**, the
count + chevron on the **left**; chevron points **left**.

---

## A2 — Schedule  (`/admin/schedule`)

**Context:** Upcoming classes for the next ~14 days, grouped by calendar day. Inside the shell.

**Layout:**
1. **Heading** — **`الجدول · الأيام القادمة`** (`font-semibold`, `primary-800`).
2. **Day groups** (repeated) — each group:
   - **Day heading** (`text-sm font-semibold`, `status.full`): either **`اليوم`** for today, or a long
     localized date (weekday + day + month).
   - A **`card`** with divided rows; each row tappable → roster, same structure as the dashboard's
     class rows: name + (time · level · instructor) on one side; **`{confirmed}/{capacity}`** with
     optional **`· +{n} انتظار`** and chevron on the other.
   - **Cancelled class:** row shown at `opacity-50` with the name suffixed **` · ملغاة`**.
3. **Empty state:** a `card` (`p-10`, centered, `status.full`) reading **`لا توجد حصص مجدولة.`**

**English equivalents:** heading `Schedule · upcoming`; today `Today`; cancelled suffix `· Cancelled`;
waitlist suffix `· +{n} wait`; empty `No scheduled classes.`

**RTL:** Day headings right-aligned. Rows mirror like the dashboard (content right, count+chevron
left; chevron points left).

---

## A3 — Class roster  (`/admin/class/[id]`)

**Context:** One class's attendee list with attendance actions. Inside the shell. Opened from any
class row.

**Layout (top → bottom):**
1. **Class info card** (`card`, `p-5`, `space-y-1`):
   - **Class name** (`text-lg` bold, `primary-900`); if cancelled, suffix **` · ملغاة`**.
   - **Date/time** line (`text-sm`, `status.full`): long localized date + start–end time range.
   - **Meta** line (`text-sm`, `status.full`): **level · instructor · {confirmed}/{capacity}**
     (instructor segment only if present).
2. **Booked section:**
   - Header (`font-semibold`, `primary-800`): **`المسجّلات`** + count **`({confirmed}/{capacity})`**.
   - A `card` with divided rows. Each booked member row:
     - Left/content: **member full name** (medium, `primary-900`, truncated); meta (`text-xs`,
       `status.full`): **phone · level**.
     - Right/action: **two small pill buttons** (for still-confirmed bookings):
       **`حضرت`** (Attended — solid rose pill, `bg-primary` white) and **`لم تحضر`** (No-show —
       outline pill, `border-outline`, `status.full` text). An inline error line (`text-xs`,
       `primary-600`) may appear under them if an action fails.
     - For rows already resolved: instead of buttons show a **status chip** — **`تم الحضور`**
       (attended → `primary-100`/`primary-700`) or **`لم تحضر`** (no-show → `status.full` 15%/grey).
   - **Empty:** centered **`لا توجد حجوزات.`**
3. **Waitlist section:**
   - Header: **`قائمة الانتظار`** + count **`({n})`**.
   - A `card` with divided rows: **`{position}. {member name}`** (position prefix when present), meta
     **phone · level**, and a green waitlist chip **`قائمة الانتظار`** (`status.waitlist` 10%/green).
   - **Empty:** centered **`لا أحد في الانتظار.`**

**Button/states to design:** `حضرت` (primary), `لم تحضر` (outline); pending/disabled (`opacity-50`);
resolved chips `تم الحضور` / `لم تحضر`; waitlist chip `قائمة الانتظار`.

**English equivalents:** sections `Booked` / `Waitlist`; buttons `Attended` / `No-show`; chips
`Attended` / `No-show` / `Waitlisted`; empties `No bookings.` / `Nobody waitlisted.`; cancelled suffix
`· Cancelled`.

**RTL:** Card text right-aligned. In each member row the name/meta is on the **right**, the action
buttons / status chip on the **left**. Action buttons group aligns to the inner-left (end) edge.

---

## A4 — Members directory  (`/admin/members`)

**Context:** Searchable list of members. Inside the shell.

**Layout (top → bottom):**
1. **Header row** (space-between): **`الأعضاء`** (`font-semibold`, `primary-800`) + a result count on
   the end side **`{n} نتيجة`**.
2. **Search field** — full-width outlined input (`rounded-card`, `border-outline`, `bg-surface`,
   `text-sm`, focus border = primary), placeholder **`ابحثي بالاسم أو الجوال أو البريد`**.
3. **Results** — a `card` with divided rows; each row tappable → member detail:
   - Left/content: **full name** (medium, `primary-900`, truncated); meta (`text-xs`, `status.full`):
     **phone or email · level**.
   - Trailing: **chevron `›`** (`status.full`).
   - **Empty:** centered **`لا يوجد أعضاء.`**

**English equivalents:** header `Members`; count `{n} results`; placeholder `Search name, phone or
email`; empty `No members found.`

**RTL:** Header title on the right, count on the left. Search input is full-width (text entry
right-aligned in Arabic). Rows: name/meta on the right, chevron on the left pointing **left**.

---

## A5 — Member detail  (`/admin/members/[id]`)

**Context:** One member's profile, balance, membership, and recent activity. Inside the shell.

**Layout (top → bottom):**
1. **Profile card** (`card`, `p-5`, `space-y-1`): **full name** (`text-lg` bold, `primary-900`);
   contact line (`text-sm`, `status.full`): **phone** (or `—`) + **` · email`** if present; **level**
   line (`text-sm`, `status.full`).
2. **Two stat tiles** (`grid-cols-2 gap-3`):
   - **Credits** — big value = balance (`text-2xl` bold, `primary-700`), label **`رصيد الحصص`**.
   - **Membership** — value = active plan name, or **`لا توجد عضوية`**; label **`العضوية`**.
3. **Recent bookings** section: header **`آخر الحجوزات`** (`font-semibold`, `primary-800`); a `card`
   of divided rows: **class name** (medium, truncated) + date/time line (`text-xs`, `status.full`),
   with a **status chip** on the end (`surface.variant`/`primary-700`).
   - **Empty:** centered **`لا توجد حجوزات.`**

**Booking status chip values:** **`مؤكد`** / **`قائمة الانتظار`** / **`تم الحضور`** / **`ملغي`** /
**`إلغاء متأخر`** / **`لم تحضر`**.

**English equivalents:** labels `Credits` / `Membership`; `No membership`; section `Recent bookings`;
empty `No bookings.`; statuses `Confirmed / Waitlisted / Attended / Cancelled / Late cancelled /
No-show`.

**RTL:** All text right-aligned; the two stat tiles read right-to-left; in booking rows the class
name/time is on the **right**, status chip on the **left**.

---

## A6 — Reports  (`/admin/reports`)

**Context:** 30-day rollups. Inside the shell. Read-only summary cards and lists.

**Layout (top → bottom):**
1. **Heading** — **`التقارير · آخر 30 يوماً`** (`font-semibold`, `primary-800`).
2. **Two KPI tiles** (`grid-cols-2 gap-3`): **Total revenue** value **`{amount} ر.س`** with label
   **`إجمالي الإيراد`**; **Payments count** value with label **`عدد المدفوعات`**.
3. **Revenue by type** section: header **`الإيراد حسب النوع`**; a `card` of three divided rows
   (label on start, amount `{amount} ر.س` in `primary-700` semibold on end):
   **`العضويات`** (Memberships), **`باقات الحصص`** (Credit packs), **`الغرامات`** (Penalties).
4. **Bookings by status** section: header **`الحجوزات حسب الحالة`**; a `card` of divided rows (status
   label on start, count on end), sorted by count desc. Status labels reuse the set:
   **`مؤكد` / `قائمة الانتظار` / `تم الحضور` / `ملغي` / `إلغاء متأخر` / `لم تحضر`**.
   - **Empty:** centered **`لا توجد بيانات.`**

**English equivalents:** heading `Reports · last 30 days`; tiles `Total revenue` / `Payments`;
sections `Revenue by type` (`Memberships / Credit packs / Penalties`) / `Bookings by status`; empty
`No data.`; revenue unit `SAR`.

**RTL:** Headings right-aligned; KPI tiles read right-to-left; in every list row the **label is on the
right** and the **value/amount on the left**.

---

## Closing note for Claude Design

Keep the admin console **visually consistent with the member app and the shared Design System**: same
rose primary scale, warm off-white surfaces, `rounded-card` cards with soft shadows, pill chips and
buttons, Tajawal type, and the status-color rules for every chip. It should read as a calm, premium,
**data-dense but uncluttered** owner dashboard — wider than the member app, no bottom tabs,
**Arabic-first RTL** with mirrored LTR/English variants using the English strings above. Preserve all
Arabic copy exactly as written. **[assumption]** Today the console is read-rich with attendance
actions only (mark attended / no-show); design empty, loading, and error states for each list so the
screens stay graceful as create/edit tooling is added later.
