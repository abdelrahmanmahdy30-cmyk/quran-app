// بيانات القرآن الكريم
export interface Surah {
  id: number;
  name: string;
  englishName: string;
  verses: number;
  pages: number;
  startPage: number; // رقم الصفحة الأولى للسورة (مصحف المدينة 604 صفحة)
  juz: number[];
  type: 'meccan' | 'medinan';
}

export interface ReviewRecord {
  date: string;
  verses: number;
  strength: number;
  type: 'memorization' | 'review';
}

export interface MemorizationProgress {
  surahId: number;
  versesMemorized: number;
  memorizedAt: string | null;
  lastReview: Date | null;
  reviewHistory: ReviewRecord[];
  strength: number; // 0-100
  status: 'not_started' | 'in_progress' | 'memorized' | 'needs_review';
}

export interface DailyGoal {
  date: string;
  targetVerses: number;
  completedVerses: number;
  targetReview: number;
  completedReview: number;
}

export interface UserStats {
  totalVersesMemorized: number;
  totalPages: number;
  currentStreak: number;
  longestStreak: number;
  startDate: string;
  targetEndDate: string;
  dailyAverage: number;
  weeklyProgress: number[];
}

// أرقام الصفحة الأولى لكل سورة (مصحف المدينة النبوية - 604 صفحة)
const SURAH_START_PAGES: number[] = [
  1,   // 1  الفاتحة
  2,   // 2  البقرة
  50,  // 3  آل عمران
  77,  // 4  النساء
  106, // 5  المائدة
  128, // 6  الأنعام
  151, // 7  الأعراف
  177, // 8  الأنفال
  187, // 9  التوبة
  208, // 10 يونس
  221, // 11 هود
  235, // 12 يوسف
  249, // 13 الرعد
  255, // 14 إبراهيم
  262, // 15 الحجر
  267, // 16 النحل
  282, // 17 الإسراء
  293, // 18 الكهف
  305, // 19 مريم
  312, // 20 طه
  322, // 21 الأنبياء
  332, // 22 الحج
  342, // 23 المؤمنون
  350, // 24 النور
  359, // 25 الفرقان
  367, // 26 الشعراء
  377, // 27 النمل
  385, // 28 القصص
  396, // 29 العنكبوت
  404, // 30 الروم
  411, // 31 لقمان
  415, // 32 السجدة
  418, // 33 الأحزاب
  428, // 34 سبأ
  434, // 35 فاطر
  440, // 36 يس
  446, // 37 الصافات
  453, // 38 ص
  458, // 39 الزمر
  467, // 40 غافر
  477, // 41 فصلت
  483, // 42 الشورى
  489, // 43 الزخرف
  496, // 44 الدخان
  499, // 45 الجاثية
  502, // 46 الأحقاف
  507, // 47 محمد
  511, // 48 الفتح
  515, // 49 الحجرات
  518, // 50 ق
  520, // 51 الذاريات
  523, // 52 الطور
  526, // 53 النجم
  528, // 54 القمر
  531, // 55 الرحمن
  534, // 56 الواقعة
  537, // 57 الحديد
  542, // 58 المجادلة
  545, // 59 الحشر
  549, // 60 الممتحنة
  551, // 61 الصف
  553, // 62 الجمعة
  554, // 63 المنافقون
  555, // 64 التغابن
  557, // 65 الطلاق
  558, // 66 التحريم
  560, // 67 الملك
  562, // 68 القلم
  564, // 69 الحاقة
  566, // 70 المعارج
  568, // 71 نوح
  570, // 72 الجن
  572, // 73 المزمل
  574, // 74 المدثر
  577, // 75 القيامة
  578, // 76 الإنسان
  580, // 77 المرسلات
  582, // 78 النبأ
  583, // 79 النازعات
  585, // 80 عبس
  586, // 81 التكوير
  587, // 82 الانفطار
  587, // 83 المطففين
  589, // 84 الانشقاق
  590, // 85 البروج
  591, // 86 الطارق
  591, // 87 الأعلى
  592, // 88 الغاشية
  593, // 89 الفجر
  594, // 90 البلد
  595, // 91 الشمس
  595, // 92 الليل
  596, // 93 الضحى
  596, // 94 الشرح
  597, // 95 التين
  597, // 96 العلق
  598, // 97 القدر
  598, // 98 البينة
  599, // 99 الزلزلة
  599, // 100 العاديات
  600, // 101 القارعة
  600, // 102 التكاثر
  601, // 103 العصر
  601, // 104 الهمزة
  601, // 105 الفيل
  602, // 106 قريش
  602, // 107 الماعون
  602, // 108 الكوثر
  603, // 109 الكافرون
  603, // 110 النصر
  603, // 111 المسد
  604, // 112 الإخلاص
  604, // 113 الفلق
  604, // 114 الناس
];

