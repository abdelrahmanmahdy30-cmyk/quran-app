code = '''"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { generatePlan, formatLocalDate, PLAN_STORAGE_KEYS } from "./plan-generator";
import { calculatePlanSelectors, canMarkDayAsCompleted, PlanSelectorsResult } from "./unified-progress";
import { MonthPlan, PlanDay, StudyDay, FridayDay } from "./six-month-plan-types";
import {
  loadSubTasks,
  saveSubTasks,
  getRequiredSubtasks,
  SubTaskKey,
} from "./plan-ui-helpers";

function getCompletedDaysFromStorage(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(PLAN_STORAGE_KEYS.sixMonth);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveCompletedDaysToStorage(days: Set<string>): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PLAN_STORAGE_KEYS.sixMonth, JSON.stringify([...days]));
    window.dispatchEvent(new Event("storage"));
  } catch {}
}

export interface UsePlanProgressReturn {
  plan: MonthPlan[];
  allDays: PlanDay[];
  todayLocalDate: string;
  todayPlanDay: PlanDay | null;
  completedDays: Set<string>;
  subTasks: Set<string>;
  selectors: PlanSelectorsResult;
  pagesDone: number;
  percentTotal: number;
  daysRemaining: number;
  khatmaDate: string;
  dailyQuota: number;
  aheadOrBehindPages: number;
  isAhead: boolean;
  memorizedPagesSet: Set<number>;
  toggleDay: (dateStr: string) => boolean;
  toggleSubTask: (dateStr: string, taskKey: SubTaskKey) => void;
  isSubTaskDone: (dateStr: string, taskKey: SubTaskKey) => boolean;
  isDayCompleted: (dateStr: string) => boolean;
}

export function usePlanProgress(): UsePlanProgressReturn {
  const plan = useMemo(() => generatePlan(), []);
  const allDays = useMemo(() => plan.flatMap((m) => m.days), [plan]);
  const todayLocalDate = useMemo(() => formatLocalDate(), []);

  const [completedDays, setCompletedDays] = useState<Set<string>>(() => getCompletedDaysFromStorage());
  const [subTasks, setSubTasksState] = useState<Set<string>>(() => loadSubTasks());

  useEffect(() => {
    const syncState = () => {
      setCompletedDays(getCompletedDaysFromStorage());
      setSubTasksState(loadSubTasks());
    };
    window.addEventListener("storage", syncState);
    return () => window.removeEventListener("storage", syncState);
  }, []);

  const selectors = useMemo(() => {
    return calculatePlanSelectors(allDays, completedDays, todayLocalDate);
  }, [allDays, completedDays, todayLocalDate]);

  const todayPlanDay = useMemo(() => {
    return allDays.find((d) => d.date === todayLocalDate) || allDays[0] || null;
  }, [allDays, todayLocalDate]);

  const dailyQuota = useMemo(() => {
    if (!todayPlanDay || todayPlanDay.type === "friday") return 0;
    const studyDay = todayPlanDay as StudyDay;
    return studyDay.dayNumber <= 139 ? 4 : 3;
  }, [todayPlanDay]);

  const memorizedPagesSet = useMemo(() => {
    const s = new Set<number>();
    allDays.forEach((d) => {
      if (completedDays.has(d.date) && d.type === "study" && d.newPages) {
        d.newPages.forEach((p) => s.add(p.p));
      }
    });
    return s;
  }, [allDays, completedDays]);

  const isDayCompleted = useCallback(
    (dateStr: string): boolean => {
      return completedDays.has(dateStr);
    },
    [completedDays]
  );

  const isSubTaskDone = useCallback(
    (dateStr: string, taskKey: SubTaskKey): boolean => {
      if (completedDays.has(dateStr)) return true;
      return subTasks.has(`${dateStr}:${taskKey}`);
    },
    [completedDays, subTasks]
  );

  const toggleDay = useCallback(
    (dateStr: string): boolean => {
      if (!canMarkDayAsCompleted(dateStr, todayLocalDate)) return false;

      const dayObj = allDays.find((d) => d.date === dateStr);
      const reqTasks = dayObj ? getRequiredSubtasks(dayObj) : [];

      const nextCompleted = new Set(completedDays);
      const nextSubTasks = new Set(subTasks);

      const willBeCompleted = !nextCompleted.has(dateStr);

      if (willBeCompleted) {
        nextCompleted.add(dateStr);
        reqTasks.forEach((t) => nextSubTasks.add(`${dateStr}:${t}`));
      } else {
        nextCompleted.delete(dateStr);
        reqTasks.forEach((t) => nextSubTasks.delete(`${dateStr}:${t}`));
      }

      setCompletedDays(nextCompleted);
      setSubTasksState(nextSubTasks);
      saveCompletedDaysToStorage(nextCompleted);
      saveSubTasks(nextSubTasks);
      return true;
    },
    [allDays, completedDays, subTasks, todayLocalDate]
  );

  const toggleSubTask = useCallback(
    (dateStr: string, taskKey: SubTaskKey): void => {
      if (!canMarkDayAsCompleted(dateStr, todayLocalDate)) return;

      const dayObj = allDays.find((d) => d.date === dateStr);
      if (!dayObj) return;

      const reqTasks = getRequiredSubtasks(dayObj);
      const subKey = `${dateStr}:${taskKey}`;

      const nextSubTasks = new Set(subTasks);
      const isCurrentlyDone = completedDays.has(dateStr) || nextSubTasks.has(subKey);

      if (isCurrentlyDone) {
        nextSubTasks.delete(subKey);
      } else {
        nextSubTasks.add(subKey);
      }

      // فحص هل جميع خطوات اليوم أنجزت
      const allDone = reqTasks.length > 0 && reqTasks.every((t) => nextSubTasks.has(`${dateStr}:${t}`));

      const nextCompleted = new Set(completedDays);
      if (allDone) {
        nextCompleted.add(dateStr);
      } else {
        nextCompleted.delete(dateStr);
      }

      setSubTasksState(nextSubTasks);
      setCompletedDays(nextCompleted);
      saveSubTasks(nextSubTasks);
      saveCompletedDaysToStorage(nextCompleted);
    },
    [allDays, completedDays, subTasks, todayLocalDate]
  );

  return {
    plan,
    allDays,
    todayLocalDate,
    todayPlanDay,
    completedDays,
    subTasks,
    selectors,
    pagesDone: selectors.pagesDone,
    percentTotal: selectors.percentTotal,
    daysRemaining: selectors.daysRemaining,
    khatmaDate: selectors.khatmaDate,
    dailyQuota,
    aheadOrBehindPages: selectors.aheadOrBehindPages,
    isAhead: selectors.aheadOrBehindPages > 0,
    memorizedPagesSet,
    toggleDay,
    toggleSubTask,
    isSubTaskDone,
    isDayCompleted,
  };
}
'''
with open('lib/use-plan-progress.ts', 'w', encoding='utf-8') as f:
    f.write(code)
print('Created lib/use-plan-progress.ts successfully!')
