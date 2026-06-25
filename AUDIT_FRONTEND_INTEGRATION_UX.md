# ÉLAN Pilates — تقرير تدقيق الواجهة + الربط + تجربة المستخدم + الأداء

**التاريخ:** 2026-06-25 · **النطاق:** فحص قراءة فقط (لم يُعدّل أي كود) · **التطبيق:** Next.js 15 App Router + React 19 + Supabase
**المنهجية:** فحص كل الصفحات والمكوّنات وطبقة البيانات + `npm run build` / `typecheck` / `lint` (كلها ✓) + فحص مباشر لقاعدة البيانات الحيّة عبر Supabase MCP (RLS، الصلاحيات، دوال SECURITY DEFINER).

---

## 1) Executive Summary — الملخص التنفيذي

**الحالة العامة:** البنية سليمة ومهنية. الربط بالباكند حقيقي (Supabase فعلي، والـ mock مجرد fallback)، جميع الأزرار المهمة موصولة بدوال حقيقية (لا يوجد زر بلا وظيفة سوى عناصر عرض)، التحقق من صلاحية المدير (`is_admin()`) مُعاد على الخادم في **كل** عملية إدارية، وحماية الضغط المزدوج (`useTransition + disabled`) موجودة على كل زر تنفيذي. `build` و`typecheck` و`lint` كلها نظيفة.

**لكن يوجد ثغرة مالية حرجة واحدة تمنع الإطلاق**، إضافة إلى مجموعة مشاكل تجربة استخدام (تأكيدات مفقودة على العمليات الخطيرة، وفشل صامت في عدة أزرار إدارية)، ونواقص أداء (N+1) ووصول (focus ring).

| التصنيف | Critical | High | Medium | Low |
|---|---|---|---|---|
| العدد | **1** | **9** | ~20 | ~20 |

**أهم 3 يجب حلّها قبل الإطلاق:**
1. 🔴 **شراء الباقات يمنح رصيداً مجاناً في الإنتاج** (لا يوجد دفع حقيقي + RPC مكشوف للجميع).
2. 🟠 **العمليات الخطيرة بلا تأكيد** (إلغاء/حذف حصة، no-show، comp، تعطيل/تفعيل خصم).
3. 🟠 **فشل صامت** في أزرار إدارية مالية (comp، خصم، mark-paid، تغيير حالة العضوة) + غياب `not-found.tsx`/`error.tsx`.

---

## 2) Broken Buttons & Links — الأزرار والروابط المكسورة أو الخطرة

### 🔴 Critical

**C-1 — زر «شراء باقة» يمنح رصيداً/اشتراكاً دون أي دفع حقيقي (في الإنتاج)**
- **المكان:** `src/actions/index.ts:45-57` (`purchaseAction`) + `src/lib/providers/index.ts:13-24` (`MockPaymentProvider`) + دالة قاعدة البيانات `simulate_purchase` / `fulfill_purchase`.
- **الوصف:** عند `DEMO=false` (الإنتاج) يستدعي `purchaseAction` الـ RPC `simulate_purchase`، الذي يستدعي `fulfill_purchase` فيُدرج دفعة بحالة `status='paid'` ويمنح الرصيد/الاشتراك **بمعرّف دفع وهمي `sandbox_...` بلا أي دفع فعلي**. `getPaymentProvider()` ما زال يُعيد `MockPaymentProvider` (لا يوجد ربط Moyasar).
- **الأخطر:** فحص قاعدة البيانات الحيّة يُظهر أن `simulate_purchase` دالة `SECURITY DEFINER` ممنوحة EXECUTE لـ **`anon` و`authenticated` و`PUBLIC`**. أي عضوة مسجّلة الدخول تستطيع نداء `/rest/v1/rpc/simulate_purchase` مباشرة ومنح نفسها **رصيداً غير محدود أو اشتراكاً مجانياً** — متجاوزةً علم DEMO بالكامل وقاعدة «لا رصيد بلا دفعة مدفوعة».
- **الأثر على المستخدم:** خسارة إيراد مباشرة / تلاعب مالي من أي مستخدم.
- **الخطورة:** Critical.
- **الإصلاح:** (أ) ربط مزوّد دفع حقيقي (Moyasar) قبل الإطلاق؛ (ب) حذف `simulate_purchase` أو نقلها خارج السكيمة المكشوفة و`REVOKE EXECUTE` من `anon, authenticated, public`؛ (ج) جعل المنح يتم فقط عبر webhook موقّع من بوّابة الدفع بعد تأكيد الدفع الفعلي.
- **يحتاج اختبار:** نعم (اختبار تفويض + اختبار مالي: لا منح رصيد إلا بعد دفعة paid حقيقية).

