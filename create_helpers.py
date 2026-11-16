code = '''import { createHafs, Page } from "quran-meta";
import { PlanDay, PageEntry } from "./six-month-plan-types";
import { formatLocalDate } from "./plan-generator";

const hafs = createHafs();

/**
 * الحصول على رقم الجزء (1 إلى 30) للصفحة المحددة بدقة من مصحف المدينة (quran-meta)
 */
export function getPageJuz(pageNum: number): number {
  if (pageNum < 1 || pageNum > 604) return 1;
  try {
    const pm = hafs.getPageMeta(pageNum as Page);
    const juz = hafs.findJuzByAyahId(pm.firstAyahId);
    return juz >= 1 && juz <= 30 ? juz : Math.min(30, Math.max(1, Math.ceil(pageNum / 20)));
  } catch {
    return Math.min(30, Math.max(1, Math.ceil(pageNum / 20)));
  }
}

export interface JuzMetaRange {
  juzNumber: number;
  name: string;
  startPage: number;
  endPage: number;
  totalPages: number;
}

/**
 * حدود أجزاء المصحف الشريف الثلاثين (الصفحة الأولى والأخيرة وعدد الصفحات)
 */
export const JUZ_META_RANGES: JuzMetaRange[] = [
  { juzNumber: 1, name: "الجزء الأول", startPage: 1, endPage: 21, totalPages: 21 },
  { juzNumber: 2, name: "الجزء الثاني", startPage: 22, endPage: 41, totalPages: 20 },
  { juzNumber: 3, name: "الجزء الثالث", startPage: 42, endPage: 62, totalPages: 21 },
  { juzNumber: 4, name: "الجزء الرابع", startPage: 62, endPage: 81, totalPages: 20 },
  { juzNumber: 5, name: "الجزء الخامس", startPage: 82, endPage: 101, totalPages: 20 },
  { juzNumber: 6, name: "الجزء السادس", startPage: 102, endPage: 121, totalPages: 20 },
  { juzNumber: 7, name: "الجزء السابع", startPage: 121, endPage: 141, totalPages: 21 },
  { juzNumber: 8, name: "الجزء الثامن", startPage: 142, endPage: 161, totalPages: 20 },
  { juzNumber: 9, name: "الجزء التاسع", startPage: 162, endPage: 181, totalPages: 20 },
  { juzNumber: 10, name: "الجزء العاشر", startPage: 182, endPage: 201, totalPages: 20 },
  { juzNumber: 11, name: "الجزء الحادي عشر", startPage: 201, endPage: 221, totalPages: 21 },
  { juzNumber: 12, name: "الجزء الثاني عشر", startPage: 222, endPage: 241, totalPages: 20 },
  { juzNumber: 13, name: "الجزء الثالث عشر", startPage: 242, endPage: 261, totalPages: 20 },
  { juzNumber: 14, name: "الجزء الرابع عشر", startPage: 262, endPage: 281, totalPages: 20 },
  { juzNumber: 15, name: "الجزء الخامس عشر", startPage: 282, endPage: 301, totalPages: 20 },
  { juzNumber: 16, name: "الجزء السادس عشر", startPage: 302, endPage: 321, totalPages: 20 },
  { juzNumber: 17, name: "الجزء السابع عشر", startPage: 322, endPage: 341, totalPages: 20 },
  { juzNumber: 18, name: "الجزء الثامن عشر", startPage: 342, endPage: 361, totalPages: 20 },
  { juzNumber: 19, name: "الجزء التاسع عشر", startPage: 362, endPage: 381, totalPages: 20 },
  { juzNumber: 20, name: "الجزء العشرون", startPage: 382, endPage: 401, totalPages: 20 },
  { juzNumber: 21, name: "الجزء الحادي والعشرون", startPage: 402, endPage: 421, totalPages: 20 },
  { juzNumber: 22, name: "الجزء الثاني والعشرون", startPage: 422, endPage: 441, totalPages: 20 },
  { juzNumber: 23, name: "الجزء الثالث والعشرون", startPage: 442, endPage: 461, totalPages: 20 },
  { juzNumber: 24, name: "الجزء الرابع والعشرون", startPage: 462, endPage: 481, totalPages: 20 },
  { juzNumber: 25, name: "الجزء الخامس والعشرون", startPage: 482, endPage: 502, totalPages: 21 },
  { juzNumber: 26, name: "الجزء السادس والعشرون", startPage: 502, endPage: 521, totalPages: 20 },
  { juzNumber: 27, name: "الجزء السابع والعشرون", startPage: 522, endPage: 541, totalPages: 20 },
  { juzNumber: 28, name: "الجزء الثامن والعشرون", startPage: 542, endPage: 561, totalPages: 20 },
  { juzNumber: 29, name: "الجزء التاسع والعشرون", startPage: 562, endPage: 581, totalPages: 20 },
  { juzNumber: 30, name: "الجزء الثلاثون", startPage: 582, endPage: 604, totalPages: 23 },
];

export const SUBTASKS_KEY = "hafiz_subtasks_six_month";
export type SubTaskKey = "far" | "near" | "memorize" | "week";

export function loadSubTasks(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(SUBTASKS_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

export function saveSubTasks(st: Set<string>): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SUBTASKS_KEY, JSON.stringify([...st]));
    window.dispatchEvent(new Event("storage"));
  } catch {}
}

/**
 * تحديد المهام الإلزامية ليوم معين
 */
export function getRequiredSubtasks(day: PlanDay): SubTaskKey[] {
  if (day.type === "study") {
    const tasks: SubTaskKey[] = ["memorize"];
    if (day.nearPages && day.nearPages.length > 0) tasks.push("near");
    if (day.farPages && day.farPages.length > 0) tasks.push("far");
    return tasks;
  } else {
    // الجمعة: مراجعة الأسبوع + البعيدة
    const tasks: SubTaskKey[] = [];
    if (day.weekPages && day.weekPages.length > 0) tasks.push("week");
    if (day.farPages && day.farPages.length > 0) tasks.push("far");
    return tasks;
  }
}

/**
 * حالة الجزء في خريطة الأجزاء الثلاثين
 */
export type JuzStatus = "completed" | "in_progress" | "not_started";

export function getJuzStatus(
  juzNum: number,
  memorizedPages: Set<number>,
  todayPages: Set<number>
): JuzStatus {
  const meta = JUZ_META_RANGES[juzNum - 1];
  if (!meta) return "not_started";

  let pagesInJuzMemorized = 0;
  for (let p = meta.startPage; p <= meta.endPage; p++) {
    if (memorizedPages.has(p)) {
      pagesInJuzMemorized++;
    }
  }

  // مكتمل إذا تم حفظ جميع صفحات الجزء بنسبة 100%
  if (pagesInJuzMemorized >= meta.totalPages) {
    return "completed";
  }

  // جاري حفظه إذا تم حفظ بعض صفحاته أو كان ورد اليوم يقع في هذا الجزء
  let hasTodayPage = false;
  for (let p = meta.startPage; p <= meta.endPage; p++) {
    if (todayPages.has(p)) {
      hasTodayPage = true;
      break;
    }
  }

  if (pagesInJuzMemorized > 0 || hasTodayPage) {
    return "in_progress";
  }

  return "not_started";
}

/**
 * استخراج الأيام السبعة للأسبوع الذي يضم التاريخ المرجعي
 */
export function getWeekDays(
  allDays: PlanDay[],
  referenceDateStr: string = formatLocalDate()
): PlanDay[] {
  if (!allDays || allDays.length === 0) return [];

  const refIdx = allDays.findIndex((d) => d.date === referenceDateStr);
  const targetIdx = refIdx >= 0 ? refIdx : 0;

  const targetDay = allDays[targetIdx];
  const [y, m, d] = targetDay.date.split("-").map(Number);
  const dateObj = new Date(y, m - 1, d);
  const dayOfWeek = dateObj.getDay(); // 0 = الأحد

  let startIdx = targetIdx - dayOfWeek;
  if (startIdx < 0) startIdx = 0;
  if (startIdx + 7 > allDays.length) {
    startIdx = Math.max(0, allDays.length - 7);
  }

  return allDays.slice(startIdx, startIdx + 7);
}
'''
with open('lib/plan-ui-helpers.ts', 'w', encoding='utf-8') as f:
    f.write(code)
print('Created lib/plan-ui-helpers.ts successfully!')
