"use client";

export type SupportedStep = "far" | "near" | "new" | "memorize" | "week" | "review";

function normalizeStep(step: SupportedStep): "far" | "near" | "new" {
  if (step === "memorize") return "new";
  if (step === "week") return "near";
  if (step === "review") return "near";
  return step;
}

import { useState, useEffect, useCallback, useMemo } from "react";
import { generatePlan } from "./plan-generator";
import { PlanDay, StudyDay } from "./six-month-plan-types";
import {
  getAllPlanDays,
  UnifiedPlanRecord,
  DEFAULT_PLAN_ID,
  loadUnifiedRecord,
  saveUnifiedRecord,
  clearUnifiedRecord,
  markStep as storeMarkStep,
  unmarkStep as storeUnmarkStep,
  markPage as storeMarkPage,
  unmarkPage as storeUnmarkPage,
  canMarkDate,
  formatLocalDateStr,
  selectPagesDone,
  selectPercentTotal,
  selectCompletedDaysCount,
  selectDaysRemaining,
  selectKhatmaDate,
  selectDailyQuota,
  selectIsDayCompleted,
  selectIsStepDone,
  selectIsPageMemorized,
  selectJuzStatus,
  selectAheadOrBehindPages,
  selectStreak,
  selectEffectiveMemorizedPages,
  deriveQuranProgress,
  getRequiredStepsForDay,
  LOCKED_KHATMA_DATE,
  getActivePlanId,
  setActivePlanId,
} from "./unified-plan-store";

