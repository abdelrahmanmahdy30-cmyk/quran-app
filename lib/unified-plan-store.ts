/**
 * lib/unified-plan-store.ts
 * المرحلة 3.5: مصدر واحد للحقيقة (Single Source of Truth)
 *
 * يوفر السجل الموحد (UnifiedPlanRecord) ومحددات نقية (Selectors) ودوال كتابة حصرية
 * لضمان عدم وجود أي نسب متضاربة أو حالات غير متزامنة عبر كامل التطبيق.
 */

import { generatePlan } from './plan-generator';
import { generatePlanFrom } from './plan-generator-from';
import {
  ReviewRating,
  PageRatingState,
  calculateNextRatingState,
  selectSrsQueue,
  SrsQueueResult,
  DEFAULT_DAILY_SRS_LIMIT,
} from './srs-engine';

export type { PageRatingState };
import { createHafs, Page, Surah } from 'quran-meta';
import { PlanDay, StudyDay, FridayDay } from './six-month-plan-types';
import { JUZ_META_RANGES } from './plan-ui-helpers';
import { useMemorizationStore } from './memorization-store';

const hafs = createHafs();

export function getAllPlanDays(record?: UnifiedPlanRecord): PlanDay[] {
  if (
    !record ||
    (record.startPage === 1 &&
      record.startDate === '2026-11-01' &&
      !record.wrapAround &&
      !record.priorPagesMemorized &&
      (!record.memorizedPages || record.memorizedPages.length === 0) &&
      (!record.frozenDays || Object.keys(record.frozenDays).length === 0) &&
      (!record.priorMemorizedSurahs || record.priorMemorizedSurahs.length === 0))
  ) {
    return generatePlan().flatMap((m) => m.days);
  }

  // احسب الصفحات المغطاة بالكامل من السور المحفوظة مسبقاً (قبل تمريرها للمولد)
  const priorCoveredPages =
    record.priorMemorizedSurahs && record.priorMemorizedSurahs.length > 0
      ? computeFullyCoveredPages(record.priorMemorizedSurahs)
      : [];

  return generatePlanFrom({
    startPage: record.startPage,
    startDate: record.startDate,
    memorizedPages: record.memorizedPages,
    frozenDays: record.frozenDays,
    today: formatLocalDateStr(),
    wrapAround: record.wrapAround,
    priorPagesMemorized: record.priorPagesMemorized,
    priorCoveredPages,
  }).flatMap((m) => m.days);
}

export interface DaySnapshot {
  date: string;
  dayIndex: number;
  dayName: string;
  isFriday: boolean;
  completedAt: string;
  pagesCount: number;
  memorizedPagesSnapshot: number[];
}

export interface DayStepsState {
  far: boolean;
  near: boolean;
  new: boolean;
}

export interface UnifiedPlanRecord {
  schemaVersion: number;
  planId: string;
  startPage: number;
  startDate: string;
  wrapAround: boolean;
  priorPagesMemorized: boolean;
  priorMemorizedSurahs?: number[]; // أرقام السور المحفوظة بالكامل (1..114)
  memorizedPages: number[];
  steps: Record<string, DayStepsState>;
  frozenDays: Record<string, DaySnapshot>;
  ratings: Record<number, PageRatingState>;
}

export const CURRENT_SCHEMA_VERSION = 1;
export const DEFAULT_PLAN_ID = 'plan-hizb-hafiz-default';
export const ACTIVE_PLAN_ID_KEY = 'hafiz_active_plan_id';

export function getActivePlanId(): string {
  if (typeof window === 'undefined') return DEFAULT_PLAN_ID;
  return localStorage.getItem(ACTIVE_PLAN_ID_KEY) || DEFAULT_PLAN_ID;
}

export function setActivePlanId(planId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACTIVE_PLAN_ID_KEY, planId);
  window.dispatchEvent(new CustomEvent('hafiz_active_plan_changed', { detail: { planId } }));
}

export function getUnifiedStorageKey(planId: string = DEFAULT_PLAN_ID): string {
  return `hafiz_unified_record_v${CURRENT_SCHEMA_VERSION}_${planId}`;
}

export function formatLocalDateStr(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function canMarkDate(targetDateStr: string, todayDateStr: string = formatLocalDateStr()): boolean {
  return targetDateStr <= todayDateStr;
}

export function createCleanRecord(planId: string = DEFAULT_PLAN_ID): UnifiedPlanRecord {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    planId,
    startPage: 1,
    startDate: '2026-11-01',
    wrapAround: false,
    priorPagesMemorized: false,
    priorMemorizedSurahs: [],
    memorizedPages: [],
    steps: {},
    frozenDays: {},
    ratings: {},
  };
}

