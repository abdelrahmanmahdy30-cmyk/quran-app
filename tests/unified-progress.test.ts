import { describe, it, expect } from "vitest";
import {
  selectUnifiedProgress,
  canMarkDayAsCompleted,
  calculatePlanSelectors,
  PLAN_STORAGE_KEYS,
  getPlanStorageKey,
} from "../lib/unified-progress";
import { formatLocalDate } from "../lib/plan-generator";
import type { MemorizationProgress } from "../lib/quran-data";

describe("توحيد التقدم ومفاتيح التخزين ومنع الأيام المستقبلية", () => {
  it("مفاتيح التخزين مستقلة ومخصصة لكل خطة", () => {
    expect(PLAN_STORAGE_KEYS.sixMonth).toBe("hafiz_completed_days_six_month");
    expect(PLAN_STORAGE_KEYS.custom).toBe("hafiz_completed_days_custom");
    expect(getPlanStorageKey("six_month")).toBe("hafiz_completed_days_six_month");
    expect(getPlanStorageKey("custom")).toBe("hafiz_completed_days_custom");
    expect(PLAN_STORAGE_KEYS.sixMonth).not.toBe(PLAN_STORAGE_KEYS.custom);
  });

  it("حساب التاريخ المحلي لا يستخدم UTC toISOString ويعتمد YYYY-MM-DD المحلي", () => {
    const now = new Date();
    const formatted = formatLocalDate(now);
    const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    expect(formatted).toBe(expected);
    expect(formatted).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("يُمنع تعليم أيام مستقبلية (canMarkDayAsCompleted)", () => {
    const today = "2026-11-01";
    const yesterday = "2026-10-31";
    const futureTomorrow = "2026-11-02";
    const farFuture = "2027-04-30";

    // اليوم والماضي مسموح
    expect(canMarkDayAsCompleted(yesterday, today)).toBe(true);
    expect(canMarkDayAsCompleted(today, today)).toBe(true);

    // الأيام المستقبلية ممنوعة
    expect(canMarkDayAsCompleted(futureTomorrow, today)).toBe(false);
    expect(canMarkDayAsCompleted(farFuture, today)).toBe(false);
  });

  it("محدد التقدم الموحد (selectUnifiedProgress) يصدر كل أرقام التقدم لقاعدة بيانات موحدة بنوع صريح وبلا as any", () => {
    const mockProgress: MemorizationProgress[] = [
      {
        surahId: 1,
        status: "memorized",
        versesMemorized: 7,
        strength: 100,
        memorizedAt: "2026-11-01",
        lastReview: new Date(),
        reviewHistory: [],
      },
      {
        surahId: 2,
        status: "in_progress",
        versesMemorized: 100,
        strength: 75,
        memorizedAt: null,
        lastReview: null,
        reviewHistory: [],
      },
      {
        surahId: 3,
        status: "not_started",
        versesMemorized: 0,
        strength: 0,
        memorizedAt: null,
        lastReview: null,
        reviewHistory: [],
      },
    ];

    const mockState = {
      stats: {
        totalVersesMemorized: 300,
        totalPages: 25,
        targetEndDate: "2027-04-30",
      },
      progress: mockProgress,
    };

    const res1 = selectUnifiedProgress(mockState);
    const res2 = selectUnifiedProgress(mockState);

    // التحقق من التطابق التام عبر جميع المشتركين
    expect(res1).toEqual(res2);
    expect(res1.totalVersesMemorized).toBe(300);
    expect(res1.totalPagesMemorized).toBe(25);
    expect(res1.totalPages).toBe(604);
    expect(res1.totalVerses).toBe(6236);
    expect(res1.completedSurahsCount).toBe(1);
    expect(res1.inProgressSurahsCount).toBe(1);
    expect(res1.notStartedSurahsCount).toBe(1);
  });

  it("محددات الخطة النقية (calculatePlanSelectors) تحسب الأرقام بدقة من الأيام المكتملة فقط", () => {
    const mockDays = [
      { date: "2026-11-01", type: "study", newPages: [{ p: 1 }, { p: 2 }, { p: 3 }, { p: 4 }] },
      { date: "2026-11-02", type: "study", newPages: [{ p: 5 }, { p: 6 }, { p: 7 }, { p: 8 }] },
      { date: "2026-11-03", type: "study", newPages: [{ p: 9 }, { p: 10 }, { p: 11 }, { p: 12 }] },
      { date: "2026-11-04", type: "study", newPages: [{ p: 13 }, { p: 14 }, { p: 15 }, { p: 16 }] },
      { date: "2026-11-05", type: "study", newPages: [{ p: 17 }, { p: 18 }, { p: 19 }, { p: 20 }] },
      { date: "2026-11-06", type: "friday" },
    ];

    const completed = new Set(["2026-11-01", "2026-11-02"]);
    const today = "2026-11-02";

    const res = calculatePlanSelectors(mockDays, completed, today);

    expect(res.daysDone).toBe(2);
    expect(res.totalDays).toBe(6);
    expect(res.daysRemaining).toBe(4);
    expect(res.pagesDone).toBe(8); // 4 + 4
    expect(res.pagesRemaining).toBe(604 - 8);
    expect(res.aheadOrBehindPages).toBe(0); // متطابق مع المطلوب حتى 2026-11-02
    expect(res.streak).toBe(2);

    // لو المستخدم أنجز يوماً إضافياً قبل موعده:
    const aheadCompleted = new Set(["2026-11-01", "2026-11-02", "2026-11-03"]);
    const aheadRes = calculatePlanSelectors(mockDays, aheadCompleted, today);
    expect(aheadRes.pagesDone).toBe(12);
    expect(aheadRes.aheadOrBehindPages).toBe(4); // متقدم بـ 4 صفحات
  });
});
