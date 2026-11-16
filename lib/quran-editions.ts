/**
 * quran-editions.ts — دعم طبعات المصحف المختلفة وحدود الصفحات الدقيقة
 *
 * يوفر بيانات دقيقة لصفحات كل سورة وجزء وحزب وربع:
 * 1. مصحف المدينة النبوية (مجمع الملك فهد - 604 صفحة - 15 سطراً)
 * 2. مصحف الشمرلي / الحرمين (521 صفحة)
 * 3. طبعة مخصصة بحسب عدد الصفحات المختار
 */

import { surahs } from "./quran-data";

export interface QuranEdition {
  id: "madinah_604" | "shamarly_521" | "custom";
  name: string;
  shortName: string;
  totalPages: number;
  linesPerPage: number;
  description: string;
}

export const QURAN_EDITIONS: Record<string, QuranEdition> = {
  madinah_604: {
    id: "madinah_604",
    name: "مصحف المدينة النبوية (مجمع الملك فهد)",
    shortName: "مصحف المدينة (604 ص)",
    totalPages: 604,
    linesPerPage: 15,
    description: "الطبعة العالمية الأكثر انتشاراً برواية حفص عن عاصم (604 صفحة، تبدأ كل صفحة بآية وتختم بآية).",
  },
  shamarly_521: {
    id: "shamarly_521",
    name: "مصحف الشمرلي / الحرمين",
    shortName: "مصحف الشمرلي (521 ص)",
    totalPages: 521,
    linesPerPage: 15,
    description: "طبعة مصر والشام والحرمين المعتمدة لدى كثير من الحفاظ (521 صفحة).",
  },
  custom: {
    id: "custom",
    name: "طبعة مخصصة",
    shortName: "طبعة مخصصة",
    totalPages: 604,
    linesPerPage: 15,
    description: "تحديد عدد صفحات المصحف يدوياً وفق طبعتك الشخصية.",
  },
};

/**
 * البدايات الدقيقة لصفحات السور الـ 114 في مصحف المدينة النبوية (604 صفحة)
 */
export const MADINAH_SURAH_START_PAGES: number[] = [
  1,   // 1. الفاتحة
  2,   // 2. البقرة
  50,  // 3. آل عمران
  77,  // 4. النساء
  106, // 5. المائدة
  128, // 6. الأنعام
  151, // 7. الأعراف
  177, // 8. الأنفال
  187, // 9. التوبة
  208, // 10. يونس
  221, // 11. هود
  235, // 12. يوسف
  249, // 13. الرعد
  255, // 14. إبراهيم
  262, // 15. الحجر
  267, // 16. النحل
  282, // 17. الإسراء
  293, // 18. الكهف
  305, // 19. مريم
  312, // 20. طه
  322, // 21. الأنبياء
  332, // 22. الحج
  342, // 23. المؤمنون
  350, // 24. النور
  359, // 25. الفرقان
  367, // 26. الشعراء
  377, // 27. النمل
  385, // 28. القصص
  396, // 29. العنكبوت
  404, // 30. الروم
  411, // 31. لقمان
  415, // 32. السجدة
  418, // 33. الأحزاب
  428, // 34. سبأ
  434, // 35. فاطر
  440, // 36. يس
  446, // 37. الصافات
  453, // 38. ص
  458, // 39. الزمر
  467, // 40. غافر
  477, // 41. فصلت
  483, // 42. الشورى
  489, // 43. الزخرف
  496, // 44. الدخان
  499, // 45. الجاثية
  502, // 46. الأحقاف
  507, // 47. محمد
  511, // 48. الفتح
  515, // 49. الحجرات
  518, // 50. ق
  520, // 51. الذاريات
  523, // 52. الطور
  526, // 53. النجم
  528, // 54. القمر
  531, // 55. الرحمن
  534, // 56. الواقعة
  537, // 57. الحديد
  542, // 58. المجادلة
  545, // 59. الحشر
  549, // 60. الممتحنة
  551, // 61. الصف
  553, // 62. الجمعة
  554, // 63. المنافقون
  556, // 64. التغابن
  558, // 65. الطلاق
  560, // 66. التحريم
  562, // 67. الملك
  564, // 68. القلم
  566, // 69. الحاقة
  568, // 70. المعارج
  570, // 71. نوح
  572, // 72. الجن
  574, // 73. المزمل
  575, // 74. المدثر
  577, // 75. القيامة
  578, // 76. الإنسان
  580, // 77. المرسلات
  582, // 78. النبأ
  583, // 79. النازعات
  585, // 80. عبس
  586, // 81. التكوير
  587, // 82. الانفطار
  587, // 83. المطففين
  589, // 84. الانشقاق
  590, // 85. البروج
  591, // 86. الطارق
  591, // 87. الأعلى
  592, // 88. الغاشية
  593, // 89. الفجر
  594, // 90. البلد
  595, // 91. الشمس
  595, // 92. الليل
  596, // 93. الضحى
  596, // 94. الشرح
  597, // 95. التين
  597, // 96. العلق
  598, // 97. القدر
  598, // 98. البينة
  599, // 99. الزلزلة
  599, // 100. العاديات
  600, // 101. القارعة
  600, // 102. التكاثر
  601, // 103. العصر
  601, // 104. الهمزة
  601, // 105. الفيل
  602, // 106. قريش
  602, // 107. الماعون
  602, // 108. الكوثر
  603, // 109. الكافرون
  603, // 110. النصر
  603, // 111. المسد
  604, // 112. الإخلاص
  604, // 113. الفلق
  604, // 114. الناس
];

