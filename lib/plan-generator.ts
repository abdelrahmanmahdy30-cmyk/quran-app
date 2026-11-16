import { createHafs, surahNamesAr, Page, Surah } from "quran-meta";
import {
  MonthPlan,
  PlanDay,
  StudyDay,
  FridayDay,
  PageEntry,
  PageSurah,
} from "./six-month-plan-types";

const hafs = createHafs();

export const ARABIC_DAYS = [
  "الأحد",
  "الاثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
] as const;

export const FAR_CYCLE_DAYS = 19;

export const ARABIC_MONTH_NAMES = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
] as const;

/**
 * حساب التاريخ المحلي بصيغة YYYY-MM-DD بدقة من دون تحويل UTC
 */
export function formatLocalDate(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * مفاتيح التخزين الموحدة لكل خطة في localStorage
 */
export const PLAN_STORAGE_KEYS = {
  sixMonth: "hafiz_completed_days_six_month",
  custom: "hafiz_completed_days_custom",
} as const;

export function getPlanStorageKey(planId: string = "six_month"): string {
  if (planId === "custom") return PLAN_STORAGE_KEYS.custom;
  return PLAN_STORAGE_KEYS.sixMonth;
}

/**
 * استخراج بيانات الصفحة والسور والآيات بدقة من حزمة quran-meta بنوع صريح بلا as any
 */
export function getPageEntry(pageNum: number): PageEntry {
  const ayahs = Array.from(hafs.ayahsInPage(pageNum as Page));
  const surahMap = new Map<number, { first: number; last: number }>();

  for (const [surahNum, ayahNum] of ayahs) {
    if (!surahMap.has(surahNum)) {
      surahMap.set(surahNum, { first: ayahNum, last: ayahNum });
    } else {
      surahMap.get(surahNum)!.last = ayahNum;
    }
  }

  const sList: PageSurah[] = [];
  for (const [surahNum, range] of surahMap.entries()) {
    const arabicName = surahNamesAr[surahNum as Surah]?.[1] || "";
    sList.push({
      n: arabicName,
      f: range.first,
      t: range.last,
    });
  }

  return {
    p: pageNum,
    s: sList,
  };
}

export interface PlanGeneratorOptions {
  startDate?: string;
  endDate?: string;
  totalPages?: number;
}

/**
 * دالة توليد الخطة المعتمدة ديناميكياً بدقة 100%:
 * - 181 يوماً تقويمياً (1 نوفمبر 2026 - 30 أبريل 2027)
 * - 26 جمعة مراجعة بلا حفظ جديد
 * - 155 يوم حفظ: 139 يوماً × 4 صفحات + 16 يوماً × 3 صفحات = 604 صفحات
 * - الختمة تنتهي يوم الخميس 2027-04-29 عند ص 604
 * - المراجعة القريبة = ورد آخر يومين حفظ (8 صفحات، و6 في الأيام الـ16 الأخيرة)
 * - المراجعة البعيدة = تدوير دوري لكامل المحفوظ القديم بلا تداخل وبلا فجوة تتجاوز 30 يوماً
 */
export function generatePlan(options: PlanGeneratorOptions = {}): MonthPlan[] {
  const startDateStr = options.startDate || "2026-11-01";
  const endDateStr = options.endDate || "2027-04-30";
  const totalPages = options.totalPages || 604;

  const [startYear, startMonth, startDay] = startDateStr.split("-").map(Number);
  const [endYear, endMonth, endDay] = endDateStr.split("-").map(Number);

  let cur = new Date(startYear, startMonth - 1, startDay);
  const finishDate = new Date(endYear, endMonth - 1, endDay);

  let currentPage = 1;
  let studyDayIndex = 1;
  let weekIndex = 1;
  let weekPagesAcc: PageEntry[] = [];
  let farReviewPointer = 0;

  // سجل صفحات الحفظ لكل يوم دراسة لاستخراج المراجعة القريبة بدقة ورد آخر يومين
  const studyDayPagesHistory = new Map<number, PageEntry[]>();

  const monthsMap = new Map<string, MonthPlan>();

  while (cur <= finishDate) {
    const dateStr = formatLocalDate(cur);
    const dayOfWeek = cur.getDay(); // 0 = الأحد, 5 = الجمعة
    const dayName = ARABIC_DAYS[dayOfWeek];
    const monthKey = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}`;
    const monthName = `${ARABIC_MONTH_NAMES[cur.getMonth()]} ${cur.getFullYear()}`;

    if (!monthsMap.has(monthKey)) {
      monthsMap.set(monthKey, {
        name: monthName,
        pageFrom: currentPage,
        pageTo: currentPage,
        totalPages: 0,
        studyDaysCount: 0,
        fridaysCount: 0,
        days: [],
      });
    }
    const currentMonthData = monthsMap.get(monthKey)!;

    if (dayOfWeek === 5) {
      // الجمعة: مراجعة أسبوعية بلا حفظ جديد
      currentMonthData.fridaysCount++;

      // المراجعة القريبة يوم الجمعة = ورد آخر يومين حفظ في الأسبوع
      const lastStudyIdx = studyDayIndex - 1;
      const nearPages: PageEntry[] = [];
      if (lastStudyIdx >= 2) {
        nearPages.push(...(studyDayPagesHistory.get(lastStudyIdx - 1) || []));
        nearPages.push(...(studyDayPagesHistory.get(lastStudyIdx) || []));
      } else if (lastStudyIdx === 1) {
        nearPages.push(...(studyDayPagesHistory.get(1) || []));
      }

      // المراجعة البعيدة: كل المحفوظ الأقدم من المراجعة القريبة
      const memorizedBefore = currentPage - 1;
      const nearMin = nearPages.length > 0 ? nearPages[0].p : memorizedBefore + 1;
      const eligibleFarMax = Math.max(0, nearMin - 1);

      const farPages: PageEntry[] = [];
      let farCount = 0;
      if (eligibleFarMax > 0) {
        // دورة FAR_CYCLE_DAYS (19) يوماً: ceil(القديم / FAR_CYCLE_DAYS) صفحة يومياً مع التدوير عند نهاية المحفوظ القديم
        const dailyFarCount = Math.ceil(eligibleFarMax / FAR_CYCLE_DAYS);
        for (let i = 0; i < dailyFarCount; i++) {
          const p = (farReviewPointer % eligibleFarMax) + 1;
          farPages.push(getPageEntry(p));
          farReviewPointer = (farReviewPointer + 1) % eligibleFarMax;
        }
        farCount = farPages.length;
      }

      const fridayDay: FridayDay = {
        date: dateStr,
        dayName,
        type: "friday",
        weekNumber: weekIndex,
        weekPages: [...weekPagesAcc],
        nearPages,
        farPages,
        farCount,
        oldPagesCount: eligibleFarMax,
      };

      currentMonthData.days.push(fridayDay);
      weekPagesAcc = [];
      weekIndex++;
    } else {
      // يوم حفظ جديد (السبت - الخميس)
      currentMonthData.studyDaysCount++;

      // المعادلة المقفولة: 139 يوماً بـ 4 صفحات + 16 يوماً بـ 3 صفحات = 604
      const countForToday = studyDayIndex <= 139 ? 4 : 3;

      const newPages: PageEntry[] = [];
      let summaryFrom = "";
      let summaryTo = "";

      if (currentPage <= totalPages) {
        const startP = currentPage;
        const endP = Math.min(totalPages, currentPage + countForToday - 1);
        for (let p = startP; p <= endP; p++) {
          const entry = getPageEntry(p);
          newPages.push(entry);
          weekPagesAcc.push(entry);
        }
        currentPage = endP + 1;

        const firstS = newPages[0].s[0];
        const lastS = newPages[newPages.length - 1].s[newPages[newPages.length - 1].s.length - 1];
        summaryFrom = `${firstS.n} ${firstS.f}`;
        summaryTo = `${lastS.n} ${lastS.t}`;
      }

      studyDayPagesHistory.set(studyDayIndex, newPages);

      // المراجعة القريبة = ورد آخر يومين حفظ (8 صفحات في مرحلة الـ4، و6 في الـ16 يوماً الأخيرة)
      const nearPages: PageEntry[] = [];
      if (studyDayIndex === 1) {
        // اليوم الأول: لا يوجد حفظ سابق
      } else if (studyDayIndex === 2) {
        nearPages.push(...(studyDayPagesHistory.get(1) || []));
      } else {
        nearPages.push(...(studyDayPagesHistory.get(studyDayIndex - 2) || []));
        nearPages.push(...(studyDayPagesHistory.get(studyDayIndex - 1) || []));
      }

      // المراجعة البعيدة = المحفوظ الأقدم من نافذة القريب (بلا تداخل مع القريب ولا صفحات لم تحفظ)
      const memorizedBefore = newPages.length > 0 ? newPages[0].p - 1 : currentPage - 1;
      const nearMin = nearPages.length > 0 ? nearPages[0].p : memorizedBefore + 1;
      const eligibleFarMax = Math.max(0, nearMin - 1);

      const farPages: PageEntry[] = [];
      let farCount = 0;
      if (eligibleFarMax > 0) {
        // دورة FAR_CYCLE_DAYS (19) يوماً: ceil(القديم / FAR_CYCLE_DAYS) صفحة يومياً مع التدوير عند نهاية المحفوظ القديم
        const dailyFarCount = Math.ceil(eligibleFarMax / FAR_CYCLE_DAYS);
        for (let i = 0; i < dailyFarCount; i++) {
          const p = (farReviewPointer % eligibleFarMax) + 1;
          farPages.push(getPageEntry(p));
          farReviewPointer = (farReviewPointer + 1) % eligibleFarMax;
        }
        farCount = farPages.length;
      }

      const studyDay: StudyDay = {
        date: dateStr,
        dayName,
        type: "study",
        dayNumber: studyDayIndex,
        newPages,
        nearPages,
        farPages,
        farCount,
        oldPagesCount: eligibleFarMax,
        summaryFrom,
        summaryTo,
        pageCount: newPages.length,
      };

      currentMonthData.days.push(studyDay);
      studyDayIndex++;
    }

    cur.setDate(cur.getDate() + 1);
  }

  const months = Array.from(monthsMap.values());
  months.forEach((m) => {
    const studyDays = m.days.filter((d) => d.type === "study" && d.newPages && d.newPages.length > 0);
    if (studyDays.length > 0) {
      m.pageFrom = (studyDays[0] as StudyDay).newPages[0].p;
      const lastDay = studyDays[studyDays.length - 1] as StudyDay;
      m.pageTo = lastDay.newPages[lastDay.newPages.length - 1].p;
      m.totalPages = m.pageTo - m.pageFrom + 1;
    } else {
      m.pageFrom = 0;
      m.pageTo = 0;
      m.totalPages = 0;
    }
  });

  return months;
}