export function validateAndSanitizeRecord(data: any, todayStr: string = formatLocalDateStr()): UnifiedPlanRecord {
  const fallback = createCleanRecord(data?.planId || DEFAULT_PLAN_ID);
  if (!data || typeof data !== 'object') return fallback;

  const validPages: number[] = Array.isArray(data.memorizedPages)
    ? Array.from(new Set<number>(data.memorizedPages.filter((p: any): p is number => typeof p === 'number' && p >= 1 && p <= 604))).sort((a, b) => a - b)
    : [];

  const validSteps: Record<string, DayStepsState> = {};
  if (data.steps && typeof data.steps === 'object') {
    for (const [date, steps] of Object.entries(data.steps)) {
      if (typeof date === 'string' && canMarkDate(date, todayStr) && steps && typeof steps === 'object') {
        const s = steps as any;
        validSteps[date] = {
          far: Boolean(s.far),
          near: Boolean(s.near),
          new: Boolean(s.new),
        };
      }
    }
  }

  const validFrozen: Record<string, DaySnapshot> = {};
  if (data.frozenDays && typeof data.frozenDays === 'object') {
    for (const [date, snap] of Object.entries(data.frozenDays)) {
      if (typeof date === 'string' && canMarkDate(date, todayStr) && snap && typeof snap === 'object') {
        const sn = snap as any;
        validFrozen[date] = {
          date,
          dayIndex: typeof sn.dayIndex === 'number' ? sn.dayIndex : 1,
          dayName: typeof sn.dayName === 'string' ? sn.dayName : '',
          isFriday: Boolean(sn.isFriday),
          completedAt: typeof sn.completedAt === 'string' ? sn.completedAt : new Date().toISOString(),
          pagesCount: typeof sn.pagesCount === 'number' ? sn.pagesCount : 0,
          memorizedPagesSnapshot: Array.isArray(sn.memorizedPagesSnapshot) ? sn.memorizedPagesSnapshot : [],
        };
      }
    }
  }

  const validRatings: Record<number, PageRatingState> = {};
  if (data.ratings && typeof data.ratings === 'object') {
    for (const [pageStr, rating] of Object.entries(data.ratings)) {
      const pageNum = Number(pageStr);
      if (pageNum >= 1 && pageNum <= 604 && rating && typeof rating === 'object') {
        validRatings[pageNum] = rating as PageRatingState;
      }
    }
  }

  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    planId: typeof data.planId === 'string' ? data.planId : DEFAULT_PLAN_ID,
    startPage: typeof data.startPage === 'number' ? data.startPage : 1,
    startDate: typeof data.startDate === 'string' ? data.startDate : '2026-11-01',
    wrapAround: Boolean(data.wrapAround),
    priorPagesMemorized: Boolean(data.priorPagesMemorized),
    priorMemorizedSurahs: Array.isArray(data.priorMemorizedSurahs)
      ? Array.from(new Set<number>(
          data.priorMemorizedSurahs.filter((n: any): n is number =>
            typeof n === 'number' &&
            Number.isInteger(n) &&
            n >= 1 &&
            n <= 114
          )
        )).sort((a: number, b: number) => a - b)
      : [],
    memorizedPages: validPages,
    steps: validSteps,
    frozenDays: validFrozen,
    ratings: validRatings,
  };
}

