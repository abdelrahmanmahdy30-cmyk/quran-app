import { describe, it, expect } from 'vitest';
import {
  computeFullyCoveredPages,
  createCleanRecord,
  getAllPlanDays,
  selectKhatmaDate,
  updatePriorMemorizedSurahs,
  selectEffectiveMemorizedPages,
  selectPagesDone,
  selectPercentTotal,
  deriveQuranProgress,
  markStep,
  unmarkStep,
  syncUnifiedProgressToLocalData,
} from '../lib/unified-plan-store';
import { useMemorizationStore } from '../lib/memorization-store';
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

describe('Prior Memorization — selectEffectiveMemorizedPages', () => {
  it('1. بدون priorMemorizedSurahs: effective = memorizedPages الأصلية', () => {
    const record = { ...createCleanRecord(), memorizedPages: [10, 11] };
    expect(selectEffectiveMemorizedPages(record)).toEqual([10, 11]);
  });

  it('2. priorMemorizedSurahs = [1] (الفاتحة): effective تحتوي الصفحة 1', () => {
    const record = { ...createCleanRecord(), priorMemorizedSurahs: [1] };
    const effective = selectEffectiveMemorizedPages(record);
    expect(effective.includes(1)).toBe(true);
    expect(selectPagesDone(record)).toBeGreaterThanOrEqual(1);
  });

  it('3. priorMemorizedSurahs = [4] (النساء): الصفحة 106 لا تدخل effective', () => {
    const record = { ...createCleanRecord(), priorMemorizedSurahs: [4] };
    const effective = selectEffectiveMemorizedPages(record);
    expect(effective.includes(106)).toBe(false);
  });

  it('4. priorMemorizedSurahs = [4, 5] (النساء + المائدة): الصفحة 106 تدخل effective', () => {
    const record = { ...createCleanRecord(), priorMemorizedSurahs: [4, 5] };
    const effective = selectEffectiveMemorizedPages(record);
    expect(effective.includes(106)).toBe(true);
  });

  it('5. memorizedPages = [10, 11] مع prior [1]: لا تكرار، memorizedPages لم تتغير', () => {
    const record = { ...createCleanRecord(), memorizedPages: [10, 11], priorMemorizedSurahs: [1] };
    const effective = selectEffectiveMemorizedPages(record);
    // الصفحة 1 موجودة (من prior)، 10 و 11 موجودتان (من memorizedPages)
    expect(effective.includes(1)).toBe(true);
    expect(effective.includes(10)).toBe(true);
    expect(effective.includes(11)).toBe(true);
    // لا تكرار
    expect(effective.length).toBe(new Set(effective).size);
    // memorizedPages الأصلية لم تتغير
    expect(record.memorizedPages).toEqual([10, 11]);
  });

  it('6. إلغاء priorMemorizedSurahs → effective = memorizedPages فقط', () => {
    const record = { ...createCleanRecord(), memorizedPages: [5, 6], priorMemorizedSurahs: [] };
    expect(selectEffectiveMemorizedPages(record)).toEqual([5, 6]);
  });

  it('7. ratings وsteps وfrozenDays وstartDate لا تتغير بعد استدعاء selectEffectiveMemorizedPages', () => {
    const base = {
      ...createCleanRecord(),
      memorizedPages: [1],
      priorMemorizedSurahs: [2],
      startDate: '2026-11-01',
    };
    selectEffectiveMemorizedPages(base); // استدعاء فقط
    expect(base.ratings).toEqual({});
    expect(base.steps).toEqual({});
    expect(base.frozenDays).toEqual({});
    expect(base.startDate).toBe('2026-11-01');
    expect(base.memorizedPages).toEqual([1]);
  });

  it('8. selectPagesDone مع [2] (البقرة) = 48', () => {
    const record = { ...createCleanRecord(), priorMemorizedSurahs: [2] };
    expect(selectPagesDone(record)).toBe(48);
    expect(selectPercentTotal(record)).toBeGreaterThan(0);
  });
});

