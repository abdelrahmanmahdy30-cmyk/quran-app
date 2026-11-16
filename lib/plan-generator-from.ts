import { createHafs, Page, Surah } from "quran-meta";
import {
  MonthPlan,
  PlanDay,
  StudyDay,
  FridayDay,
  PageEntry,
  PageSurah,
} from "./six-month-plan-types";
import {
  ARABIC_DAYS,
  ARABIC_MONTH_NAMES,
  FAR_CYCLE_DAYS,
  formatLocalDate,
  getPageEntry,
  generatePlan,
} from "./plan-generator";
import { DaySnapshot } from "./unified-plan-store";

export interface GeneratePlanFromOptions {
  startPage?: number;
  startDate?: string; // YYYY-MM-DD
  memorizedPages?: number[];
  frozenDays?: Record<string, DaySnapshot>;
  today?: string; // YYYY-MM-DD
  wrapAround?: boolean;
  priorPagesMemorized?: boolean;
}

/**
 * دالة توليد الخطة التكيفية النقية (Pure Function):
 * تولد الخطة انطلاقاً من أي سورة/صفحة، وتتكيف مع تقدم أو تأخر المستخدم (Rebase)
 * مع الحفاظ المطلق على:
 * 1. التطابق التام مع الخطة الأصلية المقفولة عند البدء من ص 1 بدون تقدم (181 يوماً، ختمة 2027-04-29).
 * 2. الأيام المكتملة والمجمدة (frozenDays) لا تتغير أبداً.
 * 3. لا قفز ولا حفظ مضاعف عند التأخر.
 * 4. الجمعة راحة ومراجعة بلا حفظ جديد.
 * 5. المراجعة القريبة = ورد آخر يومين حفظ.
 * 6. المراجعة البعيدة = تدوير كامل المحفوظ القديم بمعدل ceil(N / 19) وبفجوة <= 30 يوماً.
 * 7. لا مراجعة لصفحة لم تُحفظ بعد.
 */