### 🟠 High

**H-1 — لا يوجد `not-found.tsx` رغم استدعاء `notFound()` في 3 صفحات**
- **المكان:** `src/app/(app)/class/[id]/page.tsx:19`، `confirmation/[bookingId]/page.tsx:19` (ولا يوجد أي `not-found.tsx` في المشروع).
- **الأثر:** معرّف غير صالح يعرض صفحة 404 الافتراضية لـ Next **بالإنجليزية و LTR** — يكسر تجربة RTL/العربية ولا يوفّر رابط رجوع.
- **الإصلاح:** إضافة `src/app/not-found.tsx` بنص عربي ورابط إلى `/schedule`. · **اختبار:** نعم.

**H-2 — لا يوجد `error.tsx` / `global-error.tsx`**
- **المكان:** لا حدود خطأ في المشروع كله.
- **الأثر:** أي استثناء وقت العرض يعرض شاشة خطأ Next الافتراضية بالإنجليزية/LTR. النص `common.error` موجود في `i18n.ts:17` لكنه غير مستخدم.
- **الإصلاح:** إضافة `global-error.tsx` و`(app)/error.tsx` بنص محلّي. · **اختبار:** نعم.

**H-3 — صفوف الملف الشخصي (تفاصيل/طريقة الدفع/الإشعارات) روابط ميتة**
- **المكان:** `src/app/(app)/profile/page.tsx:50-52` (المكوّن `Row` في `:72-77`).
- **الوصف:** ثلاثة صفوف تبدو قابلة للنقر (سهم chevron) لكنها `<div>` بلا أي handler أو رابط — طرق مسدودة صامتة.
- **الإصلاح:** ربطها فعلياً أو إزالتها أو جعلها `disabled` مع إشارة «قريباً». · **اختبار:** لا.

**H-4 — زر «حفظ التغييرات» في الإعدادات لا يفعل شيئاً**
- **المكان:** `src/app/admin/settings/page.tsx:62` (الصفحة كلها static stub، `:5-14`).
- **الوصف:** كل قيم الإعدادات ثابتة، وزر «Save changes» بلا `onClick`/form/action. الإداري سيظنّ أنه حفظ بينما لا شيء يُحفظ. مفاتيح الإشعارات وأزرار اللغة زخرفية أيضاً.
- **الإصلاح:** ربطها بجدول إعدادات + server action، أو إزالة الزر ووسمها للقراءة فقط. · **اختبار:** نعم لو رُبطت.

**H-5..H-9 — عمليات خطيرة بلا تأكيد + فشل صامت** (مفصّلة في القسم 4؛ مُجمّعة هنا للحصر):
- إلغاء حصة / حذف حصة بلا تأكيد — `ClassRowActions.tsx:33,37`.
- No-show بلا تأكيد — `AttendanceButtons.tsx:36-39`.
- Comp + خصم على حجز: بلا تأكيد و**النتيجة مُتجاهَلة (فشل صامت)** — `MemberMoney.tsx:157-167`.
- تفعيل/تعطيل كود خصم: بلا تأكيد و**فشل صامت** — `PromoManager.tsx:63-67,144`.

### عناصر تبدو أزراراً لكنها ليست تفاعلية (Low/UX)
- شرائح «احجز/قائمة الانتظار» في `ClassCard.tsx:29-30` تبدو CTA لكنها label عرض فقط (الحجز يتم في صفحة التفاصيل).

---

## 3) Integration Issues — مشاكل الربط بين الواجهة والخادم وقاعدة البيانات