// قائمة سور القرآن الكريم
export const surahs: Surah[] = [
  { id: 1, name: "الفاتحة", englishName: "Al-Fatiha", verses: 7, pages: 1, startPage: SURAH_START_PAGES[0], juz: [1], type: "meccan" },
  { id: 2, name: "البقرة", englishName: "Al-Baqara", verses: 286, pages: 48, startPage: SURAH_START_PAGES[1], juz: [1, 2, 3], type: "medinan" },
  { id: 3, name: "آل عمران", englishName: "Aal-Imran", verses: 200, pages: 28, startPage: SURAH_START_PAGES[2], juz: [3, 4], type: "medinan" },
  { id: 4, name: "النساء", englishName: "An-Nisa", verses: 176, pages: 28, startPage: SURAH_START_PAGES[3], juz: [4, 5, 6], type: "medinan" },
  { id: 5, name: "المائدة", englishName: "Al-Ma'ida", verses: 120, pages: 22, startPage: SURAH_START_PAGES[4], juz: [6, 7], type: "medinan" },
  { id: 6, name: "الأنعام", englishName: "Al-An'am", verses: 165, pages: 23, startPage: SURAH_START_PAGES[5], juz: [7, 8], type: "meccan" },
  { id: 7, name: "الأعراف", englishName: "Al-A'raf", verses: 206, pages: 28, startPage: SURAH_START_PAGES[6], juz: [8, 9], type: "meccan" },
  { id: 8, name: "الأنفال", englishName: "Al-Anfal", verses: 75, pages: 10, startPage: SURAH_START_PAGES[7], juz: [9, 10], type: "medinan" },
  { id: 9, name: "التوبة", englishName: "At-Tawba", verses: 129, pages: 20, startPage: SURAH_START_PAGES[8], juz: [10, 11], type: "medinan" },
  { id: 10, name: "يونس", englishName: "Yunus", verses: 109, pages: 15, startPage: SURAH_START_PAGES[9], juz: [11], type: "meccan" },
  { id: 11, name: "هود", englishName: "Hud", verses: 123, pages: 15, startPage: SURAH_START_PAGES[10], juz: [11, 12], type: "meccan" },
  { id: 12, name: "يوسف", englishName: "Yusuf", verses: 111, pages: 13, startPage: SURAH_START_PAGES[11], juz: [12, 13], type: "meccan" },
  { id: 13, name: "الرعد", englishName: "Ar-Ra'd", verses: 43, pages: 6, startPage: SURAH_START_PAGES[12], juz: [13], type: "medinan" },
  { id: 14, name: "إبراهيم", englishName: "Ibrahim", verses: 52, pages: 7, startPage: SURAH_START_PAGES[13], juz: [13], type: "meccan" },
  { id: 15, name: "الحجر", englishName: "Al-Hijr", verses: 99, pages: 6, startPage: SURAH_START_PAGES[14], juz: [14], type: "meccan" },
  { id: 16, name: "النحل", englishName: "An-Nahl", verses: 128, pages: 16, startPage: SURAH_START_PAGES[15], juz: [14], type: "meccan" },
  { id: 17, name: "الإسراء", englishName: "Al-Isra", verses: 111, pages: 13, startPage: SURAH_START_PAGES[16], juz: [15], type: "meccan" },
  { id: 18, name: "الكهف", englishName: "Al-Kahf", verses: 110, pages: 12, startPage: SURAH_START_PAGES[17], juz: [15, 16], type: "meccan" },
  { id: 19, name: "مريم", englishName: "Maryam", verses: 98, pages: 8, startPage: SURAH_START_PAGES[18], juz: [16], type: "meccan" },
  { id: 20, name: "طه", englishName: "Ta-Ha", verses: 135, pages: 10, startPage: SURAH_START_PAGES[19], juz: [16], type: "meccan" },
  { id: 21, name: "الأنبياء", englishName: "Al-Anbiya", verses: 112, pages: 10, startPage: SURAH_START_PAGES[20], juz: [17], type: "meccan" },
  { id: 22, name: "الحج", englishName: "Al-Hajj", verses: 78, pages: 10, startPage: SURAH_START_PAGES[21], juz: [17], type: "medinan" },
  { id: 23, name: "المؤمنون", englishName: "Al-Mu'minun", verses: 118, pages: 9, startPage: SURAH_START_PAGES[22], juz: [18], type: "meccan" },
  { id: 24, name: "النور", englishName: "An-Nur", verses: 64, pages: 10, startPage: SURAH_START_PAGES[23], juz: [18], type: "medinan" },
  { id: 25, name: "الفرقان", englishName: "Al-Furqan", verses: 77, pages: 8, startPage: SURAH_START_PAGES[24], juz: [18, 19], type: "meccan" },
  { id: 26, name: "الشعراء", englishName: "Ash-Shu'ara", verses: 227, pages: 12, startPage: SURAH_START_PAGES[25], juz: [19], type: "meccan" },
  { id: 27, name: "النمل", englishName: "An-Naml", verses: 93, pages: 10, startPage: SURAH_START_PAGES[26], juz: [19, 20], type: "meccan" },
  { id: 28, name: "القصص", englishName: "Al-Qasas", verses: 88, pages: 12, startPage: SURAH_START_PAGES[27], juz: [20], type: "meccan" },
  { id: 29, name: "العنكبوت", englishName: "Al-Ankabut", verses: 69, pages: 9, startPage: SURAH_START_PAGES[28], juz: [20, 21], type: "meccan" },
  { id: 30, name: "الروم", englishName: "Ar-Rum", verses: 60, pages: 7, startPage: SURAH_START_PAGES[29], juz: [21], type: "meccan" },
  { id: 31, name: "لقمان", englishName: "Luqman", verses: 34, pages: 4, startPage: SURAH_START_PAGES[30], juz: [21], type: "meccan" },
  { id: 32, name: "السجدة", englishName: "As-Sajda", verses: 30, pages: 3, startPage: SURAH_START_PAGES[31], juz: [21], type: "meccan" },
  { id: 33, name: "الأحزاب", englishName: "Al-Ahzab", verses: 73, pages: 11, startPage: SURAH_START_PAGES[32], juz: [21, 22], type: "medinan" },
  { id: 34, name: "سبأ", englishName: "Saba", verses: 54, pages: 7, startPage: SURAH_START_PAGES[33], juz: [22], type: "meccan" },
  { id: 35, name: "فاطر", englishName: "Fatir", verses: 45, pages: 6, startPage: SURAH_START_PAGES[34], juz: [22], type: "meccan" },
  { id: 36, name: "يس", englishName: "Ya-Sin", verses: 83, pages: 6, startPage: SURAH_START_PAGES[35], juz: [22, 23], type: "meccan" },
  { id: 37, name: "الصافات", englishName: "As-Saffat", verses: 182, pages: 8, startPage: SURAH_START_PAGES[36], juz: [23], type: "meccan" },
  { id: 38, name: "ص", englishName: "Sad", verses: 88, pages: 6, startPage: SURAH_START_PAGES[37], juz: [23], type: "meccan" },
  { id: 39, name: "الزمر", englishName: "Az-Zumar", verses: 75, pages: 10, startPage: SURAH_START_PAGES[38], juz: [23, 24], type: "meccan" },
  { id: 40, name: "غافر", englishName: "Ghafir", verses: 85, pages: 10, startPage: SURAH_START_PAGES[39], juz: [24], type: "meccan" },
  { id: 41, name: "فصلت", englishName: "Fussilat", verses: 54, pages: 7, startPage: SURAH_START_PAGES[40], juz: [24, 25], type: "meccan" },
  { id: 42, name: "الشورى", englishName: "Ash-Shura", verses: 53, pages: 7, startPage: SURAH_START_PAGES[41], juz: [25], type: "meccan" },
  { id: 43, name: "الزخرف", englishName: "Az-Zukhruf", verses: 89, pages: 8, startPage: SURAH_START_PAGES[42], juz: [25], type: "meccan" },
  { id: 44, name: "الدخان", englishName: "Ad-Dukhan", verses: 59, pages: 4, startPage: SURAH_START_PAGES[43], juz: [25], type: "meccan" },
  { id: 45, name: "الجاثية", englishName: "Al-Jathiya", verses: 37, pages: 4, startPage: SURAH_START_PAGES[44], juz: [25], type: "meccan" },
  { id: 46, name: "الأحقاف", englishName: "Al-Ahqaf", verses: 35, pages: 5, startPage: SURAH_START_PAGES[45], juz: [26], type: "meccan" },
  { id: 47, name: "محمد", englishName: "Muhammad", verses: 38, pages: 5, startPage: SURAH_START_PAGES[46], juz: [26], type: "medinan" },
  { id: 48, name: "الفتح", englishName: "Al-Fath", verses: 29, pages: 5, startPage: SURAH_START_PAGES[47], juz: [26], type: "medinan" },
  { id: 49, name: "الحجرات", englishName: "Al-Hujurat", verses: 18, pages: 3, startPage: SURAH_START_PAGES[48], juz: [26], type: "medinan" },
  { id: 50, name: "ق", englishName: "Qaf", verses: 45, pages: 3, startPage: SURAH_START_PAGES[49], juz: [26], type: "meccan" },
  { id: 51, name: "الذاريات", englishName: "Adh-Dhariyat", verses: 60, pages: 3, startPage: SURAH_START_PAGES[50], juz: [26, 27], type: "meccan" },
  { id: 52, name: "الطور", englishName: "At-Tur", verses: 49, pages: 3, startPage: SURAH_START_PAGES[51], juz: [27], type: "meccan" },
  { id: 53, name: "النجم", englishName: "An-Najm", verses: 62, pages: 3, startPage: SURAH_START_PAGES[52], juz: [27], type: "meccan" },
  { id: 54, name: "القمر", englishName: "Al-Qamar", verses: 55, pages: 3, startPage: SURAH_START_PAGES[53], juz: [27], type: "meccan" },
  { id: 55, name: "الرحمن", englishName: "Ar-Rahman", verses: 78, pages: 4, startPage: SURAH_START_PAGES[54], juz: [27], type: "medinan" },
  { id: 56, name: "الواقعة", englishName: "Al-Waqi'a", verses: 96, pages: 4, startPage: SURAH_START_PAGES[55], juz: [27], type: "meccan" },
  { id: 57, name: "الحديد", englishName: "Al-Hadid", verses: 29, pages: 5, startPage: SURAH_START_PAGES[56], juz: [27], type: "medinan" },
  { id: 58, name: "المجادلة", englishName: "Al-Mujadila", verses: 22, pages: 4, startPage: SURAH_START_PAGES[57], juz: [28], type: "medinan" },
  { id: 59, name: "الحشر", englishName: "Al-Hashr", verses: 24, pages: 4, startPage: SURAH_START_PAGES[58], juz: [28], type: "medinan" },
  { id: 60, name: "الممتحنة", englishName: "Al-Mumtahina", verses: 13, pages: 3, startPage: SURAH_START_PAGES[59], juz: [28], type: "medinan" },
  { id: 61, name: "الصف", englishName: "As-Saff", verses: 14, pages: 2, startPage: SURAH_START_PAGES[60], juz: [28], type: "medinan" },
  { id: 62, name: "الجمعة", englishName: "Al-Jumu'a", verses: 11, pages: 2, startPage: SURAH_START_PAGES[61], juz: [28], type: "medinan" },
  { id: 63, name: "المنافقون", englishName: "Al-Munafiqun", verses: 11, pages: 2, startPage: SURAH_START_PAGES[62], juz: [28], type: "medinan" },
  { id: 64, name: "التغابن", englishName: "At-Taghabun", verses: 18, pages: 2, startPage: SURAH_START_PAGES[63], juz: [28], type: "medinan" },
  { id: 65, name: "الطلاق", englishName: "At-Talaq", verses: 12, pages: 2, startPage: SURAH_START_PAGES[64], juz: [28], type: "medinan" },
  { id: 66, name: "التحريم", englishName: "At-Tahrim", verses: 12, pages: 2, startPage: SURAH_START_PAGES[65], juz: [28], type: "medinan" },
  { id: 67, name: "الملك", englishName: "Al-Mulk", verses: 30, pages: 2, startPage: SURAH_START_PAGES[66], juz: [29], type: "meccan" },
  { id: 68, name: "القلم", englishName: "Al-Qalam", verses: 52, pages: 3, startPage: SURAH_START_PAGES[67], juz: [29], type: "meccan" },
  { id: 69, name: "الحاقة", englishName: "Al-Haaqqa", verses: 52, pages: 3, startPage: SURAH_START_PAGES[68], juz: [29], type: "meccan" },
  { id: 70, name: "المعارج", englishName: "Al-Ma'arij", verses: 44, pages: 2, startPage: SURAH_START_PAGES[69], juz: [29], type: "meccan" },
  { id: 71, name: "نوح", englishName: "Nuh", verses: 28, pages: 2, startPage: SURAH_START_PAGES[70], juz: [29], type: "meccan" },
  { id: 72, name: "الجن", englishName: "Al-Jinn", verses: 28, pages: 2, startPage: SURAH_START_PAGES[71], juz: [29], type: "meccan" },
  { id: 73, name: "المزمل", englishName: "Al-Muzzammil", verses: 20, pages: 2, startPage: SURAH_START_PAGES[72], juz: [29], type: "meccan" },
  { id: 74, name: "المدثر", englishName: "Al-Muddaththir", verses: 56, pages: 3, startPage: SURAH_START_PAGES[73], juz: [29], type: "meccan" },
  { id: 75, name: "القيامة", englishName: "Al-Qiyama", verses: 40, pages: 2, startPage: SURAH_START_PAGES[74], juz: [29], type: "meccan" },
  { id: 76, name: "الإنسان", englishName: "Al-Insan", verses: 31, pages: 2, startPage: SURAH_START_PAGES[75], juz: [29], type: "medinan" },
  { id: 77, name: "المرسلات", englishName: "Al-Mursalat", verses: 50, pages: 2, startPage: SURAH_START_PAGES[76], juz: [29], type: "meccan" },
  { id: 78, name: "النبأ", englishName: "An-Naba", verses: 40, pages: 2, startPage: SURAH_START_PAGES[77], juz: [30], type: "meccan" },
  { id: 79, name: "النازعات", englishName: "An-Nazi'at", verses: 46, pages: 2, startPage: SURAH_START_PAGES[78], juz: [30], type: "meccan" },
  { id: 80, name: "عبس", englishName: "Abasa", verses: 42, pages: 1, startPage: SURAH_START_PAGES[79], juz: [30], type: "meccan" },
  { id: 81, name: "التكوير", englishName: "At-Takwir", verses: 29, pages: 1, startPage: SURAH_START_PAGES[80], juz: [30], type: "meccan" },
  { id: 82, name: "الانفطار", englishName: "Al-Infitar", verses: 19, pages: 1, startPage: SURAH_START_PAGES[81], juz: [30], type: "meccan" },
  { id: 83, name: "المطففين", englishName: "Al-Mutaffifin", verses: 36, pages: 2, startPage: SURAH_START_PAGES[82], juz: [30], type: "meccan" },
  { id: 84, name: "الانشقاق", englishName: "Al-Inshiqaq", verses: 25, pages: 1, startPage: SURAH_START_PAGES[83], juz: [30], type: "meccan" },
  { id: 85, name: "البروج", englishName: "Al-Buruj", verses: 22, pages: 1, startPage: SURAH_START_PAGES[84], juz: [30], type: "meccan" },
  { id: 86, name: "الطارق", englishName: "At-Tariq", verses: 17, pages: 1, startPage: SURAH_START_PAGES[85], juz: [30], type: "meccan" },
  { id: 87, name: "الأعلى", englishName: "Al-A'la", verses: 19, pages: 1, startPage: SURAH_START_PAGES[86], juz: [30], type: "meccan" },
  { id: 88, name: "الغاشية", englishName: "Al-Ghashiya", verses: 26, pages: 1, startPage: SURAH_START_PAGES[87], juz: [30], type: "meccan" },
  { id: 89, name: "الفجر", englishName: "Al-Fajr", verses: 30, pages: 2, startPage: SURAH_START_PAGES[88], juz: [30], type: "meccan" },
  { id: 90, name: "البلد", englishName: "Al-Balad", verses: 20, pages: 1, startPage: SURAH_START_PAGES[89], juz: [30], type: "meccan" },
  { id: 91, name: "الشمس", englishName: "Ash-Shams", verses: 15, pages: 1, startPage: SURAH_START_PAGES[90], juz: [30], type: "meccan" },
  { id: 92, name: "الليل", englishName: "Al-Layl", verses: 21, pages: 1, startPage: SURAH_START_PAGES[91], juz: [30], type: "meccan" },
  { id: 93, name: "الضحى", englishName: "Ad-Duha", verses: 11, pages: 1, startPage: SURAH_START_PAGES[92], juz: [30], type: "meccan" },
  { id: 94, name: "الشرح", englishName: "Ash-Sharh", verses: 8, pages: 1, startPage: SURAH_START_PAGES[93], juz: [30], type: "meccan" },
  { id: 95, name: "التين", englishName: "At-Tin", verses: 8, pages: 1, startPage: SURAH_START_PAGES[94], juz: [30], type: "meccan" },
  { id: 96, name: "العلق", englishName: "Al-Alaq", verses: 19, pages: 1, startPage: SURAH_START_PAGES[95], juz: [30], type: "meccan" },
  { id: 97, name: "القدر", englishName: "Al-Qadr", verses: 5, pages: 1, startPage: SURAH_START_PAGES[96], juz: [30], type: "meccan" },
  { id: 98, name: "البينة", englishName: "Al-Bayyina", verses: 8, pages: 1, startPage: SURAH_START_PAGES[97], juz: [30], type: "medinan" },
  { id: 99, name: "الزلزلة", englishName: "Az-Zalzala", verses: 8, pages: 1, startPage: SURAH_START_PAGES[98], juz: [30], type: "medinan" },
  { id: 100, name: "العاديات", englishName: "Al-Adiyat", verses: 11, pages: 1, startPage: SURAH_START_PAGES[99], juz: [30], type: "meccan" },
  { id: 101, name: "القارعة", englishName: "Al-Qari'a", verses: 11, pages: 1, startPage: SURAH_START_PAGES[100], juz: [30], type: "meccan" },
  { id: 102, name: "التكاثر", englishName: "At-Takathur", verses: 8, pages: 1, startPage: SURAH_START_PAGES[101], juz: [30], type: "meccan" },
  { id: 103, name: "العصر", englishName: "Al-Asr", verses: 3, pages: 1, startPage: SURAH_START_PAGES[102], juz: [30], type: "meccan" },
  { id: 104, name: "الهمزة", englishName: "Al-Humaza", verses: 9, pages: 1, startPage: SURAH_START_PAGES[103], juz: [30], type: "meccan" },
  { id: 105, name: "الفيل", englishName: "Al-Fil", verses: 5, pages: 1, startPage: SURAH_START_PAGES[104], juz: [30], type: "meccan" },
  { id: 106, name: "قريش", englishName: "Quraysh", verses: 4, pages: 1, startPage: SURAH_START_PAGES[105], juz: [30], type: "meccan" },
  { id: 107, name: "الماعون", englishName: "Al-Ma'un", verses: 7, pages: 1, startPage: SURAH_START_PAGES[106], juz: [30], type: "meccan" },
  { id: 108, name: "الكوثر", englishName: "Al-Kawthar", verses: 3, pages: 1, startPage: SURAH_START_PAGES[107], juz: [30], type: "meccan" },
  { id: 109, name: "الكافرون", englishName: "Al-Kafirun", verses: 6, pages: 1, startPage: SURAH_START_PAGES[108], juz: [30], type: "meccan" },
  { id: 110, name: "النصر", englishName: "An-Nasr", verses: 3, pages: 1, startPage: SURAH_START_PAGES[109], juz: [30], type: "medinan" },
  { id: 111, name: "المسد", englishName: "Al-Masad", verses: 5, pages: 1, startPage: SURAH_START_PAGES[110], juz: [30], type: "meccan" },
  { id: 112, name: "الإخلاص", englishName: "Al-Ikhlas", verses: 4, pages: 1, startPage: SURAH_START_PAGES[111], juz: [30], type: "meccan" },
  { id: 113, name: "الفلق", englishName: "Al-Falaq", verses: 5, pages: 1, startPage: SURAH_START_PAGES[112], juz: [30], type: "meccan" },
  { id: 114, name: "الناس", englishName: "An-Nas", verses: 6, pages: 1, startPage: SURAH_START_PAGES[113], juz: [30], type: "meccan" },
];

