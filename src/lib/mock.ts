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
