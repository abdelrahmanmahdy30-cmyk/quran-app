import { useMemorizationStore } from "./memorization-store";
import type { MemorizationProgress } from "./quran-data";
import {
  TOTAL_VERSES,
  TOTAL_PAGES,
  calculateProgress,
  calculateRemainingDays,
} from "./quran-data";
import { calculateCompletedJuzCount } from "./quran-metadata";
import { formatLocalDate, PLAN_STORAGE_KEYS, getPlanStorageKey } from "./plan-generator";

export interface UnifiedProgress {
  // الآيات
  totalVersesMemorized: number;
  totalVerses: number;
  versesPercentage: number;

  // الصفحات
  totalPagesMemorized: number;
  totalPages: number;
  pagesPercentage: number;

  // السور والأجزاء
  completedSurahsCount: number;
  inProgressSurahsCount: number;
  notStartedSurahsCount: number;
  completedJuzCount: number;

  // الأيام والتواريخ
  remainingDays: number;
  todayLocalDate: string;
}

/**
 * محدد التقدم الموحد (Pure Selector)
 * يضمن أن أرقام التقدم (الخطة، لوحة التحكم، الإحصائيات) تصدر من دالة موحدة واحدة
 */
export function selectUnifiedProgress(state: {
  stats: { totalVersesMemorized: number; totalPages: number; targetEndDate: string };
  progress: MemorizationProgress[];
}): UnifiedProgress {
  const versesMemorized = state.stats?.totalVersesMemorized || 0;
  const versesPercentage = calculateProgress(versesMemorized, TOTAL_VERSES);

  const completedSurahs = state.progress.filter((p) => p.status === "memorized").length;
  const inProgressSurahs = state.progress.filter((p) => p.status === "in_progress").length;
  const notStartedSurahs = state.progress.filter((p) => p.status === "not_started").length;
  const completedJuz = calculateCompletedJuzCount(state.progress);

  const pagesMemorized = state.stats?.totalPages || 0;
  const pagesPercentage = Math.round((pagesMemorized / TOTAL_PAGES) * 100);

  const today = formatLocalDate(new Date());
  const remaining = calculateRemainingDays(state.stats?.targetEndDate || today);

  return {
    totalVersesMemorized: versesMemorized,
    totalVerses: TOTAL_VERSES,
    versesPercentage,
    totalPagesMemorized: pagesMemorized,
    totalPages: TOTAL_PAGES,
    pagesPercentage,
    completedSurahsCount: completedSurahs,
    inProgressSurahsCount: inProgressSurahs,
    notStartedSurahsCount: notStartedSurahs,
    completedJuzCount: completedJuz,
    remainingDays: Math.max(0, remaining),
    todayLocalDate: today,
  };
}

/**
 * خطاف React لاستخدام محدد التقدم الموحد مباشرة في المكونات
 */
export function useUnifiedProgress(): UnifiedProgress {
  return useMemorizationStore((state) => selectUnifiedProgress(state));
}

/**
 * التحقق من إمكانية تعليم اليوم:
 * يُسمح بالتعليم إذا كان التاريخ <= اليوم الحالي،
 * أو إذا كان اليوم السابق في ترتيب الخطة مكتملاً في السجل الموحد
 */
export function canMarkDayAsCompleted(
  dateStr: string,
  todayLocalDate: string = formatLocalDate(),
  record?: { frozenDays?: Record<string, any> },
  planDays?: Array<{ date: string }>
): boolean {
  if (dateStr <= todayLocalDate) {
    return true;
  }
  if (!record || !planDays || planDays.length === 0) {
    return false;
  }
  const targetIndex = planDays.findIndex((d) => d.date === dateStr);
  if (targetIndex <= 0) {
    return false;
  }
  const prevDay = planDays[targetIndex - 1];
  if (!record.frozenDays?.[prevDay.date]) {
    return false;
  }
  if (prevDay.date > todayLocalDate) {
    return canMarkDayAsCompleted(prevDay.date, todayLocalDate, record, planDays);
  }
  return true;
}

export { PLAN_STORAGE_KEYS, getPlanStorageKey, formatLocalDate };

