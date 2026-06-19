export type Locale = "ar" | "en";
export const DEFAULT_LOCALE: Locale = "ar";
export const LOCALE_COOKIE = "elan_locale";

export function dirFor(locale: Locale): "rtl" | "ltr" {
  return locale === "ar" ? "rtl" : "ltr";
}

/** Translation dictionary. All copy lives here — none hardcoded in components. */
export const dict = {
  ar: {
    appName: "إيلان",
    tabs: { timetable: "الجدول", bookings: "حجوزاتي", memberships: "العضويات", profile: "حسابي" },
    common: { loading: "جارٍ التحميل…", error: "حدث خطأ", today: "اليوم", sar: "ر.س", buy: "شراء", cancel: "إلغاء", minutes: "دقيقة", back: "رجوع" },
    timetable: { title: "الجدول", filters: "تصفية", empty: "لا توجد حصص في هذا اليوم." },
    status: { available: "مقاعد متاحة", waitlist_open: "قائمة الانتظار متاحة", fully_booked: "مكتمل", booking_closed: "الحجز مغلق", booked: "محجوز", waitlisted: "في قائمة الانتظار" },
    detail: { time: "الوقت", instructor: "المدربة", level: "المستوى", description: "الوصف", waitlistBanner: "{n}/{cap} في قائمة الانتظار" },
    cta: { book: "احجزي", joinWaitlist: "انضمي لقائمة الانتظار", cancel: "إلغاء الحجز", leaveWaitlist: "مغادرة قائمة الانتظار", closed: "الحجز مغلق", levelTooLow: "المستوى غير مناسب", noCredits: "لا يوجد رصيد" },
    bookings: { title: "حجوزاتي", upcoming: "القادمة", past: "السابقة", empty: "لا توجد حجوزات." },
    bstatus: { confirmed: "مؤكد", waitlisted: "قائمة الانتظار", attended: "تم الحضور", cancelled: "ملغي", late_cancelled: "إلغاء متأخر", no_show: "لم تحضر" },
    memberships: { title: "العضويات", noMembership: "لا توجد عضوية", noCredits: "لا يوجد رصيد حصص", plans: "باقات العضوية", packs: "باقات الحصص", credits: "{n} حصة", validDays: "صالحة {n} يوم", bought: "تم الشراء بنجاح" },
    profile: { title: "حسابي", attended: "{n} حصة تم حضورها", language: "اللغة", logout: "تسجيل الخروج", admin: "لوحة الإدارة", version: "الإصدار" },
    login: { title: "تسجيل الدخول", email: "البريد الإلكتروني", password: "كلمة المرور", submit: "دخول", demo: "دخول كعضوة تجريبية", demoAdmin: "دخول كمسؤولة", hint: "للتجربة: noor@elan.demo / elan1234" },
  },
  en: {
    appName: "ELAN",
    tabs: { timetable: "Timetable", bookings: "Bookings", memberships: "Memberships", profile: "Profile" },
    common: { loading: "Loading…", error: "Something went wrong", today: "Today", sar: "SAR", buy: "Buy", cancel: "Cancel", minutes: "mins", back: "Back" },
    timetable: { title: "Timetable", filters: "Filters", empty: "No classes scheduled for this day." },
    status: { available: "spots left", waitlist_open: "Waitlist open", fully_booked: "Fully booked", booking_closed: "Booking closed", booked: "Booked", waitlisted: "Waitlisted" },
    detail: { time: "TIME", instructor: "INSTRUCTOR", level: "LEVEL", description: "DESCRIPTION", waitlistBanner: "{n}/{cap} on the waitlist" },
    cta: { book: "Book", joinWaitlist: "Join waitlist", cancel: "Cancel booking", leaveWaitlist: "Leave waitlist", closed: "Booking closed", levelTooLow: "Level too low", noCredits: "No credits" },
    bookings: { title: "Bookings", upcoming: "Upcoming", past: "Past", empty: "No bookings yet." },
    bstatus: { confirmed: "Confirmed", waitlisted: "Waitlisted", attended: "Attended", cancelled: "Cancelled", late_cancelled: "Late cancelled", no_show: "No-show" },
    memberships: { title: "Memberships", noMembership: "No membership", noCredits: "No credits remaining", plans: "Membership plans", packs: "Credit packs", credits: "{n} credits", validDays: "Valid {n} days", bought: "Purchase successful" },
    profile: { title: "Profile", attended: "{n} classes attended", language: "Language", logout: "Log out", admin: "Admin panel", version: "Version" },
    login: { title: "Sign in", email: "Email", password: "Password", submit: "Sign in", demo: "Enter as demo member", demoAdmin: "Enter as admin", hint: "Demo: noor@elan.demo / elan1234" },
  },
} as const;

export type Dict = (typeof dict)["en"];