export function migrateLegacyStorage(planId: string = DEFAULT_PLAN_ID): UnifiedPlanRecord | null {
  if (typeof window === 'undefined') return null;

  try {
    const record = createCleanRecord(planId);
    let migratedAny = false;

    const legacyCompletedDaysRaw =
      localStorage.getItem("hafiz_unified_plan_completed_days") ||
      localStorage.getItem("hafiz_completed_days_six_month");
    if (legacyCompletedDaysRaw) {
      try {
        const dates: string[] = JSON.parse(legacyCompletedDaysRaw);
        if (Array.isArray(dates) && dates.length > 0) {
          const allPlanDays = getAllPlanDays();
          dates.forEach((dStr) => {
            if (typeof dStr === 'string' && canMarkDate(dStr)) {
              record.steps[dStr] = { far: true, near: true, new: true };
              const foundDay = allPlanDays.find((d) => d.date === dStr);
              if (foundDay) {
                record.frozenDays[dStr] = {
                  date: dStr,
                  dayIndex: foundDay.type === 'study' ? foundDay.dayNumber : foundDay.weekNumber,
                  dayName: foundDay.dayName,
                  isFriday: foundDay.type === 'friday',
                  completedAt: new Date().toISOString(),
                  pagesCount: foundDay.type === 'study' ? (foundDay as StudyDay).newPages.length : 0,
                  memorizedPagesSnapshot: [],
                };
                if (foundDay.type === 'study' && (foundDay as StudyDay).newPages) {
                  (foundDay as StudyDay).newPages.forEach((p) => {
                    if (!record.memorizedPages.includes(p.p)) {
                      record.memorizedPages.push(p.p);
                    }
                  });
                }
              }
              migratedAny = true;
            }
          });
          record.memorizedPages.sort((a, b) => a - b);
        }
      } catch {
        // ignore
      }
    }

    const legacyAppRaw = localStorage.getItem('hafiz-quran-v1');
    if (legacyAppRaw) {
      try {
        const appState = JSON.parse(legacyAppRaw);
        const progressList = appState?.state?.progress;
        if (Array.isArray(progressList)) {
          progressList.forEach((p: any) => {
            if (p?.status === 'memorized' && Array.isArray(p.pageRange)) {
              for (let pNum = p.pageRange[0]; pNum <= p.pageRange[1]; pNum++) {
                if (!record.memorizedPages.includes(pNum) && pNum >= 1 && pNum <= 604) {
                  record.memorizedPages.push(pNum);
                  migratedAny = true;
                }
              }
            }
          });
          record.memorizedPages.sort((a, b) => a - b);
        }
      } catch {
        // ignore
      }
    }

    if (migratedAny) {
      return record;
    }
    return null;
  } catch {
    return null;
  }
}

export function loadUnifiedRecord(planId: string = DEFAULT_PLAN_ID): UnifiedPlanRecord {
  if (typeof window === 'undefined') return createCleanRecord(planId);

  const key = getUnifiedStorageKey(planId);
  const raw = localStorage.getItem(key);

  if (!raw) {
    const migrated = migrateLegacyStorage(planId);
    if (migrated) {
      saveUnifiedRecord(migrated);
      return migrated;
    }
    const fresh = createCleanRecord(planId);
    saveUnifiedRecord(fresh);
    return fresh;
  }

  try {
    const parsed = JSON.parse(raw);
    const sanitized = validateAndSanitizeRecord(parsed);
    return sanitized;
  } catch (err) {
    console.warn('[UnifiedPlanStore] Corrupted JSON detected. Creating backup and reinitializing.', err);
    try {
      localStorage.setItem(`${key}_corrupted_backup_${Date.now()}`, raw);
    } catch {
      // ignore
    }
    const clean = createCleanRecord(planId);
    saveUnifiedRecord(clean);
    return clean;
  }
}

export function saveUnifiedRecord(record: UnifiedPlanRecord): void {
  if (typeof window === 'undefined') return;
  const key = getUnifiedStorageKey(record.planId);
  try {
    const jsonStr = JSON.stringify(record);
    localStorage.setItem(key, jsonStr);
    syncUnifiedProgressToLocalData(record);
    window.dispatchEvent(new CustomEvent('hafiz_unified_record_updated', { detail: { planId: record.planId } }));
    window.dispatchEvent(new Event('storage'));
  } catch (err) {
    console.error('[UnifiedPlanStore] Failed to save record to localStorage:', err);
  }
}

export function clearUnifiedRecord(planId: string = DEFAULT_PLAN_ID): UnifiedPlanRecord {
  const clean = createCleanRecord(planId);
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(getUnifiedStorageKey(planId), JSON.stringify(clean));
      syncUnifiedProgressToLocalData(clean);
      window.dispatchEvent(new CustomEvent('hafiz_unified_record_updated', { detail: { planId } }));
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.error('[UnifiedPlanStore] Failed to clear unified record:', e);
    }
  }
  return clean;
}

export function getRequiredStepsForDay(day: PlanDay): Array<'far' | 'near' | 'new'> {
  if (day.type === 'friday') {
    const req: Array<'far' | 'near' | 'new'> = ['near'];
    if (day.farPages && day.farPages.length > 0) req.push('far');
    return req;
  }
  const sDay = day as StudyDay;
  const req: Array<'far' | 'near' | 'new'> = ['new'];
  if (sDay.nearPages && sDay.nearPages.length > 0) req.push('near');
  if (sDay.farPages && sDay.farPages.length > 0) req.push('far');
  return req;
}

export function isAllRequiredStepsDone(day: PlanDay, stepsState?: DayStepsState): boolean {
  if (!stepsState) return false;
  const req = getRequiredStepsForDay(day);
  return req.every((st) => {
    if (st === 'new') return stepsState.new;
    if (st === 'near') return stepsState.near;
    if (st === 'far') return stepsState.far;
    return false;
  });
}

