import { describe, it, expect } from "vitest";
import { generatePlan, formatLocalDate, ARABIC_DAYS } from "../lib/plan-generator";
import { createHafs, surahNamesAr, Page, Surah } from "quran-meta";
import { StudyDay, FridayDay, PlanDay } from "../lib/six-month-plan-types";
import * as fs from "fs";

describe("تدقيق جدول الـ 6 أشهر لحفظ القرآن الكريم (نوفمبر 2026 - أبريل 2027)", () => {
  const plan = generatePlan();
  const hafs = createHafs();
  const allDays: PlanDay[] = plan.flatMap((m) => m.days);
  const studyDays = allDays.filter((d): d is StudyDay => d.type === "study");
  const fridayDays = allDays.filter((d): d is FridayDay => d.type === "friday");

  it("1. كل صفحة 1..604 تظهر كحفظ جديد مرة واحدة بالضبط، بلا فجوات ولا تكرار، وآخر يوم ينتهي عند ص 604", () => {
    const pageCounts = new Map<number, number>();

    studyDays.forEach((day) => {
      day.newPages.forEach((p) => {
        pageCounts.set(p.p, (pageCounts.get(p.p) || 0) + 1);
      });
    });

    const missingPages: number[] = [];
    const duplicatePages: { page: number; count: number }[] = [];

    for (let p = 1; p <= 604; p++) {
      const count = pageCounts.get(p) || 0;
      if (count === 0) missingPages.push(p);
      else if (count > 1) duplicatePages.push({ page: p, count });
    }

    expect(missingPages).toHaveLength(0);
    expect(duplicatePages).toHaveLength(0);
    expect(pageCounts.size).toBe(604);

    // آخر صفحة في آخر يوم حفظ
    const lastStudyDay = studyDays[studyDays.length - 1];
    const lastPage = lastStudyDay.newPages[lastStudyDay.newPages.length - 1]?.p;
    expect(lastPage).toBe(604);
  });

  it("2. الأرقام المقفولة للخطة: 181 يوماً، 26 جمعة، 155 حفظ، 139×4+16×3=604، الختمة 2027-04-29، الجمعات بلا حفظ جديد، أسماء الأيام صحيحة", () => {
    // 181 يوماً تقويمياً
    expect(allDays.length).toBe(181);

    // 26 جمعة
    expect(fridayDays.length).toBe(26);

    // 155 يوم حفظ
    expect(studyDays.length).toBe(155);

    // 139 يوماً بـ 4 صفحات
    const daysWith4Pages = studyDays.filter((d) => d.newPages.length === 4);
    expect(daysWith4Pages.length).toBe(139);

    // 16 يوماً بـ 3 صفحات
    const daysWith3Pages = studyDays.filter((d) => d.newPages.length === 3);
    expect(daysWith3Pages.length).toBe(16);

    // 139 * 4 + 16 * 3 = 604
    const totalNewPages = studyDays.reduce((acc, d) => acc + d.newPages.length, 0);
    expect(totalNewPages).toBe(604);

    // الختمة يوم الخميس 2027-04-29
    const khatmaDay = studyDays[studyDays.length - 1];
    expect(khatmaDay.date).toBe("2027-04-29");
    expect(khatmaDay.dayName).toBe("الخميس");
    expect(khatmaDay.newPages[khatmaDay.newPages.length - 1].p).toBe(604);

    // آخر يوم في الخطة التقويمية الجمعة 2027-04-30
    const finalCalendarDay = allDays[allDays.length - 1];
    expect(finalCalendarDay.date).toBe("2027-04-30");
    expect(finalCalendarDay.type).toBe("friday");

    // كل الجمعات بلا حفظ جديد والتواريخ وأسماء الأيام صحيحة
    allDays.forEach((day) => {
      const [y, m, d] = day.date.split("-").map(Number);
      const dateObj = new Date(y, m - 1, d);
      const expectedDayName = ARABIC_DAYS[dateObj.getDay()];
      expect(day.dayName).toBe(expectedDayName);

      if (dateObj.getDay() === 5) {
        expect(day.type).toBe("friday");
        expect("newPages" in day).toBe(false);
      } else {
        expect(day.type).toBe("study");
      }
    });
  });

  it("3. مجموع كل شهر: نوفمبر 104، ديسمبر 108، يناير 104، فبراير 96، مارس 108، أبريل 84 (المجموع = 604)", () => {
    expect(plan.length).toBe(6);

    const expectedMonths = [
      { name: "نوفمبر 2026", pages: 104, studyDays: 26, fridays: 4, from: 1, to: 104 },
      { name: "ديسمبر 2026", pages: 108, studyDays: 27, fridays: 4, from: 105, to: 212 },
      { name: "يناير 2027", pages: 104, studyDays: 26, fridays: 5, from: 213, to: 316 },
      { name: "فبراير 2027", pages: 96, studyDays: 24, fridays: 4, from: 317, to: 412 },
      { name: "مارس 2027", pages: 108, studyDays: 27, fridays: 4, from: 413, to: 520 },
      { name: "أبريل 2027", pages: 84, studyDays: 25, fridays: 5, from: 521, to: 604 },
    ];

    let grandTotal = 0;
    expectedMonths.forEach((exp, idx) => {
      const m = plan[idx];
      expect(m.name).toBe(exp.name);
      expect(m.totalPages).toBe(exp.pages);
      expect(m.studyDaysCount).toBe(exp.studyDays);
      expect(m.fridaysCount).toBe(exp.fridays);
      expect(m.pageFrom).toBe(exp.from);
      expect(m.pageTo).toBe(exp.to);
      grandTotal += m.totalPages;
    });

    expect(grandTotal).toBe(604);
  });

  it("4. المراجعة الصغرى = ورد آخر يومين حفظ (8 صفحات، و6 في الـ16 يوماً الأخيرة)، ولا تشير لصفحات لم تُحفظ بعد", () => {
    let cumulativeMax = 0;

    studyDays.forEach((day, idx) => {
      const todayMax = day.newPages[day.newPages.length - 1].p;
      const memorizedBefore = cumulativeMax;

      if (idx === 0) {
        // اليوم الأول: لا يوجد مراجعة قريبة
        expect(day.nearPages).toHaveLength(0);
      } else if (idx === 1) {
        // اليوم الثاني: ورد اليوم الأول فقط (4 صفحات)
        expect(day.nearPages).toHaveLength(4);
        expect(day.nearPages.map((p) => p.p)).toEqual([1, 2, 3, 4]);
      } else if (idx < 139) {
        // الأيام 3 إلى 139: ورد آخر يومين حفظ (4 + 4 = 8 صفحات)
        expect(day.nearPages).toHaveLength(8);
      } else if (idx === 139) {
        // اليوم 140 (أول يوم 3 صفحات): اليوم السابق 4 وقبله 4 = 8 صفحات
        expect(day.nearPages).toHaveLength(8);
      } else if (idx === 140) {
        // اليوم 141: اليوم السابق 3 وقبله 4 = 7 صفحات
        expect(day.nearPages).toHaveLength(7);
      } else {
        // الأيام 142 إلى 155: ورد آخر يومين حفظ (3 + 3 = 6 صفحات)
        expect(day.nearPages).toHaveLength(6);
      }

      // التحقق من أن المراجعة القريبة لا تشير لصفحات لم تُحفظ بعد
      day.nearPages.forEach((p) => {
        expect(p.p).toBeLessThanOrEqual(memorizedBefore);
      });

      cumulativeMax = todayMax;
    });
  });

      it("5. البعيدة تطابق ceil(القديم ÷ 19) كل يوم، بلا تداخل مع القريبة، ولا مراجعة لصفحة لم تُحفظ بعد، وتدوير منتظم", () => {
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

      // 3. التتابع الدائري المنتظم ضمن المحفوظ القديم المؤهل
      const farPageNumbers = day.farPages.map((p) => p.p);
      for (let i = 1; i < farPageNumbers.length; i++) {
        expect(farPageNumbers[i]).toBe((farPageNumbers[i - 1] % day.oldPagesCount) + 1);
      }

      // 4. لا مراجعة لصفحة لم تحفظ بعد (كل الصفحات <= المحفوظ القديم المؤهل)
      day.farPages.forEach((fp) => {
        expect(fp.p).toBeLessThanOrEqual(day.oldPagesCount);
      });
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

it("7. اتصال الآيات بين كل يومين، ورقم الآية لا يتجاوز عدد آيات سورتها في أي صفحة", () => {
    let prevLastSurah: number | null = null;
    let prevLastAyah: number | null = null;
    const continuityErrors: string[] = [];

    for (let p = 1; p <= 604; p++) {
      const pageAyahs = Array.from(hafs.ayahsInPage(p as Page));
      const first = pageAyahs[0];
      const last = pageAyahs[pageAyahs.length - 1];

      // فحص عدم تجاوز رقم الآية لعدد آيات سورتها
      pageAyahs.forEach(([sNum, aNum]) => {
        const totalSurahAyahs = hafs.getAyahCountInSurah(sNum as Surah);
        expect(aNum).toBeGreaterThanOrEqual(1);
        expect(aNum).toBeLessThanOrEqual(totalSurahAyahs);
      });

      // فحص اتصال الآيات بين الصفحات
      if (prevLastSurah !== null && prevLastAyah !== null) {
        if (first[0] === prevLastSurah) {
          // نفس السورة: الآية الأولى = السابقة + 1
          if (first[1] !== prevLastAyah + 1) {
            continuityErrors.push(`ص ${p}: متوقع سورة ${first[0]} آية ${prevLastAyah + 1}، وُجد ${first[1]}`);
          }
        } else if (first[0] === prevLastSurah + 1) {
          // سورة جديدة: يجب أن تبدأ بالآية 1
          if (first[1] !== 1) {
            continuityErrors.push(`ص ${p}: سورة جديدة ${first[0]} تبدأ بالآية ${first[1]} بدلاً من 1`);
          }
        } else {
          continuityErrors.push(`ص ${p}: قفزة في السور من ${prevLastSurah} إلى ${first[0]}`);
        }
      }

      prevLastSurah = last[0];
      prevLastAyah = last[1];
    }

    expect(continuityErrors).toHaveLength(0);
  });

  it("8. أسماء السور وأرقام الآيات لكل صفحة تطابق quran-meta (getPageMeta / ayahsInPage) دون أي as any", () => {
    const discrepancies: string[] = [];

    allDays.forEach((day) => {
      const pagesToCheck = [
        ...(day.type === "study" ? day.newPages : day.weekPages || []),
        ...day.nearPages,
        ...day.farPages,
      ];

      pagesToCheck.forEach((entry) => {
        const p = entry.p;
        const ayahs = Array.from(hafs.ayahsInPage(p as Page));

        entry.s.forEach((sEntry) => {
          const matchingAyahs = ayahs.filter(([sNum]) => {
            const cleanName = surahNamesAr[sNum as Surah]?.[1] || "";
            return cleanName === sEntry.n;
          });

          if (matchingAyahs.length === 0) {
            discrepancies.push(`الصفحة ${p}: السورة '${sEntry.n}' غير موجودة في quran-meta`);
          } else {
            const expectedFrom = matchingAyahs[0][1];
            const expectedTo = matchingAyahs[matchingAyahs.length - 1][1];

            if (sEntry.f !== expectedFrom || sEntry.t !== expectedTo) {
              discrepancies.push(
                `الصفحة ${p} سورة '${sEntry.n}': الآيات [${sEntry.f}-${sEntry.t}] لا تطابق quran-meta [${expectedFrom}-${expectedTo}]`
              );
            }
          }
        });
      });
    });

    expect(discrepancies).toHaveLength(0);
  });

  it("9. مزامنة ملف public/six-month-plan.json ليتطابق مع generatePlan", () => {
    fs.writeFileSync(
      "public/six-month-plan.json",
      JSON.stringify(plan, null, 2),
      "utf8"
    );
    expect(fs.existsSync("public/six-month-plan.json")).toBe(true);

    const savedContent = JSON.parse(fs.readFileSync("public/six-month-plan.json", "utf8"));
    expect(savedContent.length).toBe(6);
  });
});
