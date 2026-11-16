/**
 * lib/srs-engine.ts
 * المحرك النقي للتكرار المتباعد المتكيف (SRS Engine)
 *
 * القواعد الصارمة:
 * 1. التقييم طبقة إضافية فوق الخطة، ولا يغيّر الخطة الأساسية أو تاريخ الختمة أو النسبة الموحدة.
 * 2. الفواصل:
 *    - يحتاج تثبيت: يوم واحد (ويرجع Stage 1)
 *    - جيد: 3 أيام
 *    - جيد جداً: 7 أيام
 *    - ممتاز: 14 يوماً ثم 30 يوماً
 * 3. الترقية والتراجع: تقييم أعلى يرفع المرحلة، و"يحتاج تثبيت" يُنزل المرحلة إلى 1.
 * 4. مستويات الإتقان (Mastery): جديد (<40)، قيد التثبيت (40-69)، ثابت (70-84)، متقن (>=85 مع stage >= 3).
 * 5. منع التراكم: حد أقصى افتراضي 6 صفحات يومياً، وترتيب الأولويات: يحتاج تثبيت أولاً، ثم الأقدم تأخراً، ثم الأقل strength.
 */

export type ReviewRating = 'excellent' | 'very_good' | 'good' | 'needs_work';

export type MasteryLevel = 'new' | 'reinforcing' | 'stable' | 'mastered';

export interface RatingHistoryEntry {
  date: string;
  rating: ReviewRating;
  strength: number;
}

export interface PageRatingState {
  page: number;
  lastReviewedDate: string; // YYYY-MM-DD
  lastRating: ReviewRating;
  stage: number; // 1, 2, 3, 4, ...
  strength: number; // 0 - 100
  nextDueDate: string; // YYYY-MM-DD
  history: RatingHistoryEntry[];
}

export const DEFAULT_DAILY_SRS_LIMIT = 6;

/**
 * إضافة أيام إلى تاريخ محلي YYYY-MM-DD بدقة
 */
export function addDaysToDateStr(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  const resY = dt.getFullYear();
  const resM = String(dt.getMonth() + 1).padStart(2, '0');
  const resD = String(dt.getDate()).padStart(2, '0');
  return `${resY}-${resM}-${resD}`;
}

/**
 * حساب الفارق بالأيام بين تاريخين YYYY-MM-DD (d1 - d2)
 */
export function diffDaysDateStr(d1: string, d2: string): number {
  const [y1, m1, day1] = d1.split('-').map(Number);
  const [y2, m2, day2] = d2.split('-').map(Number);
  const dt1 = new Date(y1, m1 - 1, day1);
  const dt2 = new Date(y2, m2 - 1, day2);
  return Math.round((dt1.getTime() - dt2.getTime()) / 86400000);
}

/**
 * حساب فاصل الأيام التالي والمرحلة التالية بناءً على التقييم والمرحلة الحالية
 */
export function computeNextIntervalAndStage(
  rating: ReviewRating,
  currentStage: number = 0
): { intervalDays: number; nextStage: number } {
  switch (rating) {
    case 'needs_work':
      // يوم واحد، ويرجع Stage 1
      return { intervalDays: 1, nextStage: 1 };

    case 'good':
      // 3 أيام، وترقية مرحلة واحدة (حد أدنى 2)
      return { intervalDays: 3, nextStage: Math.max(2, currentStage + 1) };

    case 'very_good':
      // 7 أيام، وترقية مرحلة واحدة (حد أدنى 3)
      return { intervalDays: 7, nextStage: Math.max(3, currentStage + 1) };

    case 'excellent':
      // ممتاز: 14 يوماً إذا كانت المرحلة < 3، و30 يوماً إذا كانت المرحلة >= 3
      if (currentStage < 3) {
        return { intervalDays: 14, nextStage: 3 };
      }
      return { intervalDays: 30, nextStage: currentStage + 1 };
  }
}

/**
 * حساب القوة الجديدة (0-100) عند التقييم
 */
export function computeRatingStrength(
  rating: ReviewRating,
  prevStrength?: number
): number {
  const base = prevStrength ?? 50;

  switch (rating) {
    case 'needs_work':
      // تراجع ملحوظ للقوة
      return Math.max(15, Math.min(35, Math.round(base * 0.5)));

    case 'good':
      return Math.max(50, Math.min(100, base + 12));

    case 'very_good':
      return Math.max(70, Math.min(100, base + 16));

    case 'excellent':
      return Math.max(88, Math.min(100, base + 22));
  }
}