export function markStep(
  record: UnifiedPlanRecord,
  localDate: string,
  step: 'far' | 'near' | 'new',
  planDays: PlanDay[] = getAllPlanDays(),
  todayStr: string = formatLocalDateStr()
): UnifiedPlanRecord {
  if (!canMarkDate(localDate, todayStr)) {
    console.warn(`[UnifiedPlanStore] Cannot mark future date: ${localDate}`);
    return record;
  }

  const day = planDays.find((d) => d.date === localDate);
  if (!day) return record;

  const currentSteps = record.steps[localDate] || { far: false, near: false, new: false };
  const nextSteps: DayStepsState = { ...currentSteps, [step]: true };

  const nextRecord: UnifiedPlanRecord = {
    ...record,
    steps: {
      ...record.steps,
      [localDate]: nextSteps,
    },
    frozenDays: { ...record.frozenDays },
  };

  if (step === 'new' && day.type !== 'friday' && 'newPages' in day) {
    const sDay = day as StudyDay;
    const pNums = sDay.newPages.map((p) => p.p);
    const set = new Set(nextRecord.memorizedPages);
    pNums.forEach((p) => set.add(p));
    nextRecord.memorizedPages = Array.from(set).sort((a, b) => a - b);
  }

  if (isAllRequiredStepsDone(day, nextSteps)) {
    nextRecord.frozenDays[localDate] = {
      date: localDate,
      dayIndex: day.type === 'study' ? day.dayNumber : day.weekNumber,
      dayName: day.dayName,
      isFriday: day.type === 'friday',
      completedAt: new Date().toISOString(),
      pagesCount: (day.type === 'friday') ? 0 : (day as StudyDay).newPages.length,
      memorizedPagesSnapshot: [...nextRecord.memorizedPages],
    };
  }

  saveUnifiedRecord(nextRecord);
  return nextRecord;
}

/**
 * تقييم التسميع لصفحة محفوظة (المرحلة 4: SRS)
 * لا يُسمح بتقييم صفحة لم تُحفظ بعد، ولا بتاريخ مستقبلي.
 * لا يمس صفحات الخطة أو تاريخ الختمة أو النسبة الموحدة.
 */
export function storeRatePage(
  record: UnifiedPlanRecord,
  page: number,
  rating: ReviewRating,
  reviewDate: string = formatLocalDateStr(),
  todayStr: string = formatLocalDateStr()
): UnifiedPlanRecord {
  if (page < 1 || page > 604) return record;

  if (!canMarkDate(reviewDate, todayStr)) {
    console.warn(`[UnifiedPlanStore] Cannot rate page with future review date ${reviewDate}`);
    return record;
  }

  if (!record.memorizedPages.includes(page)) {
    console.warn(`[UnifiedPlanStore] Cannot rate page ${page} which has not been memorized yet`);
    return record;
  }

  const existing = record.ratings[page];
  const nextRatingState = calculateNextRatingState(page, rating, reviewDate, existing);

  const nextRecord: UnifiedPlanRecord = {
    ...record,
    ratings: {
      ...record.ratings,
      [page]: nextRatingState,
    },
  };

  saveUnifiedRecord(nextRecord);
  return nextRecord;
}

export function storeRatePages(
  record: UnifiedPlanRecord,
  pages: number[],
  rating: ReviewRating,
  reviewDate: string = formatLocalDateStr(),
  todayStr: string = formatLocalDateStr()
): UnifiedPlanRecord {
  let curr = record;
  for (const p of pages) {
    curr = storeRatePage(curr, p, rating, reviewDate, todayStr);
  }
  return curr;
}

export function unmarkStep(
  record: UnifiedPlanRecord,
  localDate: string,
  step: 'far' | 'near' | 'new',
  planDays: PlanDay[] = getAllPlanDays(),
  todayStr: string = formatLocalDateStr()
): UnifiedPlanRecord {
  if (!canMarkDate(localDate, todayStr)) {
    return record;
  }

  const day = planDays.find((d) => d.date === localDate);
  if (!day) return record;

  const currentSteps = record.steps[localDate] || { far: false, near: false, new: false };
  const nextSteps: DayStepsState = { ...currentSteps, [step]: false };

  const nextRecord: UnifiedPlanRecord = {
    ...record,
    steps: {
      ...record.steps,
      [localDate]: nextSteps,
    },
    frozenDays: { ...record.frozenDays },
  };

  if (step === 'new' && day.type !== 'friday' && 'newPages' in day) {
    const sDay = day as StudyDay;
    const pNums = new Set(sDay.newPages.map((p) => p.p));
    nextRecord.memorizedPages = nextRecord.memorizedPages.filter((p) => !pNums.has(p));
  }

  delete nextRecord.frozenDays[localDate];

  saveUnifiedRecord(nextRecord);
  return nextRecord;
}