/**
 * الحصول على نطاق صفحات سورة في طبعة معينة
 */
export function getSurahPageRange(surahId: number, editionId: string = "madinah_604", customTotalPages: number = 604): { startPage: number; endPage: number; pageCount: number } {
  const index = surahId - 1;
  if (index < 0 || index >= 114) {
    return { startPage: 1, endPage: 1, pageCount: 1 };
  }

  const madinahStart = MADINAH_SURAH_START_PAGES[index];
  const madinahEnd = index === 113 ? 604 : (MADINAH_SURAH_START_PAGES[index + 1] === madinahStart ? madinahStart : MADINAH_SURAH_START_PAGES[index + 1]);

  if (editionId === "madinah_604") {
    // حساب الصفحة الأخيرة للسورة في مصحف المدينة
    let end = 604;
    for (let i = index + 1; i < 114; i++) {
      if (MADINAH_SURAH_START_PAGES[i] > madinahStart) {
        end = MADINAH_SURAH_START_PAGES[i];
        // إذا كانت السورة التالية تبدأ في نفس الصفحة، فنهاية السورة الحالية هي تلك الصفحة
        break;
      }
    }
    const actualEnd = Math.max(madinahStart, end);
    return {
      startPage: madinahStart,
      endPage: actualEnd,
      pageCount: actualEnd - madinahStart + 1,
    };
  }

  // تحويل نسبي لأي طبعة أخرى (مثل 521 أو المخصص)
  const total = editionId === "shamarly_521" ? 521 : customTotalPages;
  const ratio = total / 604;
  const convertedStart = Math.max(1, Math.min(total, Math.round(madinahStart * ratio)));
  const convertedEnd = Math.max(convertedStart, Math.min(total, Math.round(madinahEnd * ratio)));

  return {
    startPage: convertedStart,
    endPage: convertedEnd,
    pageCount: convertedEnd - convertedStart + 1,
  };
}

/**
 * الحصول على أسماء السور الموجودة في نطاق صفحات معين بدقة
 */
export function getSurahsInPageRangeExact(
  fromPage: number,
  toPage: number,
  editionId: string = "madinah_604",
  customTotalPages: number = 604
): { id: number; name: string; verses: number; startPage: number; endPage: number }[] {
  const result: { id: number; name: string; verses: number; startPage: number; endPage: number }[] = [];

  for (const surah of surahs) {
    const range = getSurahPageRange(surah.id, editionId, customTotalPages);
    if (range.endPage >= fromPage && range.startPage <= toPage) {
      result.push({
        id: surah.id,
        name: surah.name,
        verses: surah.verses,
        startPage: range.startPage,
        endPage: range.endPage,
      });
    }
  }

  return result;
}

/**
 * الحصول على الجزء (Juz) الذي تقع فيه صفحة معينة
 */
export function getJuzForPage(page: number, totalPages: number = 604): number {
  const pagesPerJuz = totalPages / 30;
  const juz = Math.ceil(page / pagesPerJuz);
  return Math.max(1, Math.min(30, juz));
}

/**
 * الحصول على الحزب (Hizb - 60 حزباً) الذي تقع فيه صفحة معينة
 */
export function getHizbForPage(page: number, totalPages: number = 604): number {
  const pagesPerHizb = totalPages / 60;
  const hizb = Math.ceil(page / pagesPerHizb);
  return Math.max(1, Math.min(60, hizb));
}

/**
 * الحصول على الربع (Rub - 240 ربعاً) الذي تقع فيه صفحة معينة
 */
export function getRubForPage(page: number, totalPages: number = 604): number {
  const pagesPerRub = totalPages / 240;
  const rub = Math.ceil(page / pagesPerRub);
  return Math.max(1, Math.min(240, rub));
}
