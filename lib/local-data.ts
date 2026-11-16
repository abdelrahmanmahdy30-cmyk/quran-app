/**
 * local-data.ts — طبقة البيانات المحلية
 *
 * هذا الملف هو المصدر الوحيد (Single Source of Truth) لكل ما يخص:
 *   - مفتاح التخزين في localStorage
 *   - القيم الافتراضية (كلها أصفار، لا بيانات تجريبية)
 *   - دوال القراءة والكتابة والمسح من localStorage
 *
 * أي ملف آخر يحتاج بيانات افتراضية أو تخزين محلي يستورد من هنا فقط.
 */

import {
  surahs,
  type MemorizationProgress,
  type DailyGoal,
  type UserStats,
} from "./quran-data";
import {
  getDefaultPlanConfig,
  type PlanConfig,
  type SurahMasteryRecord,
  type PlanProposal,
  type PlanHistoryEntry,
} from "./smart-plan-engine";

// ─── مفتاح التخزين ───────────────────────────────────────────────────────────

/** المفتاح الوحيد المستخدم في localStorage لحفظ بيانات التطبيق */
export const HAFIZ_STORAGE_KEY = "hafiz-quran-v1";

// ─── نوع البيانات المخزّنة ────────────────────────────────────────────────────

/** شكل البيانات كما تُخزَّن في localStorage */
export interface PersistedState {
  progress: MemorizationProgress[];
  dailyGoals: DailyGoal[];
  stats: UserStats;
  currentSurah: number;
  planConfig?: PlanConfig;
  masteryRecords?: Record<number, SurahMasteryRecord>;
  planProposals?: PlanProposal[];
  planHistory?: PlanHistoryEntry[];
}

// ─── القيم الافتراضية (صفر — بدون أي بيانات تجريبية) ────────────────────────

/**
 * إنشاء إحصائيات ابتدائية نظيفة.
 * تُعاد دالةً (لا ثابتاً) لضمان نسخة جديدة مستقلة في كل مرة.
 */
export function getInitialStats(): UserStats {
  return {
    totalVersesMemorized: 0,
    totalPages: 0,
    currentStreak: 0,
    longestStreak: 0,
    startDate: new Date().toISOString(),
    targetEndDate: new Date(
      Date.now() + 120 * 24 * 60 * 60 * 1000
    ).toISOString(),
    dailyAverage: 0,
    weeklyProgress: [0, 0, 0, 0, 0, 0, 0],
  };
}

/**
 * إنشاء تقدم افتراضي صفري لكل سور القرآن الكريم الـ114.
 * لا تُضاف أي بيانات مسبقة هنا.
 */
export function getDefaultProgress(): MemorizationProgress[] {
  return surahs.map((surah) => ({
    surahId: surah.id,
    versesMemorized: 0,
    memorizedAt: null,
    lastReview: null,
    reviewHistory: [],
    strength: 0,
    status: "not_started" as const,
  }));
}

/**
 * إنشاء سجلات الإتقان الافتراضية للـ 114 سورة
 */
export function getDefaultMasteryRecords(): Record<number, SurahMasteryRecord> {
  const records: Record<number, SurahMasteryRecord> = {};
  for (const surah of surahs) {
    records[surah.id] = {
      surahId: surah.id,
      masteryLevel: "new",
      strength: 0,
      nearReviewStage: 1,
      lastReviewDate: null,
      nextReviewDate: "",
      totalReviews: 0,
      consecutivePasses: 0,
      history: [],
    };
  }
  return records;
}

/**
 * الحالة الكاملة الافتراضية — نقطة البداية النظيفة.
 */
export function getDefaultState(): PersistedState {
  return {
    progress: getDefaultProgress(),
    dailyGoals: [],
    stats: getInitialStats(),
    currentSurah: 114,
    planConfig: getDefaultPlanConfig(),
    masteryRecords: getDefaultMasteryRecords(),
    planProposals: [],
    planHistory: [],
  };
}

// ─── دوال القراءة والكتابة والمسح ────────────────────────────────────────────

/**
 * قراءة البيانات المحفوظة من localStorage.
 * تُراعي الشكل الذي يحفظه Zustand persist: { state: {...}, version: N }
 * تعيد null إذا لم توجد بيانات أو كانت تالفة.
 */
export function readLocalData(): PersistedState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(HAFIZ_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { state?: PersistedState; version?: number };
    return parsed?.state ?? null;
  } catch {
    return null;
  }
}

/**
 * كتابة البيانات إلى localStorage بنفس شكل Zustand persist.
 * مفيدة للاختبار أو الاستيراد المباشر.
 */
export function writeLocalData(state: PersistedState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(HAFIZ_STORAGE_KEY, JSON.stringify({ state, version: 0 }));
  } catch {
    // localStorage ممتلئ أو غير متاح
  }
}

/**
 * مسح كل البيانات المحفوظة محلياً.
 * تُستدعى عند إعادة التعيين الكاملة.
 */
export function clearLocalData(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(HAFIZ_STORAGE_KEY);
    localStorage.removeItem("hafiz_unified_record_v1_plan-hizb-hafiz-default");
    localStorage.removeItem("hafiz_completed_days_six_month");
  } catch (error) {
    console.error("فشل مسح البيانات من localStorage:", error);
  }
}
