import { describe, it, expect } from "vitest";
import { generatePlan } from "../lib/plan-generator";
import { createHafs, surahNamesAr, Page, Surah } from "quran-meta";
import { StudyDay, PlanDay } from "../lib/six-month-plan-types";

describe("تدقيق الحسابات واشتقاق بيانات الخطة والسور من مصدرها الأصلي", () => {
  const plan = generatePlan();
  const allDays = plan.flatMap((m) => m.days);
  const studyDays = allDays.filter((d): d is StudyDay => d.type === "study");
  const hafs = createHafs();

  it("1. تحديد يوم الختمة ديناميكياً بالبحث عن الصفحة 604 في الخطة", () => {
    const khatmaDay = studyDays.find((d) => d.newPages.some((p) => p.p === 604));
    expect(khatmaDay).toBeDefined();
    expect(khatmaDay?.date).toBe("2027-04-29");
    expect(khatmaDay?.dayName).toBe("الخميس");
    expect(khatmaDay?.dayNumber).toBe(155);
  });

  it("2. اشتقاق الآيات والسور المحفوظة من الصفحات 1-4 (ورد اليوم الأول)", () => {
    const pages = [1, 2, 3, 4];
    const surahAyahs = new Map<number, Set<number>>();

    for (const p of pages) {
      for (const [s, a] of hafs.ayahsInPage(p as Page)) {
        if (!surahAyahs.has(s)) surahAyahs.set(s, new Set());
        surahAyahs.get(s)!.add(a);
      }
    }

    // سورة الفاتحة (سورة 1)
    const fatihaAyahs = surahAyahs.get(1);
    expect(fatihaAyahs).toBeDefined();
    expect(fatihaAyahs?.size).toBe(7);
    expect(hafs.getAyahCountInSurah(1 as Surah)).toBe(7);
    // إذن الفاتحة مكتملة تماماً

    // سورة البقرة (سورة 2)
    const baqarahAyahs = surahAyahs.get(2);
    expect(baqarahAyahs).toBeDefined();
    expect(baqarahAyahs?.size).toBe(24); // الآيات 1 إلى 24
    expect(hafs.getAyahCountInSurah(2 as Surah)).toBe(286);
    // إذن البقرة قيد الحفظ بنسبة 24 / 286

    // إجمالي الآيات المحفوظة في اليوم الأول
    const totalVerses = Array.from(surahAyahs.values()).reduce((sum, s) => sum + s.size, 0);
    expect(totalVerses).toBe(31); // 7 + 24 = 31
  });

  it("3. التحقق من حساب الأيام المنقضية والمتبقية تقويمياً", () => {
    const startDateStr = "2026-11-01";
    const khatmaDateStr = "2027-04-29";
    const calendarEndDateStr = "2027-04-30";

    const [sy, sm, sd] = startDateStr.split("-").map(Number);
    const [ky, km, kd] = khatmaDateStr.split("-").map(Number);
    const [ey, em, ed] = calendarEndDateStr.split("-").map(Number);

    const start = new Date(sy, sm - 1, sd);
    const khatma = new Date(ky, km - 1, kd);
    const end = new Date(ey, em - 1, ed);

    // الفرق بين البداية والختمة بالأيام
    const daysToKhatma = Math.round((khatma.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    expect(daysToKhatma).toBe(179); // 179 يوماً بين 1 نوفمبر و29 أبريل

    // إجمالي أيام الخطة شاملاً يوم البداية والنهاية
    const totalCalendarDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    expect(totalCalendarDays).toBe(181);
  });
});