export interface PlanSelectorsResult {
  pagesDone: number;
  percentTotal: number;
  percentMonth: number;
  percentWeek: number;
  daysDone: number;
  totalDays: number;
  daysRemaining: number;
  pagesRemaining: number;
  khatmaDate: string;
  aheadOrBehindPages: number;
  streak: number;
  motivationalMsg: string;
}

/**
 * محددات الخطة النقية (Pure Plan Selectors)
 * تحسب كل مؤشرات التقدم من سجل الأيام المكتملة فقط بلا أي افتراض عشوائي
 */
export function calculatePlanSelectors(
  days: Array<{ date: string; type: string; newPages?: Array<{ p: number }> }>,
  completedDays: Set<string>,
  todayLocalDate: string = formatLocalDate()
): PlanSelectorsResult {
  const totalDays = days.length;
  const completedList = days.filter((d) => completedDays.has(d.date));
  const daysDone = completedList.length;
  const daysRemaining = Math.max(0, totalDays - daysDone);

  // حساب الصفحات المنجزة من سجل الأيام المكتملة فقط
  let pagesDone = 0;
  completedList.forEach((d) => {
    if (d.type === "study" && d.newPages) {
      pagesDone += d.newPages.length;
    }
  });

  const totalPages = 604;
  const pagesRemaining = Math.max(0, totalPages - pagesDone);
  const percentTotal = totalPages > 0 ? Math.round((pagesDone / totalPages) * 100) : 0;

  // تاريخ الختمة المجدول
  const lastDay = days[days.length - 1];
  const khatmaDate = lastDay ? lastDay.date : todayLocalDate;

  // حساب التقدم المتوقع حتى تاريخ اليوم
  let expectedPages = 0;
  days.forEach((d) => {
    if (d.date <= todayLocalDate && d.type === "study" && d.newPages) {
      expectedPages += d.newPages.length;
    }
  });
  const aheadOrBehindPages = pagesDone - expectedPages;

  // حساب السلسلة (streak) من تاريخ اليوم رجوعاً
  let streak = 0;
  const sortedDays = [...days].sort((a, b) => b.date.localeCompare(a.date));
  const pastDays = sortedDays.filter((d) => d.date <= todayLocalDate);
  for (const d of pastDays) {
    if (completedDays.has(d.date)) {
      streak++;
    } else {
      if (d.date === todayLocalDate && streak === 0) continue;
      break;
    }
  }

  // نسبة الشهر الحالي
  const [todayYear, todayMonth] = todayLocalDate.split("-");
  const currentMonthDays = days.filter((d) => d.date.startsWith(`${todayYear}-${todayMonth}`));
  const currentMonthDone = currentMonthDays.filter((d) => completedDays.has(d.date)).length;
  const percentMonth = currentMonthDays.length > 0 ? Math.round((currentMonthDone / currentMonthDays.length) * 100) : 0;

  // رسالة تحفيزية
  let motivationalMsg = "";
  if (percentTotal === 0) motivationalMsg = "ابدأ رحلتك مع القرآن الكريم اليوم! 🌟";
  else if (percentTotal < 10) motivationalMsg = "بداية موفقة! كل خطوة تقربك من الختمة 💪";
  else if (percentTotal < 25) motivationalMsg = "أنت على الطريق الصحيح، واصل المسيرة! 🚀";
  else if (percentTotal < 50) motivationalMsg = "ربع القرآن خلفك! همة واستمرار 🌙";
  else if (percentTotal < 75) motivationalMsg = "رائع! تجاوزت النصف، الختمة قريبة إن شاء الله ⭐";
  else if (percentTotal < 90) motivationalMsg = "ثلاثة أرباع القرآن! أنت بطل حقيقي 🏆";
  else if (percentTotal < 100) motivationalMsg = "اقتربت من الختمة، لا تتوقف الآن! 🎉";
  else motivationalMsg = "مبارك! أتممت حفظ القرآن الكريم كاملاً 🕌";

  return {
    pagesDone,
    percentTotal,
    percentMonth,
    percentWeek: percentMonth,
    daysDone,
    totalDays,
    daysRemaining,
    pagesRemaining,
    khatmaDate,
    aheadOrBehindPages,
    streak,
    motivationalMsg,
  };
}

