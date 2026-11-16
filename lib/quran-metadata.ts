/**
 * quran-metadata.ts — جداول رقمية معتمدة لحساب الصفحات والأجزاء بدقة
 * 
 * المصدر المعتمد: مصحف المدينة النبوية (مجمع الملك فهد لطباعة المصحف الشريف - رواية حفص عن عاصم - 604 صفحة / 30 جزءاً)
 * ملاحظة: هذا الملف يحتوي على أرقام وحدود فقط (أرقام سور وآيات وصفحات) دون أي نصوص قرآنية.
 */

import { surahs, type MemorizationProgress } from "./quran-data";

export interface JuzBoundary {
  juzNumber: number;
  startSurah: number;
  startAyah: number;
  endSurah: number;
  endAyah: number;
}

/**
 * حدود الأجزاء الثلاثين بدقة (السورة والآية البداية والنهاية)
 * المصدر: مجمع الملك فهد لطباعة المصحف الشريف
 */
export const JUZ_BOUNDARIES: JuzBoundary[] = [
  { juzNumber: 1, startSurah: 1, startAyah: 1, endSurah: 2, endAyah: 141 },
  { juzNumber: 2, startSurah: 2, startAyah: 142, endSurah: 2, endAyah: 252 },
  { juzNumber: 3, startSurah: 2, startAyah: 253, endSurah: 3, endAyah: 92 },
  { juzNumber: 4, startSurah: 3, startAyah: 93, endSurah: 4, endAyah: 23 },
  { juzNumber: 5, startSurah: 4, startAyah: 24, endSurah: 4, endAyah: 147 },
  { juzNumber: 6, startSurah: 4, startAyah: 148, endSurah: 5, endAyah: 81 },
  { juzNumber: 7, startSurah: 5, startAyah: 82, endSurah: 6, endAyah: 110 },
  { juzNumber: 8, startSurah: 6, startAyah: 111, endSurah: 7, endAyah: 87 },
  { juzNumber: 9, startSurah: 7, startAyah: 88, endSurah: 8, endAyah: 40 },
  { juzNumber: 10, startSurah: 8, startAyah: 41, endSurah: 9, endAyah: 92 },
  { juzNumber: 11, startSurah: 9, startAyah: 93, endSurah: 11, endAyah: 5 },
  { juzNumber: 12, startSurah: 11, startAyah: 6, endSurah: 12, endAyah: 52 },
  { juzNumber: 13, startSurah: 12, startAyah: 53, endSurah: 14, endAyah: 52 },
  { juzNumber: 14, startSurah: 15, startAyah: 1, endSurah: 16, endAyah: 128 },
  { juzNumber: 15, startSurah: 17, startAyah: 1, endSurah: 18, endAyah: 74 },
  { juzNumber: 16, startSurah: 18, startAyah: 75, endSurah: 20, endAyah: 135 },
  { juzNumber: 17, startSurah: 21, startAyah: 1, endSurah: 22, endAyah: 78 },
  { juzNumber: 18, startSurah: 23, startAyah: 1, endSurah: 25, endAyah: 20 },
  { juzNumber: 19, startSurah: 25, startAyah: 21, endSurah: 27, endAyah: 55 },
  { juzNumber: 20, startSurah: 27, startAyah: 56, endSurah: 29, endAyah: 45 },
  { juzNumber: 21, startSurah: 29, startAyah: 46, endSurah: 33, endAyah: 30 },
  { juzNumber: 22, startSurah: 33, startAyah: 31, endSurah: 36, endAyah: 27 },
  { juzNumber: 23, startSurah: 36, startAyah: 28, endSurah: 39, endAyah: 31 },
  { juzNumber: 24, startSurah: 39, startAyah: 32, endSurah: 41, endAyah: 46 },
  { juzNumber: 25, startSurah: 41, startAyah: 47, endSurah: 45, endAyah: 37 },
  { juzNumber: 26, startSurah: 46, startAyah: 1, endSurah: 51, endAyah: 30 },
  { juzNumber: 27, startSurah: 51, startAyah: 31, endSurah: 57, endAyah: 29 },
  { juzNumber: 28, startSurah: 58, startAyah: 1, endSurah: 66, endAyah: 12 },
  { juzNumber: 29, startSurah: 67, startAyah: 1, endSurah: 77, endAyah: 50 },
  { juzNumber: 30, startSurah: 78, startAyah: 1, endSurah: 114, endAyah: 6 },
];

/**
 * حساب إجمالي الصفحات المحفوظة بدقة:
 * - إذا كانت السورة مكتملة: تُحسب كامل صفحاتها المعتمدة
 * - إذا كانت قيد الحفظ: تُحسب الصفحات بنسبة الآيات المحفوظة لآيات السورة × صفحاتها
 */
export function calculateTotalPagesMemorized(progress: MemorizationProgress[]): number {
  const total = progress.reduce((acc, p) => {
    const surah = surahs.find((s) => s.id === p.surahId);
    if (!surah || p.versesMemorized <= 0) return acc;
    if (p.status === "memorized" || p.versesMemorized >= surah.verses) {
      return acc + surah.pages;
    }
    // صفحات مكتملة جزئياً بالسورة
    const completedPagesInSurah = Math.floor((p.versesMemorized / surah.verses) * surah.pages);
    return acc + completedPagesInSurah;
  }, 0);

  return Math.min(604, Math.max(0, total));
}

/**
 * حساب الأجزاء المكتملة حفظاً بنسبة 100% بدقة متناهية
 * يفحص كل جزء هل جميع آياته من بدايته لنهايته تم حفظها
 */
export function calculateCompletedJuzCount(progress: MemorizationProgress[]): number {
  let completedJuz = 0;

  for (const juz of JUZ_BOUNDARIES) {
    let isJuzComplete = true;

    for (let sId = juz.startSurah; sId <= juz.endSurah; sId++) {
      const surah = surahs.find((s) => s.id === sId);
      if (!surah) {
        isJuzComplete = false;
        break;
      }

      const p = progress.find((item) => item.surahId === sId);
      const versesMem = p?.versesMemorized || 0;

      // إذا كانت السورة هي سورة البداية والنهاية لنفس الجزء
      if (sId === juz.startSurah && sId === juz.endSurah) {
        if (versesMem < juz.endAyah) {
          isJuzComplete = false;
          break;
        }
      } else if (sId === juz.startSurah) {
        // سورة البداية، يجب أن نكون وصلنا لآخر آية مطلوبة في هذا الجزء
        // إذا كان الجزء يبدأ من آية لاحقة، يفترض التسلسل بالحفظ أن ما بعدها محفوظ
        // وبما أن الحفظ يبدأ من 1، فإذا كان versesMem < عدد آيات السورة لن تكون كاملة
        if (versesMem < surah.verses) {
          isJuzComplete = false;
          break;
        }
      } else if (sId === juz.endSurah) {
        // سورة النهاية، يجب حفظ الآيات حتى endAyah على الأقل
        if (versesMem < juz.endAyah) {
          isJuzComplete = false;
          break;
        }
      } else {
        // سورة تقع بالكامل داخل الجزء
        if (versesMem < surah.verses) {
          isJuzComplete = false;
          break;
        }
      }
    }

    if (isJuzComplete) {
      completedJuz++;
    }
  }

  return completedJuz;
}
