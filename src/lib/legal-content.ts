import type { Locale } from "./i18n";

export type LegalSection = { title: string; body: string[] };

export type LegalDocument = {
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
};

const updated = "2026-06-30";

export const legalContent: Record<"privacy" | "terms", Record<Locale, LegalDocument>> = {
  privacy: {
    ar: {
      title: "سياسة الخصوصية",
      updated,
      intro:
        "توضّح هذه السياسة كيف تجمع ÉLAN (إيلان) — استوديو بيلاتس للسيدات في الرياض — بياناتك الشخصية وتستخدمها وتحميها وفق نظام حماية البيانات الشخصية (PDPL) في المملكة العربية السعودية.",
      sections: [
        {
          title: "البيانات التي نجمعها",
          body: [
            "الاسم، البريد الإلكتروني، رقم الجوال، وسجل الحجوزات والحضور.",
            "بيانات العضوية والرصيد والمدفوعات (بدون تخزين بيانات البطاقة — تُعالَج عبر بوابة الدفع المعتمدة).",
            "تفضيلات اللغة والإشعارات داخل التطبيق.",
          ],
        },
        {
          title: "كيف نستخدم بياناتك",
          body: [
            "إدارة الحجوزات والعضويات والتواصل بشأن حصصك.",
            "إرسال تذكيرات وإشعارات الحجز والترقية من قائمة الانتظار (بموافقتك على القناة).",
            "تحسين الخدمة والامتثال للمتطلبات القانونية والمحاسبية.",
          ],
        },
        {
          title: "الأساس القانوني والموافقة",
          body: [
            "نعالج بياناتك لتنفيذ عقد العضوية/الحجز وبموافقتك عند الحاجة (مثل التسويق عبر البريد أو واتساب).",
            "يمكنك سحب موافقتك على قنوات التواصل من إعدادات حسابك أو بالتواصل مع الاستوديو.",
          ],
        },
        {
          title: "مشاركة البيانات",
          body: [
            "لا نبيع بياناتك. نشاركها فقط مع مزوّدي الخدمة الضروريين (استضافة، قاعدة بيانات، بوابة دفع، بريد) بعقود حماية مناسبة.",
            "قد نفصح عن بيانات عند طلب جهة رسمية وفق القانون.",
          ],
        },
        {
          title: "الاحتفاظ والأمان",
          body: [
            "نحتفظ بالبيانات طالما حسابك نشط أو كما يقتضيه القانون والمحاسبة.",
            "نطبّق ضوابط وصول وصلاحيات (RLS) وتشفيراً في النقل. لا يُخزَّن رقم البطاقة لدينا.",
          ],
        },
        {
          title: "حقوقك",
          body: [
            "الاطلاع والتصحيح والحذف (حيث ينطبق) وتقييد المعالجة — تواصلي معنا عبر البيانات أدناه.",
            "لديك حق تقديم شكوى لدى الهيئة السعودية للبيانات والذكاء الاصطناعي (سدايا) عند الاقتضاء.",
          ],
        },
        {
          title: "التواصل",
          body: [
            "ÉLAN — استوديو بيلاتس للسيدات · الرياض",
            "البريد: privacy@elan.sa (يُستبدل ببريد الاستوديو الرسمي عند الإطلاق)",
            "الهاتف: +966 11 234 5678",
          ],
        },
      ],
    },
    en: {
      title: "Privacy Policy",
      updated,
      intro:
        "This policy explains how ÉLAN — women's Pilates studio in Riyadh — collects, uses, and protects your personal data under Saudi Arabia's Personal Data Protection Law (PDPL).",
      sections: [
        {
          title: "Data we collect",
          body: [
            "Name, email, phone, booking and attendance history.",
            "Membership, credits, and payment records (card data is never stored by us — processed by the payment gateway).",
            "Language and in-app notification preferences.",
          ],
        },
        {
          title: "How we use your data",
          body: [
            "Manage bookings, memberships, and class-related communication.",
            "Send booking reminders and waitlist updates (with your channel consent).",
            "Improve the service and meet legal and accounting obligations.",
          ],
        },
        {
          title: "Legal basis & consent",
          body: [
            "We process data to perform your membership/booking contract and, where required, with your consent (e.g. marketing email or WhatsApp).",
            "You may withdraw marketing consent via your account settings or by contacting the studio.",
          ],
        },
        {
          title: "Sharing",
          body: [
            "We do not sell your data. We share it only with necessary processors (hosting, database, payments, email) under appropriate safeguards.",
            "We may disclose data when required by law.",
          ],
        },
        {
          title: "Retention & security",
          body: [
            "We retain data while your account is active or as required by law and accounting.",
            "We use access controls (RLS) and encryption in transit. Card numbers are not stored on our systems.",
          ],
        },
        {
          title: "Your rights",
          body: [
            "Access, correction, deletion (where applicable), and restriction — contact us using the details below.",
            "You may lodge a complaint with the Saudi Data & AI Authority (SDAIA) where applicable.",
          ],
        },
        {
          title: "Contact",
          body: [
            "ÉLAN — Women's Pilates Studio · Riyadh",
            "Email: privacy@elan.sa (replace with the studio's official address at launch)",
            "Phone: +966 11 234 5678",
          ],
        },
      ],
    },
  },
  terms: {
    ar: {
      title: "الشروط والأحكام",
      updated,
      intro:
        "باستخدامك تطبيق ÉLAN أو حجزك حصصاً لدينا، فإنك توافقين على هذه الشروط. يُرجى قراءتها بعناية.",
      sections: [
        {
          title: "الخدمة",
          body: [
            "يُقدَّم التطبيق لإدارة الحجوزات والعضويات في استوديو ÉLAN للسيدات.",
            "قد نحدّث الميزات أو المواعيد؛ سنسعى لإخطارك بالتغييرات الجوهرية.",
          ],
        },
        {
          title: "الحساب والأهلية",
          body: [
            "أنتِ مسؤولة عن سرية بيانات دخولك وعن النشاط على حسابك.",
            "يجب تقديم معلومات صحيحة. نحتفظ بحق تعليق الحساب عند إساءة الاستخدام أو تكرار عدم الحضور وفق سياسة الاستوديو.",
          ],
        },
        {
          title: "الحجز والإلغاء",
          body: [
            "الحجز يخضع لتوافر المقاعد والرصيد أو العضوية النشطة.",
            "الإلغاء المجاني خلال المدة المعلنة في التطبيق (افتراضياً قبل ١٢ ساعة من الحصة ما لم تُحدَّد مدة أخرى).",
            "الإلغاء المتأخر أو عدم الحضور قد يؤدي لخصم رصيد أو غرامة وفق سياسة الاستوديو.",
          ],
        },
        {
          title: "العضويات والمدفوعات",
          body: [
            "الأسعار معروضة بالريال السعودي وتشمل ضريبة القيمة المضافة حيث ينطبق.",
            "طلبات الشراء عبر التطبيق قد تبقى «بانتظار الدفع» حتى يؤكدها موظف الاستوديو أو بوابة الدفع.",
            "الاسترجاع يخضع لسياسة الاستوديو والأنظمة المعمول بها.",
          ],
        },
        {
          title: "السلوك والسلامة",
          body: [
            "يُرجى الالتزام بتعليمات المدربة وقواعد السلامة في الاستوديو.",
            "يُمنع إساءة استخدام التطبيق أو محاولة التلاعب بالحجوزات أو الرصيد.",
          ],
        },
        {
          title: "إخلاء المسؤولية",
          body: [
            "يُنصح باستشارة طبيب قبل ممارسة التمارين عند وجود حالة صحية.",
            "الاستوديو غير مسؤول عن انقطاع الخدمة بسبب أعطال تقنية خارجة عن إرادتنا المعقولة.",
          ],
        },
        {
          title: "القانون والتواصل",
          body: [
            "تخضع هذه الشروط لأنظمة المملكة العربية السعودية.",
            "للاستفسارات: privacy@elan.sa · +966 11 234 5678",
          ],
        },
      ],
    },
    en: {
      title: "Terms of Service",
      updated,
      intro:
        "By using the ÉLAN app or booking classes with us, you agree to these terms. Please read them carefully.",
      sections: [
        {
          title: "The service",
          body: [
            "The app manages bookings and memberships at ÉLAN women's Pilates studio.",
            "We may update features or schedules; we will aim to notify you of material changes.",
          ],
        },
        {
          title: "Account & eligibility",
          body: [
            "You are responsible for keeping your login secure and for activity on your account.",
            "Provide accurate information. We may suspend accounts for abuse or repeated no-shows per studio policy.",
          ],
        },
        {
          title: "Booking & cancellation",
          body: [
            "Booking depends on availability and active credits or membership.",
            "Free cancellation within the window shown in the app (default 12 hours before class unless otherwise stated).",
            "Late cancellation or no-show may forfeit credits or incur penalties per studio policy.",
          ],
        },
        {
          title: "Memberships & payments",
          body: [
            "Prices are shown in SAR and include VAT where applicable.",
            "In-app purchases may remain pending until confirmed by studio staff or the payment gateway.",
            "Refunds follow studio policy and applicable regulations.",
          ],
        },
        {
          title: "Conduct & safety",
          body: [
            "Follow trainer instructions and studio safety rules.",
            "Misuse of the app or attempts to manipulate bookings or credits are prohibited.",
          ],
        },
        {
          title: "Disclaimer",
          body: [
            "Consult a physician before exercising if you have a medical condition.",
            "We are not liable for service interruptions due to technical failures beyond our reasonable control.",
          ],
        },
        {
          title: "Governing law & contact",
          body: [
            "These terms are governed by the laws of the Kingdom of Saudi Arabia.",
            "Questions: privacy@elan.sa · +966 11 234 5678",
          ],
        },
      ],
    },
  },
};