**المسار العام صحيح:** UI → Server Action → Supabase RPC/Query → RLS/`is_admin()` → DB → `revalidatePath` → تحديث UI + toast. كل طبقة البيانات (`queries.ts`, `admin.ts`) تبدأ بـ `import "server-only"` والجلب كله في Server Components. الجلب من العميل يقتصر على `login/page.tsx` (صحيح للمصادقة).

| # | المشكلة | المكان | الأثر | الخطورة |
|---|---|---|---|---|
| I-1 | `simulate_purchase` مكشوف ويمنح رصيداً (انظر C-1) | DB + `actions/index.ts:53` | تلاعب مالي | Critical |
| I-2 | **الـ mock fallback غير مقيّد بـ DEMO** في مسار «العضو غير الحقيقي»؛ في الإنتاج عند خطأ Supabase تُعرض بيانات ملفّقة بدل خطأ | `queries.ts:93,99,165,180,192,209,223` | عضوة قد ترى ملف تجريبي لشخص آخر («نور العتيبي») | High |
| I-3 | تحقّق صلاحية المدير على الخادم في كل عملية — **سليم** (دفاع متعدد الطبقات) | `admin-actions.ts:17-22,148-155`; `actions/admin.ts:8-14`; layout `admin/layout.tsx:14-18`; export route 403 | — | ✅ جيّد |
| I-4 | `markAttendedAction` تحديث جدول مباشر يعتمد على RLS بدل RPC SECURITY DEFINER (غير متسق مع no-show) | `actions/admin.ts:29` | يعتمد على صحة RLS | Low |
| I-5 | إعادة حلّ هوية العضو 3–4 مرات لكل طلب (`auth.getUser()` + `current_member_id`) | `queries.ts:12,78,87,104,131` + `layout.tsx:13` | جولات إضافية لكل تنقّل | Medium |
| I-6 | معالجات إدارية كثيرة **تتجاهل نتيجة الـ action** (فشل صامت) | comp/discount/status/toggle/note/task (انظر القسم 8) | لا يعرف الإداري بفشل العملية | High (مجمّع) |

**الـ idempotency والمنطق المالي على الخادم سليمان:** `markPaymentPaidAction` يستخدم قلب حالة ذرّي `initiated→paid` + فهرس فريد على دفتر الرصيد (أقوى حماية في الكود)، و`deleteClassAction` يرفض الحذف إن وُجدت حجوزات (`admin-actions.ts:630-634`).

---

## 4) UX Issues — مشاكل سهولة الاستخدام

**للعضوة:**
- ✅ تدفّقات الحجز/الإلغاء/الشراء واضحة، بحالات pending وtoast نجاح/خطأ كاملة (`Buttons.tsx`)، وEmptyState مستخدم في schedule/bookings/memberships.
- 🟠 صفوف الملف الشخصي الميتة (H-3) تربك العضوة.
- 🟡 نص «Add to calendar» موجود (`i18n.ts:16`) لكن **لا يوجد زر** فعلي في صفحة التأكيد.
- 🟡 التحية ثابتة «مساء الخير» دائماً بصرف النظر عن الوقت (`i18n.ts:15`)، و«التالي · اليوم» تُعرض حتى لو لم تكن الحصة اليوم (`(app)/page.tsx:40`).
- 🟡 رسالة خطأ تسجيل الدخول للرابط السحري تعرض نص Supabase الخام الإنجليزي (`login/page.tsx:29`) بدل `t.error`.

**للإدارة:**
- 🟠 **العمليات الخطيرة بلا تأكيد:** إلغاء/حذف حصة (حتى مع وجود حجوزات)، no-show، comp، خصم، تعطيل خصم. الإلغاء يجعل الحصة غير قابلة للحجز لكل العضوات بنقرة واحدة.
- 🟠 **فشل صامت:** comp/discount/mark-paid/تغيير حالة/toggle مهمة/إضافة ملاحظة لا تُظهر خطأً عند الفشل.
- 🟡 الفرق pending/paid واضح في `MemberPayments`، لكن لا success toast في أي عملية إدارية (المكوّنات الإدارية لا تستخدم نظام Toast إطلاقاً — تعتمد `setErr` محلي فقط).
- 🟡 صفحة التقارير: نافذة «آخر 30 يوماً» ثابتة بلا أي فلاتر تاريخ/نوع (`admin.ts:331`).
- 🟡 أسماء الحصص تُعرض بالإنجليزي `name_en` فقط حتى في الواجهة العربية (`admin/schedule` card `:53`، dashboard `:111`).