export function markPage(
  record: UnifiedPlanRecord,
  page: number,
  planDays: PlanDay[] = getAllPlanDays(),
  todayStr: string = formatLocalDateStr()
): UnifiedPlanRecord {
  if (page < 1 || page > 604) return record;

  const targetDay = planDays.find((d) => d.type !== 'friday' && (d as StudyDay).newPages?.some((p) => p.p === page));
  if (targetDay && !canMarkDate(targetDay.date, todayStr)) {
    console.warn(`[UnifiedPlanStore] Cannot mark page ${page} belonging to future date ${targetDay.date}`);
    return record;
  }

  const set = new Set(record.memorizedPages);
  set.add(page);
  const nextPages = Array.from(set).sort((a, b) => a - b);

  let nextRecord: UnifiedPlanRecord = {
    ...record,
    memorizedPages: nextPages,
  };

  if (targetDay) {
    const sDay = targetDay as StudyDay;
    const allDayPagesDone = sDay.newPages.every((p) => set.has(p.p));
    if (allDayPagesDone) {
      nextRecord = markStep(nextRecord, targetDay.date, 'new', planDays, todayStr);
    }
  }

  saveUnifiedRecord(nextRecord);
  return nextRecord;
}

export function unmarkPage(
  record: UnifiedPlanRecord,
  page: number,
  planDays: PlanDay[] = getAllPlanDays(),
  todayStr: string = formatLocalDateStr()
): UnifiedPlanRecord {
  if (page < 1 || page > 604) return record;

  const targetDay = planDays.find((d) => d.type !== 'friday' && (d as StudyDay).newPages?.some((p) => p.p === page));
  if (targetDay && !canMarkDate(targetDay.date, todayStr)) {
    return record;
  }

  const nextPages = record.memorizedPages.filter((p) => p !== page);
  let nextRecord: UnifiedPlanRecord = {
    ...record,
    memorizedPages: nextPages,
  };

  if (targetDay) {
    nextRecord = unmarkStep(nextRecord, targetDay.date, 'new', planDays, todayStr);
  }

  saveUnifiedRecord(nextRecord);
  return nextRecord;
}

/**
 * يحسب الصفحات المغطاة بالكامل من قائمة أرقام السور المحفوظة.
 * الصفحة تُعتبر مغطاة فقط إذا كانت كل آياتها تنتمي لسور موجودة في fullSurahIds.
 * الصفحات المشتركة بين سورة محفوظة وأخرى غير محفوظة لا تُرجع.
 * دالة نقية (Pure): لا تلمس localStorage ولا تعدل السجل.
 */
export function computeFullyCoveredPages(fullSurahIds: number[]): number[] {
  if (!fullSurahIds || fullSurahIds.length === 0) return [];
  const surahsSet = new Set(fullSurahIds);
  const covered: number[] = [];

  for (let p = 1; p <= 604; p++) {
    const ayahs = Array.from(hafs.ayahsInPage(p as Page));
    if (ayahs.length === 0) continue;
    // الصفحة مغطاة فقط إذا كانت كل آياتها تنتمي لسور محفوظة
    if (ayahs.every(([s]) => surahsSet.has(s))) {
      covered.push(p);
    }
  }

  return covered;
}

/**
 * تحديث قائمة السور المحفوظة مسبقاً في السجل الموحد.
 * لا تعدل memorizedPages أو ratings أو steps أو frozenDays.
 */
export function updatePriorMemorizedSurahs(
  record: UnifiedPlanRecord,
  surahIds: number[]
): UnifiedPlanRecord {
  // تنظيف: إزالة المكررات والأرقام خارج النطاق 1..114
  const cleaned = [...new Set(
    surahIds.filter((n) => Number.isInteger(n) && n >= 1 && n <= 114)
  )].sort((a, b) => a - b);

  const nextRecord: UnifiedPlanRecord = {
    ...record,
    priorMemorizedSurahs: cleaned,
    // لا تعديل على: memorizedPages, ratings, steps, frozenDays
  };

  saveUnifiedRecord(nextRecord);
  return nextRecord;
}

/**
 * اشتقاق الصفحات المحفوظة الفعالة: مجموع memorizedPages + صفحات السور المحفوظة مسبقاً كاملاً.
 * دالة نقية (Pure): لا تلمس localStorage ولا تعدل السجل.
 * تُزيل التكرار وتُرتّب تصاعدياً.
 */
export function selectEffectiveMemorizedPages(record: UnifiedPlanRecord): number[] {
  const prior =
    record.priorMemorizedSurahs && record.priorMemorizedSurahs.length > 0
      ? computeFullyCoveredPages(record.priorMemorizedSurahs)
      : [];
  if (prior.length === 0) return record.memorizedPages;
  const merged = new Set<number>([...record.memorizedPages, ...prior]);
  return Array.from(merged).sort((a, b) => a - b);
}

