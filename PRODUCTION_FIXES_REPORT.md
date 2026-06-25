# ÉLAN — تقرير الإصلاحات نحو الإنتاج (Production Fixes)

**التاريخ:** 2026-06-25 · **الفرع:** `claude/magical-ritchie-q78vic`
**النطاق:** تنفيذ فعلي للإصلاحات (أمن مالي، تدفق الدفع، RLS، refunds، audit، واجهة، أداء، تجربة، تنقّل) — مع التحقق المباشر على قاعدة البيانات الحيّة.
**النتيجة:** `build` ✓ · `lint` ✓ · `typecheck` ✓ · `tests` 36/36 ✓ · `audit` 0 Critical / 0 High.

---

## 1) Summary — ملخص ما تم إصلاحه

أُغلقت الثغرة المالية الحرجة (منح رصيد مجاني) من جذورها وتم التحقق منها حيًّا، وأُعيد بناء تدفق الدفع ليكون: **طلب → دفعة معلّقة (بلا رصيد) → تأكيد (أدمن/Webhook) → تحصيل ذرّي مرة واحدة**. أُضيفت refunds وسجل تدقيق وقابلية استخدام التطبيق كعضوة للأدمن، وصفحات خطأ عربية، وloading skeletons، وتغذية راجعة فورية للأزرار، وحالات selected واضحة، وإصلاح N+1 وpagination، وترحيل الخطوط إلى next/font والصور إلى next/image.

| البند | قبل | بعد |
|---|---|---|
| ثغرات مالية | عضوة تمنح نفسها رصيداً مجاناً عبر RPC | مغلقة + مُتحقّق منها حيًّا |
| تحصيل الرصيد | فوري عند الشراء (حتى بلا دفع) | فقط بعد دفعة `paid` مؤكّدة، ذرّي وidempotent |
| refunds | غير موجودة | `refund_payment` ذرّية تعكس الرصيد غير المستخدم |
| صفحات الخطأ | 404 إنجليزية LTR افتراضية | not-found/error/global-error عربية RTL |
| تغذية الأزرار | فشل صامت في عمليات إدارية | toast نجاح/خطأ + confirmation + loading |
| الأداء | N+1 (حتى 200 RPC)، خطوط حاجبة | استعلام واحد + pagination + next/font/image |

---

## 2) Modified Files — الملفات المعدّلة (ولماذا)

**قاعدة البيانات / Migrations**
- `supabase/migrations/0004_payment_flow_hardening.sql` — `create_pending_purchase` + `confirm_payment` + سحب EXECUTE من `simulate_purchase`/`handle_new_user`/`members_guard_self_update`.
- `supabase/migrations/0005_refunds_and_webhook.sql` — `refund_payment` + فهرس `credit_ledger_refund_once`.

**الأمن والدفع (تطبيق)**
- `src/actions/index.ts` — `purchaseAction` ينشئ دفعة معلّقة فقط (لا تحصيل).
- `src/admin-actions.ts` — `markPaymentPaidAction` يمرّ عبر `confirm_payment`؛ أُضيف `refundPaymentAction`.
- `src/lib/providers/index.ts` — `verifyWebhookSignature` (HMAC، timing-safe).
- `src/app/api/payments/webhook/route.ts` (جديد) — Webhook موقّع، service-role، خامل بلا مفاتيح.

**البيانات / منع التسريب والـ mock في الإنتاج**
- `src/lib/queries.ts` — كل fallback إلى mock صار خلف `DEMO`؛ في الإنتاج: `notFound()`/رمي الخطأ بدل بيانات ملفّقة؛ إزالة استعلام عضو عشوائي (تسريب)؛ `isAdmin` من دور العضو نفسه.
- `src/app/(app)/layout.tsx` — السماح للأدمن باستخدام تطبيق العضوة (اختبار) دون كسر حماية الجلسة.

**الواجهة — صفحات وحالات**
- `src/app/not-found.tsx`, `src/app/error.tsx`, `src/app/global-error.tsx` (جديدة) — صفحات خطأ عربية مع رجوع/رئيسية/إعادة محاولة.
- `src/app/admin/audit/page.tsx` (جديدة) + `src/lib/audit.ts` — عرض سجل التدقيق (RLS للأدمن).
- 10 ملفات `loading.tsx` (root/app/schedule/bookings/memberships/profile/admin/members/admin-schedule/reports) + `src/components/Skeleton.tsx`.