export function usePlanProgress(explicitPlanId?: string) {
  const [activePlanId, setActivePlanIdState] = useState<string>(() => explicitPlanId || getActivePlanId());
  const planId = explicitPlanId || activePlanId;

  const [record, setRecord] = useState<UnifiedPlanRecord>(() => {
    return loadUnifiedRecord(planId);
  });

  const allDays = useMemo(() => getAllPlanDays(record), [record]);
  const todayLocalDate = useMemo(() => formatLocalDateStr(), []);

  useEffect(() => {
    if (explicitPlanId) return;
    const handleActiveChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ planId?: string }>;
      const nextId = customEvent.detail?.planId || getActivePlanId();
      setActivePlanIdState(nextId);
      setRecord(loadUnifiedRecord(nextId));
    };
    window.addEventListener("hafiz_active_plan_changed", handleActiveChange);
    return () => window.removeEventListener("hafiz_active_plan_changed", handleActiveChange);
  }, [explicitPlanId]);

  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ planId?: string }>;
      if (!customEvent.detail || customEvent.detail.planId === planId) {
        setRecord(loadUnifiedRecord(planId));
      }
    };

    const handleStorage = (e: StorageEvent) => {
      setRecord(loadUnifiedRecord(planId));
    };

    window.addEventListener("hafiz_unified_record_updated", handleUpdate);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("hafiz_unified_record_updated", handleUpdate);
      window.removeEventListener("storage", handleStorage);
    };
  }, [planId]);

  // دوال الكتابة
  const markStepAction = useCallback(
    (dateStr: string, step: SupportedStep) => {
      const next = storeMarkStep(record, dateStr, normalizeStep(step), allDays, todayLocalDate);
      setRecord(next);
    },
    [record, allDays, todayLocalDate]
  );

  const unmarkStepAction = useCallback(
    (dateStr: string, step: SupportedStep) => {
      const next = storeUnmarkStep(record, dateStr, normalizeStep(step), allDays, todayLocalDate);
      setRecord(next);
    },
    [record, allDays, todayLocalDate]
  );

  const toggleStepAction = useCallback(
    (dateStr: string, step: SupportedStep) => {
      if (selectIsStepDone(record, dateStr, normalizeStep(step))) {
        unmarkStepAction(dateStr, step);
      } else {
        markStepAction(dateStr, step);
      }
    },
    [record, markStepAction, unmarkStepAction]
  );

  const toggleDayAction = useCallback(
    (dateStr: string) => {
      const day = allDays.find((d) => d.date === dateStr);
      if (!day) return;

      const isCompleted = selectIsDayCompleted(record, dateStr);
      const reqSteps = getRequiredStepsForDay(day);

      if (isCompleted) {
        let curr = record;
        for (const st of reqSteps) {
          curr = storeUnmarkStep(curr, dateStr, st, allDays, todayLocalDate);
        }
        setRecord(curr);
      } else {
        let curr = record;
        for (const st of reqSteps) {
          curr = storeMarkStep(curr, dateStr, st, allDays, todayLocalDate);
        }
        setRecord(curr);
      }
    },
    [record, allDays, todayLocalDate]
  );

  const markPageAction = useCallback(
    (pageNum: number) => {
      const next = storeMarkPage(record, pageNum, allDays, todayLocalDate);
      setRecord(next);
    },
    [record, allDays, todayLocalDate]
  );

  const unmarkPageAction = useCallback(
    (pageNum: number) => {
      const next = storeUnmarkPage(record, pageNum, allDays, todayLocalDate);
      setRecord(next);
    },
    [record, allDays, todayLocalDate]
  );

  const resetProgressAction = useCallback(() => {
    const clean = clearUnifiedRecord(planId);
    setRecord(clean);
  }, [planId]);

  // المشتقات النقية
  const pagesDone = useMemo(() => selectPagesDone(record), [record]);
  const percentTotal = useMemo(() => selectPercentTotal(record), [record]);
  const completedDaysCount = useMemo(() => selectCompletedDaysCount(record), [record]);
  const daysRemaining = useMemo(() => selectDaysRemaining(record, allDays.length), [record, allDays.length]);
  const khatmaDate = useMemo(() => selectKhatmaDate(record, allDays), [record, allDays]);
  const dailyQuota = useMemo(() => selectDailyQuota(record, todayLocalDate, allDays), [record, todayLocalDate, allDays]);
  const aheadOrBehindPages = useMemo(() => selectAheadOrBehindPages(record, allDays, todayLocalDate), [record, allDays, todayLocalDate]);
  const isAhead = aheadOrBehindPages > 0;
  const streak = useMemo(() => selectStreak(record, allDays, todayLocalDate), [record, allDays, todayLocalDate]);
  const derivedQuran = useMemo(
    () => deriveQuranProgress(selectEffectiveMemorizedPages(record), record.priorMemorizedSurahs || []),
    [record]
  );

  const selectors = useMemo(() => ({
    pagesDone,
    percentTotal,
    completedDaysCount,
    daysRemaining,
    khatmaDate,
    dailyQuota,
    aheadOrBehindPages,
    isAhead,
    streak,
    derivedQuran,
  }), [pagesDone, percentTotal, completedDaysCount, daysRemaining, khatmaDate, dailyQuota, aheadOrBehindPages, isAhead, streak, derivedQuran]);

  return {
    record,
    planId,
    switchPlan: setActivePlanId,
    selectors,
    allDays,
    todayLocalDate,
    // محددات
    pagesDone,
    percentTotal,
    completedDaysCount,
    daysRemaining,
    khatmaDate,
    dailyQuota,
    aheadOrBehindPages,
    isAhead,
    streak,
    derivedQuran,
    isDayCompleted: (dateStr: string) => selectIsDayCompleted(record, dateStr),
    isStepDone: (dateStr: string, step: SupportedStep) => selectIsStepDone(record, dateStr, normalizeStep(step)),
    isSubTaskDone: (dateStr: string, step: SupportedStep) => selectIsStepDone(record, dateStr, normalizeStep(step)),
    isPageMemorized: (p: number) => selectIsPageMemorized(record, p),
    getJuzStatus: (juz: number) => selectJuzStatus(record, juz),
    canMarkDay: (dateStr: string) => canMarkDate(dateStr, todayLocalDate),
    // إجراءات
    markStep: markStepAction,
    unmarkStep: unmarkStepAction,
    toggleStep: toggleStepAction,
    toggleSubTask: toggleStepAction,
    toggleDay: toggleDayAction,
    markPage: markPageAction,
    unmarkPage: unmarkPageAction,
    resetProgress: resetProgressAction,
  };
}
