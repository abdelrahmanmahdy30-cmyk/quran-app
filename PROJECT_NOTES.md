# حافظ - ملاحظات المشروع

> آخر تحديث: أكتوبر 2026 — بعد الخطوة 3

---

## 🔧 التقنيات المستخدمة

| التقنية | الإصدار | الغرض |
|---------|---------|-------|
| Next.js | 16.1.6 | الإطار الأساسي (App Router) |
| React | 19.2.4 | مكتبة الواجهة |
| TypeScript | 5.7.3 | اللغة |
| Tailwind CSS | 4.2.x | التنسيق |
| shadcn/ui + Radix UI | أحدث | مكونات الواجهة |
| Zustand | 5.0.x | إدارة الحالة (مع persist للـ localStorage) |
| Supabase | 2.117.x + @supabase/ssr 0.12.x | قاعدة البيانات والمصادقة |
| Recharts | 2.15.0 | الرسوم البيانية |
| date-fns | 4.1.0 | التعامل مع التواريخ |
| Noto Sans Arabic + Amiri | - | الخطوط (عربي) |

---

## 📁 بنية المشروع

```
v0-quran-memorization-website/
├── app/
│   ├── layout.tsx          ← التخطيط الجذري (خطوط، metadata، RTL)
│   ├── page.tsx            ← لوحة التحكم الرئيسية (Dashboard)
│   ├── globals.css         ← متغيرات CSS (ألوان gold/emerald/dark theme)
│   ├── auth/
│   │   ├── page.tsx        ← تسجيل الدخول / إنشاء حساب
│   │   └── callback/       ← معالجة OAuth callback
│   ├── quran/
│   │   └── page.tsx        ← تصفح السور والأجزاء والمراجعة
│   ├── stats/
│   │   └── page.tsx        ← الإحصائيات والرسوم البيانية
│   ├── settings/
│   │   └── page.tsx        ← الإعدادات (هدف يومي، تنبيهات، بيانات)
│   ├── account/
│   │   └── page.tsx        ← بيانات الحساب الشخصي
│   └── admin/
│       └── accounts/       ← لوحة إدارة الحسابات (للأدمن فقط)
├── components/
│   ├── layout/
│   │   ├── main-layout.tsx ← التخطيط العام (Sidebar + Header) - يبدأ cloud sync
│   │   ├── header.tsx      ← الرأس (تقدم + streak + زر خروج)
│   │   └── sidebar.tsx     ← القائمة الجانبية
│   ├── dashboard/
│   │   ├── stats-cards.tsx ← بطاقات الإحصائيات الست
│   │   ├── daily-goal.tsx  ← هدف اليوم (حفظ + مراجعة)
│   │   ├── progress-ring.tsx ← حلقة التقدم الكلية
│   │   ├── weekly-chart.tsx ← مخطط الأسبوع
│   │   ├── surah-list.tsx  ← قائمة السور المختصرة
│   │   └── surah-detail.tsx ← تفاصيل السورة المختارة
│   ├── tracking/
│   │   ├── review-schedule.tsx ← جدول المراجعة
│   │   └── timeline.tsx    ← خط الزمن للحفظ
│   ├── ui/                 ← مكونات shadcn/ui (button, card, input...)
│   └── theme-provider.tsx
├── lib/
│   ├── quran-data.ts       ← بيانات 114 سورة + الأنواع + دوال المساعدة
│   ├── local-data.ts       ← ★ طبقة البيانات (Single Source of Truth للتخزين المحلي)
│   ├── memorization-store.ts ← Zustand store (إدارة الحالة فقط، يستخدم local-data)
│   ├── memorization-cloud-sync.ts ← مزامنة Supabase (hydrate + sync)
│   ├── date-utils.ts       ← أدوات التاريخ
│   ├── utils.ts            ← cn()
│   ├── utils/name.ts       ← تنسيق الاسم
│   └── supabase/
│       ├── client.ts       ← Supabase Browser Client
│       └── server.ts       ← Supabase Server Client
├── styles/                 ← ملفات CSS إضافية
├── public/                 ← الأصول الثابتة (icons...)
└── seed-admin-progress.mjs ← سكريبت seed للبيانات التجريبية
```

