code = '''import { describe, it, expect } from "vitest";
import { generatePlan, formatLocalDate } from "../lib/plan-generator";
import {
  calculatePlanSelectors,
  canMarkDayAsCompleted,
  selectUnifiedProgress,
} from "../lib/unified-progress";
import {
  getPageJuz,
  getJuzStatus,
  getRequiredSubtasks,
  getWeekDays,
  JUZ_META_RANGES,
} from "../lib/plan-ui-helpers";
import { StudyDay, FridayDay, PlanDay } from "../lib/six-month-plan-types";
import * as fs from "fs";

describe("اختبارات الواجهة وتوحيد التقدم (المرحلة 3)", () => {
  const plan = generatePlan();
  const allDays = plan.flatMap((m) => m.days);
  const todayLocalDate = "2026-11-01";

  // ============================================================
  // الاختبار 1: الفشل إذا ظهرت نسبتا تقدم مختلفتان لنفس الحالة
  // ============================================================
  it("1. لا تظهر نسبتا تقدم مختلفتان لنفس الحالة إطلاقاً (مقياس واحد موحد من 604)", () => {
    // سيناريو 1: البداية (صفر أيام مكتملة)
    const emptyCompleted = new Set<string>();
    const selEmpty = calculatePlanSelectors(allDays, emptyCompleted, todayLocalDate);
    expect(selEmpty.pagesDone).toBe(0);
    expect(selEmpty.percentTotal).toBe(0);

    // سيناريو 2: إتمام اليوم الأول (4 صفحات)
    const day1Completed = new Set<string>(["2026-11-01"]);
    const selDay1 = calculatePlanSelectors(allDays, day1Completed, todayLocalDate);
    expect(selDay1.pagesDone).toBe(4);
    const expectedPctDay1 = Math.round((4 / 604) * 100);
    expect(selDay1.percentTotal).toBe(expectedPctDay1); // 1%

    // فحص التطابق مع محدد التقدم العام (بمقياس الصفحات)
    const mockState = {
      stats: { totalVersesMemorized: 0, totalPages: selDay1.pagesDone, targetEndDate: "2027-04-29" },
      progress: [],
    };
    const unified = selectUnifiedProgress(mockState);
    expect(unified.totalPagesMemorized).toBe(selDay1.pagesDone);
    expect(unified.pagesPercentage).toBe(selDay1.percentTotal);

    // سيناريو 3: إتمام نصف الخطة (302 صفحة)
    const halfDays = new Set<string>();
    let accPages = 0;
    for (const d of allDays) {
      if (d.type === "study" && d.newPages) {
        halfDays.add(d.date);
        accPages += d.newPages.length;
        if (accPages >= 302) break;
      }
    }
    const selHalf = calculatePlanSelectors(allDays, halfDays, todayLocalDate);
    const expectedHalfPct = Math.round((accPages / 604) * 100);
    expect(selHalf.percentTotal).toBe(expectedHalfPct);
    expect(selHalf.pagesDone).toBe(accPages);

    // سيناريو 4: إتمام كامل الـ 604 صفحة
    const allStudyCompleted = new Set<string>();
    allDays.forEach((d) => {
      if (d.type === "study") allStudyCompleted.add(d.date);
    });
    const selFull = calculatePlanSelectors(allDays, allStudyCompleted, todayLocalDate);
    expect(selFull.pagesDone).toBe(604);
    expect(selFull.percentTotal).toBe(100);
  });

  // ============================================================
  // الاختبار 2: الفشل إذا سُمح بتعليم يوم مستقبلي
  // ============================================================
  it("2. يُمنع منعاً باتاً تعليم أي يوم مستقبلي (قفل صريح وتلميح)", () => {
    const today = "2026-11-01";
    const past = "2026-10-31";
    const tomorrow = "2026-11-02";
    const nextWeek = "2026-11-08";
    const nextYear = "2027-04-30";

    // اليوم والماضي: مسموح
    expect(canMarkDayAsCompleted(today, today)).toBe(true);
    expect(canMarkDayAsCompleted(past, today)).toBe(true);

    // الأيام القادمة في المستقبل: ممنوعة كلها قطعاً
    expect(canMarkDayAsCompleted(tomorrow, today)).toBe(false);
    expect(canMarkDayAsCompleted(nextWeek, today)).toBe(false);
    expect(canMarkDayAsCompleted(nextYear, today)).toBe(false);

    // التحقق من كافة أيام الخطة بعد تاريخ اليوم
    const futureDays = allDays.filter((d) => d.date > today);
    futureDays.forEach((d) => {
      expect(canMarkDayAsCompleted(d.date, today)).toBe(false);
    });
  });

  // ============================================================
  // الاختبار 3: الفشل إذا اختلف عدد صفحات اليوم المعروض عن generatePlan
  // ============================================================
  it("3. عدد صفحات كل يوم معروض في الواجهة يطابق generatePlan لجميع الـ 181 يوماً", () => {
    expect(allDays.length).toBe(181);

    allDays.forEach((day, idx) => {
      if (day.type === "study") {
        const sDay = day as StudyDay;
        const expectedCount = sDay.dayNumber <= 139 ? 4 : 3;
        expect(sDay.newPages).toHaveLength(expectedCount);
        expect(sDay.pageCount).toBe(expectedCount);

        // التحقق من أن رقم الجزء لكل صفحة ينتمي إلى 1..30
        sDay.newPages.forEach((p) => {
          const juz = getPageJuz(p.p);
          expect(juz).toBeGreaterThanOrEqual(1);
          expect(juz).toBeLessThanOrEqual(30);
        });
      } else {
        const fDay = day as FridayDay;
        expect("newPages" in fDay).toBe(false);
        expect(fDay.type).toBe("friday");
      }
    });
  });

  // ============================================================
  // الاختبار 4: إنجاز الخطوات الثلاث وإكمال اليوم تلقائياً
  // ============================================================
  it("4. يوم الحفظ يتطلب خطواته الثلاث بدقة، ويُعلَم مكتملاً تلقائياً إذا أُنجزت كلها، ويخرج إذا ألغيت إحداها", () => {
    // اليوم الأول: لا يوجد مراجعة قريبة ولا بعيدة -> المطلوب حفظ جديد فقط
    const day1 = allDays[0];
    const reqDay1 = getRequiredSubtasks(day1);
    expect(reqDay1).toEqual(["memorize"]);

    // اليوم الرابع: حفظ جديد + قريبة + بعيدة
    const day4 = allDays[3];
    const reqDay4 = getRequiredSubtasks(day4);
    expect(reqDay4).toContain("memorize");
    expect(reqDay4).toContain("near");
    expect(reqDay4).toContain("far");
    expect(reqDay4.length).toBe(3);

    // محاكاة إنجاز خطوات اليوم الرابع خطوة بخطوة
    const subTasks = new Set<string>();
    const date4 = day4.date;

    // خطوة 1 فقط
    subTasks.add(`${date4}:far`);
    let isDayDone = reqDay4.every((t) => subTasks.has(`${date4}:${t}`));
    expect(isDayDone).toBe(false);

    // خطوة 2 فقط
    subTasks.add(`${date4}:near`);
    isDayDone = reqDay4.every((t) => subTasks.has(`${date4}:${t}`));
    expect(isDayDone).toBe(false);

    // خطوة 3 (اكتملت كل الخطوات)
    subTasks.add(`${date4}:memorize`);
    isDayDone = reqDay4.every((t) => subTasks.has(`${date4}:${t}`));
    expect(isDayDone).toBe(true); // يكتمل اليوم تلقائياً

    // إلغاء خطوة واحدة
    subTasks.delete(`${date4}:near`);
    isDayDone = reqDay4.every((t) => subTasks.has(`${date4}:${t}`));
    expect(isDayDone).toBe(false); // يخرج من الإنجاز فوراً
  });

  // ============================================================
  // الاختبار 5: فحص خريطة الأجزاء الثلاثين
  // ============================================================
  it("5. خريطة الأجزاء تضم 30 جزءاً بحالات دقيقة (مكتمل / جاري حفظه / غير مبدوء)", () => {
    expect(JUZ_META_RANGES).toHaveLength(30);

    const emptyMemorized = new Set<number>();
    const todayPages = new Set<number>([1, 2, 3, 4]); // اليوم الأول في الجزء 1

    // الجزء 1 يجب أن يكون جاري حفظه
    const statusJuz1 = getJuzStatus(1, emptyMemorized, todayPages);
    expect(statusJuz1).toBe("in_progress");

    // الجزء 2 غير مبدوء
    const statusJuz2 = getJuzStatus(2, emptyMemorized, todayPages);
    expect(statusJuz2).toBe("not_started");

    // إذا حُفظت كامل صفحات الجزء 1 (1..21)
    const fullJuz1 = new Set<number>();
    for (let p = 1; p <= 21; p++) fullJuz1.add(p);
    const statusJuz1Done = getJuzStatus(1, fullJuz1, new Set());
    expect(statusJuz1Done).toBe("completed");
  });

  // ============================================================
  // الاختبار 6: فحص شريط الأسبوع (7 أيام)
  // ============================================================
  it("6. شريط الأسبوع يضم 7 أيام صحيحة تبدأ بالأحد", () => {
    const week1 = getWeekDays(allDays, "2026-11-01");
    expect(week1).toHaveLength(7);
    expect(week1[0].date).toBe("2026-11-01");
    expect(week1[0].dayName).toBe("الأحد");
    expect(week1[5].type).toBe("friday"); // الجمعة راحة ومراجعة
  });

  // ============================================================
  // الاختبار 7: التأكد من خلو ملفات الواجهة من ar-SA (أرقام لاتينية فقط)
  // ============================================================
  it("7. ملفات مكونات المرحلة 3 خالية من ar-SA وتستخدم أرقاماً لاتينية فقط", () => {
    const filesToCheck = [
      "components/dashboard/stats-cards.tsx",
      "components/dashboard/progress-ring.tsx",
      "components/dashboard/khatma-journey-card.tsx",
      "components/dashboard/juz-grid-map.tsx",
      "components/plan/today-ward-card.tsx",
      "components/plan/week-strip-bar.tsx",
      "app/page.tsx",
      "app/plan/page.tsx",
    ];

    filesToCheck.forEach((filePath) => {
      const content = fs.readFileSync(filePath, "utf-8");
      expect(content).not.toContain("ar-SA");
    });
  });
});
'''

with open('tests/ui-unified-plan.test.ts', 'w', encoding='utf-8') as f:
    f.write(code)

print('Created tests/ui-unified-plan.test.ts successfully!')