// إجمالي عدد الآيات والصفحات
export const TOTAL_VERSES = 6236;
export const TOTAL_PAGES = 604;
export const TOTAL_JUZ = 30;

// حساب الخطة اليومية للحفظ
export function calculateDailyTarget(totalDays: number = 120): { verses: number; pages: number } {
  const versesPerDay = Math.ceil(TOTAL_VERSES / totalDays);
  const pagesPerDay = Math.ceil(TOTAL_PAGES / totalDays);
  return { verses: versesPerDay, pages: pagesPerDay };
}

// حساب نسبة التقدم
export function calculateProgress(memorized: number, total: number): number {
  return Math.round((memorized / total) * 100);
}

// تنسيق التاريخ الميلادي بصيغة عربية واضحة
export function formatArabicDate(date: Date): string {
  return new Intl.DateTimeFormat('ar-EG-u-nu-latn', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Africa/Cairo',
  }).format(date);
}

// حساب الأيام المتبقية
export function calculateRemainingDays(targetDate: string): number {
  const target = new Date(targetDate);
  const today = new Date();
  const diffTime = target.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// تقييم قوة الحفظ
export function getStrengthLevel(strength: number): { label: string; color: string } {
  if (strength >= 90) return { label: 'ممتاز', color: 'text-emerald-bright' };
  if (strength >= 70) return { label: 'جيد جداً', color: 'text-gold' };
  if (strength >= 50) return { label: 'جيد', color: 'text-chart-4' };
  if (strength >= 30) return { label: 'متوسط', color: 'text-orange-400' };
  return { label: 'يحتاج مراجعة', color: 'text-destructive' };
}