export function generatePlanFrom(options: GeneratePlanFromOptions = {}): MonthPlan[] {
  const startPage = Math.max(1, Math.min(604, options.startPage ?? 1));
  const startDateStr = options.startDate || "2026-11-01";
  const todayStr = options.today || formatLocalDate(new Date());
  const wrapAround = !!options.wrapAround;
  const priorPagesMemorized = !!options.priorPagesMemorized;
  const memorizedPages = options.memorizedPages ? [...options.memorizedPages] : [];
  const frozenDays = options.frozenDays || {};

  // الحالة المعيارية النظيفة: ص 1 وتاريخ 2026-11-01 بلا تقدم ولا تجمد
  if (
    startPage === 1 &&
    startDateStr === "2026-11-01" &&
    !wrapAround &&
    !priorPagesMemorized &&
    memorizedPages.length === 0 &&
    Object.keys(frozenDays).length === 0
  ) {
    return generatePlan({ startDate: startDateStr, totalPages: 604 });
  }

  // 1. تسلسل الصفحات المستهدفة للحفظ في الخطة
  const targetPagesSequence: number[] = [];
  if (wrapAround && startPage > 1) {
    for (let p = startPage; p <= 604; p++) targetPagesSequence.push(p);
    for (let p = 1; p < startPage; p++) targetPagesSequence.push(p);
  } else {
    for (let p = startPage; p <= 604; p++) targetPagesSequence.push(p);
  }

  // 2. الصفحات المحفوظة مسبقاً قبل نقطة البداية (إذا اختار المستخدم نعم)
  const priorPages: number[] = [];
  if (priorPagesMemorized && !wrapAround && startPage > 1) {
    for (let p = 1; p < startPage; p++) priorPages.push(p);
  }

  const memorizedSet = new Set<number>([...priorPages, ...memorizedPages]);
  const remainingPagesToMemorize = targetPagesSequence.filter((p) => !memorizedSet.has(p));

  const [startYear, startMonth, startDay] = startDateStr.split("-").map(Number);
  let cur = new Date(startYear, startMonth - 1, startDay);

  let studyDayIndex = 1;
  let weekIndex = 1;
  let weekPagesAcc: PageEntry[] = [];
  let farReviewPointer = 0;

  // سجل صفحات الحفظ لكل يوم دراسي لاستخراج القريبة بدقة
  const studyDayPagesHistory = new Map<number, PageEntry[]>();
  const allMemorizedSoFar: number[] = [...priorPages];
  const allMemorizedSet = new Set<number>(allMemorizedSoFar);

  const monthsMap = new Map<string, MonthPlan>();

  // يستمر التوليد حتى استيعاب جميع الأيام الماضية وحتى حفظ كامل الصفحات المستهدفة
  let hasMorePages = remainingPagesToMemorize.length > 0;
  let safetyLoopLimit = 1000;

  while ((hasMorePages || formatLocalDate(cur) <= todayStr) && safetyLoopLimit-- > 0) {
    const dateStr = formatLocalDate(cur);
    const dayOfWeek = cur.getDay(); // 0 = الأحد, 5 = الجمعة
    const dayName = ARABIC_DAYS[dayOfWeek];
    const monthKey = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}`;
    const monthName = `${ARABIC_MONTH_NAMES[cur.getMonth()]} ${cur.getFullYear()}`;

    if (!monthsMap.has(monthKey)) {
      monthsMap.set(monthKey, {
        name: monthName,
        pageFrom: 0,
        pageTo: 0,
        totalPages: 0,
        studyDaysCount: 0,
        fridaysCount: 0,
        days: [],
      });
    }
    const currentMonthData = monthsMap.get(monthKey)!;

    if (dayOfWeek === 5) {
      // الجمعة: راحة ومراجعة أسبوعية + بعيدة بلا حفظ جديد
      currentMonthData.fridaysCount++;

      // القريبة = ورد آخر يومين حفظ دراسة
      const lastStudyIdx = studyDayIndex - 1;
      const nearPages: PageEntry[] = [];
      if (lastStudyIdx >= 2) {
        nearPages.push(...(studyDayPagesHistory.get(lastStudyIdx - 1) || []));
        nearPages.push(...(studyDayPagesHistory.get(lastStudyIdx) || []));
      } else if (lastStudyIdx === 1) {
        nearPages.push(...(studyDayPagesHistory.get(1) || []));
      }

      const nearPNums = new Set<number>(nearPages.map((p) => p.p));
      const eligibleFar = allMemorizedSoFar.filter((p) => !nearPNums.has(p));
      const eligibleFarMax = eligibleFar.length;

      const farPages: PageEntry[] = [];
      let farCount = 0;
      if (eligibleFarMax > 0) {
        const dailyFarCount = Math.ceil(eligibleFarMax / FAR_CYCLE_DAYS);
        for (let i = 0; i < dailyFarCount; i++) {
          const p = eligibleFar[(farReviewPointer + i) % eligibleFarMax];
          farPages.push(getPageEntry(p));
        }
        farReviewPointer = (farReviewPointer + dailyFarCount) % eligibleFarMax;
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
      // يوم دراسي (السبت - الخميس)
      currentMonthData.studyDaysCount++;

      let newPages: PageEntry[] = [];
      let summaryFrom = "";
      let summaryTo = "";

      const frozenSnapshot = dateStr <= todayStr ? frozenDays[dateStr] : undefined;

      if (frozenSnapshot) {
        // 1. يوم مجمّد ومكتمل سابقاً: استعادة صفحاته المعتمدة
        const pList = frozenSnapshot.memorizedPagesSnapshot && frozenSnapshot.memorizedPagesSnapshot.length > 0
          ? frozenSnapshot.memorizedPagesSnapshot.slice(-frozenSnapshot.pagesCount)
          : [];
        newPages = pList.map(getPageEntry);
        for (const p of pList) {
          if (!allMemorizedSet.has(p)) {
            allMemorizedSet.add(p);
            allMemorizedSoFar.push(p);
          }
        }
      } else if (
        dateStr < todayStr &&
        (memorizedPages.length > 0 || Object.keys(frozenDays).length > 0)
      ) {
        // 2. يوم ماضٍ غير مكتمل (فائت) في خطة جارية: لا قفز ولا حفظ مضاعف
        newPages = [];
      } else {
        // 3. اليوم الحالي أو قادم: استهلاك الحصة من الصفحات المتبقية
        if (remainingPagesToMemorize.length > 0) {
          // الحصة: 4 صفحات يومياً، وفي اليوم الأخير الباقي فقط
          // (وإذا كانت الخطة المعيارية 604 صفحات من ص 1: 139×4 + 16×3)
          let quota = 4;
          if (startPage === 1 && targetPagesSequence.length === 604 && studyDayIndex > 139) {
            quota = 3;
          }
          const takeCount = Math.min(quota, remainingPagesToMemorize.length);
          const pNums = remainingPagesToMemorize.splice(0, takeCount);
          newPages = pNums.map(getPageEntry);

          for (const p of pNums) {
            if (!allMemorizedSet.has(p)) {
              allMemorizedSet.add(p);
              allMemorizedSoFar.push(p);
            }
          }
        }
      }

      if (newPages.length > 0) {
        weekPagesAcc.push(...newPages);
        const firstS = newPages[0].s[0];
        const lastPageSurahs = newPages[newPages.length - 1].s;
        const lastS = lastPageSurahs[lastPageSurahs.length - 1];
        summaryFrom = `${firstS.n} ${firstS.f}`;
        summaryTo = `${lastS.n} ${lastS.t}`;
      }

      studyDayPagesHistory.set(studyDayIndex, newPages);

      // المراجعة القريبة = ورد آخر يومين دراسيين
      const nearPages: PageEntry[] = [];
      if (studyDayIndex === 1) {
        // اليوم الأول
      } else if (studyDayIndex === 2) {
        nearPages.push(...(studyDayPagesHistory.get(1) || []));
      } else {
        nearPages.push(...(studyDayPagesHistory.get(studyDayIndex - 2) || []));
        nearPages.push(...(studyDayPagesHistory.get(studyDayIndex - 1) || []));
      }

      // المراجعة البعيدة = كل المحفوظ الأقدم من نافذة القريب واليوم
      const nearPNums = new Set<number>(nearPages.map((p) => p.p));
      const todayPNums = new Set<number>(newPages.map((p) => p.p));
      const eligibleFar = allMemorizedSoFar.filter((p) => !nearPNums.has(p) && !todayPNums.has(p));
      const eligibleFarMax = eligibleFar.length;

      const farPages: PageEntry[] = [];
      let farCount = 0;
      if (eligibleFarMax > 0) {
        const dailyFarCount = Math.ceil(eligibleFarMax / FAR_CYCLE_DAYS);
        for (let i = 0; i < dailyFarCount; i++) {
          const p = eligibleFar[(farReviewPointer + i) % eligibleFarMax];
          farPages.push(getPageEntry(p));
        }
        farReviewPointer = (farReviewPointer + dailyFarCount) % eligibleFarMax;
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

    hasMorePages = remainingPagesToMemorize.length > 0;
    cur.setDate(cur.getDate() + 1);
  }

  // تحديث بيانات نطاق الصفحات لكل شهر
  const months = Array.from(monthsMap.values());
  months.forEach((m) => {
    const studyDaysWithPages = m.days.filter(
      (d) => d.type === "study" && d.newPages && d.newPages.length > 0
    ) as StudyDay[];

    if (studyDaysWithPages.length > 0) {
      m.pageFrom = studyDaysWithPages[0].newPages[0].p;
      const lastDay = studyDaysWithPages[studyDaysWithPages.length - 1];
      m.pageTo = lastDay.newPages[lastDay.newPages.length - 1].p;
      m.totalPages = studyDaysWithPages.reduce((acc, d) => acc + d.newPages.length, 0);
    } else {
      m.pageFrom = 0;
      m.pageTo = 0;
      m.totalPages = 0;
    }
  });

  return months;
}
