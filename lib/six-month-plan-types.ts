/**
 * six-month-plan-types.ts
 * أنواع بيانات خطة الحفظ الستة أشهر (نوفمبر 2026 - أبريل 2027)
 */

export interface PageSurah {
  n: string;
  f: number;
  t: number;
}

export interface PageEntry {
  p: number;
  s: PageSurah[];
}

export interface StudyDay {
  date: string;
  dayName: string;
  type: "study";
  dayNumber: number;
  newPages: PageEntry[];
  nearPages: PageEntry[];
  farPages: PageEntry[];
  farCount: number;
  oldPagesCount: number;
  summaryFrom: string;
  summaryTo: string;
  pageCount: number;
}

export interface FridayDay {
  date: string;
  dayName: string;
  type: "friday";
  weekNumber: number;
  weekPages: PageEntry[];
  nearPages: PageEntry[];
  farPages: PageEntry[];
  farCount: number;
  oldPagesCount: number;
}

export type PlanDay = StudyDay | FridayDay;

export interface MonthPlan {
  name: string;
  pageFrom: number;
  pageTo: number;
  totalPages: number;
  studyDaysCount: number;
  fridaysCount: number;
  days: PlanDay[];
}

export function formatPageSurahs(page: PageEntry): string {
  return page.s.map((s) => `${s.n} (${s.f}${s.f !== s.t ? `-${s.t}` : ""})`).join(" + ");
}

export const MONTH_COLORS = [
  { bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-400", badge: "bg-blue-500/20 text-blue-300" },
  { bg: "bg-purple-500/10", border: "border-purple-500/30", text: "text-purple-400", badge: "bg-purple-500/20 text-purple-300" },
  { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-400", badge: "bg-amber-500/20 text-amber-300" },
  { bg: "bg-rose-500/10", border: "border-rose-500/30", text: "text-rose-400", badge: "bg-rose-500/20 text-rose-300" },
  { bg: "bg-teal-500/10", border: "border-teal-500/30", text: "text-teal-400", badge: "bg-teal-500/20 text-teal-300" },
  { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400", badge: "bg-emerald-500/20 text-emerald-300" },
];
