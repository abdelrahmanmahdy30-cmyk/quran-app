/**
 * spaced-repetition.ts
 *
 * نظام التكرار المتباعد الذكي لمراجعة القرآن الكريم (Spaced Repetition System - SRS)
 * مبني على فترات علمية لتثبيت الحفظ في الذاكرة طويلة المدى:
 * - مستوى 1 (ضعيف < 50%): مراجعة كل يوم
 * - مستوى 2 (متوسط 50-69%): مراجعة كل 3 أيام
 * - مستوى 3 (جيد 70-84%): مراجعة كل 7 أيام
 * - مستوى 4 (قوي 85-94%): مراجعة كل 14 يوماً
 * - مستوى 5 (متقن 95-100%): مراجعة كل 30 يوماً
 */

import { surahs, type MemorizationProgress } from "./quran-data";

export type ReviewGrade = "hard" | "good" | "easy";

export interface SrsSurahItem {
  surahId: number;
  strength: number;
  status: MemorizationProgress["status"];
  versesMemorized: number;
  totalVerses: number;
  lastReview: Date | null;
  nextReviewDate: Date;
  intervalDays: number;
  daysUntilReview: number;
  urgency: "overdue" | "due_today" | "upcoming" | "mastered";
}

/**
 * تحديد الفاصل الزمني بالأيام بحسب قوة الحفظ
 */
export function getIntervalForStrength(strength: number): number {
  if (strength < 50) return 1;
  if (strength < 70) return 3;
  if (strength < 85) return 7;
  if (strength < 95) return 14;
  return 30;
}

/**
 * حساب حالة التكرار المتباعد لسورة معينة
 */
export function calculateSrsItem(progress: MemorizationProgress): SrsSurahItem {
  const intervalDays = getIntervalForStrength(progress.strength);
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  let nextReviewDate: Date;

  if (!progress.lastReview) {
    // لم تُراجع من قبل: مستحقة الآن
    nextReviewDate = new Date(now);
  } else {
    const last = new Date(progress.lastReview);
    last.setHours(0, 0, 0, 0);
    nextReviewDate = new Date(last);
    nextReviewDate.setDate(nextReviewDate.getDate() + intervalDays);
  }

  const diffMs = nextReviewDate.getTime() - now.getTime();
  const daysUntilReview = Math.round(diffMs / (1000 * 60 * 60 * 24));

  let urgency: SrsSurahItem["urgency"] = "upcoming";
  if (daysUntilReview < 0) {
    urgency = "overdue";
  } else if (daysUntilReview === 0) {
    urgency = "due_today";
  } else if (progress.strength >= 90) {
    urgency = "mastered";
  }

  return {
    surahId: progress.surahId,
    strength: progress.strength,
    status: progress.status,
    versesMemorized: progress.versesMemorized,
    totalVerses: surahs.find((s) => s.id === progress.surahId)?.verses ?? 0,
    lastReview: progress.lastReview,
    nextReviewDate,
    intervalDays,
    daysUntilReview,
    urgency,
  };
}

/**
 * حساب القوة الجديدة بناءً على تقييم المستخدم في جلسة المراجعة
 */
export function calculateNewStrength(currentStrength: number, grade: ReviewGrade): number {
  switch (grade) {
    case "hard":
      // يحتاج تثبيت: تثبيت القوة في نطاق 40-55%
      return Math.max(35, Math.min(55, currentStrength - 10));
    case "good":
      // جيد: زيادة 10%
      return Math.min(90, Math.max(65, currentStrength + 10));
    case "easy":
      // متقن: زيادة 15-20% حتى 100%
      return Math.min(100, Math.max(85, currentStrength + 15));
  }
}