describe('Prior Memorization — deriveQuranProgress مع priorMemorizedSurahs', () => {
  it('1. [] → 0 صفحات ، 0% ، لا NaN', () => {
    const result = deriveQuranProgress([], []);
    expect(result.totalPagesMemorized).toBe(0);
    expect(result.pagesPercentage).toBe(0);
    expect(Number.isNaN(result.pagesPercentage)).toBe(false);
    expect(Number.isNaN(result.versesPercentage)).toBe(false);
  });

  it('2. [4] (النساء) → السورة 4 مكتملة 176/176', () => {
    const effectivePages = selectEffectiveMemorizedPages({
      ...createCleanRecord(),
      priorMemorizedSurahs: [4],
    });
    const result = deriveQuranProgress(effectivePages, [4]);
    const surah4 = result.surahs.find((s) => s.surahId === 4)!;
    expect(surah4.status).toBe('completed');
    expect(surah4.versesMemorized).toBe(176);
    expect(surah4.percentage).toBe(100);
  });

  it('3. [4] → الصفحة 106 ليست في effectiveMemorizedPages (مشتركة)', () => {
    const effectivePages = selectEffectiveMemorizedPages({
      ...createCleanRecord(),
      priorMemorizedSurahs: [4],
    });
    expect(effectivePages.includes(106)).toBe(false);
  });

  it('4. [4,5] → effectiveMemorizedPages = 51 صفحة بالضبط', () => {
    const effectivePages = selectEffectiveMemorizedPages({
      ...createCleanRecord(),
      priorMemorizedSurahs: [4, 5],
    });
    expect(effectivePages.length).toBe(51);
  });

  it('5. [4,5] → السورتان 4 و5 مكتملتان', () => {
    const effectivePages = selectEffectiveMemorizedPages({
      ...createCleanRecord(),
      priorMemorizedSurahs: [4, 5],
    });
    const result = deriveQuranProgress(effectivePages, [4, 5]);
    const surah4 = result.surahs.find((s) => s.surahId === 4)!;
    const surah5 = result.surahs.find((s) => s.surahId === 5)!;
    expect(surah4.status).toBe('completed');
    expect(surah5.status).toBe('completed');
  });

  it('6. memorizedPages=[106] مع prior=[4] → 30 صفحة، لا تكرار', () => {
    const effectivePages = selectEffectiveMemorizedPages({
      ...createCleanRecord(),
      memorizedPages: [106],
      priorMemorizedSurahs: [4],
    });
    // 29 صفحة من سورة 4 (77-105) + صفحة 106 = 30
    expect(effectivePages.length).toBe(30);
    expect(effectivePages.includes(106)).toBe(true);
    // لا تكرار
    const unique = new Set(effectivePages);
    expect(unique.size).toBe(effectivePages.length);
  });

  it('7. كل السور [1..114] → 604 صفحة وselectPercentTotal = 100', () => {
    const allSurahs = Array.from({ length: 114 }, (_, i) => i + 1);
    const record = { ...createCleanRecord(), priorMemorizedSurahs: allSurahs };
    expect(selectEffectiveMemorizedPages(record).length).toBe(604);
    expect(selectPercentTotal(record)).toBe(100);
  });

  it('8. pagesPercentage لا يساوي NaN مع سجل فارغ', () => {
    const result = deriveQuranProgress([], []);
    expect(Number.isNaN(result.pagesPercentage)).toBe(false);
    expect(Number.isNaN(result.versesPercentage)).toBe(false);
  });
});

describe('Prior Memorization — اتساق الأرقام بين الشريط ودرايف القرآن', () => {
  const allDays = getAllPlanDays();

  it('A. حفظ يوم ثم إلغاؤه: النسبة ترجع للقيمة السابقة بالضبط', () => {
    let record = createCleanRecord();

    // حالة ابتدائية
    const beforePages = selectPagesDone(record);
    const beforePct = selectPercentTotal(record);

    // حفظ يوم 2026-11-01
    record = markStep(record, '2026-11-01', 'new', allDays, '2026-11-01');
    expect(selectPagesDone(record)).toBeGreaterThan(beforePages);
    expect(selectPercentTotal(record)).toBeGreaterThanOrEqual(beforePct);

    // إلغاء نفس اليوم
    record = unmarkStep(record, '2026-11-01', 'new', allDays, '2026-11-01');
    expect(selectPagesDone(record)).toBe(beforePages);
    expect(selectPercentTotal(record)).toBe(beforePct);
  });

  it('B. [4]: الشريط (pagesDone/percentTotal) ودرايف القرآن (derived) متسقان', () => {
    const record = { ...createCleanRecord(), priorMemorizedSurahs: [4] };

    // الشريط العلوي
    const pagesDone = selectPagesDone(record);         // من selectEffectiveMemorizedPages
    const percentTotal = selectPercentTotal(record);   // من selectEffectiveMemorizedPages

    // درايف القرآن
    const effectivePages = selectEffectiveMemorizedPages(record);
    const derived = deriveQuranProgress(effectivePages, [4]);

    // المتوقع: 29 صفحة (77-105)، الصفحة 106 مشتركة مستبعدة
    expect(pagesDone).toBe(29);
    expect(percentTotal).toBe(5); // Math.round(29/604*100) = 5

    // derived.totalPagesMemorized يعتمد على memorizedPages.length وهو 29 أيضاً
    expect(derived.totalPagesMemorized).toBe(29);
    expect(derived.pagesPercentage).toBe(5);

    // الأهم: سورة 4 مكتملة 100%
    const surah4 = derived.surahs.find(s => s.surahId === 4)!;
    expect(surah4.status).toBe('completed');
    expect(surah4.versesMemorized).toBe(176);

    // الشريط ودرايف متفقان
    expect(pagesDone).toBe(derived.totalPagesMemorized);
    expect(percentTotal).toBe(derived.pagesPercentage);
  });

  it('C. [4] ثم تم الحفظ لصفحة 106: 30 صفحة بالضبط بدون عدّ مزدوج', () => {
    // سجل فيه prior=[4] وصفحة 106 محفوظة يدوياً
    const record = {
      ...createCleanRecord(),
      memorizedPages: [106],
      priorMemorizedSurahs: [4],
    };

    const effective = selectEffectiveMemorizedPages(record);

    // 29 صفحة (77-105) من prior + صفحة 106 يدوي = 30
    expect(effective.length).toBe(30);
    expect(effective.includes(106)).toBe(true);

    // لا تكرار
    const unique = new Set(effective);
    expect(unique.size).toBe(30);

    // الشريط يعكس 30 صفحة
    expect(selectPagesDone(record)).toBe(30);

    // درايف: سورة 4 لا تزال مكتملة
    const derived = deriveQuranProgress(effective, [4]);
    const surah4 = derived.surahs.find(s => s.surahId === 4)!;
    expect(surah4.status).toBe('completed');
    expect(derived.totalPagesMemorized).toBe(30);
  });
});

