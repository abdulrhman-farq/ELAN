import type { Locale } from "./i18n";

/**
 * Legal / compliance copy (Privacy, Terms) and studio contact details.
 *
 * Content is real, PDPL-aware boilerplate tailored to ÉLAN. Studio-specific
 * facts that only the business can confirm (registered entity name, CR/VAT
 * numbers, registered address, DPO) are sourced from env so they can be set at
 * deploy time without a code change; sensible public defaults are used until then
 * and the launch checklist tracks confirming the real values.
 */
export const LEGAL_LAST_UPDATED = "2026-06-28";

export const CONTACT = {
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "hello@elan.sa",
  phone: process.env.NEXT_PUBLIC_CONTACT_PHONE ?? "+966 11 000 0000",
  whatsapp: process.env.NEXT_PUBLIC_CONTACT_WHATSAPP ?? "+966 11 000 0000",
  address: {
    ar: process.env.NEXT_PUBLIC_STUDIO_ADDRESS_AR ?? "حي الياسمين، الرياض، المملكة العربية السعودية",
    en: process.env.NEXT_PUBLIC_STUDIO_ADDRESS_EN ?? "Al Yasmin District, Riyadh, Saudi Arabia",
  },
  hours: { ar: "السبت – الخميس: ٧ص – ٩م", en: "Sat–Thu: 7:00 AM – 9:00 PM" },
} as const;

export interface LegalSection {
  h: string;
  p: string[];
}

export function privacyContent(locale: Locale): { title: string; intro: string; sections: LegalSection[] } {
  if (locale === "ar") {
    return {
      title: "سياسة الخصوصية",
      intro:
        "تصف هذه السياسة كيف يجمع استوديو إيلان بياناتكِ الشخصية ويستخدمها ويحميها عند استخدام تطبيق الحجز، وفقًا لنظام حماية البيانات الشخصية في المملكة العربية السعودية (PDPL).",
      sections: [
        { h: "البيانات التي نجمعها", p: ["الاسم الكامل ورقم الجوال والبريد الإلكتروني.", "سجل الحجوزات والحضور ورصيد الحصص والعضوية.", "بيانات تقنية أساسية لتشغيل الخدمة (ملفات تعريف الارتباط للجلسة وتفضيل اللغة)."] },
        { h: "أساس المعالجة والغرض", p: ["نعالج بياناتكِ لتنفيذ الحجوزات وإدارة عضويتكِ والتواصل معكِ بخصوص حصصكِ، وذلك بناءً على موافقتكِ وتنفيذًا للخدمة المطلوبة."] },
        { h: "مشاركة البيانات", p: ["لا نبيع بياناتكِ. نشاركها فقط مع مزودي الخدمة الضروريين لتشغيل التطبيق (الاستضافة والإشعارات) وبالقدر اللازم."] },
        { h: "الاحتفاظ بالبيانات", p: ["نحتفظ ببياناتكِ طوال فترة نشاط حسابكِ وللمدة التي يقتضيها الالتزام النظامي، ثم نحذفها أو نجعلها مجهولة المصدر."] },
        { h: "حقوقكِ", p: ["لكِ الحق في الوصول إلى بياناتكِ وتصحيحها وطلب حذفها وسحب موافقتكِ. يمكنكِ تعديل بياناتكِ من صفحة حسابكِ أو التواصل معنا."] },
        { h: "الأمان", p: ["نطبّق ضوابط تقنية وتنظيمية لحماية بياناتكِ، بما في ذلك التحكم في الوصول وتشفير الاتصال."] },
        { h: "التواصل", p: [`لأي استفسار عن خصوصيتكِ تواصلي معنا عبر ${CONTACT.email}.`] },
      ],
    };
  }
  return {
    title: "Privacy Policy",
    intro:
      "This policy explains how ÉLAN Studio collects, uses and protects your personal data when you use the booking app, in line with Saudi Arabia's Personal Data Protection Law (PDPL).",
    sections: [
      { h: "Data we collect", p: ["Full name, phone number and email address.", "Booking, attendance, credit and membership history.", "Basic technical data needed to run the service (session cookies and language preference)."] },
      { h: "Legal basis & purpose", p: ["We process your data to fulfil bookings, manage your membership and contact you about your classes — based on your consent and to perform the service you requested."] },
      { h: "Data sharing", p: ["We do not sell your data. We share it only with the service providers necessary to operate the app (hosting, notifications), and only to the extent required."] },
      { h: "Data retention", p: ["We keep your data while your account is active and for any period required by law, after which we delete or anonymise it."] },
      { h: "Your rights", p: ["You have the right to access, correct and request deletion of your data, and to withdraw consent. You can edit your details from your profile or contact us."] },
      { h: "Security", p: ["We apply technical and organisational controls to protect your data, including access control and encrypted transport."] },
      { h: "Contact", p: [`For any privacy question, contact us at ${CONTACT.email}.`] },
    ],
  };
}

export function termsContent(locale: Locale): { title: string; intro: string; sections: LegalSection[] } {
  if (locale === "ar") {
    return {
      title: "الشروط والأحكام",
      intro: "باستخدامكِ تطبيق حجوزات إيلان فإنكِ توافقين على الشروط التالية.",
      sections: [
        { h: "الحساب", p: ["يُنشأ حسابكِ ببريدكِ الإلكتروني وتسجّلين الدخول عبر رابط آمن يُرسل إليه. أنتِ مسؤولة عن الحفاظ على سرية وصولكِ."] },
        { h: "الحجز والإلغاء", p: ["يخضع الحجز لتوافر المقاعد وسعة الحصة. يمكنكِ الإلغاء وفق سياسة الإلغاء المعروضة؛ قد يترتب على الإلغاء المتأخر أو عدم الحضور خصم رصيد أو إيقاف مؤقت."] },
        { h: "قائمة الانتظار", p: ["عند اكتمال الحصة يمكنكِ الانضمام لقائمة الانتظار، وسننبّهكِ عند توفّر مقعد."] },
        { h: "سلوك الاستخدام", p: ["تلتزمين باستخدام التطبيق للأغراض المشروعة فقط وعدم الإضرار بالخدمة أو بالعضوات الأخريات."] },
        { h: "التعديلات", p: ["قد نحدّث هذه الشروط من وقت لآخر، وسيظهر تاريخ آخر تحديث أعلى الصفحة."] },
        { h: "التواصل", p: [`لأي استفسار تواصلي معنا عبر ${CONTACT.email}.`] },
      ],
    };
  }
  return {
    title: "Terms of Service",
    intro: "By using the ÉLAN booking app you agree to the following terms.",
    sections: [
      { h: "Your account", p: ["Your account is created with your email and you sign in via a secure link sent to it. You are responsible for keeping your access confidential."] },
      { h: "Booking & cancellation", p: ["Bookings are subject to seat availability and class capacity. You may cancel under the displayed cancellation policy; late cancellation or no-shows may incur a credit deduction or a temporary booking suspension."] },
      { h: "Waitlist", p: ["When a class is full you can join the waitlist, and we'll notify you when a seat opens."] },
      { h: "Acceptable use", p: ["You agree to use the app only for lawful purposes and not to disrupt the service or other members."] },
      { h: "Changes", p: ["We may update these terms from time to time; the last-updated date appears at the top of this page."] },
      { h: "Contact", p: [`For any question, contact us at ${CONTACT.email}.`] },
    ],
  };
}
