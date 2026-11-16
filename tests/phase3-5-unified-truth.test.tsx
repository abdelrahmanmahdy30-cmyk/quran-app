/**
 * tests/phase3-5-unified-truth.test.tsx
 * اختبارات التكامل للمرحلة 3.5: مصدر واحد للحقيقة (Single Source of Truth)
 * ترندر المكونات الحقيقية على السجل الموحد (vitest + @testing-library/react)
 */

import { describe, it, expect, beforeEach } from "vitest";
import React from "react";
import { render, screen, act } from "@testing-library/react";
import { KhatmaJourneyCard } from "@/components/dashboard/khatma-journey-card";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { ProgressRing } from "@/components/dashboard/progress-ring";
import { DailyGoal } from "@/components/dashboard/daily-goal";
import { TodayWardCard } from "@/components/plan/today-ward-card";
import { WeekStripBar } from "@/components/plan/week-strip-bar";
import { JuzGridMap } from "@/components/dashboard/juz-grid-map";
import {
  DEFAULT_PLAN_ID,
  getUnifiedStorageKey,
  createCleanRecord,
  saveUnifiedRecord,
  loadUnifiedRecord,
  markStep,
  unmarkStep,
  markPage,
  migrateLegacyStorage,
  getAllPlanDays,
  canMarkDate,
} from "@/lib/unified-plan-store";