describe('Prior Memorization — مزامنة متجر القرآن (syncUnifiedProgressToLocalData)', () => {
  it('1. مزامنة الفاتحة [1]: useMemorizationStore و localStorage يعكسان 7 من 7 آيات ومكتملة', () => {
    localStorage.clear();
    const record = { ...createCleanRecord(), priorMemorizedSurahs: [1] };
    syncUnifiedProgressToLocalData(record);

    // التحقق من حالة Zustand في الذاكرة
    const storeState = useMemorizationStore.getState();
    const fatiha = storeState.progress.find((p) => p.surahId === 1);
    expect(fatiha).toBeDefined();
    expect(fatiha?.versesMemorized).toBe(7);
    expect(fatiha?.status).toBe('memorized');
    expect(fatiha?.strength).toBe(100);

    // التحقق من localStorage
    const raw = localStorage.getItem('hafiz-quran-v1');
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed.state?.progress).toBeDefined();
    expect(parsed.state.progress.length).toBe(114);
    const fatihaLocal = parsed.state.progress.find((p: any) => p.surahId === 1);
    expect(fatihaLocal.versesMemorized).toBe(7);
    expect(fatihaLocal.status).toBe('memorized');
  });

  it('2. مزامنة باردة (Cold Start): عندما يكون localStorage فارغاً تماماً يتم إنشاء 114 سورة كاملة دون undefined', () => {
    localStorage.removeItem('hafiz-quran-v1');
    const record = { ...createCleanRecord(), priorMemorizedSurahs: [4] };
    syncUnifiedProgressToLocalData(record);

    const raw = localStorage.getItem('hafiz-quran-v1');
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed.state?.progress).toBeDefined();
    expect(parsed.state.progress.length).toBe(114);

    const surah4 = parsed.state.progress.find((p: any) => p.surahId === 4);
    expect(surah4.versesMemorized).toBe(176);
    expect(surah4.status).toBe('memorized');
  });

  it('3. مزامنة النساء [4]: في الذاكرة 176/176 ومكتملة، والصفحة 106 ليست effective', () => {
    const record = { ...createCleanRecord(), priorMemorizedSurahs: [4] };
    syncUnifiedProgressToLocalData(record);

    const storeState = useMemorizationStore.getState();
    const nisa = storeState.progress.find((p) => p.surahId === 4);
    expect(nisa?.versesMemorized).toBe(176);
    expect(nisa?.status).toBe('memorized');

    // التأكد من أن الصفحة 106 ليست فعالة
    const effective = selectEffectiveMemorizedPages(record);
    expect(effective.includes(106)).toBe(false);
    expect(effective.length).toBe(29);
  });

  it('4. مزامنة النساء والمائدة [4, 5]: كلتاهما مكتملتان في الذاكرة والصفحة 106 فعالة', () => {
    const record = { ...createCleanRecord(), priorMemorizedSurahs: [4, 5] };
    syncUnifiedProgressToLocalData(record);

    const storeState = useMemorizationStore.getState();
    const nisa = storeState.progress.find((p) => p.surahId === 4);
    const maidah = storeState.progress.find((p) => p.surahId === 5);
    expect(nisa?.status).toBe('memorized');
    expect(maidah?.status).toBe('memorized');

    const effective = selectEffectiveMemorizedPages(record);
    expect(effective.includes(106)).toBe(true);
    expect(effective.length).toBe(51);
  });
});