/**
 * المحددات النقية (Pure Selectors)
 */

export function selectPagesDone(record: UnifiedPlanRecord): number {
  return selectEffectiveMemorizedPages(record).length;
}

export function selectPercentTotal(record: UnifiedPlanRecord): number {
  const count = selectEffectiveMemorizedPages(record).length;
  if (count === 0) return 0;
  return Math.round((count / 604) * 100);
}

export function selectCompletedDaysCount(record: UnifiedPlanRecord): number {
  return Object.keys(record.frozenDays).length;
}

export function selectDaysRemaining(record: UnifiedPlanRecord, totalDays: number = 181): number {
  const completed = Object.keys(record.frozenDays).length;
  return Math.max(0, totalDays - completed);
}

/**
 * اشتقاق تاريخ الختمة ديناميكياً من الخطة:
 * يبحث عن آخر يوم دراسي يحتوي على صفحات حفظ جديدة (newPages.length > 0).
 */
export function selectKhatmaDate(
  record?: UnifiedPlanRecord,
  planDays: PlanDay[] = getAllPlanDays(record)
): string {
  // آخر يوم دراسي يحتوي newPages (بدل البحث عن الصفحة 604 مباشرة)
  let lastStudyDayWithPages: PlanDay | undefined;
  for (const d of planDays) {
    if (d.type === 'study' && (d as StudyDay).newPages && (d as StudyDay).newPages.length > 0) {
      lastStudyDayWithPages = d;
    }
  }
  return lastStudyDayWithPages ? lastStudyDayWithPages.date : '2027-04-29';
}

export const LOCKED_KHATMA_DATE = '2027-04-29';

/**
 * اشتقاق الورد اليومي المقرر ديناميكياً من الخطة:
 * يستخرج عدد صفحات الحفظ الجديد المقررة لليوم المحدد (0 في أيام الجمعة).
 */
export function selectDailyQuota(
  record?: UnifiedPlanRecord,
  dateStr: string = formatLocalDateStr(),
  planDays: PlanDay[] = getAllPlanDays()
): number {
  const day = planDays.find((d) => d.date === dateStr);
  if (!day) return 4;
  if (day.type === 'friday') return 0;
  return (day as StudyDay).newPages ? (day as StudyDay).newPages.length : 4;
}

export function selectIsDayCompleted(record: UnifiedPlanRecord, dateStr: string): boolean {
  return Boolean(record.frozenDays[dateStr]);
}

export function selectIsStepDone(
  record: UnifiedPlanRecord,
  dateStr: string,
  step: 'far' | 'near' | 'new'
): boolean {
  return Boolean(record.steps[dateStr]?.[step]);
}

export function selectIsPageMemorized(record: UnifiedPlanRecord, page: number): boolean {
  return selectEffectiveMemorizedPages(record).includes(page);
}

export function selectJuzStatus(
  record: UnifiedPlanRecord,
  juzNumber: number
): 'completed' | 'in_progress' | 'not_started' {
  const meta = JUZ_META_RANGES[juzNumber - 1];
  if (!meta) return 'not_started';

  const totalInJuz = meta.endPage - meta.startPage + 1;
  const effectiveSet = new Set<number>(selectEffectiveMemorizedPages(record));
  let count = 0;
  for (let p = meta.startPage; p <= meta.endPage; p++) {
    if (effectiveSet.has(p)) count++;
  }

  if (count === totalInJuz) return 'completed';
  if (count > 0) return 'in_progress';
  return 'not_started';
}

export function selectAheadOrBehindPages(
  record: UnifiedPlanRecord,
  planDays: PlanDay[] = getAllPlanDays(),
  todayStr: string = formatLocalDateStr()
): number {
  let expectedPages = 0;
  for (const d of planDays) {
    if (d.date <= todayStr) {
      if (d.type !== 'friday' && 'newPages' in d) {
        expectedPages += (d as StudyDay).newPages.length;
      }
    }
  }
  const actualPages = record.memorizedPages.length;
  return actualPages - expectedPages;
}

export function selectCompletedJuzCount(record: UnifiedPlanRecord): number {
  let completed = 0;
  for (let j = 1; j <= 30; j++) {
    if (selectJuzStatus(record, j) === 'completed') {
      completed++;
    }
  }
  return completed;
}

/**
 * حساب سلسلة الأيام المكتملة المتتالية (Streak) ديناميكياً من السجل الموحد
 */
