import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  canMarkDate,
  getAllPlanDays,
  createCleanRecord,
  markStep,
  unmarkStep,
  markPage,
  unmarkPage,
  selectEffectiveMemorizedPages,
  saveUnifiedRecord,
  loadUnifiedRecord,
  DEFAULT_PLAN_ID,
  getRequiredStepsForDay,
  type UnifiedPlanRecord,
} from '@/lib/unified-plan-store';
import { canMarkDayAsCompleted } from '@/lib/unified-progress';
import { StudyDay, FridayDay } from '@/lib/six-month-plan-types';

describe('المرحلة الثانية: فتح اليوم التالي بالتتابع بعد إكمال اليوم السابق ومنع القفز', () => {
  const today = '2026-11-01';

  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-01T10:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('1. اليوم الأول مفتوح، واليوم الثاني مغلق قبل إكمال اليوم الأول', () => {
    const record = createCleanRecord();
    const allDays = getAllPlanDays(record);
    const day1 = allDays[0];
    const day2 = allDays[1];

    expect(day1.date).toBe('2026-11-01');
    expect(day2.date).toBe('2026-11-02');

    // اليوم الأول متاح لأنه يوافق اليوم الحالي
    expect(canMarkDate(day1.date, today, record, allDays)).toBe(true);
    expect(canMarkDayAsCompleted(day1.date, today, record, allDays)).toBe(true);

    // اليوم الثاني مغلق لأن اليوم الأول لم يكتمل بعد
    expect(canMarkDate(day2.date, today, record, allDays)).toBe(false);
    expect(canMarkDayAsCompleted(day2.date, today, record, allDays)).toBe(false);

    // محاولة تعليم اليوم الثاني المستقبلي تُرفض ولا تغيّر السجل
    const beforeStr = JSON.stringify(record);
    const afterAttempt = markStep(record, day2.date, 'new', allDays, today);
    expect(JSON.stringify(afterAttempt)).toBe(beforeStr);
  });

  it('2. بعد وضع اليوم الأول في frozenDays: اليوم الثاني يصبح قابلاً للتعليم، واليوم الثالث يظل مغلقاً', () => {
    let record = createCleanRecord();
    const allDays = getAllPlanDays(record);
    const day1 = allDays[0];
    const day2 = allDays[1];
    const day3 = allDays[2];

    // إكمال جميع الخطوات المطلوبة لليوم الأول
    const reqSteps = getRequiredStepsForDay(day1);
    for (const step of reqSteps) {
      record = markStep(record, day1.date, step, allDays, today);
    }

    // اليوم الأول أصبح في frozenDays
    expect(record.frozenDays[day1.date]).toBeDefined();

    // اليوم الثاني المستقبلي أصبح مفتوحاً وقابلاً للتعليم فوراً
    expect(canMarkDate(day2.date, today, record, allDays)).toBe(true);
    expect(canMarkDayAsCompleted(day2.date, today, record, allDays)).toBe(true);

    // لكن اليوم الثالث يظل مقفولاً لمنع القفز
    expect(canMarkDate(day3.date, today, record, allDays)).toBe(false);
    expect(canMarkDayAsCompleted(day3.date, today, record, allDays)).toBe(false);

    // تعليم خطوة في اليوم الثاني ينجح الآن
    const day2Pages = (day2 as StudyDay).newPages.map((p) => p.p);
    record = markStep(record, day2.date, 'new', allDays, today);
    expect(record.steps[day2.date]?.new).toBe(true);
    day2Pages.forEach((p) => {
      expect(record.memorizedPages).toContain(p);
    });
  });

  it('3. بعد إكمال اليوم الثاني: اليوم الثالث يصبح قابلاً للتعليم، واليوم الرابع يظل مغلقاً', () => {
    let record = createCleanRecord();
    const allDays = getAllPlanDays(record);
    const day1 = allDays[0];
    const day2 = allDays[1];
    const day3 = allDays[2];
    const day4 = allDays[3];

    // إكمال اليوم الأول
    for (const step of getRequiredStepsForDay(day1)) {
      record = markStep(record, day1.date, step, allDays, today);
    }

    // إكمال اليوم الثاني
    for (const step of getRequiredStepsForDay(day2)) {
      record = markStep(record, day2.date, step, allDays, today);
    }

    expect(record.frozenDays[day2.date]).toBeDefined();

    // اليوم الثالث أصبح متاحاً الآن
    expect(canMarkDate(day3.date, today, record, allDays)).toBe(true);

    // اليوم الرابع لا يزال مغلقاً
    expect(canMarkDate(day4.date, today, record, allDays)).toBe(false);
  });

  it('4. إلغاء اليوم الأول: يُعاد قفل اليوم الثاني واليوم الثالث فوراً، والبيانات لا تُحذف تلقائياً', () => {
    let record = createCleanRecord();
    const allDays = getAllPlanDays(record);
    const day1 = allDays[0];
    const day2 = allDays[1];
    const day3 = allDays[2];

    // إكمال اليوم الأول ثم حفظ خطوة في اليوم الثاني
    for (const step of getRequiredStepsForDay(day1)) {
      record = markStep(record, day1.date, step, allDays, today);
    }
    record = markStep(record, day2.date, 'new', allDays, today);
    const day2Pages = (day2 as StudyDay).newPages.map((p) => p.p);
    expect(record.steps[day2.date]?.new).toBe(true);

    // الآن: إلغاء اليوم الأول
    record = unmarkStep(record, day1.date, 'new', allDays, today);
    expect(record.frozenDays[day1.date]).toBeUndefined();

    // اليوم الثاني يُقفل فوراً
    expect(canMarkDate(day2.date, today, record, allDays)).toBe(false);
    expect(canMarkDayAsCompleted(day2.date, today, record, allDays)).toBe(false);

    // واليوم الثالث مقفول أيضاً
    expect(canMarkDate(day3.date, today, record, allDays)).toBe(false);

    // بيانات اليوم الثاني لم تُحذف عشوائياً (لا تتغير إلا بالإجراء الطبيعي للإلغاء)
    expect(record.steps[day2.date]?.new).toBe(true);
    day2Pages.forEach((p) => {
      expect(record.memorizedPages).toContain(p);
    });

    // محاولة تعليم خطوات جديدة في اليوم الثاني المقفول مجدداً تُرفض
    const attempt = markStep(record, day2.date, 'near', allDays, today);
    expect(attempt.steps[day2.date]?.near).toBeFalsy();
  });

  it('5. تاريخ مستقبلي بعيد مثل اليوم 15 يظل مغلقاً دائماً عند إكمال اليوم الأول فقط', () => {
    let record = createCleanRecord();
    const allDays = getAllPlanDays(record);
    const day1 = allDays[0];
    const day15 = allDays[14]; // اليوم الـ 15

    for (const step of getRequiredStepsForDay(day1)) {
      record = markStep(record, day1.date, step, allDays, today);
    }

    expect(canMarkDate(day15.date, today, record, allDays)).toBe(false);
    expect(canMarkDayAsCompleted(day15.date, today, record, allDays)).toBe(false);
  });

  it('6. الجمعة تُعامل حسب ترتيب allDays والمهام المطلوبة (near إلزامي، و far إن وجد)', () => {
    let record = createCleanRecord();
    const allDays = getAllPlanDays(record);

    // إكمال الأيام 1 إلى 5 (من الأحد إلى الخميس)
    for (let i = 0; i < 5; i++) {
      const d = allDays[i];
      for (const step of getRequiredStepsForDay(d)) {
        record = markStep(record, d.date, step, allDays, today);
      }
    }

    const friday = allDays[5]; // اليوم السادس هو الجمعة
    const saturday = allDays[6]; // اليوم السابع هو السبت
    expect(friday.type).toBe('friday');
    expect(saturday.type).toBe('study');

    // الجمعة أصبحت مفتوحة لأن الخميس مكتمل
    expect(canMarkDate(friday.date, today, record, allDays)).toBe(true);

    // السبت يظل مغلقاً قبل إنجاز الجمعة
    expect(canMarkDate(saturday.date, today, record, allDays)).toBe(false);

    // مهام الجمعة المطلوبة
    const fridayReq = getRequiredStepsForDay(friday);
    expect(fridayReq).toContain('near'); // مراجعة الأسبوع إلزامية

    // إنجاز مهام الجمعة
    for (const step of fridayReq) {
      record = markStep(record, friday.date, step, allDays, today);
    }

    expect(record.frozenDays[friday.date]).toBeDefined();

    // بعد إكمال الجمعة: السبت يفتح بالتتابع
    expect(canMarkDate(saturday.date, today, record, allDays)).toBe(true);
  });

  it('7. priorMemorizedSurahs لا تتأثر بفتح الأيام أو إكمالها أو إلغائها', () => {
    let record: UnifiedPlanRecord = {
      ...createCleanRecord(),
      priorMemorizedSurahs: [1, 114],
    };
    const allDays = getAllPlanDays(record);
    const day1 = allDays[0];

    // إكمال اليوم الأول
    for (const step of getRequiredStepsForDay(day1)) {
      record = markStep(record, day1.date, step, allDays, today);
    }
    expect(record.priorMemorizedSurahs).toEqual([1, 114]);

    // إلغاء اليوم الأول
    record = unmarkStep(record, day1.date, 'new', allDays, today);
    expect(record.priorMemorizedSurahs).toEqual([1, 114]);
  });

  it('8. الصفحة المشتركة 106 تحافظ على السلوك الحالي ولا تتكرر الصفحات', () => {
    let record: UnifiedPlanRecord = {
      ...createCleanRecord(),
      priorMemorizedSurahs: [4],
    };
    const effectiveBefore = selectEffectiveMemorizedPages(record);
    expect(effectiveBefore.includes(106)).toBe(false);

    const allDays = getAllPlanDays(record);
    const day1 = allDays[0];

    for (const step of getRequiredStepsForDay(day1)) {
      record = markStep(record, day1.date, step, allDays, today);
    }

    const effectiveAfter = selectEffectiveMemorizedPages(record);
    expect(effectiveAfter.includes(106)).toBe(false);

    // عدم تكرار الصفحات إطلاقاً
    const unique = new Set(effectiveAfter);
    expect(unique.size).toBe(effectiveAfter.length);
  });

  it('9. لا يحدث أي تغيير تلقائي في السجل بمجرد الاستعلام أو التنقل', () => {
    const record = createCleanRecord();
    const allDays = getAllPlanDays(record);
    const beforeJson = JSON.stringify(record);

    // مجرد استدعاء canMarkDate لمختلف الأيام
    canMarkDate('2026-11-01', today, record, allDays);
    canMarkDate('2026-11-02', today, record, allDays);
    canMarkDate('2026-11-15', today, record, allDays);

    expect(JSON.stringify(record)).toBe(beforeJson);
  });

  it('10. markPage و unmarkPage يلتزمان بقفل التاريخ المستقبلي وبفتحه عند إكمال اليوم السابق', () => {
    let record = createCleanRecord();
    const allDays = getAllPlanDays(record);
    const day1 = allDays[0] as StudyDay;
    const day2 = allDays[1] as StudyDay;

    const day2FirstPage = day2.newPages[0].p;

    // محاولة تعليم صفحة تابعة لليوم الثاني قبل إكمال اليوم الأول تُرفض
    record = markPage(record, day2FirstPage, allDays, today);
    expect(record.memorizedPages).not.toContain(day2FirstPage);

    // إكمال اليوم الأول
    for (const step of getRequiredStepsForDay(day1)) {
      record = markStep(record, day1.date, step, allDays, today);
    }

    // الآن تعليم صفحة اليوم الثاني ينجح لأن اليوم الثاني مفتوح
    record = markPage(record, day2FirstPage, allDays, today);
    expect(record.memorizedPages).toContain(day2FirstPage);

    // إلغاء تعليم الصفحة ينجح أيضاً
    record = unmarkPage(record, day2FirstPage, allDays, today);
    expect(record.memorizedPages).not.toContain(day2FirstPage);
  });

  it('11. الاستدعاءات القديمة لـ canMarkDate بدون record أو planDays تحافظ على السلوك القديم 100%', () => {
    expect(canMarkDate('2026-11-01', '2026-11-01')).toBe(true);
    expect(canMarkDate('2026-10-31', '2026-11-01')).toBe(true);
    expect(canMarkDate('2026-11-02', '2026-11-01')).toBe(false);
    expect(canMarkDate('2026-11-15', '2026-11-01')).toBe(false);
  });
});
