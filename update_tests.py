import codecs

with open('tests/six-month-plan.test.ts', 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace('// FAR_CYCLE_DAYS5 يوم حفظ', '// 155 يوم حفظ')

# Let's locate test 5 and 6 by regex or split
idx5 = c.find('it("5.')
idx7 = c.find('it("7.')

if idx5 != -1 and idx7 != -1:
    before = c[:idx5]
    after = c[idx7:]
    
    middle = """  it("5. البعيدة تطابق ceil(القديم ÷ 19) كل يوم، بلا تداخل مع القريبة، ولا مراجعة لصفحة لم تُحفظ بعد، ونطاق متصل", () => {
    allDays.forEach((day) => {
      const nearSet = new Set(day.nearPages.map((p) => p.p));

      // 1. لا تداخل إطلاقاً بين القريبة والبعيدة
      day.farPages.forEach((fp) => {
        expect(nearSet.has(fp.p)).toBe(false);
      });

      // 2. البعيدة تطابق ceil(القديم ÷ 19) كل يوم
      const expectedFarCount = day.oldPagesCount > 0 ? Math.ceil(day.oldPagesCount / 19) : 0;
      expect(day.farCount).toBe(expectedFarCount);
      expect(day.farPages.length).toBe(expectedFarCount);

      // 3. نطاق متصل في المراجعة البعيدة
      const farPageNumbers = day.farPages.map((p) => p.p);
      for (let i = 1; i < farPageNumbers.length; i++) {
        expect(farPageNumbers[i]).toBe(farPageNumbers[i - 1] + 1);
      }

      // 4. لا مراجعة لصفحة لم تحفظ بعد
      if (day.type === "study") {
        const studyDay = day as StudyDay;
        const currentMemorizedMax = studyDay.newPages.length > 0 ? studyDay.newPages[0].p - 1 : 0;
        day.farPages.forEach((fp) => {
          expect(fp.p).toBeLessThanOrEqual(currentMemorizedMax);
        });
      }
    });
  });

  it("6. لا صفحة محفوظة تمر عليها أكثر من 30 يوماً تقويمياً بلا مراجعة (قريبة أو أسبوعية أو بعيدة)، ويطبع الاختبار أقصى فجوة فعلية", () => {
    const pageReviewDays = new Map<number, number[]>();
    for (let p = 1; p <= 604; p++) {
      pageReviewDays.set(p, []);
    }

    allDays.forEach((day, dayIndex) => {
      const calDayNum = dayIndex + 1;
      const reviewedToday = new Set<number>();

      // المراجعة القريبة
      day.nearPages.forEach((p) => reviewedToday.add(p.p));

      // المراجعة الأسبوعية (يوم الجمعة)
      if (day.type === "friday" && day.weekPages) {
        day.weekPages.forEach((p) => reviewedToday.add(p.p));
      }

      // المراجعة البعيدة
      day.farPages.forEach((p) => reviewedToday.add(p.p));

      reviewedToday.forEach((p) => {
        pageReviewDays.get(p)!.push(calDayNum);
      });
    });

    let maxGap = 0;
    const violations: { page: number; gap: number; fromDay: number; toDay: number }[] = [];

    // فحص الفجوات بين كل مراجعتين متتاليتين لأي صفحة
    for (let p = 1; p <= 604; p++) {
      const reviews = pageReviewDays.get(p)!;
      for (let i = 1; i < reviews.length; i++) {
        const gap = reviews[i] - reviews[i - 1];
        if (gap > maxGap) maxGap = gap;
        if (gap > 30) {
          violations.push({ page: p, gap, fromDay: reviews[i - 1], toDay: reviews[i] });
        }
      }
    }

    console.log(`أقصى فجوة فعلية بين مراجعتين لأي صفحة: ${maxGap} يوماً تقويمياً`);
    expect(violations).toHaveLength(0);
    expect(maxGap).toBeLessThanOrEqual(30);
  });

"""
    new_c = before + middle + after
    with open('tests/six-month-plan.test.ts', 'w', encoding='utf-8') as f:
        f.write(new_c)
    print('Updated test 5 and 6 successfully!')
else:
    print('Indices not found:', idx5, idx7)