export function selectStreak(
  record: UnifiedPlanRecord,
  planDays: PlanDay[] = getAllPlanDays(),
  todayStr: string = formatLocalDateStr()
): number {
  const completedDates = new Set(Object.keys(record.frozenDays));
  const sortedDays = planDays
    .filter((d) => d.date <= todayStr)
    .sort((a, b) => b.date.localeCompare(a.date));

  let streak = 0;
  let isCheckingToday = true;

  for (const day of sortedDays) {
    if (completedDates.has(day.date)) {
      streak++;
      isCheckingToday = false;
    } else {
      if (isCheckingToday && day.date === todayStr) {
        isCheckingToday = false;
        continue;
      }
      break;
    }
  }
  return streak;
}

export interface DerivedSurahProgress {
  surahId: number;
  versesMemorized: number;
  totalVerses: number;
  status: 'completed' | 'in_progress' | 'not_started';
  percentage: number;
}

export interface DerivedQuranProgress {
  totalVersesMemorized: number;
  totalVerses: number;
  versesPercentage: number;
  totalPagesMemorized: number;
  totalPages: number;
  pagesPercentage: number;
  completedSurahsCount: number;
  inProgressSurahsCount: number;
  notStartedSurahsCount: number;
  completedJuzCount: number;
  juzProgress: Array<{ juz: number; pagesDone: number; totalPages: number; percent: number }>;
  surahs: DerivedSurahProgress[];
}

/**
 * اشتقاق تقدم السور والآيات والأجزاء بدقة كاملة من الصفحات المحفوظة عبر quran-meta
 */
export function deriveQuranProgress(
  memorizedPages: number[],
  priorMemorizedSurahs: number[] = []
): DerivedQuranProgress {
  const pageSet = new Set(memorizedPages);
  const surahVerses = new Map<number, Set<number>>();

  for (const p of memorizedPages) {
    if (p >= 1 && p <= 604) {
      for (const [s, a] of hafs.ayahsInPage(p as Page)) {
        if (!surahVerses.has(s)) surahVerses.set(s, new Set());
        surahVerses.get(s)!.add(a);
      }
    }
  }

  // أضف جميع آيات السور المحفوظة مسبقاً كاملةً (بغض النظر عن الصفحات المشتركة)
  for (const sId of priorMemorizedSurahs) {
    if (sId < 1 || sId > 114) continue;
    const totalVersesInSurah = hafs.getAyahCountInSurah(sId as Surah);
    if (!surahVerses.has(sId)) surahVerses.set(sId, new Set());
    const ayahSet = surahVerses.get(sId)!;
    for (let a = 1; a <= totalVersesInSurah; a++) {
      ayahSet.add(a);
    }
  }

  let totalVersesMemorized = 0;
  let completedSurahsCount = 0;
  let inProgressSurahsCount = 0;
  let notStartedSurahsCount = 0;
  const surahsList: DerivedSurahProgress[] = [];

  for (let sId = 1; sId <= 114; sId++) {
    const totalVerses = hafs.getAyahCountInSurah(sId as Surah);
    const versesMemorized = surahVerses.has(sId) ? surahVerses.get(sId)!.size : 0;
    totalVersesMemorized += versesMemorized;

    let status: 'completed' | 'in_progress' | 'not_started' = 'not_started';
    if (versesMemorized === totalVerses && totalVerses > 0) {
      status = 'completed';
      completedSurahsCount++;
    } else if (versesMemorized > 0) {
      status = 'in_progress';
      inProgressSurahsCount++;
    } else {
      notStartedSurahsCount++;
    }

    const percentage = totalVerses > 0 ? Math.round((versesMemorized / totalVerses) * 100) : 0;
    surahsList.push({
      surahId: sId,
      versesMemorized,
      totalVerses,
      status,
      percentage,
    });
  }

  let completedJuzCount = 0;
  const juzProgressList = JUZ_META_RANGES.map((meta, idx) => {
    const totalPagesInJuz = meta.endPage - meta.startPage + 1;
    let count = 0;
    for (let p = meta.startPage; p <= meta.endPage; p++) {
      if (pageSet.has(p)) count++;
    }
    const percent = Math.round((count / totalPagesInJuz) * 100);
    if (count === totalPagesInJuz) completedJuzCount++;
    return {
      juz: idx + 1,
      pagesDone: count,
      totalPages: totalPagesInJuz,
      percent,
    };
  });

  return {
    totalVersesMemorized,
    totalVerses: 6236,
    versesPercentage: Math.round((totalVersesMemorized / 6236) * 100),
    totalPagesMemorized: memorizedPages.length,
    totalPages: 604,
    pagesPercentage: Math.round((memorizedPages.length / 604) * 100),
    completedSurahsCount,
    inProgressSurahsCount,
    notStartedSurahsCount,
    completedJuzCount,
    juzProgress: juzProgressList,
    surahs: surahsList,
  };
}

