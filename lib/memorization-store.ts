"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { surahs, type MemorizationProgress, type DailyGoal, type UserStats, type ReviewRecord, TOTAL_VERSES } from "./quran-data";
import {
  HAFIZ_STORAGE_KEY,
  getInitialStats,
  getDefaultProgress,
  getDefaultMasteryRecords,
  clearLocalData,
} from "./local-data";
import { calculateTotalPagesMemorized } from "./quran-metadata";
import {
  getDefaultPlanConfig,
  type PlanConfig,
  type SurahMasteryRecord,
  type MasteryLevel,
  type ReviewGrade,
  type ReviewHistoryEntry,
  type DayPlan,
  type PlanProposal,
  type PlanHistoryEntry,
  type RecoveryPlan,
  buildSmartPlan,
  calculateMasteryTransition,
  calculateRecoveryPlan,
  evaluatePlanProgressAndPropose,
} from "./smart-plan-engine";

/**
 * الحصول على تاريخ اليوم التقويمي بصيغة YYYY-MM-DD وفقاً للتوقيت المحلي للمستخدم
 */
export function getLocalCalendarDate(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * حساب الأيام المنقضية منذ تاريخ معين
 */
const daysSince = (value: Date | string | null): number => {
  if (!value) return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 86400000));
};

export interface PlanEstimate {
  estimatedDate: Date | null;
  daysNeeded: number;
  remainingVerses: number;
  daysDifference: number; // الموجب: متقدم، السالب: متأخر
  status: "ahead" | "behind" | "on_track" | "not_started" | "completed";
}

/**
 * تصنيف الورد التقليدي للمراجعة
 */
export type WardCategory = "jadid" | "qareeb" | "ba'eed";

export interface WardItem {
  surahId: number;
  surahName: string;
  versesMemorized: number;
  memorizedAt: string | null;
  lastReview: Date | null;
  daysSinceMemorized: number;
  daysSinceReview: number;
  category: WardCategory;
  dueForReview: boolean; // هل موعد مراجعته اليوم؟
}

export interface DailyWard {
  jadid: WardItem[];   // حُفظ منذ ≤ 7 أيام  → يراجع يومياً
  qareeb: WardItem[];  // حُفظ منذ 7-30 يوم   → يراجع أسبوعياً
  baeed: WardItem[];   // حُفظ منذ > 30 يوم   → يراجع شهرياً
  todayTotal: WardItem[]; // ما يجب مراجعته اليوم فعلاً
}

interface MemorizationState {
  progress: MemorizationProgress[];
  dailyGoals: DailyGoal[];
  stats: UserStats;
  currentSurah: number;
  
  // نظام التخطيط والإتقان المتقدم
  planConfig: PlanConfig;
  masteryRecords: Record<number, SurahMasteryRecord>;
  planProposals: PlanProposal[];
  planHistory: PlanHistoryEntry[];

  // Actions
  initializeProgress: () => void;
  updateSurahProgress: (surahId: number, versesMemorized: number) => void;
  markSurahComplete: (surahId: number) => void;
  recordReview: (surahId: number, versesCount?: number) => void;
  recordMasteryReview: (
    surahId: number,
    grade: ReviewGrade,
    type?: "near" | "medium" | "distant" | "cumulative" | "diagnostic",
    notes?: string
  ) => void;
  recordDailyProgress: (verses: number, reviewVerses: number) => void;
  addVersesToCurrentSurah: (count: number) => void;
  addReviewToDailyGoal: (count: number) => void;
  updateStrength: (surahId: number, strength: number) => void;
  setCurrentSurah: (surahId: number) => void;
  updatePlanSettings: (settings: { dailyTarget?: number; startDate?: string; targetEndDate?: string }) => void;
  updatePlanConfig: (config: Partial<PlanConfig>) => void;
  resetProgress: () => void;
  undoSurahAction: (surahId: number) => void;

  // الظروف الطارئة وإعادة الجدولة
  activateEmergencyPause: (
    reason: NonNullable<PlanConfig["emergencyPause"]>["reason"],
    returnDate?: string,
    notes?: string
  ) => void;
  deactivateEmergencyPause: () => void;
  activateBreakRecovery: (breakDays?: number, diagnosticResults?: Record<number, MasteryLevel>) => void;
  deactivateBreakRecovery: () => void;
  acceptPlanProposal: (proposalId: string) => void;
  dismissPlanProposal: (proposalId: string) => void;
  rescheduleMissedDays: (missedDays: number, strategy: "extend" | "absorb") => void;
  postponeDayTask: (dateStr: string) => void;
  activatePostCompletion: (cycleDays: number) => void;
  deactivatePostCompletion: () => void;
  checkForPlanProposals: () => void;

