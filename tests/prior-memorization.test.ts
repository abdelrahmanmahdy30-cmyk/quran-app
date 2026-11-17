import { describe, it, expect } from 'vitest';
import {
  computeFullyCoveredPages,
  createCleanRecord,
  getAllPlanDays,
  selectKhatmaDate,
  updatePriorMemorizedSurahs,
} from '../lib/unified-plan-store';
import type { StudyDay } from '../lib/six-month-plan-types';

describe('Prior Memorization — computeFullyCoveredPages', () => {
  it('[] → []', () => {
    expect(computeFullyCoveredPages([])).toEqual([]);
  });

  it('[1] (الفاتحة) → [1] بالضبط', () => {
    expect(computeFullyCoveredPages([1])).toEqual([1]);
  });

  it('[2] (البقرة) → 48 صفحة', () => {
    expect(computeFullyCoveredPages([2]).length).toBe(48);
  });

  it('[4] (النساء) لا تشمل الصفحة 106 (مشتركة مع سورة 5)', () => {
    expect(computeFullyCoveredPages([4]).includes(106)).toBe(false);
  });

  it('[4, 5] (النساء + المائدة) تشمل الصفحة 106', () => {
    expect(computeFullyCoveredPages([4, 5]).includes(106)).toBe(true);
  });

  it('لا توجد صفحات مكررة في النتيجة', () => {
    const pages = computeFullyCoveredPages([1, 2, 3, 4, 5]);
    const unique = Array.from(new Set(pages));
    expect(pages.length).toBe(unique.length);
  });

  it('النتيجة مرتبة تصاعدياً', () => {
    const pages = computeFullyCoveredPages([2]);
    for (let i = 1; i < pages.length; i++) {
      expect(pages[i]).toBeGreaterThan(pages[i - 1]);
    }
  });
});

describe('Prior Memorization — selectKhatmaDate', () => {
  it('بدون محفوظ سابق: تاريخ الختمة صحيح (2027-04-29)', () => {
    const record = createCleanRecord();
    const days = getAllPlanDays(record);
    const khatma = selectKhatmaDate(record, days);
    expect(khatma).toBe('2027-04-29');
  });

  it('مع محفوظ سابق [114] (سورة الناس): تاريخ الختمة بصيغة YYYY-MM-DD', () => {
    const record = { ...createCleanRecord(), priorMemorizedSurahs: [114] };
    const days = getAllPlanDays(record);
    const khatma = selectKhatmaDate(record, days);
    expect(khatma).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('مع محفوظ سابق [114]: الخطة ما زالت تحتوي newPages', () => {
    const record = { ...createCleanRecord(), priorMemorizedSurahs: [114] };
    const days = getAllPlanDays(record);
    const hasNewPages = days.some(
      (d) => d.type === 'study' && (d as StudyDay).newPages.length > 0
    );
    expect(hasNewPages).toBe(true);
  });
});

describe('Prior Memorization — updatePriorMemorizedSurahs', () => {
  it('لا تمسح memorizedPages عند تحديث priorMemorizedSurahs', () => {
    // createCleanRecord + نضيف memorizedPages يدوياً
    const record = { ...createCleanRecord(), memorizedPages: [1, 2, 3] };
    const updated = updatePriorMemorizedSurahs(record, [5]);
    // memorizedPages يجب أن تبقى
    expect(updated.memorizedPages).toEqual([1, 2, 3]);
    expect(updated.priorMemorizedSurahs).toEqual([5]);
  });

  it('تُنقّي الأرقام خارج النطاق 1..114', () => {
    const record = createCleanRecord();
    const updated = updatePriorMemorizedSurahs(record, [0, 1, 115, 50, -1]);
    expect(updated.priorMemorizedSurahs).toEqual([1, 50]);
  });

  it('تُزيل التكرار وتُرتّب تصاعدياً', () => {
    const record = createCleanRecord();
    const updated = updatePriorMemorizedSurahs(record, [5, 1, 5, 3, 1]);
    expect(updated.priorMemorizedSurahs).toEqual([1, 3, 5]);
  });
});

describe('Prior Memorization — تكامل مع مولد الخطة', () => {
  it('بدون priorMemorizedSurahs: 181 يوم في الخطة', () => {
    const record = createCleanRecord();
    const days = getAllPlanDays(record);
    expect(days.length).toBe(181);
  });

  it('مع [1] (الفاتحة): الصفحة 1 ليست في newPages', () => {
    const record = { ...createCleanRecord(), priorMemorizedSurahs: [1] };
    const days = getAllPlanDays(record);
    const allNewPages = days
      .filter((d) => d.type === 'study')
      .flatMap((d) => (d as StudyDay).newPages.map((p) => p.p));
    expect(allNewPages.includes(1)).toBe(false);
  });

  it('بدون priorMemorizedSurahs: لا تكرار في newPages', () => {
    const record = createCleanRecord();
    const days = getAllPlanDays(record);
    const allNewPages = days
      .filter((d) => d.type === 'study')
      .flatMap((d) => (d as StudyDay).newPages.map((p) => p.p));
    const unique = Array.from(new Set(allNewPages));
    expect(allNewPages.length).toBe(unique.length);
  });
});
