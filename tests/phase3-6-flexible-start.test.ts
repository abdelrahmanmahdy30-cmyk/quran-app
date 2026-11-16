import { describe, it, expect, beforeEach } from 'vitest';
import { generatePlan } from '../lib/plan-generator';
import { generatePlanFrom } from '../lib/plan-generator-from';
import { StudyDay, FridayDay } from '../lib/six-month-plan-types';
import {
  loadUnifiedRecord,
  saveUnifiedRecord,
  getUnifiedStorageKey,
  DEFAULT_PLAN_ID,
  formatLocalDateStr,
} from '../lib/unified-plan-store';

describe('المرحلة 3.6: البداية من أي سورة، وخطة تتعدل حسب تقدمك (Rebase)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // 1. البداية من ص 1: نفس الأرقام المقفولة تماماً
  it('1. البداية من ص 1: تعطي نفس الأرقام المقفولة تماماً ومطابقة 100% مع generatePlan', () => {
    const lockedMonths = generatePlan();
    const flexibleMonths = generatePlanFrom({
      startPage: 1,
      startDate: '2026-11-01',
    });

    const lockedDays = lockedMonths.flatMap((m) => m.days);
    const flexDays = flexibleMonths.flatMap((m) => m.days);

    // 181 يوماً تقويمياً
    expect(flexDays.length).toBe(181);
    expect(flexDays.length).toBe(lockedDays.length);

    // 26 جمعة
    const fridays = flexDays.filter((d) => d.type === 'friday');
    expect(fridays.length).toBe(26);

    // 155 يوم حفظ
    const studyDays = flexDays.filter((d) => d.type === 'study') as StudyDay[];
    expect(studyDays.length).toBe(155);

    // تاريخ الختمة عند ص 604 هو الخميس 2027-04-29
    const khatmaDay = studyDays.find((d) => d.newPages?.some((p) => p.p === 604));
    expect(khatmaDay).toBeDefined();
    expect(khatmaDay!.date).toBe('2027-04-29');

    // مطابقة تامة يوماً بيوم
    for (let i = 0; i < lockedDays.length; i++) {
      expect(flexDays[i].date).toBe(lockedDays[i].date);
      expect(flexDays[i].type).toBe(lockedDays[i].type);
    }
  });

  // 2. البداية من ص 106 (المائدة) / 300 / 604: كل صفحة تُحفظ مرة واحدة، لا مراجعة لصفحة لم تُحفظ، الفجوة <= 30
  it('2. البداية من ص 106 (المائدة) و300 و604: كل صفحة تُحفظ مرة واحدة فقط والختمة تنتهي عند 604 والفجوة <= 30 يوماً', () => {
    const testPages = [106, 300, 604];

    for (const sp of testPages) {
      const months = generatePlanFrom({
        startPage: sp,
        startDate: '2026-11-01',
        priorPagesMemorized: false,
      });

      const days = months.flatMap((m) => m.days);
      const studyDays = days.filter((d) => d.type === 'study') as StudyDay[];

      // تجميع كل الصفحات المحفوظة في الخطة
      const memorizedInPlan = studyDays.flatMap((d) => d.newPages.map((p) => p.p));

      // أول صفحة تبدأ بدقة من sp
      expect(memorizedInPlan[0]).toBe(sp);
      // آخر صفحة تنتهي عند 604
      expect(memorizedInPlan[memorizedInPlan.length - 1]).toBe(604);

      // كل صفحة من sp إلى 604 تُحفظ مرة واحدة بالضبط بلا تكرار
      const expectedCount = 604 - sp + 1;
      expect(memorizedInPlan.length).toBe(expectedCount);
      const uniquePages = new Set(memorizedInPlan);
      expect(uniquePages.size).toBe(expectedCount);

      // التحقق من أن المراجعة لا تحتوي أي صفحة لم تُحفظ بعد، وأن الفجوة <= 30 يوماً
      const memorizedSoFar = new Set<number>();
      const lastReviewDateOfPage = new Map<number, string>();
      let maxGapDays = 0;

      for (const d of days) {
        if (d.type === 'study') {
          for (const p of d.newPages) {
            memorizedSoFar.add(p.p);
            lastReviewDateOfPage.set(p.p, d.date);
          }
        }

        // فحص القريبة
        for (const p of d.nearPages) {
          expect(memorizedSoFar.has(p.p)).toBe(true);
          const lastDate = lastReviewDateOfPage.get(p.p);
          if (lastDate) {
            const gap = Math.round(
              (new Date(d.date).getTime() - new Date(lastDate).getTime()) / 86400000
            );
            if (gap > maxGapDays) maxGapDays = gap;
          }
          lastReviewDateOfPage.set(p.p, d.date);
        }

        // فحص البعيدة
        for (const p of d.farPages) {
          expect(memorizedSoFar.has(p.p)).toBe(true);
          const lastDate = lastReviewDateOfPage.get(p.p);
          if (lastDate) {
            const gap = Math.round(
              (new Date(d.date).getTime() - new Date(lastDate).getTime()) / 86400000
            );
            if (gap > maxGapDays) maxGapDays = gap;
          }
          lastReviewDateOfPage.set(p.p, d.date);
        }

        // فحص مراجعة الأسبوع يوم الجمعة
        if (d.type === 'friday' && d.weekPages) {
          for (const p of d.weekPages) {
            expect(memorizedSoFar.has(p.p)).toBe(true);
            const lastDate = lastReviewDateOfPage.get(p.p);
            if (lastDate) {
              const gap = Math.round(
                (new Date(d.date).getTime() - new Date(lastDate).getTime()) / 86400000
              );
              if (gap > maxGapDays) maxGapDays = gap;
            }
            lastReviewDateOfPage.set(p.p, d.date);
          }
        }
      }

      expect(maxGapDays).toBeLessThanOrEqual(30);
    }
  });

  // 3. rebase متقدم: تعليم يومين زيادة يقدّم تاريخ الختمة واليوم التالي يبدأ بالصفحة الصحيحة
  it('3. rebase متقدم: عند تعليم يومين زيادة يتقدم تاريخ الختمة واليوم التالي يبدأ بالصفحة الصحيحة', () => {
    // اليوم هو 2026-11-01، المستخدم أكمل يوم 1 ويوم 2 (ص 1 إلى 8)
    const memorizedPages = [1, 2, 3, 4, 5, 6, 7, 8];
    const frozenDays = {
      '2026-11-01': {
        date: '2026-11-01',
        dayIndex: 1,
        dayName: 'الأحد',
        isFriday: false,
        pagesCount: 4,
        completedAt: '2026-11-01T12:00:00Z',
        memorizedPagesSnapshot: [1, 2, 3, 4],
      },
      '2026-11-02': {
        date: '2026-11-02',
        dayIndex: 2,
        dayName: 'الاثنين',
        isFriday: false,
        pagesCount: 4,
        completedAt: '2026-11-01T14:00:00Z',
        memorizedPagesSnapshot: [1, 2, 3, 4, 5, 6, 7, 8],
      },
    };

    const rebasedMonths = generatePlanFrom({
      startPage: 1,
      startDate: '2026-11-01',
      memorizedPages,
      frozenDays,
      today: '2026-11-01', // اليوم التقويمي هو 1 نوفمبر لكن المستخدم متقدم بيوم
    });

    const days = rebasedMonths.flatMap((m) => m.days);
    const studyDays = days.filter((d) => d.type === 'study') as StudyDay[];

    // اليوم القادم التالي (2026-11-02 الاثنين) يجب أن يبدأ من ص 9 فوراً
    const nextDay = studyDays.find((d) => d.date === '2026-11-02');
    expect(nextDay).toBeDefined();
    expect(nextDay!.newPages[0].p).toBe(9);

    // تاريخ الختمة يتقدم بيوم عن 2027-04-29
    const khatmaDay = studyDays.find((d) => d.newPages?.some((p) => p.p === 604));
    expect(khatmaDay).toBeDefined();
    expect(khatmaDay!.date < '2027-04-29').toBe(true);
  });

  // 4. rebase متأخر: تجاوز أياماً، الخطة تكمل من أول صفحة غير محفوظة وتاريخ الختمة يتأخر
  it('4. rebase متأخر: عند التأخر لا قفز ولا حفظ مضاعف، والخطة تكمل من أول صفحة غير محفوظة وتتأخر الختمة', () => {
    // اليوم هو 2026-11-05 (الخميس، اليوم الخامس)
    // المستخدم أنجز فقط يوم 1 (ص 1-4)، والأيام 2 و3 و4 فاتت بلا إنجاز
    const memorizedPages = [1, 2, 3, 4];
    const frozenDays = {
      '2026-11-01': {
        date: '2026-11-01',
        dayIndex: 1,
        dayName: 'الأحد',
        isFriday: false,
        pagesCount: 4,
        completedAt: '2026-11-01T12:00:00Z',
        memorizedPagesSnapshot: [1, 2, 3, 4],
      },
    };

    const rebasedMonths = generatePlanFrom({
      startPage: 1,
      startDate: '2026-11-01',
      memorizedPages,
      frozenDays,
      today: '2026-11-05', // تأخر 3 أيام دراسية
    });

    const days = rebasedMonths.flatMap((m) => m.days);
    const studyDays = days.filter((d) => d.type === 'study') as StudyDay[];

    // ورد اليوم 2026-11-05 يبدأ من ص 5 (أول صفحة غير محفوظة) بلا قفز
    const todayStudyDay = studyDays.find((d) => d.date === '2026-11-05');
    expect(todayStudyDay).toBeDefined();
    expect(todayStudyDay!.newPages[0].p).toBe(5);
    // لا حفظ مضاعف: الحصة 4 صفحات فقط
    expect(todayStudyDay!.newPages.length).toBe(4);

    // تاريخ الختمة يتأخر عن 2027-04-29
    const khatmaDay = studyDays.find((d) => d.newPages?.some((p) => p.p === 604));
    expect(khatmaDay).toBeDefined();
    expect(khatmaDay!.date > '2027-04-29').toBe(true);
  });

  // 5. الأيام المجمدة لا تتغير أبداً بعد أي rebase
  it('5. الأيام المجمدة (frozenDays) لا تتغير بياناتها بعد أي إعادة حساب rebase', () => {
    const frozenDaySnapshot = {
      date: '2026-11-01',
      dayIndex: 1,
      dayName: 'الأحد',
      isFriday: false,
      pagesCount: 4,
      completedAt: '2026-11-01T15:00:00Z',
      memorizedPagesSnapshot: [1, 2, 3, 4],
    };

    const months = generatePlanFrom({
      startPage: 1,
      startDate: '2026-11-01',
      memorizedPages: [1, 2, 3, 4],
      frozenDays: { '2026-11-01': frozenDaySnapshot },
      today: '2026-11-10',
    });

    const day1 = months.flatMap((m) => m.days).find((d) => d.date === '2026-11-01') as StudyDay;
    expect(day1).toBeDefined();
    expect(day1.newPages.map((p) => p.p)).toEqual([1, 2, 3, 4]);
  });

  // 6. تغيير نقطة البداية ينشئ خطة جديدة بمفتاح مستقل ولا يمسح خطة أخرى
  it('6. تغيير نقطة البداية ينشئ خطة جديدة بمفتاح مستقل ولا يمسح تقدم أي خطة أخرى', () => {
    const planIdDefault = DEFAULT_PLAN_ID;
    const planIdCustom = 'plan-surah-maidah-106';

    // حفظ تقدم في الخطة الافتراضية
    const recordDefault = loadUnifiedRecord(planIdDefault);
    recordDefault.memorizedPages = [1, 2, 3, 4];
    saveUnifiedRecord(recordDefault);

    // إنشاء خطة جديدة برقم بداية 106
    const recordCustom = loadUnifiedRecord(planIdCustom);
    recordCustom.startPage = 106;
    recordCustom.memorizedPages = [106, 107, 108, 109];
    saveUnifiedRecord(recordCustom);

    // التحقق من أن كل خطة تحتفظ ببياناتها المستقلة في localStorage
    const loadedDefault = loadUnifiedRecord(planIdDefault);
    const loadedCustom = loadUnifiedRecord(planIdCustom);

    expect(loadedDefault.startPage).toBe(1);
    expect(loadedDefault.memorizedPages).toEqual([1, 2, 3, 4]);

    expect(loadedCustom.startPage).toBe(106);
    expect(loadedCustom.memorizedPages).toEqual([106, 107, 108, 109]);
  });

  // 7. خيار "قبل البداية محفوظ" و"غير محفوظ" يعطيان سلوكاً صحيحاً في البعيدة
  it('7. خيار priorPagesMemorized (نعم/لا) يتحكم بدقة في المراجعة البعيدة من أول يوم', () => {
    // الحالة أ: نعم (محفوظ سابقاً)
    const monthsWithPrior = generatePlanFrom({
      startPage: 106,
      startDate: '2026-11-01',
      priorPagesMemorized: true,
    });
    const day1WithPrior = monthsWithPrior.flatMap((m) => m.days)[0] as StudyDay;
    // يجب أن تدخل الصفحات من 1 إلى 105 في المراجعة البعيدة فوراً
    expect(day1WithPrior.oldPagesCount).toBe(105);
    expect(day1WithPrior.farPages.length).toBeGreaterThan(0);
    expect(day1WithPrior.farPages[0].p).toBe(1);

    // الحالة ب: لا (غير محفوظ سابقاً - الافتراضي)
    const monthsWithoutPrior = generatePlanFrom({
      startPage: 106,
      startDate: '2026-11-01',
      priorPagesMemorized: false,
    });
    const day1WithoutPrior = monthsWithoutPrior.flatMap((m) => m.days)[0] as StudyDay;
    // لا مراجعة لصفحة لم تُحفظ
    expect(day1WithoutPrior.oldPagesCount).toBe(0);
    expect(day1WithoutPrior.farPages.length).toBe(0);
  });
});
