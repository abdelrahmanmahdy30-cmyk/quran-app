/**
 * حساب التاريخ التقويمي المحلي بصيغة YYYY-MM-DD دون تحويل UTC
 */
export function formatLocalDate(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * smart-plan-engine.ts — المحرك الذكي والمتكامل لتخطيط ومتابعة حفظ القرآن ومراجعته وإتقانه
 *
 * يشمل:
 * 1. الحفظ الجديد المرن وحساب وتوزيع الصفحات دون تكرار أو فقدان
 * 2. المراجعة القريبة (فواصل: 1، 3، 7، 14، 30 يوماً) مع التكرار المتباعد
 * 3. المراجعة المتوسطة (للمحفوظ بعد التثبيت الأولي)
 * 4. المراجعة البعيدة (للمحفوظ القديم على المدى الطويل لحمايته من النسيان)
 * 5. المراجعة التراكمية (أسبوعية وشهرية للأرباع والأحزاب والأجزاء ككتل متصلة)
 * 6. نظام قياس الإتقان المستقل (6 مستويات إتقان، 5 درجات تقييم)
 * 7. النظام المرن للظروف الطارئة والانقطاع والتعافي
 * 8. نظام التخطيط الديناميكي ومقترحات التعديل دون تغيير صامت
 * 9. مرحلة ما بعد ختم القرآن (تثبيت القرآن ودورات الختم المستمرة)
 */

import { surahs, TOTAL_VERSES, TOTAL_PAGES, TOTAL_JUZ } from "./quran-data";
import { getSurahPageRange, getSurahsInPageRangeExact, getJuzForPage, getHizbForPage, getRubForPage } from "./quran-editions";

// ============================================================
// 1. مستويات الإتقان الستة (Mastery Levels)
// ============================================================
export type MasteryLevel =
  | "new"                 // 1. جديد: لم يثبت بعد
  | "stabilizing"         // 2. قيد التثبيت: يحتاج مراجعة قريبة
  | "good"                // 3. جيد: اجتاز المراجعات الأولى
  | "mastered"            // 4. متقن: ثبت في اختبارات ومراجعات متعددة
  | "needs_reinforcement" // 5. يحتاج تقوية: ظهرت فيه أخطاء أو ضعف
  | "regressed";          // 6. متراجع: يحتاج إلى إعادة تثبيت مكثفة

export interface MasteryLevelMeta {
  key: MasteryLevel;
  label: string;
  description: string;
  badgeClass: string;
  color: string;
}

export const MASTERY_LEVELS_META: Record<MasteryLevel, MasteryLevelMeta> = {
  new: {
    key: "new",
    label: "جديد",
    description: "حفظ حديث لم يثبت بعد، يحتاج بداية المراجعة القريبة",
    badgeClass: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    color: "text-blue-400",
  },
  stabilizing: {
    key: "stabilizing",
    label: "قيد التثبيت",
    description: "يجري تثبيته في المراجعات القريبة المتعاقبة",
    badgeClass: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    color: "text-amber-400",
  },
  good: {
    key: "good",
    label: "جيد",
    description: "اجتاز مراجعات الأسبوع والأسبوعين بنجاح واستقرار",
    badgeClass: "bg-gold/15 text-gold border-gold/30",
    color: "text-gold",
  },
  mastered: {
    key: "mastered",
    label: "متقن",
    description: "راسخ في الذاكرة ومجتاز لاختبارات دورية متعددة",
    badgeClass: "bg-emerald/15 text-emerald-bright border-emerald/30",
    color: "text-emerald-bright",
  },
  needs_reinforcement: {
    key: "needs_reinforcement",
    label: "يحتاج تقوية",
    description: "ظهرت فيه أخطاء أو تردد، يوضع في أولوية المراجعة",
    badgeClass: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    color: "text-orange-400",
  },
  regressed: {
    key: "regressed",
    label: "متراجع",
    description: "تعثر شديد أو انقطاع، يحتاج خطة إعادة تثبيت مكثفة",
    badgeClass: "bg-destructive/15 text-destructive border-destructive/30",
    color: "text-destructive",
  },
};

// ============================================================
// 2. درجات التقييم الخمس لجلسة التسميع (Review Grades)
// ============================================================
export type ReviewGrade =
  | "flawless"        // راجعت دون أخطاء
  | "minor_errors"    // أخطاء بسيطة
  | "frequent_errors" // أخطاء متكررة
  | "severe_struggle" // تعثر شديد
  | "failed";         // لم أستطع التسميع

export interface ReviewGradeMeta {
  key: ReviewGrade;
  label: string;
  sublabel: string;
  iconName: string;
  badgeClass: string;
  scoreBonus: number;
}

export const REVIEW_GRADES_META: Record<ReviewGrade, ReviewGradeMeta> = {
  flawless: {
    key: "flawless",
    label: "دون أخطاء",
    sublabel: "تسميع متقن وسلس دون تردد",
    iconName: "Sparkles",
    badgeClass: "bg-emerald/20 text-emerald-bright border-emerald/40",
    scoreBonus: 15,
  },
  minor_errors: {
    key: "minor_errors",
    label: "أخطاء بسيطة",
    sublabel: "هنة أو تصحيح ذاتي فوري مع استمرار السرد",
    iconName: "Check",
    badgeClass: "bg-gold/20 text-gold border-gold/40",
    scoreBonus: 8,
  },
  frequent_errors: {
    key: "frequent_errors",
    label: "أخطاء متكررة",
    sublabel: "وقفات وتلعثم في بعض الآيات",
    iconName: "HelpCircle",
    badgeClass: "bg-amber-500/20 text-amber-400 border-amber-500/40",
    scoreBonus: -10,
  },
  severe_struggle: {
    key: "severe_struggle",
    label: "تعثر شديد",
    sublabel: "صعوبة بالغة في التذكر مع اللجوء للمصحف",
    iconName: "AlertTriangle",
    badgeClass: "bg-orange-500/20 text-orange-400 border-orange-500/40",
    scoreBonus: -25,
  },
  failed: {
    key: "failed",
    label: "لم أستطع التسميع",
    sublabel: "نسيان كبير يستدعي إعادة الحفظ والتثبيت",
    iconName: "XCircle",
    badgeClass: "bg-destructive/20 text-destructive border-destructive/40",
    scoreBonus: -40,
  },
};

// ============================================================
// 3. سجل إتقان السورة (Surah Mastery Record)
// ============================================================
export interface ReviewHistoryEntry {
  date: string;
  grade: ReviewGrade;
  type: "near" | "medium" | "distant" | "cumulative" | "diagnostic";
  strengthBefore: number;
  strengthAfter: number;
  notes?: string;
}

export interface SurahMasteryRecord {
  surahId: number;
  masteryLevel: MasteryLevel;
  strength: number; // 0 - 100
  nearReviewStage: number; // 1: 1d, 2: 3d, 3: 7d, 4: 14d, 5: 30d, 6+: graduated to medium
  lastReviewDate: string | null;
  nextReviewDate: string;
  totalReviews: number;
  consecutivePasses: number;
  history: ReviewHistoryEntry[];
  lastCumulativeReviewDate?: string | null;
}

// ============================================================
// 4. إعدادات الخطة الشاملة (Plan Configuration)
// ============================================================
export interface PlanConfig {
  id: string;
  editionId: "madinah_604" | "shamarly_521" | "custom";
  totalPages: number;
  startDate: string;         // YYYY-MM-DD
  targetEndDate: string;     // YYYY-MM-DD
  targetDurationMonths: number;
  pagesPerDay: number;
  memorizeDaysPerWeek: number; // 5, 6, 7
  restDays: number[];         // 0=الأحد, 1=الإثنين ... 5=الجمعة, 6=السبت
  userLevel: "beginner" | "intermediate" | "advanced";
  dailyAvailableMinutes: number; // بالدقائق
  
  // المحفوظ السابق
  hasPriorMemorization: boolean;
  priorMemorizedSurahs: number[]; // أرقام السور المحفوظة مسبقاً
  
  // الظروف الطارئة
  emergencyPause?: {
    isActive: boolean;
    reason: "illness" | "travel" | "work_study" | "family" | "time_shortage" | "voluntary" | "other";
    startDate: string;
    expectedReturnDate?: string;
    notes?: string;
  };

  // العودة بعد انقطاع
  breakRecovery?: {
    isActive: boolean;
    breakStartDate: string;
    breakDaysCount: number;
    stage: "diagnostic" | "gradual_review" | "gradual_resumption" | "completed";
    reducedPacePercent: number; // مثلاً 50%
  };

  // مرحلة ما بعد ختم القرآن
  postCompletion?: {
    isActive: boolean;
    cycleDays: number; // 7، 10، 15، 30، 60 يوماً
    currentCycleNumber: number;
    completedCyclesCount: number;
    lastCycleStartDate?: string;
  };
}

// ============================================================
// 5. هيكل اليوم الواحد في الخطة (DayPlan)
// ============================================================
export interface ReviewTaskItem {
  surahId: number;
  surahName: string;
  fromPage: number;
  toPage: number;
  reviewType: "near" | "medium" | "distant" | "cumulative";
  stageLabel?: string;
  masteryLevel?: MasteryLevel;
  dueReason?: string;
}

export interface DayPlan {
  dayNumber: number;
  date: string;
  weekNumber: number;
  monthNumber: number;
  isRestDay: boolean;
  type: "memorize" | "review" | "both" | "rest" | "cumulative" | "recovery";
  
  // الحفظ الجديد
  memorizeFrom: number;
  memorizeTo: number;
  surahs: string[];
  
  // المراجعات المتنوعة
  nearReviews: ReviewTaskItem[];
  mediumReviews: ReviewTaskItem[];
  distantReviews: ReviewTaskItem[];
  cumulativeReviews: {
    label: string;
    surahNames: string[];
    fromPage: number;
    toPage: number;
    scope: "rub" | "hizb" | "juz" | "weekly";
  }[];
  
  // حقول التوافق مع العرض القديم
  reviewFrom: number;
  reviewTo: number;
  
  isToday: boolean;
  isPast: boolean;
  isCompleted: boolean;
  rescheduleReason?: string;
}

// ============================================================
// 6. مقترحات التعديل الديناميكي (Plan Proposals)
// ============================================================
export interface PlanProposal {
  id: string;
  title: string;
  reason: string;
  triggerType: "ahead" | "behind" | "high_errors" | "mastery_improved" | "reviews_backlog" | "time_change";
  suggestedAdjustment: {
    pagesPerDay?: number;
    targetEndDate?: string;
    memorizeDaysPerWeek?: number;
    temporaryPauseMemorization?: boolean;
  };
  createdAt: string;
  status: "pending" | "accepted" | "dismissed";
}

// ============================================================
// 7. خطة التعافي (Recovery Plan)
// ============================================================
export interface RecoveryPlan {
  missedDays: number;
  missedMemorizationPages: number;
  urgentNearReviewsCount: number;
  weakSurahsCount: number;
  suggestedPacePagesPerDay: number;
  suggestedExtensionDays: number;
  newTargetEndDate: string;
  phases: {
    phaseName: string;
    durationDays: number;
    focus: string;
  }[];
}

// ============================================================
// 8. سجل التغييرات التاريخي (Plan Audit Log)
// ============================================================
export interface PlanHistoryEntry {
  id: string;
  date: string;
  action: string;
  details: string;
  previousEndDate?: string;
  newEndDate?: string;
}

// ============================================================
// الفواصل المتباعدة للمراجعة القريبة بالأيام
// ============================================================
export const NEAR_REVIEW_INTERVALS = [1, 3, 7, 14, 30];

/**
 * الخطة الافتراضية الذكية
 */
export function getDefaultPlanConfig(): PlanConfig {
  const today = new Date();
  const targetEnd = new Date(today);
  targetEnd.setMonth(targetEnd.getMonth() + 4);

  return {
    id: "default-plan",
    editionId: "madinah_604",
    totalPages: 604,
    startDate: formatLocalDate(today),
    targetEndDate: formatLocalDate(targetEnd),
    targetDurationMonths: 4,
    pagesPerDay: 5,
    memorizeDaysPerWeek: 6,
    restDays: [5], // الجمعة راحة
    userLevel: "intermediate",
    dailyAvailableMinutes: 45,
    hasPriorMemorization: false,
    priorMemorizedSurahs: [],
  };
}

/**
 * حساب الانتقال بين مستويات الإتقان والقوة بعد جلسة تسميع
 */
export function calculateMasteryTransition(
  currentRecord: SurahMasteryRecord,
  grade: ReviewGrade,
  reviewType: "near" | "medium" | "distant" | "cumulative" | "diagnostic" = "near"
): {
  newMasteryLevel: MasteryLevel;
  newStrength: number;
  newNearReviewStage: number;
  nextReviewDate: Date;
  consecutivePasses: number;
} {
  const meta = REVIEW_GRADES_META[grade];
  let strength = Math.min(100, Math.max(0, currentRecord.strength + meta.scoreBonus));
  let stage = currentRecord.nearReviewStage || 1;
  let passes = currentRecord.consecutivePasses || 0;
  let level = currentRecord.masteryLevel;

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  let nextIntervalDays = 1;

  switch (grade) {
    case "flawless": {
      passes += 1;
      strength = Math.min(100, strength + 5);
      if (reviewType === "near") {
        if (stage < 5) {
          nextIntervalDays = NEAR_REVIEW_INTERVALS[stage];
          stage += 1;
          level = stage >= 4 ? "good" : "stabilizing";
        } else {
          // تجاوز المراجعة القريبة
          nextIntervalDays = 30;
          stage = 6;
          level = strength >= 90 ? "mastered" : "good";
        }
      } else {
        // مراجعة متوسطة أو بعيدة
        nextIntervalDays = strength >= 90 ? 30 : 14;
        level = strength >= 90 ? "mastered" : "good";
      }
      break;
    }

    case "minor_errors": {
      passes += 1;
      if (reviewType === "near") {
        // تثبيت المرحلة الحالية وتكرارها
        const currentInterval = NEAR_REVIEW_INTERVALS[Math.min(stage - 1, NEAR_REVIEW_INTERVALS.length - 1)] || 3;
        nextIntervalDays = Math.max(2, Math.floor(currentInterval * 0.75));
        level = "stabilizing";
      } else {
        nextIntervalDays = 10;
        level = "good";
      }
      break;
    }

    case "frequent_errors": {
      passes = 0;
      level = "needs_reinforcement";
      // العودة لمرحلة أقرب
      stage = Math.max(1, stage - 1);
      nextIntervalDays = stage === 1 ? 1 : 2;
      break;
    }

    case "severe_struggle": {
      passes = 0;
      level = "needs_reinforcement";
      stage = 1;
      nextIntervalDays = 1; // غداً فوراً
      break;
    }

    case "failed": {
      passes = 0;
      level = "regressed";
      stage = 1;
      nextIntervalDays = 1; // غداً فوراً
      break;
    }
  }

  const nextReviewDate = new Date(now);
  nextReviewDate.setDate(nextReviewDate.getDate() + nextIntervalDays);

  return {
    newMasteryLevel: level,
    newStrength: strength,
    newNearReviewStage: stage,
    nextReviewDate,
    consecutivePasses: passes,
  };
}

/**
 * بناء جدول الخطة اليومية بدقة فائقة
 */
export function buildSmartPlan(
  config: PlanConfig,
  masteryRecords: Record<number, SurahMasteryRecord> = {},
  todayDateStr: string = formatLocalDate(new Date())
): DayPlan[] {
  const plan: DayPlan[] = [];
  const start = new Date(config.startDate);
  start.setHours(0, 0, 0, 0);

  const today = new Date(todayDateStr);
  today.setHours(0, 0, 0, 0);

  const totalPages = config.totalPages || 604;
  const targetEnd = new Date(config.targetEndDate);
  const totalDaysDiff = Math.max(30, Math.ceil((targetEnd.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);

  // حساب الصفحات التي تحتاج حفظ جديد (استثناء المحفوظ المسبق)
  const priorSurahSet = new Set(config.hasPriorMemorization ? config.priorMemorizedSurahs : []);
  
  // خريطة الصفحات المحفوظة مسبقاً
  const priorPagesSet = new Set<number>();
  if (config.hasPriorMemorization) {
    for (const surahId of priorSurahSet) {
      const range = getSurahPageRange(surahId, config.editionId, totalPages);
      for (let p = range.startPage; p <= range.endPage; p++) {
        priorPagesSet.add(p);
      }
    }
  }

  // الصفحات المتبقية للحفظ الفعلي
  const pagesToMemorize: number[] = [];
  for (let p = 1; p <= totalPages; p++) {
    if (!priorPagesSet.has(p)) {
      pagesToMemorize.push(p);
    }
  }

  let memoryPageIndex = 0;
  const memorizedPageHistory: { page: number; date: string; dayIndex: number }[] = [];

  // إذا كانت هناك سور محفوظة مسبقاً، ندرجها في تاريخ المحفوظ منذ البداية لتظهر في المراجعة البعيدة والمتوسطة
  if (config.hasPriorMemorization && priorSurahSet.size > 0) {
    for (const surahId of priorSurahSet) {
      const range = getSurahPageRange(surahId, config.editionId, totalPages);
      for (let p = range.startPage; p <= range.endPage; p++) {
        memorizedPageHistory.push({
          page: p,
          date: config.startDate,
          dayIndex: -30, // اعتباره محفوظاً منذ فترة سابقة
        });
      }
    }
  }

  for (let i = 0; i < totalDaysDiff; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const dateStr = formatLocalDate(date);
    const dayOfWeek = date.getDay(); // 0=Sun, 5=Fri...
    const isRest = config.restDays.includes(dayOfWeek);

    const weekNumber = Math.floor(i / 7) + 1;
    const monthNumber = Math.floor(i / 30) + 1;
    const isToday = date.getTime() === today.getTime();
    const isPast = date.getTime() < today.getTime();

    // فحص وضع التوقف الطارئ
    const isUnderEmergency = config.emergencyPause?.isActive &&
      new Date(config.emergencyPause.startDate) <= date &&
      (!config.emergencyPause.expectedReturnDate || new Date(config.emergencyPause.expectedReturnDate) >= date);

    if (isUnderEmergency) {
      plan.push({
        dayNumber: i + 1,
        date: dateStr,
        weekNumber,
        monthNumber,
        isRestDay: true,
        type: "rest",
        memorizeFrom: 0,
        memorizeTo: 0,
        surahs: [],
        nearReviews: [],
        mediumReviews: [],
        distantReviews: [],
        cumulativeReviews: [],
        reviewFrom: 0,
        reviewTo: 0,
        isToday,
        isPast,
        isCompleted: false,
        rescheduleReason: "توقف طارئ مجدول",
      });
      continue;
    }

    if (isRest) {
      // يوم الراحة: مراجعة تراكمية خفيفة أو راحة تامة
      const isCumulativeDay = (i + 1) % 7 === 0;
      let cumReviews: DayPlan["cumulativeReviews"] = [];
      let revFrom = 0;
      let revTo = 0;

      if (isCumulativeDay && memorizedPageHistory.length > 0) {
        // مراجعة تراكمية لأسبوع مضى
        const recentPages = memorizedPageHistory.slice(-config.pagesPerDay * 6);
        if (recentPages.length > 0) {
          revFrom = recentPages[0].page;
          revTo = recentPages[recentPages.length - 1].page;
          const surahList = getSurahsInPageRangeExact(revFrom, revTo, config.editionId, totalPages).map((s) => s.name);
          cumReviews.push({
            label: `تراكمي الأسبوع ${weekNumber}`,
            surahNames: surahList,
            fromPage: revFrom,
            toPage: revTo,
            scope: "weekly",
          });
        }
      }

      plan.push({
        dayNumber: i + 1,
        date: dateStr,
        weekNumber,
        monthNumber,
        isRestDay: true,
        type: isCumulativeDay && cumReviews.length > 0 ? "cumulative" : "rest",
        memorizeFrom: 0,
        memorizeTo: 0,
        surahs: [],
        nearReviews: [],
        mediumReviews: [],
        distantReviews: [],
        cumulativeReviews: cumReviews,
        reviewFrom: revFrom,
        reviewTo: revTo,
        isToday,
        isPast,
        isCompleted: false,
      });
      continue;
    }

    // 1. تحديد الحفظ الجديد
    let memFrom = 0;
    let memTo = 0;
    let memSurahs: string[] = [];

    // تقليل الحمل في وضع الاستعادة
    const effectivePagesPerDay = config.breakRecovery?.isActive
      ? Math.max(1, Math.round(config.pagesPerDay * (config.breakRecovery.reducedPacePercent / 100)))
      : config.pagesPerDay;

    if (memoryPageIndex < pagesToMemorize.length) {
      memFrom = pagesToMemorize[memoryPageIndex];
      const sliceEnd = Math.min(memoryPageIndex + effectivePagesPerDay, pagesToMemorize.length);
      memTo = pagesToMemorize[sliceEnd - 1];

      for (let p = memoryPageIndex; p < sliceEnd; p++) {
        memorizedPageHistory.push({
          page: pagesToMemorize[p],
          date: dateStr,
          dayIndex: i,
        });
      }
      memoryPageIndex = sliceEnd;

      const surahsInRange = getSurahsInPageRangeExact(memFrom, memTo, config.editionId, totalPages);
      memSurahs = surahsInRange.map((s) => s.name);
    }

    // 2. المراجعة القريبة: مراجعة ما حفظ في الأيام السابقة (بعد 1، 3، 7، 14، 30 يوماً)
    const nearList: ReviewTaskItem[] = [];
    for (const interval of NEAR_REVIEW_INTERVALS) {
      const pastDayIndex = i - interval;
      if (pastDayIndex >= 0) {
        const pagesAtInterval = memorizedPageHistory.filter((item) => item.dayIndex === pastDayIndex);
        if (pagesAtInterval.length > 0) {
          const fromP = pagesAtInterval[0].page;
          const toP = pagesAtInterval[pagesAtInterval.length - 1].page;
          const surahsFound = getSurahsInPageRangeExact(fromP, toP, config.editionId, totalPages);
          for (const s of surahsFound) {
            if (!nearList.some((n) => n.surahId === s.id)) {
              nearList.push({
                surahId: s.id,
                surahName: s.name,
                fromPage: fromP,
                toPage: toP,
                reviewType: "near",
                stageLabel: `بعد ${interval} يوم`,
                dueReason: "مراجعة قريبة للتثبيت",
              });
            }
          }
        }
      }
    }

    // 3. المراجعة المتوسطة والبعيدة والتراكمية
    const mediumList: ReviewTaskItem[] = [];
    const distantList: ReviewTaskItem[] = [];
    const cumulativeList: DayPlan["cumulativeReviews"] = [];

    // مراجعة أسبوعية تراكمية كل 7 أيام
    if ((i + 1) % 7 === 0 && memorizedPageHistory.length > 0) {
      const recentChunk = memorizedPageHistory.slice(-config.pagesPerDay * 6);
      if (recentChunk.length > 0) {
        const fromP = recentChunk[0].page;
        const toP = recentChunk[recentChunk.length - 1].page;
        cumulativeList.push({
          label: `مراجعة تراكمية للأسبوع ${weekNumber}`,
          surahNames: getSurahsInPageRangeExact(fromP, toP, config.editionId, totalPages).map((s) => s.name),
          fromPage: fromP,
          toPage: toP,
          scope: "weekly",
        });
      }
    }

    // مراجعة شهرية تراكمية (جزء كامل) كل 30 يوماً
    if ((i + 1) % 30 === 0 && memorizedPageHistory.length >= 20) {
      const monthChunk = memorizedPageHistory.slice(-Math.min(memorizedPageHistory.length, 60));
      const fromP = monthChunk[0].page;
      const toP = monthChunk[monthChunk.length - 1].page;
      cumulativeList.push({
        label: `مراجعة تراكمية شهرية (الشهر ${monthNumber})`,
        surahNames: getSurahsInPageRangeExact(fromP, toP, config.editionId, totalPages).map((s) => s.name),
        fromPage: fromP,
        toPage: toP,
        scope: "juz",
      });
    }

    // مراجعة بعيدة دورية للمحفوظ القديم (أكثر من 30 يوماً)
    const oldPages = memorizedPageHistory.filter((item) => i - item.dayIndex > 30);
    if (oldPages.length > 0) {
      // نختار مقداراً دورياً بسيطاً (صفحتين أو 3 صفحات) للحفاظ الدائم
      const cycleStep = (i % Math.ceil(oldPages.length / 3)) * 3;
      const chosen = oldPages.slice(cycleStep, cycleStep + 3);
      if (chosen.length > 0) {
        const fromP = chosen[0].page;
        const toP = chosen[chosen.length - 1].page;
        const sFound = getSurahsInPageRangeExact(fromP, toP, config.editionId, totalPages);
        for (const s of sFound) {
          if (!distantList.some((d) => d.surahId === s.id) && !nearList.some((n) => n.surahId === s.id)) {
            distantList.push({
              surahId: s.id,
              surahName: s.name,
              fromPage: fromP,
              toPage: toP,
              reviewType: "distant",
              dueReason: "مراجعة بعيدة للحفاظ على المحفوظ القديم",
            });
          }
        }
      }
    }

    // حساب حدود المراجعة الكلية لليوم
    let reviewFrom = 0;
    let reviewTo = 0;
    const allReviews = [...nearList, ...mediumList, ...distantList];
    if (allReviews.length > 0) {
      reviewFrom = Math.min(...allReviews.map((r) => r.fromPage));
      reviewTo = Math.max(...allReviews.map((r) => r.toPage));
    }

    const dayType: DayPlan["type"] =
      memFrom > 0 && allReviews.length > 0
        ? "both"
        : memFrom > 0
        ? "memorize"
        : allReviews.length > 0 || cumulativeList.length > 0
        ? "review"
        : "rest";

    plan.push({
      dayNumber: i + 1,
      date: dateStr,
      weekNumber,
      monthNumber,
      isRestDay: false,
      type: dayType,
      memorizeFrom: memFrom,
      memorizeTo: memTo,
      surahs: memSurahs,
      nearReviews: nearList,
      mediumReviews: mediumList,
      distantReviews: distantList,
      cumulativeReviews: cumulativeList,
      reviewFrom,
      reviewTo,
      isToday,
      isPast,
      isCompleted: isPast,
    });
  }

  return plan;
}

/**
 * حساب خطة التعافي عند فوات عدة أيام أو انقطاع
 */
export function calculateRecoveryPlan(
  config: PlanConfig,
  missedDays: number,
  uncompletedPages: number,
  overdueReviewsCount: number,
  weakSurahsCount: number
): RecoveryPlan {
  // عدم تحميل المستخدم المهام الفائتة في يوم واحد
  // نقترح تقسيم التعويض على فترة متوازنة مع تمديد واقعي للختمة
  const bufferRatio = config.dailyAvailableMinutes >= 60 ? 1.25 : 1.1;
  const realisticPace = Math.min(config.pagesPerDay + 1, Math.round(config.pagesPerDay * bufferRatio));

  // تمديد المدة المتبقية بما يناسب الأيام الفائتة
  const suggestedExtensionDays = Math.max(missedDays, Math.ceil(uncompletedPages / Math.max(1, config.pagesPerDay)));

  const currentEnd = new Date(config.targetEndDate);
  const newEnd = new Date(currentEnd);
  newEnd.setDate(newEnd.getDate() + suggestedExtensionDays);

  return {
    missedDays,
    missedMemorizationPages: uncompletedPages,
    urgentNearReviewsCount: overdueReviewsCount,
    weakSurahsCount,
    suggestedPacePagesPerDay: realisticPace,
    suggestedExtensionDays,
    newTargetEndDate: formatLocalDate(newEnd),
    phases: [
      {
        phaseName: "المرحلة 1: تدارك المراجعات القريبة والمتأخرة",
        durationDays: Math.min(3, Math.max(1, Math.ceil(overdueReviewsCount / 2))),
        focus: "تثبيت ما كاد يُنسى وإعادة الأجزاء الضعيفة أولاً دون إضافة حفظ جديد مجهد.",
      },
      {
        phaseName: "المرحلة 2: الاستئناف التدريجي للحفظ الجديد",
        durationDays: 4,
        focus: `بدء الحفظ الجديد بمعدل هادئ (${Math.max(1, Math.floor(config.pagesPerDay * 0.7))} صفحة/يوم) مع المراجعة اليومية.`,
      },
      {
        phaseName: "المرحلة 3: العودة للنسق المعتاد بثبات",
        durationDays: 7,
        focus: `العودة للمعدل المعتاد (${config.pagesPerDay} صفحة/يوم) مع تمديد موعد الختم بمقدار ${suggestedExtensionDays} يوماً لضمان الإتقان.`,
      },
    ],
  };
}

/**
 * فحص التقدم واقتراح تعديلات ذكية تلقائية تطلب موافقة المستخدم
 */
export function evaluatePlanProgressAndPropose(
  config: PlanConfig,
  currentMemorizedPages: number,
  masteryRecords: Record<number, SurahMasteryRecord>,
  daysSinceStart: number
): PlanProposal | null {
  const expectedPages = Math.round(daysSinceStart * config.pagesPerDay * (config.memorizeDaysPerWeek / 7));
  const diffPages = currentMemorizedPages - expectedPages;

  // فحص نسبة الأخطاء والضعف
  const allRecords = Object.values(masteryRecords);
  const weakCount = allRecords.filter((r) => r.masteryLevel === "needs_reinforcement" || r.masteryLevel === "regressed").length;

  if (weakCount >= 3) {
    return {
      id: `prop-weak-${Date.now()}`,
      title: "اقتراح تركيز مؤقت على المراجعة والتثبيت",
      reason: `لوحظ وجود ${weakCount} سور تحتاج تقوية وتثبيتاً. يُفضل خفض الحفظ الجديد مؤقتاً لتثبيت الأساس قبل المضي قدماً.`,
      triggerType: "high_errors",
      suggestedAdjustment: {
        pagesPerDay: Math.max(1, Math.floor(config.pagesPerDay * 0.5)),
        temporaryPauseMemorization: false,
      },
      createdAt: new Date().toISOString(),
      status: "pending",
    };
  }

  if (diffPages >= 15) {
    // متقدم بشكل كبير
    return {
      id: `prop-ahead-${Date.now()}`,
      title: "ما شاء الله! أنت متقدم بشكل ملحوظ عن الجدول",
      reason: `لقد أنجزت ${diffPages} صفحة إضافية متقدماً عن خطتك. يمكنك تقديم موعد الختمة أو تقليل العبء اليومي للاستمتاع بالمراجعة.`,
      triggerType: "ahead",
      suggestedAdjustment: {
        pagesPerDay: config.pagesPerDay,
      },
      createdAt: new Date().toISOString(),
      status: "pending",
    };
  }

  if (diffPages <= -15) {
    // متأخر
    const currentEnd = new Date(config.targetEndDate);
    const suggestedEnd = new Date(currentEnd);
    suggestedEnd.setDate(suggestedEnd.getDate() + Math.ceil(Math.abs(diffPages) / Math.max(1, config.pagesPerDay)));

    return {
      id: `prop-behind-${Date.now()}`,
      title: "اقتراح إعادة موازنة الجدول وتمديد واقعي للختمة",
      reason: `تراكمت ${Math.abs(diffPages)} صفحة عن المخطط. حفاظاً على جودة الحفظ ودون ضغط زائد، نقترح تمديد موعد الختمة بدلاً من مضاعفة المهام.`,
      triggerType: "behind",
      suggestedAdjustment: {
        targetEndDate: formatLocalDate(suggestedEnd),
      },
      createdAt: new Date().toISOString(),
      status: "pending",
    };
  }

  return null;
}

/**
 * مرحلة ما بعد ختم القرآن: توليد دورة مراجعة شاملة
 */
export function generatePostCompletionCycle(
  cycleDays: number = 30,
  totalPages: number = 604
): { dayNumber: number; juzNumbers: number[]; pagesFrom: number; pagesTo: number }[] {
  const schedule: { dayNumber: number; juzNumbers: number[]; pagesFrom: number; pagesTo: number }[] = [];
  const juzPerDay = 30 / cycleDays;
  const pagesPerDay = totalPages / cycleDays;

  for (let d = 1; d <= cycleDays; d++) {
    const fromP = Math.round((d - 1) * pagesPerDay) + 1;
    const toP = Math.min(totalPages, Math.round(d * pagesPerDay));
    const startJuz = Math.max(1, Math.ceil(fromP / (totalPages / 30)));
    const endJuz = Math.max(startJuz, Math.min(30, Math.ceil(toP / (totalPages / 30))));

    const juzList: number[] = [];
    for (let j = startJuz; j <= endJuz; j++) {
      juzList.push(j);
    }

    schedule.push({
      dayNumber: d,
      juzNumbers: juzList,
      pagesFrom: fromP,
      pagesTo: toP,
    });
  }

  return schedule;
}