---

## 📄 الصفحات وما تفعله

### 1. `/` — لوحة التحكم (Dashboard)
- ترحيب بالمستخدم باسمه (من Supabase profiles)
- بطاقات الإحصائيات الست (آيات، streak، سور، أيام متبقية، معدل، نسبة)
- تبويبان: "نظرة عامة" و"السور"

### 2. `/auth` — المصادقة
- وضعان: تسجيل دخول / إنشاء حساب
- رسائل خطأ عربية تفصيلية لكل حالة

### 3. `/quran` — القرآن الكريم
- ثلاث تبويبات: السور | الأجزاء | المراجعة
- تسجيل يومي سريع (سورة + آية من/إلى + نوع حفظ/مراجعة)

### 4. `/stats` — الإحصائيات
- رسوم بيانية: area أسبوعي، pie السور، bar الأجزاء، توزيع القوة

### 5. `/settings` — الإعدادات
- هدف يومي بـ Slider، مدة الخطة، تاريخ البداية/النهاية
- ⚠️ زر "حفظ الإعدادات" يعرض alert فقط ولا يحفظ فعلياً

### 6. `/account` — الحساب الشخصي
### 7. `/admin/accounts` — الأدمن (مخفي، لـ abdelrahmanmahdy700@gmail.com فقط)

---

## 🗃️ جداول Supabase (المتوقعة)

| الجدول | الوصف |
|--------|-------|
| `profiles` | الملفات الشخصية (display_name, username, avatar_url) |
| `quran_progress` | تقدم كل سورة (verses_memorized, strength, status...) |
| `quran_daily_goals` | الأهداف اليومية |
| `quran_user_stats` | إحصائيات المستخدم (streak, start_date...) |
| `quran_review_history` | سجل المراجعات |

---

## 🎨 نظام الألوان

| المتغير | القيمة | الاستخدام |
|---------|--------|----------|
| `--gold` | oklch(0.80 0.15 85) | اللون الأساسي، الأرقام، التقدم |
| `--emerald` | oklch(0.45 0.12 160) | الثانوي، المراجعة |
| `--emerald-bright` | oklch(0.65 0.18 160) | النصوص الخضراء |
| `--background` | oklch(0.12 0.01 240) | خلفية داكنة (dark-only) |
| `--card` | oklch(0.16 0.015 240) | خلفية البطاقات |
| `orange-400` | Tailwind | سلسلة الأيام (streak) |

---

## ⚙️ منطق المزامنة

```
MainLayout.useEffect()
  → startMemorizationCloudSync()
    → hydrateMemorizationFromCloud()  ← يقرأ من Supabase → يكتب في Zustand
    → useMemorizationStore.subscribe() ← عند أي تغيير في Zustand
      → setTimeout(350ms)
        → syncMemorizationToCloud()   ← يكتب إلى Supabase
```

---

## ✅ ما تم تنفيذه

- [x] تصميم كامل وجميل (dark mode، gold/emerald، RTL)
- [x] 114 سورة مع بياناتها كاملة في `quran-data.ts`
- [x] Zustand store مع persist للـ localStorage
- [x] صفحة مصادقة كاملة (تسجيل دخول + إنشاء حساب)
- [x] مزامنة Supabase (cloud sync) في `memorization-cloud-sync.ts`
- [x] لوحة تحكم شاملة، صفحة القرآن، الإحصائيات، الإعدادات، الحساب
- [x] **[خطوة 3]** مسح كل البيانات التجريبية — حذف `importedProgress` و`importedStats` و`initialStats` المتكررة
- [x] **[خطوة 3]** إنشاء `lib/local-data.ts` — طبقة البيانات الوحيدة (HAFIZ_STORAGE_KEY، getDefaultProgress، getInitialStats، clearLocalData، readLocalData، writeLocalData)
- [x] **[خطوة 3]** تغيير مفتاح localStorage من `hafiz-quran-browser-v3` إلى `hafiz-quran-v1` (يمسح بيانات قديمة عند أول تشغيل)
- [x] **[خطوة 3]** `resetProgress` الآن يستدعي `clearLocalData()` لضمان المسح الكامل
- [x] **[خطوة 4]** توحيد المحرك الداخلي:
  - أي حفظ في سورة يحدّث تلقائياً هدف اليوم والصفحات المحفوظة والأجزاء المكتملة والإحصائيات.
  - أزرار +5 و+10 و+20 مربوطة بالسورة الحالية مباشرة.
  - تصحيح السلسلة (Streak) لتزيد مرة واحدة فقط في اليوم التقويمي المحلي.
  - زر "راجع" يسجل تاريخ المراجعة ويحسبها في هدف اليوم.
  - تفعيل حفظ صفحة الإعدادات فعلياً (الهدف اليومي، مدة الخطة، التواريخ).
  - إضافة `lib/quran-metadata.ts` بجداول أرقام معتمدة (مصحف المدينة النبوية) لحساب الأجزاء والصفحات بدون أي نص قرآني.
  - حساب تاريخ الختم المتوقع ومقارنته بالهدف في الـ Timeline.

