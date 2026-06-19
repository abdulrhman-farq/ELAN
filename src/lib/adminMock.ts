/** Admin demo data mirroring the ÉLAN admin slide deck, so the admin
 *  console matches the design and is testable without a populated backend. */
export const adminMock = {
  overview: {
    bookingsToday: "٤٢",
    bookingsDelta: "▲ ١٢٪ عن الأمس",
    fillRate: "٨٦٪",
    classesToday: "٦ حصص اليوم",
    newMembers: "٧",
    newMembersNote: "▲ هذا الأسبوع",
    revenueMonth: "١٢٤٬٠٠٠",
  },
  todayClasses: [
    { time: "٧:٠٠ ص", name: "Power Reformer", instr: "نورة", booked: "٩ / ١٢", status: "مفتوحة", open: true },
    { time: "٩:٣٠ ص", name: "Mat Pilates", instr: "سارة", booked: "١٤ / ١٤", status: "مكتملة", open: false },
    { time: "٥:٣٠ م", name: "Reformer Flow", instr: "لينا", booked: "١١ / ١٢", status: "مفتوحة", open: true },
    { time: "٧:٠٠ م", name: "Sculpt & Tone", instr: "ريم", booked: "١٢ / ١٢", status: "مكتملة", open: false },
  ],
  waitlist: [
    { initial: "ل", name: "لمى الزهراني", cls: "Mat Pilates · ٩:٣٠ ص", color: "#D6B47A" },
    { initial: "ه", name: "هند القحطاني", cls: "Sculpt · ٧:٠٠ م", color: "#8DA8B8" },
    { initial: "ر", name: "رهف العنزي", cls: "Sculpt · ٧:٠٠ م", color: "#A9B39B" },
  ],
  topClass: { name: "Reformer Flow", pct: "٨٦٪" },

  // Schedule (week)
  weekDays: [
    { day: "السبت", num: "١٤", active: true },
    { day: "الأحد", num: "١٥" },
    { day: "الاثنين", num: "١٦" },
    { day: "الثلاثاء", num: "١٧" },
    { day: "الأربعاء", num: "١٨" },
  ],
  weekClasses: [
    { name: "Power Reformer", time: "٧:٠٠ ص · ٥٠ دقيقة", status: "مفتوحة", open: true, instr: "نورة", initial: "ن", occ: "٩ / ١٢", note: "الإشغال", accent: "#D6B47A" },
    { name: "Mat Pilates", time: "٩:٣٠ ص · ٥٠ دقيقة", status: "مكتملة", open: false, instr: "سارة", initial: "س", occ: "١٤ / ١٤", note: "الإشغال · ٣ بالانتظار", accent: "#A9B39B" },
    { name: "Reformer Flow", time: "٥:٣٠ م · ٥٠ دقيقة", status: "مفتوحة", open: true, instr: "لينا", initial: "ل", occ: "١١ / ١٢", note: "الإشغال", accent: "#C78B73" },
    { name: "Sculpt & Tone", time: "٧:٠٠ م · ٤٥ دقيقة", status: "مكتملة", open: false, instr: "ريم", initial: "ر", occ: "١٢ / ١٢", note: "الإشغال · ٢ بالانتظار", accent: "#8DA8B8" },
  ],

  // Members
  members: {
    active: "٣٤٨",
    expiring: "١٢",
    trials: "٢٣",
    note: "٣٤٨ عضوة نشطة · ٧ جديدات هذا الأسبوع",
    list: [
      { initial: "ن", name: "نور العتيبي", email: "noor@elan.demo", plan: "بريميَم", left: "٢ من ١٠", last: "اليوم", status: "نشطة", tone: "ok" },
      { initial: "ل", name: "لمى الزهراني", email: "lama@mail.com", plan: "باقة ١٠ حصص", left: "٧ من ١٠", last: "أمس", status: "نشطة", tone: "ok" },
      { initial: "ه", name: "هند القحطاني", email: "hind@mail.com", plan: "شهرية", left: "غير محدودة", last: "٣ أيام", status: "تنتهي قريبًا", tone: "warn" },
      { initial: "ر", name: "رهف العنزي", email: "rahaf@mail.com", plan: "تجريبية", left: "١ من ١", last: "٥ أيام", status: "تجريبية", tone: "trial" },
      { initial: "س", name: "سلمى الدوسري", email: "salma@mail.com", plan: "بريميَم", left: "٦ من ١٠", last: "أسبوع", status: "نشطة", tone: "ok" },
    ],
  },

  // Trainers
  trainers: [
    { initial: "ل", name: "لينا حدّاد", tag: "Reformer", desc: "أخصائية ريفورمر · ٦ سنوات خبرة", classes: "٨ حصص أسبوعيًا", rating: "٤٫٩", accent: "#C78B73" },
    { initial: "س", name: "سارة منصور", tag: "Mat", desc: "بيلاتس أرضي · ٤ سنوات خبرة", classes: "٧ حصص أسبوعيًا", rating: "٤٫٨", accent: "#A9B39B" },
    { initial: "ن", name: "نورة الفيصل", tag: "Power", desc: "باور ريفورمر · ٥ سنوات خبرة", classes: "٦ حصص أسبوعيًا", rating: "٤٫٩", accent: "#D6B47A" },
    { initial: "ر", name: "ريم الشمري", tag: "Sculpt", desc: "نحت وشد · ٣ سنوات خبرة", classes: "٥ حصص أسبوعيًا", rating: "٤٫٧", accent: "#8DA8B8" },
  ],

  // Reports
  reports: {
    revenueMonth: "١٢٤٬٠٠٠",
    revNote: "ريال · ▲ ١٨٪",
    newSubs: "٣٨٬٥٠٠",
    newSubsNote: "▲ ٢٢ اشتراك",
    avgValue: "٣٥٦",
    retention: "٩١٪",
    retentionNote: "▲ ٣٪",
    byMonth: [
      { m: "فبراير", v: 60 },
      { m: "مارس", v: 72 },
      { m: "أبريل", v: 80 },
      { m: "مايو", v: 92 },
      { m: "يونيو", v: 100 },
    ],
    byPackage: [
      { name: "بريميَم", pct: 54 },
      { name: "باقة ١٠ حصص", pct: 31 },
      { name: "شهرية مفتوحة", pct: 15 },
    ],
  },

  // Settings
  settings: {
    name: "ÉLAN — استوديو بيلاتس للسيدات",
    city: "الرياض",
    phone: "+966 11 234 5678",
    bookingWindow: "٧ أيام",
    cancellation: "قبل ٤ ساعات",
    maxBookings: "٣ حصص",
    notifications: ["تذكير قبل الحصة بساعة", "إشعار قائمة الانتظار", "تنبيه انتهاء الباقة"],
  },
};