/**
 * حساب القوة الحالية مع الأخذ في الاعتبار التناقص الزمني عند التأخر عن موعد الاستحقاق
 */
export function computeCurrentStrength(
  ratingState: PageRatingState,
  todayStr: string
): number {
  const overdueDays = diffDaysDateStr(todayStr, ratingState.nextDueDate);
  if (overdueDays <= 0) {
    return ratingState.strength;
  }
  // تناقص بمقدار 2% لكل يوم تأخير، بحد أدنى 10%
  const decay = overdueDays * 2;
  return Math.max(10, Math.round(ratingState.strength - decay));
}

/**
 * تصنيف مستوى الإتقان (Mastery Level)
 */
export function getMasteryLevel(strength: number, stage: number): MasteryLevel {
  if (strength >= 85 && stage >= 3) return 'mastered';
  if (strength >= 70) return 'stable';
  if (strength >= 40) return 'reinforcing';
  return 'new';
}

/**
 * دالة التقييم النقية: تحسب الحالة الجديدة للصفحة المقيمة دون أي آثار جانبية
 */
export function calculateNextRatingState(
  page: number,
  rating: ReviewRating,
  reviewDate: string,
  existingState?: PageRatingState
): PageRatingState {
  const currentStage = existingState?.stage ?? 0;
  const currentStrength = existingState ? computeCurrentStrength(existingState, reviewDate) : undefined;

  const { intervalDays, nextStage } = computeNextIntervalAndStage(rating, currentStage);
  const nextStrength = computeRatingStrength(rating, currentStrength);
  const nextDueDate = addDaysToDateStr(reviewDate, intervalDays);

  const prevHistory = existingState?.history || [];
  const nextHistory: RatingHistoryEntry[] = [
    ...prevHistory,
    {
      date: reviewDate,
      rating,
      strength: nextStrength,
    },
  ].slice(-10); // الاحتفاظ بآخر 10 تقييمات

  return {
    page,
    lastReviewedDate: reviewDate,
    lastRating: rating,
    stage: nextStage,
    strength: nextStrength,
    nextDueDate,
    history: nextHistory,
  };
}

export interface SrsQueueResult {
  dueToday: PageRatingState[];
  deferred: PageRatingState[];
  overdue: PageRatingState[];
  mastered: PageRatingState[];
  totalDueCount: number;
}

/**
 * استخراج وإدارة طابور التثبيت ومنع التراكم
 * الأولوية:
 * 1. يحتاج تثبيت أولاً (needs_work)
 * 2. الأقدم تأخراً (أكبر فارق أيام)
 * 3. الأقل strength
 * الباقي يؤجل بشفافية ولا يضيع
 */
export function selectSrsQueue(
  ratings: Record<number, PageRatingState>,
  todayStr: string,
  limit: number = DEFAULT_DAILY_SRS_LIMIT
): SrsQueueResult {
  const allList = Object.values(ratings);

  // الصفحات المستحقة اليوم أو المتأخرة
  const dueCandidates = allList.filter((r) => r.nextDueDate <= todayStr);

  // ترتيب الأولويات الدقيق
  dueCandidates.sort((a, b) => {
    // 1. يحتاج تثبيت أولاً
    const aNeedsWork = a.lastRating === 'needs_work' ? 1 : 0;
    const bNeedsWork = b.lastRating === 'needs_work' ? 1 : 0;
    if (aNeedsWork !== bNeedsWork) return bNeedsWork - aNeedsWork;

    // 2. الأقدم تأخراً
    const aOverdue = diffDaysDateStr(todayStr, a.nextDueDate);
    const bOverdue = diffDaysDateStr(todayStr, b.nextDueDate);
    if (aOverdue !== bOverdue) return bOverdue - aOverdue;

    // 3. الأقل قوة
    const aStr = computeCurrentStrength(a, todayStr);
    const bStr = computeCurrentStrength(b, todayStr);
    return aStr - bStr;
  });

  const dueToday = dueCandidates.slice(0, limit);
  const deferred = dueCandidates.slice(limit);
  const overdue = dueCandidates.filter((r) => r.nextDueDate < todayStr);
  const mastered = allList.filter(
    (r) => getMasteryLevel(computeCurrentStrength(r, todayStr), r.stage) === 'mastered'
  );

  return {
    dueToday,
    deferred,
    overdue,
    mastered,
    totalDueCount: dueCandidates.length,
  };
}