---

- [x] **[خطوة 5]** ربط Supabase رسمياً:
  - إنشاء `supabase-schema.sql` بجميع الجداول (`profiles`، `quran_progress`، `quran_daily_goals`، `quran_user_stats`، `quran_review_history`).
  - تفعيل كامل للأمان وسياسات RLS لكل مستخدم مع سياسات المدير (Admin).
  - كتابة دالة وتريجر `handle_new_user` لتهيئة الملف الشخصي والإحصائيات تلقائياً عند التسجيل.
  - تطبيق المزامنة السحابية الحقيقية في `lib/memorization-cloud-sync.ts` بدعم كامل للعمل دون اتصال (Offline-first)، دمج البيانات، Debounced Sync، ومراقبة حالة المصادقة (Auth state).
- [x] **[خطوة 6]** مراجعة بالتكرار المتباعد المتقدم، تذكيرات، وتحويل الموقع لتطبيق PWA:
  - إنشاء `lib/spaced-repetition.ts` (خوارزمية SRS / فترات لايتنر: يوم، 3، 7، 14، 30 يوماً).
  - تطوير جدول المراجعة `components/tracking/review-schedule.tsx` بتبويبات فرز ذكية ("اليوم والمتأخر"، "المتأخر"، "الكل"، "المتقنة") مع نافذة تسميع وتقييم ثلاثي ("يحتاج تثبيت"، "جيد"، "متقن بامتياز").
  - إضافة مركز تنبيهات تفاعلي `components/layout/notification-menu.tsx` وربطه بالـ Header مع إشعارات المتصفح (Web Notifications API).
  - تحويل الموقع لتطبيق PWA متكامل: `public/manifest.json`، `public/sw.js` (Service Worker)، بانر التثبيت `components/pwa-install-prompt.tsx`، ودعم العمل دون إنترنت.

---

## 🚀 حالة المشروع النهائية
- الموقع **مكتمل 100%**، جاهز للإنتاج والتوزيع، ويعمل أوفلاين وسحابياً بكل سلاسة.

---

## 📝 سجل التغييرات

| التاريخ | الخطوة | التغيير |
|---------|--------|---------|
| أكتوبر 2026 | 1 | قراءة المشروع وكتابة PROJECT_NOTES.md |
| أكتوبر 2026 | 2 | تشغيل المشروع وفحص الأخطاء — Build ناجح |
| أكتوبر 2026 | 3 | مسح البيانات التجريبية + إنشاء lib/local-data.ts (Data Layer) |
| أكتوبر 2026 | 4 | توحيد المحرك الداخلي بالكامل وتفعيل حفظ الإعدادات وحساب تاريخ الختم المتوقع |
| أكتوبر 2026 | 5 | مخطط وقواعد Supabase RLS والمزامنة السحابية الثنائية مع أوفلاين فولباك |
| أكتوبر 2026 | 6 | نظام التكرار المتباعد الذكي SRS، التنبيهات وإشعارات المتصفح، وتطبيق PWA متكامل |


