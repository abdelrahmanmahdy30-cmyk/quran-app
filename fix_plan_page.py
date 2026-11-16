with open('app/plan/page.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

# 1. Fix ar-SA date formatting
c = c.replace(
    '{new Date(day.date).toLocaleDateString("ar-SA", { month: "short", day: "numeric" })}',
    '{day.date.slice(5)}'
)

# 2. Add imports
import_target = 'import { SixMonthSchedule } from "@/components/plan/six-month-schedule";'
import_replacement = '''import { SixMonthSchedule } from "@/components/plan/six-month-schedule";
import { TodayWardCard } from "@/components/plan/today-ward-card";
import { WeekStripBar } from "@/components/plan/week-strip-bar";
import { KhatmaJourneyCard } from "@/components/dashboard/khatma-journey-card";
import { JuzGridMap } from "@/components/dashboard/juz-grid-map";'''

if import_target in c and 'TodayWardCard' not in c:
    c = c.replace(import_target, import_replacement, 1)

# 3. Add selectedPlanDate state inside PlanPage
state_target = 'export default function PlanPage() {'
state_replacement = '''export default function PlanPage() {
  const [selectedPlanDate, setSelectedPlanDate] = useState<string>("2026-11-01");'''

if state_target in c and 'selectedPlanDate' not in c:
    c = c.replace(state_target, state_replacement, 1)

# 4. Insert components after the page header
header_target = '''        {/* رأس الصفحة الأصلي */}
        <div className="relative overflow-hidden rounded-3xl border border-gold/20 bg-gradient-to-br from-emerald/30 via-card to-card px-6 py-6 shadow-xl">
          <div className="pointer-events-none absolute -end-8 -top-8 h-40 w-40 rounded-full border border-gold/10" />
          <div className="relative">
            <p className="text-sm font-medium text-gold mb-1">رحلتك المنظمة</p>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground flex items-center gap-3 font-serif">
              <CalendarDays className="h-8 w-8 text-gold" />
              الخطة التفصيلية للحفظ
            </h1>
            <p className="text-muted-foreground mt-2 text-sm">
              من أول يوم حتى ختم القرآن الكريم — مقسمة بالأشهر والأسابيع والأيام
            </p>
          </div>
        </div>'''

header_replacement = '''        {/* رأس الصفحة الأصلي */}
        <div className="relative overflow-hidden rounded-3xl border border-gold/20 bg-gradient-to-br from-emerald/30 via-card to-card px-6 py-6 shadow-xl">
          <div className="pointer-events-none absolute -end-8 -top-8 h-40 w-40 rounded-full border border-gold/10" />
          <div className="relative">
            <p className="text-sm font-medium text-gold mb-1">رحلتك المنظمة</p>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground flex items-center gap-3 font-serif">
              <CalendarDays className="h-8 w-8 text-gold" />
              الخطة التفصيلية للحفظ
            </h1>
            <p className="text-muted-foreground mt-2 text-sm">
              من أول يوم حتى ختم القرآن الكريم — مقسمة بالأشهر والأسابيع والأيام
            </p>
          </div>
        </div>

        {/* 1) ورد اليوم في أعلى صفحة الخطة */}
        <TodayWardCard
          forcedDateStr={selectedPlanDate}
          onDateChange={setSelectedPlanDate}
        />

        {/* 4) شريط الأسبوع (7 أيام) */}
        <WeekStripBar
          selectedDateStr={selectedPlanDate}
          onSelectDate={setSelectedPlanDate}
        />

        {/* 2) بطاقة الطريق إلى الختمة (مقياس موحد وبانر متقدم) */}
        <KhatmaJourneyCard />

        {/* 3) خريطة الأجزاء الثلاثين */}
        <JuzGridMap />'''

if header_target in c:
    c = c.replace(header_target, header_replacement, 1)

with open('app/plan/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

print('Updated app/plan/page.tsx successfully!')