**للمدرب:** لا توجد صفحات مخصّصة للمدرب. صفحة `admin/trainers` دليل عرض فقط (لا إضافة/تعديل/تعطيل)، وكشف الحضور وcheck-in/no-show داخل لوحة الإدارة لا في واجهة مدرب منفصلة بصلاحيات محدودة.

---

## 5) Performance Issues — الأداء

**جدول أحجام الـ Routes (من build):** كل المسارات 103–117 kB ما عدا **`/login` = 172 kB** (شاذّ).

| # | المشكلة | المكان | الإصلاح | الخطورة |
|---|---|---|---|---|
| P-1 | **N+1**: استدعاء `elan_credit_balance` لكل عضوة (حتى 200×) | `admin.ts:720` (`getMembersOverview`) | RPC دفعي واحد `elan_credit_balances(ids[])` | High |
| P-2 | **N+1 + غير محدود**: نفس النمط على كل أعضاء التصدير بلا limit | `admin.ts:789,777` | limit/cursor + RPC دفعي | High |
| P-3 | `/login` يحمّل SDK سوبابيز كاملاً في bundle العميل (69.5kB) | `login/page.tsx:4` | `await import()` للعميل داخل الـ handlers فقط | High |
| P-4 | إعادة حلّ هوية العضو 3–4×/طلب | `queries.ts` (I-5) | `react.cache()` حول `currentRealMemberId` | Medium |
| P-5 | `getClass` يمسح نافذة 120 يوماً لقراءة حصة واحدة | `queries.ts:91` | استعلام `class_instance` مفرد بالـ id | Medium |
| P-6 | كل الصفحات `force-dynamic` (20×) → لا cache؛ يضخّم N+1 | كل الصفحات | `react.cache()` + `unstable_cache` للكتالوج/المدربين | Medium |
| P-7 | الخطوط عبر `<link>` حاجب للعرض بدل `next/font` | `app/layout.tsx:17-26` | الهجرة إلى `next/font/google` | Medium |
| P-8 | `<img>` خام بدل `next/image` (×3) مع أن `remotePatterns` مهيّأة | `admin/page.tsx:110`, `admin/schedule/page.tsx:48`, `class/[id]/page.tsx:48` | استخدام `next/image` | Medium |
| P-9 | التقارير تجمع كل الصفوف في JS بلا limit | `admin.ts:333` | تجميع في SQL view/RPC | Medium |
| P-10 | دليل الأعضاء سقف صلب 200 بلا cursor؛ `getPromoCodes` بلا limit | `admin.ts:219,699,478` | ترقيم cursor | Medium/Low |

**إيجابيات:** لا مكتبات ثقيلة (فقط supabase + zod؛ التواريخ عبر `Intl`)، الفلترة على الخادم (`ilike`/`eq` مع تنظيف الإدخال)، `Promise.all` و`.in()` مستخدمة جيداً (لا waterfalls)، `revalidatePath` شامل ودقيق.

---

## 6) Mobile / RTL Issues — الجوال والاتجاه العربي

- ✅ `<html lang={locale} dir={dirFor(locale)}>` صحيح (`app/layout.tsx:15`, `i18n.ts:5`)، خصائص CSS منطقية (`start-*`, `border-s`, `text-end`)، الجداول تستخدم تمرير أفقي (`min-w-[...]`)، أهداف لمس ≥44px في `DateStrip`.
- 🟡 لا يوجد `export const viewport` / `themeColor` (Next يحقن viewport افتراضياً، لكن لا تحكّم صريح) — `app/layout.tsx`.
- 🟡 سهم الرجوع `‹` في تفاصيل الحصة (`class/[id]/page.tsx:50`) glyph ثابت LTR — يجب أن يكون اتجاهياً في RTL.
- 🟡 أسماء عربية مفقودة: `name_en` فقط في بطاقات/جداول الحصص (القسم 4)؛ وبعض السلاسل العربية الثابتة تظهر في الوضع الإنجليزي (settings/trainers، `ClassQuiz` عربي ثابت).
- 🟡 تبويبات `/bookings` تستخدم `<a href>` (إعادة تحميل كامل) بدل `next/link` (`bookings/page.tsx:26-27`).