  // Selectors / Helpers
  getTodaysGoal: () => DailyGoal;
  getSurahProgress: (surahId: number) => MemorizationProgress | null;
  getMasteryRecord: (surahId: number) => SurahMasteryRecord;
  getWeeklyData: () => { day: string; memorized: number; reviewed: number }[];
  getPlanEstimate: () => PlanEstimate;
  getDailyWard: () => DailyWard;
  getSmartPlan: () => DayPlan[];
  getRecoveryPlan: () => RecoveryPlan | null;
}

export const useMemorizationStore = create<MemorizationState>()(
  persist(
    (set, get) => {
      /**
       * دالة داخلية لتسجيل الإنجاز اليومي وتحديث السلسلة (Streak) بدقة:
       * - تزيد السلسلة مرة واحدة فقط لكل يوم تقويمي محلي.
       */
      const recordDailyProgressInternal = (
        state: { dailyGoals: DailyGoal[]; stats: UserStats },
        versesDelta: number,
        reviewDelta: number
      ) => {
        if (versesDelta <= 0 && reviewDelta <= 0) {
          return { dailyGoals: state.dailyGoals, stats: state.stats };
        }

        const today = getLocalCalendarDate();
        const existingGoalIndex = state.dailyGoals.findIndex((g) => g.date === today);

        const hadActivityTodayBefore =
          existingGoalIndex >= 0 &&
          (state.dailyGoals[existingGoalIndex].completedVerses > 0 ||
            state.dailyGoals[existingGoalIndex].completedReview > 0);

        let updatedGoals = [...state.dailyGoals];
        if (existingGoalIndex >= 0) {
          updatedGoals[existingGoalIndex] = {
            ...updatedGoals[existingGoalIndex],
            completedVerses: updatedGoals[existingGoalIndex].completedVerses + versesDelta,
            completedReview: updatedGoals[existingGoalIndex].completedReview + reviewDelta,
          };
        } else {
          updatedGoals.push({
            date: today,
            targetVerses: state.dailyGoals[state.dailyGoals.length - 1]?.targetVerses || 52,
            completedVerses: versesDelta,
            targetReview: state.dailyGoals[state.dailyGoals.length - 1]?.targetReview || 100,
            completedReview: reviewDelta,
          });
        }

        // تحديث السلسلة (Streak) مرة واحدة فقط في اليوم التقويمي
        let newStreak = state.stats.currentStreak;
        let longestStreak = state.stats.longestStreak;

        if (!hadActivityTodayBefore) {
          const yesterdayDate = new Date();
          yesterdayDate.setDate(yesterdayDate.getDate() - 1);
          const yesterdayStr = getLocalCalendarDate(yesterdayDate);

          const hadProgressYesterday = state.dailyGoals.some(
            (g) => g.date === yesterdayStr && (g.completedVerses > 0 || g.completedReview > 0)
          );

          if (state.stats.currentStreak === 0 || hadProgressYesterday) {
            newStreak = state.stats.currentStreak + 1;
          } else {
            // انقطعت السلسلة يوم أمس فتبدأ من جديد بـ 1
            newStreak = 1;
          }
          longestStreak = Math.max(longestStreak, newStreak);
        }

        // حساب المعدل اليومي من الأيام النشطة الفعلية
        const activeDays = updatedGoals.filter((g) => g.completedVerses > 0);
        const totalCompletedVerses = updatedGoals.reduce((sum, g) => sum + g.completedVerses, 0);
        const dailyAverage = activeDays.length > 0 ? Math.round(totalCompletedVerses / activeDays.length) : 0;

        return {
          dailyGoals: updatedGoals,
          stats: {
            ...state.stats,
            currentStreak: newStreak,
            longestStreak,
            dailyAverage,
          },
        };
      };

      return {
        progress: getDefaultProgress(),
        dailyGoals: [],
        stats: getInitialStats(),
        currentSurah: 114, // البداية من سورة الناس
        planConfig: getDefaultPlanConfig(),
        masteryRecords: getDefaultMasteryRecords(),
        planProposals: [],
        planHistory: [],

        initializeProgress: () => {
          set({
            progress: getDefaultProgress(),
            dailyGoals: [],
            stats: getInitialStats(),
            planConfig: getDefaultPlanConfig(),
            masteryRecords: getDefaultMasteryRecords(),
            planProposals: [],
            planHistory: [],
          });
        },

        /**
         * تحديث حفظ آيات سورة معينة:
         * يربط تلقائياً الزيادة بهدف اليوم، ويحسب الصفحات المحفوظة والأجزاء المكتملة
         */
        updateSurahProgress: (surahId, versesMemorized) => {
          const surah = surahs.find((s) => s.id === surahId);
          if (!surah) return;

          set((state) => {
            const currentItem = state.progress.find((p) => p.surahId === surahId);
            const oldVerses = currentItem?.versesMemorized || 0;
            const cappedVerses = Math.min(Math.max(versesMemorized, 0), surah.verses);
            const deltaVerses = Math.max(0, cappedVerses - oldVerses);

            const now = new Date();
            const isNowComplete = cappedVerses >= surah.verses;
            const becameMemorized = isNowComplete && !currentItem?.memorizedAt;

            const updatedProgress = state.progress.map((p) => {
              if (p.surahId === surahId) {
                const strengthAfterDecay = Math.max(0, p.strength - Math.floor(daysSince(p.lastReview) / 7) * 5);
                const newStatus: MemorizationProgress["status"] =
                  cappedVerses === 0
                    ? "not_started"
                    : isNowComplete
                    ? "memorized"
                    : strengthAfterDecay < 50 && p.lastReview
                    ? "needs_review"
                    : "in_progress";

                const record: ReviewRecord = {
                  date: now.toISOString(),
                  verses: cappedVerses,
                  strength: p.strength,
                  type: becameMemorized ? "memorization" : "review",
                };

                return {
                  ...p,
                  versesMemorized: cappedVerses,
                  memorizedAt: becameMemorized ? now.toISOString() : p.memorizedAt,
                  lastReview: now,
                  reviewHistory: [...(p.reviewHistory || []), record],
                  status: newStatus,
                  strength: isNowComplete ? Math.min(p.strength + 15, 100) : p.strength,
                };
              }
              return p;
            });

            // تحديث سجل الإتقان للسورة
            const currentMastery = state.masteryRecords[surahId] || {
              surahId,
              masteryLevel: "new" as MasteryLevel,
              strength: 0,
              nearReviewStage: 1,
              lastReviewDate: null,
              nextReviewDate: "",
              totalReviews: 0,
              consecutivePasses: 0,
              history: [],
            };

            const tomorrowDate = new Date(now);
            tomorrowDate.setDate(tomorrowDate.getDate() + 1);

            const updatedMastery: Record<number, SurahMasteryRecord> = {
              ...state.masteryRecords,
              [surahId]: {
                ...currentMastery,
                masteryLevel: isNowComplete
                  ? currentMastery.masteryLevel === "new"
                    ? "stabilizing"
                    : currentMastery.masteryLevel
                  : "new",
                strength: isNowComplete ? Math.max(currentMastery.strength, 60) : currentMastery.strength,
                nearReviewStage: currentMastery.nearReviewStage || 1,
                nextReviewDate: currentMastery.nextReviewDate || getLocalCalendarDate(tomorrowDate),
              },
            };

            const totalMemorized = updatedProgress.reduce((sum, p) => sum + p.versesMemorized, 0);
            const totalPages = calculateTotalPagesMemorized(updatedProgress);

            const { dailyGoals: updatedGoals, stats: updatedStats } = recordDailyProgressInternal(
              state,
              deltaVerses,
              0
            );

            return {
              progress: updatedProgress,
              masteryRecords: updatedMastery,
              dailyGoals: updatedGoals,
              stats: {
                ...updatedStats,
                totalVersesMemorized: totalMemorized,
                totalPages,
              },
            };
          });
        },

        /**
         * إتمام حفظ السورة كاملة بضغطة زر
         */
        markSurahComplete: (surahId) => {
          const surah = surahs.find((s) => s.id === surahId);
          if (!surah) return;

          set((state) => {
            const currentItem = state.progress.find((p) => p.surahId === surahId);
            const oldVerses = currentItem?.versesMemorized || 0;
            const deltaVerses = Math.max(0, surah.verses - oldVerses);
            const now = new Date();

            const updatedProgress = state.progress.map((p) => {
              if (p.surahId === surahId) {
                return {
                  ...p,
                  versesMemorized: surah.verses,
                  memorizedAt: p.memorizedAt || now.toISOString(),
                  lastReview: now,
                  reviewHistory: [
                    ...(p.reviewHistory || []),
                    { date: now.toISOString(), verses: surah.verses, strength: 100, type: "memorization" as const },
                  ],
                  status: "memorized" as const,
                  strength: 100,
                };
              }
              return p;
            });

            // تحديث الإتقان
            const tomorrowDate = new Date(now);
            tomorrowDate.setDate(tomorrowDate.getDate() + 1);

            const currentMastery = state.masteryRecords[surahId] || {
              surahId,
              masteryLevel: "stabilizing" as MasteryLevel,
              strength: 70,
              nearReviewStage: 1,
              lastReviewDate: null,
              nextReviewDate: getLocalCalendarDate(tomorrowDate),
              totalReviews: 0,
              consecutivePasses: 0,
              history: [],
            };

            const updatedMastery: Record<number, SurahMasteryRecord> = {
              ...state.masteryRecords,
              [surahId]: {
                ...currentMastery,
                masteryLevel: "stabilizing",
                strength: Math.max(currentMastery.strength, 75),
                nextReviewDate: getLocalCalendarDate(tomorrowDate),
              },
            };

            const totalMemorized = updatedProgress.reduce((sum, p) => sum + p.versesMemorized, 0);
            const totalPages = calculateTotalPagesMemorized(updatedProgress);

            const { dailyGoals: updatedGoals, stats: updatedStats } = recordDailyProgressInternal(
              state,
              deltaVerses,
              0
            );

            return {
              progress: updatedProgress,
              masteryRecords: updatedMastery,
              dailyGoals: updatedGoals,
              stats: {
                ...updatedStats,
                totalVersesMemorized: totalMemorized,
                totalPages,
              },
            };
          });
        },

        /**
         * تسجيل مراجعة تقليدي لسورة (متوافق مع الأزرار السابقة)
         */
        recordReview: (surahId, versesCount) => {
          const surah = surahs.find((s) => s.id === surahId);
          if (!surah) return;

          // توجيه تلقائي لنظام الإتقان بتقدير "minor_errors" كافتراضي إذا لم يُحدد تقييم تفصيلي
          get().recordMasteryReview(surahId, "minor_errors", "near");
        },

        /**
         * تسجيل مراجعة متقدم بنظام قياس الإتقان الذكي (5 درجات تقييم و6 مستويات إتقان)
         */
        recordMasteryReview: (surahId, grade, type = "near", notes) => {
          const surah = surahs.find((s) => s.id === surahId);
          if (!surah) return;

          set((state) => {
            const currentItem = state.progress.find((p) => p.surahId === surahId);
            const verses = currentItem?.versesMemorized || surah.verses;

            const existingRecord: SurahMasteryRecord = state.masteryRecords[surahId] || {
              surahId,
              masteryLevel: "new",
              strength: currentItem?.strength || 50,
              nearReviewStage: 1,
              lastReviewDate: null,
              nextReviewDate: "",
              totalReviews: 0,
              consecutivePasses: 0,
              history: [],
            };

            const transition = calculateMasteryTransition(existingRecord, grade, type);
            const now = new Date();

            const newHistoryEntry: ReviewHistoryEntry = {
              date: now.toISOString(),
              grade,
              type,
              strengthBefore: existingRecord.strength,
              strengthAfter: transition.newStrength,
              notes,
            };

            const updatedRecord: SurahMasteryRecord = {
              ...existingRecord,
              masteryLevel: transition.newMasteryLevel,
              strength: transition.newStrength,
              nearReviewStage: transition.newNearReviewStage,
              lastReviewDate: now.toISOString(),
              nextReviewDate: getLocalCalendarDate(transition.nextReviewDate),
              totalReviews: existingRecord.totalReviews + 1,
              consecutivePasses: transition.consecutivePasses,
              history: [...(existingRecord.history || []), newHistoryEntry],
            };

            const updatedMasteryRecords = {
              ...state.masteryRecords,
              [surahId]: updatedRecord,
            };

            // تحديث تقدم السورة وقوتها
            const updatedProgress = state.progress.map((p) => {
              if (p.surahId === surahId) {
                return {
                  ...p,
                  lastReview: now,
                  strength: transition.newStrength,
                  reviewHistory: [
                    ...(p.reviewHistory || []),
                    {
                      date: now.toISOString(),
                      verses,
                      strength: transition.newStrength,
                      type: "review" as const,
                    },
                  ],
                };
              }
              return p;
            });

            // تسجيل المراجعة في الهدف اليومي
            const { dailyGoals: updatedGoals, stats: updatedStats } = recordDailyProgressInternal(
              state,
              0,
              verses
            );

            return {
              progress: updatedProgress,
              masteryRecords: updatedMasteryRecords,
              dailyGoals: updatedGoals,
              stats: updatedStats,
            };
          });
        },

        recordDailyProgress: (verses, reviewVerses) => {
          set((state) => {
            const { dailyGoals: updatedGoals, stats: updatedStats } = recordDailyProgressInternal(
              state,
              verses,
              reviewVerses
            );
            return {
              dailyGoals: updatedGoals,
              stats: updatedStats,
            };
          });
        },

        addVersesToCurrentSurah: (count) => {
          const state = get();
          const surah = surahs.find((s) => s.id === state.currentSurah);
          if (!surah) return;

          const currentItem = state.progress.find((p) => p.surahId === state.currentSurah);
          const currentVerses = currentItem?.versesMemorized || 0;
          const targetVerses = Math.min(surah.verses, currentVerses + count);

          state.updateSurahProgress(state.currentSurah, targetVerses);
        },

        addReviewToDailyGoal: (count) => {
          const state = get();
          const currentItem = state.progress.find((p) => p.surahId === state.currentSurah);
          if (currentItem && currentItem.versesMemorized > 0) {
            state.recordMasteryReview(state.currentSurah, "minor_errors", "near");
          } else {
            state.recordDailyProgress(0, count);
          }
        },

        updateStrength: (surahId, strength) => {
          set((state) => {
            const capped = Math.min(100, Math.max(0, strength));
            const existingRecord = state.masteryRecords[surahId];
            return {
              progress: state.progress.map((p) =>
                p.surahId === surahId ? { ...p, strength: capped, lastReview: new Date() } : p
              ),
              masteryRecords: existingRecord
                ? {
                    ...state.masteryRecords,
                    [surahId]: {
                      ...existingRecord,
                      strength: capped,
                      masteryLevel:
                        capped >= 90
                          ? "mastered"
                          : capped >= 70
                          ? "good"
                          : capped >= 50
                          ? "stabilizing"
                          : "needs_reinforcement",
                    },
                  }
                : state.masteryRecords,
            };
          });
        },

        setCurrentSurah: (surahId) => {
          set({ currentSurah: surahId });
        },

        updatePlanSettings: ({ dailyTarget, startDate, targetEndDate }) => {
          set((state) => {
            const today = getLocalCalendarDate();
            const updatedGoals = state.dailyGoals.map((goal) => {
              if (goal.date === today && dailyTarget) {
                return { ...goal, targetVerses: dailyTarget };
              }
              return goal;
            });

            const updatedConfig = {
              ...state.planConfig,
              ...(startDate ? { startDate } : {}),
              ...(targetEndDate ? { targetEndDate } : {}),
              ...(dailyTarget ? { pagesPerDay: Math.max(1, Math.round(dailyTarget / 15)) } : {}),
            };

            return {
              dailyGoals: updatedGoals,
              planConfig: updatedConfig,
              stats: {
                ...state.stats,
                ...(startDate ? { startDate } : {}),
                ...(targetEndDate ? { targetEndDate } : {}),
              },
            };
          });
        },

        updatePlanConfig: (newConfig) => {
          set((state) => {
            const merged = { ...state.planConfig, ...newConfig };
            const historyEntry: PlanHistoryEntry = {
              id: `hist-${Date.now()}`,
              date: new Date().toISOString(),
              action: "تحديث إعدادات الخطة",
              details: `تم تعديل الخطة: صفحات يومية ${merged.pagesPerDay}، أيام حفظ أسبوعية: ${merged.memorizeDaysPerWeek}، طبعة: ${merged.editionId}`,
              previousEndDate: state.planConfig.targetEndDate,
              newEndDate: merged.targetEndDate,
            };

            return {
              planConfig: merged,
              planHistory: [historyEntry, ...(state.planHistory || [])],
              stats: {
                ...state.stats,
                startDate: merged.startDate,
                targetEndDate: merged.targetEndDate,
              },
            };
          });
        },

        resetProgress: () => {
          clearLocalData();
          set({
            progress: getDefaultProgress(),
            dailyGoals: [],
            stats: getInitialStats(),
            currentSurah: 114,
            planConfig: getDefaultPlanConfig(),
            masteryRecords: getDefaultMasteryRecords(),
            planProposals: [],
            planHistory: [],
          });
        },

        undoSurahAction: (surahId: number) => {
          const surah = surahs.find((s) => s.id === surahId);
          if (!surah) return;

          set((state) => {
            const currentItem = state.progress.find((p) => p.surahId === surahId);
            if (!currentItem || !currentItem.reviewHistory || currentItem.reviewHistory.length === 0) return state;

            const newHistory = currentItem.reviewHistory.slice(0, -1);
            const prevRecord = newHistory[newHistory.length - 1];

            const restoredVerses = prevRecord ? prevRecord.verses : 0;
            const restoredStrength = prevRecord ? prevRecord.strength : 0;
            const wasMemorized = restoredVerses >= surah.verses;

            const updatedProgress = state.progress.map((p) => {
              if (p.surahId === surahId) {
                const newStatus: typeof p.status =
                  restoredVerses === 0
                    ? "not_started"
                    : wasMemorized
                    ? "memorized"
                    : "in_progress";

                return {
                  ...p,
                  versesMemorized: restoredVerses,
                  strength: restoredStrength,
                  reviewHistory: newHistory,
                  status: newStatus,
                  memorizedAt: wasMemorized ? p.memorizedAt : null,
                  lastReview: prevRecord ? new Date(prevRecord.date) : null,
                };
              }
              return p;
            });

            const totalMemorized = updatedProgress.reduce((sum, p) => sum + p.versesMemorized, 0);
            const totalPages = calculateTotalPagesMemorized(updatedProgress);

            return {
              progress: updatedProgress,
              stats: {
                ...state.stats,
                totalVersesMemorized: totalMemorized,
                totalPages,
              },
            };
          });
        },

        // ============================================================
        // الظروف الطارئة وإعادة الجدولة الذكية
        // ============================================================
        activateEmergencyPause: (reason, returnDate, notes) => {
          set((state) => {
            const today = getLocalCalendarDate();
            const pauseConfig = {
              isActive: true,
              reason,
              startDate: today,
              expectedReturnDate: returnDate,
              notes,
            };

            const historyEntry: PlanHistoryEntry = {
              id: `pause-${Date.now()}`,
              date: new Date().toISOString(),
              action: "تفعيل التوقف الطارئ",
              details: `سبب التوقف: ${reason} — العودة المتوقعة: ${returnDate || "غير محدد"}`,
            };

            return {
              planConfig: {
                ...state.planConfig,
                emergencyPause: pauseConfig,
              },
              planHistory: [historyEntry, ...(state.planHistory || [])],
            };
          });
        },

        deactivateEmergencyPause: () => {
          set((state) => ({
            planConfig: {
              ...state.planConfig,
              emergencyPause: {
                isActive: false,
                reason: "voluntary",
                startDate: "",
              },
            },
            planHistory: [
              {
                id: `resume-${Date.now()}`,
                date: new Date().toISOString(),
                action: "استئناف الخطة بعد التوقف الطارئ",
                details: "تم رفع حالة التوقف واستئناف الجدول اليومي بسلام",
              },
              ...(state.planHistory || []),
            ],
          }));
        },

        activateBreakRecovery: (breakDays = 14, diagnosticResults) => {
          set((state) => {
            const today = getLocalCalendarDate();
            const updatedMastery = { ...state.masteryRecords };

            if (diagnosticResults) {
              for (const [sIdStr, level] of Object.entries(diagnosticResults)) {
                const sId = Number(sIdStr);
                if (updatedMastery[sId]) {
                  updatedMastery[sId] = {
                    ...updatedMastery[sId],
                    masteryLevel: level,
                    nearReviewStage: level === "mastered" ? 5 : level === "good" ? 3 : 1,
                    strength: level === "mastered" ? 95 : level === "good" ? 75 : level === "needs_reinforcement" ? 45 : 30,
                  };
                }
              }
            }

            const recoveryConfig = {
              isActive: true,
              breakStartDate: today,
              breakDaysCount: breakDays,
              stage: "gradual_review" as const,
              reducedPacePercent: 50,
            };

            return {
              planConfig: {
                ...state.planConfig,
                breakRecovery: recoveryConfig,
              },
              masteryRecords: updatedMastery,
              planHistory: [
                {
                  id: `recovery-${Date.now()}`,
                  date: new Date().toISOString(),
                  action: "تفعيل وضع العودة بعد الانقطاع",
                  details: `انقطاع لمدة ${breakDays} يوماً. تم تفعيل المراجعة التشخيصية وتخفيف الحفظ بنسبة 50% للتركيز على استقرار المحفوظ.`,
                },
                ...(state.planHistory || []),
              ],
            };
          });
        },

        deactivateBreakRecovery: () => {
          set((state) => ({
            planConfig: {
              ...state.planConfig,
              breakRecovery: {
                isActive: false,
                breakStartDate: "",
                breakDaysCount: 0,
                stage: "completed",
                reducedPacePercent: 100,
              },
            },
            planHistory: [
              {
                id: `recovery-end-${Date.now()}`,
                date: new Date().toISOString(),
                action: "إتمام وضع التعافي والعودة الكاملة",
                details: "استقرت المراجعات وتمت العودة لمعدل الحفظ الطبيعي",
              },
              ...(state.planHistory || []),
            ],
          }));
        },

        acceptPlanProposal: (proposalId) => {
          set((state) => {
            const proposal = state.planProposals.find((p) => p.id === proposalId);
            if (!proposal) return state;

            const updatedConfig = {
              ...state.planConfig,
              ...proposal.suggestedAdjustment,
            };

            const updatedProposals = state.planProposals.map((p) =>
              p.id === proposalId ? { ...p, status: "accepted" as const } : p
            );

            const historyEntry: PlanHistoryEntry = {
              id: `prop-accept-${Date.now()}`,
              date: new Date().toISOString(),
              action: `اعتماد المقترح الذكي: ${proposal.title}`,
              details: proposal.reason,
              previousEndDate: state.planConfig.targetEndDate,
              newEndDate: updatedConfig.targetEndDate,
            };

            return {
              planConfig: updatedConfig,
              planProposals: updatedProposals,
              planHistory: [historyEntry, ...(state.planHistory || [])],
              stats: {
                ...state.stats,
                ...(updatedConfig.targetEndDate ? { targetEndDate: updatedConfig.targetEndDate } : {}),
              },
            };
          });
        },

        dismissPlanProposal: (proposalId) => {
          set((state) => ({
            planProposals: state.planProposals.map((p) =>
              p.id === proposalId ? { ...p, status: "dismissed" as const } : p
            ),
          }));
        },

        rescheduleMissedDays: (missedDays, strategy) => {
          set((state) => {
            const currentEnd = new Date(state.planConfig.targetEndDate);
            const newEnd = new Date(currentEnd);
            if (strategy === "extend") {
              newEnd.setDate(newEnd.getDate() + missedDays);
            }
            const newEndStr = getLocalCalendarDate(newEnd);

            return {
              planConfig: {
                ...state.planConfig,
                targetEndDate: newEndStr,
              },
              planHistory: [
                {
                  id: `resched-${Date.now()}`,
                  date: new Date().toISOString(),
                  action: "إعادة جدولة الأيام الفائتة",
                  details: `معالجة ${missedDays} أيام فائتة بواسطة ${strategy === "extend" ? "تمديد الختم" : "الامتصاص المرن"} دون مضاعفة الحفظ دفعة واحدة.`,
                  previousEndDate: state.planConfig.targetEndDate,
                  newEndDate: newEndStr,
                },
                ...(state.planHistory || []),
              ],
            };
          });
        },

        postponeDayTask: (dateStr) => {
          set((state) => {
            const historyEntry: PlanHistoryEntry = {
              id: `postpone-${Date.now()}`,
              date: new Date().toISOString(),
              action: "تأجيل مهام يوم محدد",
              details: `تم تأجيل مهام تاريخ ${dateStr} ونقلها للأيام اللاحقة مع حفظ أولوية المراجعة.`,
            };
            return {
              planHistory: [historyEntry, ...(state.planHistory || [])],
            };
          });
        },

        activatePostCompletion: (cycleDays) => {
          set((state) => ({
            planConfig: {
              ...state.planConfig,
              postCompletion: {
                isActive: true,
                cycleDays,
                currentCycleNumber: (state.planConfig.postCompletion?.currentCycleNumber || 0) + 1,
                completedCyclesCount: state.planConfig.postCompletion?.completedCyclesCount || 0,
                lastCycleStartDate: getLocalCalendarDate(),
              },
            },
            planHistory: [
              {
                id: `post-comp-${Date.now()}`,
                date: new Date().toISOString(),
                action: "بدء مرحلة تثبيت القرآن والمحافظة عليه",
                details: `انطلاق دورة مراجعة شاملة للقرآن كاملاً كل ${cycleDays} يوماً.`,
              },
              ...(state.planHistory || []),
            ],
          }));
        },

        deactivatePostCompletion: () => {
          set((state) => ({
            planConfig: {
              ...state.planConfig,
              postCompletion: {
                ...(state.planConfig.postCompletion || {
                  currentCycleNumber: 0,
                  completedCyclesCount: 0,
                }),
                isActive: false,
                cycleDays: 30,
              },
            },
          }));
        },

        checkForPlanProposals: () => {
          const state = get();
          const daysSinceStart = daysSince(state.planConfig.startDate);
          const proposal = evaluatePlanProgressAndPropose(
            state.planConfig,
            state.stats.totalPages,
            state.masteryRecords,
            daysSinceStart
          );

          if (proposal) {
            const exists = state.planProposals.some((p) => p.triggerType === proposal.triggerType && p.status === "pending");
            if (!exists) {
              set({ planProposals: [proposal, ...state.planProposals] });
            }
          }
        },

        // ============================================================
        // Selectors
        // ============================================================
        getTodaysGoal: () => {
          const state = get();
          const today = getLocalCalendarDate();
          return (
            state.dailyGoals.find((g) => g.date === today) || {
              date: today,
              targetVerses: 52,
              completedVerses: 0,
              targetReview: 100,
              completedReview: 0,
            }
          );
        },

        getSurahProgress: (surahId) => {
          return get().progress.find((p) => p.surahId === surahId) || null;
        },

        getMasteryRecord: (surahId) => {
          const state = get();
          return (
            state.masteryRecords[surahId] || {
              surahId,
              masteryLevel: "new",
              strength: 0,
              nearReviewStage: 1,
              lastReviewDate: null,
              nextReviewDate: "",
              totalReviews: 0,
              consecutivePasses: 0,
              history: [],
            }
          );
        },

        getWeeklyData: () => {
          const days = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
          const weekData = [];

          for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = getLocalCalendarDate(d);
            const goal = get().dailyGoals.find((g) => g.date === dateStr);

            weekData.push({
              day: days[d.getDay()],
              memorized: goal?.completedVerses || 0,
              reviewed: goal?.completedReview || 0,
            });
          }

          return weekData;
        },

        getPlanEstimate: (): PlanEstimate => {
          const state = get();
          const totalMemorized = state.stats.totalVersesMemorized;
          const remainingVerses = Math.max(0, TOTAL_VERSES - totalMemorized);

          if (remainingVerses === 0) {
            return {
              estimatedDate: new Date(),
              daysNeeded: 0,
              remainingVerses: 0,
              daysDifference: 0,
              status: "completed",
            };
          }

          const speed = state.stats.dailyAverage > 0 ? state.stats.dailyAverage : 0;
          if (speed <= 0) {
            return {
              estimatedDate: null,
              daysNeeded: 0,
              remainingVerses,
              daysDifference: 0,
              status: "not_started",
            };
          }

          const daysNeeded = Math.ceil(remainingVerses / speed);
          const estimatedDate = new Date();
          estimatedDate.setDate(estimatedDate.getDate() + daysNeeded);

          const target = new Date(state.stats.targetEndDate);
          const now = new Date();
          const targetDaysRemaining = Math.max(0, Math.ceil((target.getTime() - now.getTime()) / 86400000));
          const daysDifference = targetDaysRemaining - daysNeeded;

          let status: PlanEstimate["status"] = "on_track";
          if (daysDifference > 3) status = "ahead";
          else if (daysDifference < -3) status = "behind";

          return {
            estimatedDate,
            daysNeeded,
            remainingVerses,
            daysDifference,
            status,
          };
        },

        getDailyWard: (): DailyWard => {
          const state = get();
          const now = Date.now();

          const wardItems: WardItem[] = state.progress
            .filter((p) => p.versesMemorized > 0 && p.memorizedAt)
            .map((p) => {
              const surah = surahs.find((s) => s.id === p.surahId);
              const daysSinceMemorized = Math.floor(
                (now - new Date(p.memorizedAt!).getTime()) / 86400000
              );
              const daysSinceReview = p.lastReview
                ? Math.floor((now - new Date(p.lastReview).getTime()) / 86400000)
                : daysSinceMemorized;

              let category: WardCategory;
              let dueForReview: boolean;

              if (daysSinceMemorized <= 7) {
                category = "jadid";
                dueForReview = daysSinceReview >= 1;
              } else if (daysSinceMemorized <= 30) {
                category = "qareeb";
                dueForReview = daysSinceReview >= 7;
              } else {
                category = "ba'eed";
                dueForReview = daysSinceReview >= 30;
              }

              return {
                surahId: p.surahId,
                surahName: surah?.name ?? "",
                versesMemorized: p.versesMemorized,
                memorizedAt: p.memorizedAt,
                lastReview: p.lastReview,
                daysSinceMemorized,
                daysSinceReview,
                category,
                dueForReview,
              } satisfies WardItem;
            });

          return {
            jadid: wardItems.filter((w) => w.category === "jadid"),
            qareeb: wardItems.filter((w) => w.category === "qareeb"),
            baeed: wardItems.filter((w) => w.category === "ba'eed"),
            todayTotal: wardItems.filter((w) => w.dueForReview),
          };
        },

        getSmartPlan: (): DayPlan[] => {
          const state = get();
          return buildSmartPlan(state.planConfig, state.masteryRecords);
        },

        getRecoveryPlan: (): RecoveryPlan | null => {
          const state = get();
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const activeDays = state.dailyGoals.filter((g) => g.completedVerses > 0 || g.completedReview > 0);
          const lastActiveDate = activeDays.length > 0
            ? new Date(activeDays[activeDays.length - 1].date)
            : new Date(state.planConfig.startDate);
          
          const missedDays = Math.max(0, Math.floor((today.getTime() - lastActiveDate.getTime()) / 86400000) - 1);
          if (missedDays <= 0 && !state.planConfig.breakRecovery?.isActive) {
            return null;
          }

          const smartPlan = buildSmartPlan(state.planConfig, state.masteryRecords);
          const pendingPages = smartPlan
            .filter((d) => d.isPast && !d.isCompleted && d.memorizeFrom > 0)
            .reduce((sum, d) => sum + (d.memorizeTo - d.memorizeFrom + 1), 0);
          
          const overdueReviews = Object.values(state.masteryRecords).filter(
            (r) => r.nextReviewDate && new Date(r.nextReviewDate) < today
          ).length;

          const weakSurahs = Object.values(state.masteryRecords).filter(
            (r) => r.masteryLevel === "needs_reinforcement" || r.masteryLevel === "regressed"
          ).length;

          return calculateRecoveryPlan(state.planConfig, missedDays, pendingPages, overdueReviews, weakSurahs);
        },
      };
    },
    {
      name: HAFIZ_STORAGE_KEY,
      partialize: (state) => ({
        progress: state.progress,
        dailyGoals: state.dailyGoals,
        stats: state.stats,
        currentSurah: state.currentSurah,
        planConfig: state.planConfig,
        masteryRecords: state.masteryRecords,
        planProposals: state.planProposals,
        planHistory: state.planHistory,
      }),
    }
  )
);

if (typeof window !== "undefined") {
  window.addEventListener("hafiz_unified_record_updated", () => {
    try {
      useMemorizationStore.persist?.rehydrate();
    } catch (_) {}
  });
}