**تغذية الأزرار وإمكانية الوصول**
- `src/components/ui/Button.tsx` (جديد) — زر موحّد: isLoading/loadingText/selected/aria-pressed/variant/size/focus-ring/active.
- `src/components/Buttons.tsx`, `ClassCard.tsx`, `BottomTabs.tsx`, `MemberSidebar.tsx`, `DateStrip.tsx`, `MembershipCards.tsx` (جديد) — selected/aria-current/تغذية فورية.
- `src/components/ConfirmDialog.tsx` — focus trap حقيقي + استعادة التركيز.
- `src/components/admin/*` (ClassRowActions, AttendanceButtons, MemberPayments, MemberMoney, PromoManager, MemberStatusSelect, MemberTasks, AddNoteForm, AdminNav) — confirmation للعمليات الخطيرة + إنهاء الفشل الصامت + loading لكل زر.
- `src/app/admin/layout.tsx` — تغليف لوحة الإدارة بـ ToastProvider.

**الأداء**
- `src/lib/admin.ts` — إزالة N+1 (استعلام `credit_ledger` واحد) + pagination عبر `.range` + `getReports(?days)`.
- `src/app/admin/members/page.tsx`, `src/app/admin/reports/page.tsx` — قراءة `?page`/`?days` + روابط ترقيم.
- `src/app/layout.tsx` + `src/lib/fonts.ts` (جديد) + `src/app/globals.css` — next/font + focus-visible + reduced-motion + viewport themeColor.
- `src/app/admin/page.tsx`, `src/app/admin/schedule/page.tsx`, `src/app/(app)/class/[id]/page.tsx` — `<img>` → `next/image`.

**i18n / اختبارات** — `src/lib/i18n.ts` (purchasePending + errors)، `src/lib/__tests__/integration.todo.test.ts` (مواصفات التدفق الجديد).

---

## 3) Database / Migration Changes

| الكائن | النوع | الوصف |
|---|---|---|
| `create_pending_purchase(type,ref)` | RPC (DEFINER, authenticated) | ينشئ دفعة `initiated` للعضو الحالي (auth.uid) — بلا رصيد/عضوية. يعيد استخدام طلب معلّق قائم لتفادي التكرار. |
| `confirm_payment(id)` | RPC (DEFINER, `is_admin()`-guard) | قفل صف + حارس حالة `initiated→paid` ثم تحصيل مرة واحدة: credit_pack→ledger (مع `credit_ledger_purchase_once`)، membership→`member_memberships`. idempotent. |
| `refund_payment(id,amount?,reason?)` | RPC (DEFINER, `is_admin()`-guard) | `paid→refunded` ذرّي؛ يعكس فقط `least(credits, balance)` (لا يستردّ رصيداً مستخدماً)؛ `credit_ledger_refund_once`. |
| `simulate_purchase` | REVOKE | سُحب EXECUTE من anon/authenticated/public (service_role فقط للتطوير). |
| `handle_new_user`, `members_guard_self_update` | REVOKE | دوال trigger — سُحبت من anon/authenticated/public. |

كلها `SET search_path = public, pg_temp`. طُبّقت حيًّا عبر Supabase وأُرفقت كملفات migration رسمية.

**Bootstrap:** تمت ترقية `Abdulrhman@farq.sa` إلى `role=admin` (مرتبط بحساب auth قائم؛ كلمة المرور لم تُخزّن أو تُعرض).

---

## 4) Security Fixes — الثغرات المغلقة

1. **منح رصيد مجاني (Critical):** `simulate_purchase` كانت مكشوفة للجميع وتمنح رصيداً/عضوية بلا دفع. **أُغلقت** (سحب EXECUTE) و`purchaseAction` لم يعد يستدعيها.
2. **تسريب بيانات عضو آخر:** `getMemberContext` لم يعد يستعلم عن عضو عشوائي؛ يحلّ العضو حصراً عبر `current_member_id()`.
3. **mock/demo في الإنتاج:** كل fallback صار خلف `DEMO`؛ الإنتاج لا يعرض بيانات ملفّقة.
4. **دوال trigger مكشوفة كـ RPC:** سُحبت.
5. **تحصيل/استرجاع آمن:** `confirm_payment`/`refund_payment` بحارس `is_admin()` (تم التحقق: عضو عادي → `FORBIDDEN`).