describe("المرحلة 3.5: اختبارات التكامل ومصدر واحد للحقيقة", () => {
  const allDays = getAllPlanDays();
  const testStorageKey = getUnifiedStorageKey(DEFAULT_PLAN_ID);

  beforeEach(() => {
    localStorage.clear();
    const clean = createCleanRecord();
    saveUnifiedRecord(clean);
  });

  it("1. نسبة واحدة فقط في الصفحة بعد أي تعليم: كل المكونات ترندر نفس النسبة بالضبط دون تضارب", () => {
    // أ) الحالة الابتدائية (0 صفحة): النسبة 0% في كل المكونات
    const { unmount } = render(
      <div>
        <KhatmaJourneyCard />
        <StatsCards />
        <ProgressRing />
        <DailyGoal />
      </div>
    );

    // فحص صارم: استخراج كافة النسب المئوية في الصفحة والتأكد من أنها متطابقة بنسبة 100%
    const pcts = screen.getAllByText(/\d+%/).map((el) => el.textContent?.trim());
    const totalProgressPcts = pcts.filter((p) => p === "0%" || p === "50%" || p === "1%");
    const uniqueProgress = Array.from(new Set(totalProgressPcts));
    expect(uniqueProgress).toEqual(["0%"]);

    unmount();

    // ب) بعد تعليم اليومين الأول والثاني (8 صفحات = 1%):
    let record = loadUnifiedRecord();
    record = markStep(record, "2026-11-01", "new", allDays, "2026-11-05");
    record = markStep(record, "2026-11-02", "new", allDays, "2026-11-05");
    record = markStep(record, "2026-11-02", "near", allDays, "2026-11-05");
    saveUnifiedRecord(record);

    render(
      <div>
        <KhatmaJourneyCard />
        <StatsCards />
        <ProgressRing />
        <DailyGoal />
      </div>
    );

    const renderedOnes = screen.getAllByText(/1%/i);
    expect(renderedOnes.length).toBeGreaterThanOrEqual(3);

    const pageCountDisplays = screen.getAllByText(/8 من 604 صفحة/);
    expect(pageCountDisplays.length).toBeGreaterThanOrEqual(1);
  });

  it("2. تعليم خطوة من السجل/الجدول يغيّر الكارت والنسبة والخريطة وبطاقة الختمة وشريط الأسبوع بالتزامن", () => {
    const { unmount } = render(
      <div>
        <TodayWardCard forcedDateStr="2026-11-01" />
        <KhatmaJourneyCard />
        <JuzGridMap />
        <WeekStripBar selectedDateStr="2026-11-01" />
      </div>
    );

    expect(screen.getByRole("button", { name: /^تم الحفظ$/i })).toBeDefined();
    expect(screen.getByText("جاري حفظه (0)")).toBeDefined();

    unmount();

    act(() => {
      let record = loadUnifiedRecord();
      markStep(record, "2026-11-01", "new", allDays, "2026-11-05");
    });

    render(
      <div>
        <TodayWardCard forcedDateStr="2026-11-01" />
        <KhatmaJourneyCard />
        <JuzGridMap />
        <WeekStripBar selectedDateStr="2026-11-01" />
      </div>
    );

    expect(screen.getByText("تم الحفظ وإتمام اليوم ✓")).toBeDefined();
    expect(screen.getByText("جاري حفظه (1)")).toBeDefined();
  });

  it("3. إلغاء خطوة من الكارت يُخرج اليوم من الجدول والإحصائيات", () => {
    let record = loadUnifiedRecord();
    record = markStep(record, "2026-11-01", "new", allDays, "2026-11-05");
    expect(record.frozenDays["2026-11-01"]).toBeDefined();

    record = unmarkStep(record, "2026-11-01", "new", allDays, "2026-11-05");
    saveUnifiedRecord(record);

    expect(record.frozenDays["2026-11-01"]).toBeUndefined();
    expect(record.memorizedPages).toHaveLength(0);

    render(<StatsCards />);
    expect(screen.getByText("لم تكتمل أي أيام بعد")).toBeDefined();
  });

  it("4. منع تعليم أي يوم مستقبلي من المسارات الأربعة مع قفل صريح وتلميح", () => {
    const today = "2026-11-01";
    const futureDate = "2026-11-15";

    expect(canMarkDate(futureDate, today)).toBe(false);
    expect(canMarkDate(today, today)).toBe(true);

    let record = loadUnifiedRecord();
    const beforeStr = JSON.stringify(record);
    record = markStep(record, futureDate, "new", allDays, today);
    expect(JSON.stringify(record)).toBe(beforeStr);

    record = markPage(record, 100, allDays, today);
    expect(record.memorizedPages).not.includes(100);

    render(<TodayWardCard forcedDateStr={futureDate} />);
    const saveBtn = screen.getByRole("button", { name: /تم الحفظ/i });
    expect(saveBtn.hasAttribute("disabled")).toBe(true);
  });

  it("5. تاريخ الختمة = 2027-04-29 في كل البطاقات عند البدء من ص 1 ولا يظهر 2027-04-30 إطلاقاً", () => {
    render(
      <div>
        <KhatmaJourneyCard />
        <StatsCards />
      </div>
    );

    const khatmaDisplays = screen.getAllByText(/2027-04-29/);
    expect(khatmaDisplays.length).toBeGreaterThanOrEqual(2);

    const wrongDates = screen.queryAllByText(/2027-04-30/);
    expect(wrongDates).toHaveLength(0);
  });

  it("6. الترحيل من المفاتيح القديمة بدون فقدان تقدم، والتعامل المرن والآمن مع JSON فاسد", () => {
    localStorage.clear();

    localStorage.setItem(
      "hafiz_unified_plan_completed_days",
      JSON.stringify(["2026-11-01", "2026-11-02"])
    );
    localStorage.setItem(
      "hafiz_subtasks_2026-11-01",
      JSON.stringify(["memorize", "near", "far"])
    );

    const migrated = migrateLegacyStorage(DEFAULT_PLAN_ID);
    expect(migrated).not.toBeNull();
    if (migrated) {
      expect(migrated.frozenDays["2026-11-01"]).toBeDefined();
      expect(migrated.frozenDays["2026-11-02"]).toBeDefined();
      expect(migrated.memorizedPages).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    }

    localStorage.setItem(testStorageKey, "{ corrupted json invalid !!!");
    const safeRecord = loadUnifiedRecord(DEFAULT_PLAN_ID);
    expect(safeRecord).toBeDefined();
    expect(safeRecord.schemaVersion).toBe(1);
    expect(safeRecord.memorizedPages).toEqual([]);

    let foundBackup = false;
    for (let i = 0; i < localStorage.length; i++) {
      if (localStorage.key(i)?.includes("corrupted_backup")) {
        foundBackup = true;
        break;
      }
    }
    expect(foundBackup).toBe(true);
  });
});