/**
 * مزامنة تلقائية لبيانات السجل الموحد مع متجر التطبيق المحلي hafiz-quran-v1
 */
export function syncUnifiedProgressToLocalData(record: UnifiedPlanRecord): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem('hafiz-quran-v1');
    const existing = raw ? JSON.parse(raw) : {};
    const derived = deriveQuranProgress(selectEffectiveMemorizedPages(record), record.priorMemorizedSurahs || []);

    const baseProgress: Array<any> =
      existing.state?.progress && Array.isArray(existing.state.progress) && existing.state.progress.length === 114
        ? existing.state.progress
        : Array.from({ length: 114 }, (_, i) => ({
            surahId: i + 1,
            versesMemorized: 0,
            memorizedAt: null,
            lastReview: null,
            reviewHistory: [],
            strength: 0,
            status: 'not_started',
          }));

    const updatedProgress = baseProgress.map((p: any) => {
      const d = derived.surahs[p.surahId - 1];
      if (!d) return p;
      const isCompleted = d.status === 'completed';
      const effectiveVerses = Math.max(p.versesMemorized || 0, d.versesMemorized);
      const isMemorized = isCompleted || p.status === 'memorized' || effectiveVerses >= d.totalVerses;
      return {
        ...p,
        versesMemorized: effectiveVerses,
        status: isMemorized ? 'memorized' : effectiveVerses > 0 ? 'in_progress' : p.status || 'not_started',
        strength: isMemorized ? 100 : p.strength || (effectiveVerses > 0 ? 75 : 0),
        lastReviewed: p.lastReviewed || (effectiveVerses > 0 ? formatLocalDateStr() : null),
        memorizedAt: isMemorized ? p.memorizedAt || new Date().toISOString() : p.memorizedAt,
      };
    });

    const streak = selectStreak(record);
    const updatedStats = {
      ...(existing.state?.stats || {}),
      totalVersesMemorized: derived.totalVersesMemorized,
      totalPages: derived.totalPagesMemorized,
      currentStreak: streak,
      longestStreak: Math.max(existing.state?.stats?.longestStreak || 0, streak),
      lastActiveDate: formatLocalDateStr(),
    };

    const nextState = {
      ...existing,
      state: {
        ...(existing.state || {}),
        progress: updatedProgress,
        stats: updatedStats,
      },
    };

    localStorage.setItem('hafiz-quran-v1', JSON.stringify(nextState));

    // تحديث متجر Zustand في الذاكرة فورياً حتى تشعر به صفحة القرآن بدون إعادة تحميل
    try {
      if (typeof useMemorizationStore !== 'undefined' && useMemorizationStore.setState) {
        useMemorizationStore.setState((prev) => ({
          ...prev,
          progress: updatedProgress,
          stats: {
            ...prev.stats,
            ...updatedStats,
          },
        }));
      }
    } catch (_) {}
  } catch (e) {
    console.warn('[UnifiedPlanStore] Could not sync to local-data:', e);
  }
}

export function exportPlanAsJson(record: UnifiedPlanRecord): string {
  return JSON.stringify(record, null, 2);
}

export function importPlanFromJson(
  jsonStr: string,
  todayStr: string = formatLocalDateStr()
): { success: boolean; record?: UnifiedPlanRecord; error?: string } {
  try {
    const parsed = JSON.parse(jsonStr);
    const sanitized = validateAndSanitizeRecord(parsed, todayStr);
    saveUnifiedRecord(sanitized);
    return { success: true, record: sanitized };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Invalid JSON' };
  }
}

/**
 * تحديث تاريخ بداية الخطة مع الحفاظ على الصفحات المحفوظة والتقييمات.
 * يُعيد حساب الجدول الكامل من التاريخ الجديد عبر إعادة تحميل السجل.
 * يُعيد السجل المحدَّث ويحفظه في localStorage.
 */
export function updatePlanStartDate(
  record: UnifiedPlanRecord,
  newStartDate: string,
  todayStr: string = formatLocalDateStr()
): UnifiedPlanRecord {
  if (!newStartDate || newStartDate === record.startDate) return record;
  if (newStartDate > todayStr) {
    console.warn('[UnifiedPlanStore] Cannot set future start date');
    return record;
  }
  const nextRecord: UnifiedPlanRecord = {
    ...record,
    startDate: newStartDate,
    // steps و frozenDays مفتاحها تاريخ مطلق؛ تغيير startDate يُبطل دلالتها
    steps: {},
    frozenDays: {},
  };
  saveUnifiedRecord(nextRecord);
  return nextRecord;
}