**تحقق حيّ (معاملات أُلغيت rollback):** عضو يُمنع من `simulate_purchase` (permission denied)؛ الشراء المعلّق يمنح 0 رصيد؛ عضو يُمنع من `confirm_payment` (FORBIDDEN)؛ أدمن يؤكّد مرتين → الرصيد يُمنح مرة واحدة (8→13→13)؛ refund يعكس مرة واحدة (8→13→8→8).

---

## 5) Payment & Credit Fixes — تدفق الدفع والكريدت الجديد

```
اختيار باقة (BuyButton)
  → create_pending_purchase  ⇒ payment.status = 'initiated'  (لا رصيد)
  → [بوابة دفع / Webhook موقّع]  أو  [تأكيد الأدمن: Mark paid]
  → confirm_payment(id)       ⇒ 'paid' + تحصيل ذرّي مرة واحدة
        • credit_pack  → credit_ledger (+credits)   [unique: purchase once]
        • membership   → member_memberships (active + فترة)
  → الرصيد/العضوية محدّثة
```

- pending/initiated **لا** يمنح رصيداً (وحدة + تحقق حيّ).
- التحصيل عبر مسار **واحد** (`confirm_payment`) idempotent (قفل صف + حارس حالة + فهارس فريدة).
- refunds تعكس غير المستخدم فقط، وتُسجّل في `pricing_audit`.
- الواجهة تعرض «بانتظار تأكيد الدفع» بعد الشراء.

---

## 6) Frontend Fixes

- **صفحات الخطأ:** not-found/error/global-error عربية RTL مع رجوع/رئيسية/إعادة محاولة.
- **العمليات الخطيرة الآن بتأكيد:** إلغاء/حذف حصة (تحذير أقوى عند وجود حجوزات)، no-show، Mark paid، Comp، تعطيل promo.
- **لا فشل صامت:** كل عملية إدارية تُظهر toast نجاح/خطأ؛ `MemberStatusSelect` يرجع للقيمة السابقة عند الفشل.
- **زر موحّد** `<Button>` مع loading/disabled/selected/focus-ring.
- **selected state** واضح لبطاقات الباقات + اليوم المختار في DateStrip (ليس لوناً فقط).
- منع الضغط المزدوج على كل زر تنفيذي (`useTransition` + disabled).

---

## 7) UX Improvements

- **العضوة:** رصيد واضح، حالة الباقة (pending/paid)، رسائل حجز/إلغاء/شراء واضحة، الأدمن يقدر يجرّب التطبيق كعضوة.
- **الإدارة:** فرق pending/paid واضح، تأكيد للعمليات الخطيرة، صفحة سجل تدقيق `/admin/audit`، تقارير بنافذة `?days` قابلة للضبط، ترقيم صفحات الأعضاء.
- **التنقّل:** `aria-current="page"` على Bottom tabs/Sidebar/AdminNav مع مؤشّر غير لوني (ring/وزن خط)، وLoading skeletons تمنع الوميض/الفراغ.
- **إمكانية الوصول:** focus ring عام، focus trap في الحوارات، aria-labels لأزرار الأيقونات، احترام prefers-reduced-motion.

---

## 8) Performance Fixes

- **N+1:** صفحة/تصدير الأعضاء كانت تستدعي `elan_credit_balance` لكل عضو (حتى 200×) → استعلام `credit_ledger` واحد بـ `.in()` وتجميع بالذاكرة.
- **Pagination:** `.range()` خادمي للأعضاء مع روابط Prev/Next مع الحفاظ على الفلاتر.
- **الخطوط:** next/font/google (إزالة `<link>` الحاجب) → preload تلقائي وتقليل layout shift.
- **الصور:** `next/image` (fill/مقاسة) لصور الحصص → تحسين/تأجيل تحميل.
- **Loading UI:** 10 skeletons تمنع الشاشة الفارغة على الصفحات الديناميكية.
- **إدراك السرعة:** active/pressed/focus transitions خفيفة، toast فوري.

---

## 9) Test Results

| الفحص | النتيجة |
|---|---|
| `npm run build` | ✓ نجاح (كل المسارات + `/admin/audit` + `/api/payments/webhook`) |
| `npm run lint` | ✓ بلا تحذيرات/أخطاء |
| `npm run typecheck` | ✓ نظيف |
| `npm test` | ✓ 36 passed (+14 مواصفات تكامل skipped) |
| `npm audit` | 2 moderate فقط (postcss داخل Next 15.5.19) — **0 Critical / 0 High** |
| تحقق DB حيّ | ✓ 4 سيناريوهات أمن/دفع + سيناريو refund (rolled back) |