---

## 7) Accessibility Issues — الوصول

| # | المشكلة | المكان | الخطورة |
|---|---|---|---|
| A-1 | **لا يوجد `:focus-visible`** ring عام؛ كثير من الأزرار/الحقول بلا مؤشّر تركيز للوحة المفاتيح | `globals.css` | High |
| A-2 | حوارات الإدارة بلا **focus trap / Esc / استعادة تركيز** ولا `aria-labelledby` | NewMember, EditMember, ScheduleGenerator, SellBundle | Medium |
| A-3 | **labels غير مرتبطة** برمجياً (`htmlFor`/`id`) في كل حوارات الإدارة + AddNote/MemberSearch | متعدد | Medium |
| A-4 | `ConfirmDialog` «focus-trap خفيف» فقط (لا يقيّد Tab، لا يعيد التركيز) | `ConfirmDialog.tsx:33` | Medium |
| A-5 | أزرار رمزية/أيقونية بلا `aria-label` (٪/× في MemberMoney، DateStrip، LangToggle) | متعدد | Low |
| A-6 | `aria-current` ناقص على `MemberSidebar` و`AdminNav` | — | Low |
| A-7 | تباين ألوان «الفخامة الهادئة» (نحاسي #B89B72 على كريمي) أقل من AA 4.5:1 لنصوص الجسم | `tailwind.config.ts` | Low/تحقّق |

✅ Toast فيه `aria-live="polite"` + زر إغلاق `aria-label`؛ login فيه `role="alert"`/`role="status"`؛ `MemberTasks` checkbox فيه `aria-label`.

---

## 8) Silent-Failure / Confirmation Matrix — مصفوفة الفشل الصامت والتأكيد

| المكوّن (file:line) | العملية | تأكيد؟ | feedback عند الفشل؟ | الخطورة |
|---|---|---|---|---|
| `AttendanceButtons.tsx:36` | No-show | ❌ | خطأ فقط، لا نجاح | High |
| `ClassRowActions.tsx:33` | إلغاء حصة | ❌ | setErr فقط | High |
| `ClassRowActions.tsx:37` | حذف حصة | ❌ | setErr فقط | High |
| `MemberMoney.tsx:174` | خصم على حجز | ❌ | **النتيجة مُتجاهَلة** | High |
| `MemberMoney.tsx:180` | Comp حجز | ❌ | **النتيجة مُتجاهَلة** | High |
| `PromoManager.tsx:144` | تفعيل/تعطيل خصم | ❌ | **النتيجة مُتجاهَلة** | High |
| `MemberStatusSelect.tsx:22` | تغيير حالة العضوة | ❌ | **النتيجة مُتجاهَلة** | Medium |
| `MemberPayments.tsx:74` | mark-paid | ❌ (عملية مالية) | خطأ عام، لا نجاح | Medium |
| `MemberTasks.tsx:21,33` | إضافة/تبديل مهمة | — | خطأ مبتلَع | Medium |
| `AddNoteForm.tsx:13` | إضافة ملاحظة | — | خطأ مبتلَع | Medium |

**ملاحظة كود:** ternary مكرّر بلا أثر في حساب قيمة الخصم `PromoManager.tsx:45` و`MemberMoney.tsx:43` (كلا الفرعين `×100`) — الوحدات صحيحة بالصدفة لكن الكود مضلّل لمن يعدّله لاحقاً.

---

## 9) Critical Fixes — أهم الإصلاحات العاجلة (قبل الإطلاق)

1. **(C-1) إغلاق ثغرة الشراء المجاني:** ربط Moyasar حقيقي + `REVOKE EXECUTE ON FUNCTION simulate_purchase FROM anon, authenticated, public` (أو حذفها)، وجعل المنح عبر webhook دفع موقّع فقط.
2. **(I-2) تقييد كل الـ mock fallback خلف `if (DEMO)`** وإلا `throw` ليظهر `error.tsx` بدل بيانات ملفّقة في الإنتاج.
3. **(H-1/H-2) إضافة `not-found.tsx` و`error.tsx`/`global-error.tsx`** بنصوص عربية.
4. **(High) إضافة تأكيد (ConfirmDialog) للعمليات الخطيرة:** إلغاء/حذف حصة، no-show، comp، خصم، تعطيل كود خصم — خاصة إلغاء حصة بها حجوزات.
5. **(High) إيقاف الفشل الصامت:** فحص نتيجة كل action إداري وعرض toast نجاح/خطأ (توصيل المكوّنات الإدارية بنظام Toast).
6. **(H-3/H-4) معالجة العناصر الميتة:** صفوف الملف الشخصي + زر «حفظ» في الإعدادات.

---

## 10) Recommended Improvements — تحسينات مقترحة

- **أداء:** RPC دفعي للأرصدة (P-1/P-2)، `react.cache()` لهوية العضو (P-4)، استعلام حصة مفردة (P-5)، `next/font` + `next/image` (P-7/P-8)، تجميع التقارير في SQL (P-9)، ترقيم cursor للأعضاء (P-10).
- **وصول:** ring تركيز عام `:focus-visible` + `prefers-reduced-motion`، focus trap حقيقي مشترك للحوارات، ربط labels بـ `htmlFor/id`، `aria-label` للأزرار الرمزية.
- **محتوى عربي:** استخدام `ar ? name_ar : name_en` في كل بطاقات/جداول الحصص، نقل السلاسل الثابتة إلى `i18n`، سهم رجوع اتجاهي، تحية حسب الوقت.
- **ميزات:** فلاتر التقارير (تاريخ/نوع)، إدارة المدربين (CRUD)، إنشاء/تعديل حصة مفردة، تنفيذ «Add to calendar» أو إزالته، `viewport`/themeColor.
- **تصدير CSV:** تحييد حقن الصيغ (`=`,`+`,`@`) في الخلايا (`export/route.ts`).

---

## 11) Testing Checklist — قائمة الاختبارات

**آلية (Vitest + اختبار تكامل على مشروع Supabase تجريبي):**
- [ ] منح الرصيد فقط بعد دفعة `paid` حقيقية؛ `simulate_purchase` غير قابلة للنداء من `anon`/`authenticated` (تفويض DB).
- [ ] لا يمكن لعضوة استدعاء أي RPC مالي لمنح نفسها رصيداً.
- [ ] mark-paid مرّتين يمنح الرصيد مرة واحدة فقط (idempotency).
- [ ] منع الحجز المزدوج/تجاوز السعة (موجود عبر فهرس فريد + قفل صف).
- [ ] RLS: عضوة لا ترى صفوف/حجوزات/مدفوعات عضوة أخرى.
- [ ] غير الإداري يُرفض في كل actions الإدارية (forbidden).
- [ ] mock fallback لا يُفعّل أبداً في الإنتاج (DEMO=false).

**يدوي (Mobile + Desktop، عربي + إنجليزي):**
- [ ] كل صفحة تُحمّل، محمية بالصلاحية الصحيحة، RTL سليم، لا عناصر خارج الشاشة.
- [ ] كل زر خطير يطلب تأكيداً ويعرض toast نتيجة.
- [ ] 404/خطأ يعرضان صفحة عربية مع رابط رجوع.
- [ ] صفوف الملف الشخصي وزر «حفظ» الإعدادات إمّا تعمل أو مُزالة.
- [ ] تدفّق الدفع الحقيقي (بعد Moyasar) يمنح الرصيد فقط بعد نجاح الدفع.
- [ ] التنقّل عبر لوحة المفاتيح يُظهر مؤشّر تركيز واضحاً؛ الحوارات تحبس التركيز.

---

### ملاحظة أمنية مُكتشَفة أثناء التدقيق (أُبلغ عنها، لم تُصلَح لأن المطلوب فحص فقط)
ثغرة `simulate_purchase` (C-1/I-1) قابلة للاستغلال **حالياً** على قاعدة البيانات الحيّة (EXECUTE ممنوح لـ anon/authenticated/public). أوصي بإغلاقها فوراً قبل أي إطلاق.

*تم التدقيق دون تعديل أي كود. كل ادعاء موثّق بمرجع `file:line`.*