---

## 10) Remaining Risks / المتبقّي (مع السبب)

1. **بوابة دفع حيّة غير موصولة.** البنية جاهزة (Webhook موقّع + `create_pending_purchase`/`confirm_payment` + `verifyWebhookSignature`) لكنها خاملة حتى تُضاف مفاتيح المزوّد. السبب: يتطلب قرار المزوّد (Moyasar/Tap/Stripe) وبيانات تاجر حقيقية — لا يجوز وضع مفاتيح وهمية. حاليًا التأكيد يدوي عبر الأدمن (آمن وصحيح).
2. **اختبارات التكامل آلية غير مفعّلة** (موجودة كمواصفات skipped) — تتطلب مشروع Supabase تجريبي مزروع. عوّضناها بتحقق حيّ مباشر موثّق.
3. **صفحة الإعدادات لا تزال placeholder** وزر «حفظ» غير موصول؛ و**صفوف الملف الشخصي** (بيانات/دفع/إشعارات) شكلية، و**إدارة المدربين** للعرض فقط. لم تُربط بعد (تتطلب جداول/قرارات منتج) — موصى بها كمرحلة تالية قصيرة.
4. **`/login` ~172kB** (SDK سوبابيز في حزمة العميل) — تحسين ممكن بـ dynamic import.
5. **View `class_instance_availability` (تنبيه ERROR من linter):** SECURITY DEFINER **مقصود** — يحتاج رؤية كل الحجوزات لحساب السعة؛ لا يكشف سوى أعداد تجميعية (لا PII). استثناء مُراجَع.
6. **npm audit:** 2 moderate في postcss المضمّن داخل Next — يتطلب ترقية Next 16 (تغيير جذري) — مؤجّل.

---

## 11) Manual Deployment Steps — خطوات يدوية مطلوبة

1. **متغيّرات البيئة (Vercel/الاستضافة):**
   - `NEXT_PUBLIC_ELAN_DEMO=false` (إلزامي للإنتاج)
   - `NEXT_PUBLIC_SITE_URL` = رابط الموقع
   - للدفع لاحقًا: `PAYMENT_WEBHOOK_SECRET`، `SUPABASE_SERVICE_ROLE_KEY` (سرّي خادمي فقط)، واختياري `NEXT_PUBLIC_ELAN_MEDIA_BASE` للصور.
2. **Supabase Auth:** تفعيل «Leaked Password Protection» من لوحة التحكم (تنبيه WARN).
3. **بوابة الدفع:** اختيار المزوّد وربط محوّل يطبّع الحدث إلى `{ourPaymentId,status}` ثم توجيه Webhook إلى `/api/payments/webhook`.
4. **Migrations:** `0001`–`0005` مطبّقة على المشروع الحالي؛ لأي بيئة جديدة طبّقها بالترتيب.
5. **أدمن:** `Abdulrhman@farq.sa` مفعّل كأدمن؛ لإضافة آخرين استخدم لوحة الأعضاء أو ترقية الدور.

---

## 12) Production Readiness Score — تقييم الجاهزية

### **88 / 100**

**ما تحقّق (قويّ):** أمن مالي مغلق ومُتحقّق منه حيًّا، تدفق دفع/استرجاع ذرّي idempotent، RLS على auth_user_id، سجل تدقيق، صفحات خطأ، تغذية أزرار وloading شاملة، N+1 وpagination، next/font/image، build/lint/typecheck/tests خضراء، 0 Critical/High.

**ما يمنع 95+ (محدّد):**
- **(−5) بوابة الدفع الحيّة غير موصولة** — البنية جاهزة لكن تحتاج مزوّداً ومفاتيح (التأكيد يدوي الآن).
- **(−4) اختبارات تكامل آلية** غير مفعّلة (تحقق حيّ يدوي بديل).
- **(−3) صفحات/عناصر placeholder متبقّية:** الإعدادات (زر حفظ)، صفوف الملف الشخصي الشكلية، إدارة المدربين للعرض فقط.

عند ربط بوابة دفع حقيقية + تفعيل اختبارات التكامل على مشروع تجريبي + ربط/إخفاء عناصر الـ placeholder، يصل التقييم إلى **96–98/100**.

*كل الإصلاحات مدفوعة على `claude/magical-ritchie-q78vic`. لم تُكسر أي ميزة قائمة؛ لا mock/demo في الإنتاج؛ لم تُعرض أي أسرار.*
