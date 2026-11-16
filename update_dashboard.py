code = """\"use client\";

import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { TodayWardCard } from "@/components/plan/today-ward-card";
import { WeekStripBar } from "@/components/plan/week-strip-bar";
import { KhatmaJourneyCard } from "@/components/dashboard/khatma-journey-card";
import { JuzGridMap } from "@/components/dashboard/juz-grid-map";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { DailyGoal } from "@/components/dashboard/daily-goal";
import { WeeklyChart } from "@/components/dashboard/weekly-chart";
import { SurahList } from "@/components/dashboard/surah-list";
import { SurahDetail } from "@/components/dashboard/surah-detail";
import { ProgressRing } from "@/components/dashboard/progress-ring";
import { WardPanel } from "@/components/dashboard/ward-panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function getLocalDisplayName(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("quran-browser-profile");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      firstName?: string;
      fatherName?: string;
      familyName?: string;
    };
    const name = [parsed.firstName, parsed.fatherName, parsed.familyName]
      .filter(Boolean)
      .join(" ")
      .trim();
    return name || null;
  } catch {
    return null;
  }
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("2026-11-01");

  useEffect(() => {
    setDisplayName(getLocalDisplayName());

    const handleStorage = () => setDisplayName(getLocalDisplayName());
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  return (
    <MainLayout>
      <div className="relative space-y-8 overflow-hidden pb-12">
        <div className="pointer-events-none absolute -top-32 start-1/3 h-72 w-72 rounded-full bg-emerald/10 blur-3xl" />
        <div className="pointer-events-none absolute top-20 end-0 h-64 w-64 rounded-full bg-gold/10 blur-3xl" />

        {/* الترحيب */}
        <section className="relative overflow-hidden rounded-3xl border border-gold/20 bg-gradient-to-br from-emerald/40 via-card to-card px-6 py-7 shadow-2xl shadow-black/10 sm:px-8">
          <div className="absolute -end-10 -top-16 h-48 w-48 rounded-full border border-gold/15" />
          <div className="absolute -end-2 -top-8 h-32 w-32 rounded-full border border-gold/10" />
          <div className="relative max-w-2xl">
            <p className="mb-3 text-sm font-medium text-gold">رحلتك مع القرآن الكريم</p>
            <h1 className="font-serif text-3xl font-bold leading-tight text-foreground sm:text-4xl">
              السلام عليكم، {displayName ?? ""}
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">
              كل آية تحفظها خطوة مباركة. تابع إنجازك، راجع ما حفظت، واستمر بثبات.
            </p>
          </div>
        </section>

        {/* 1) ورد اليوم في أعلى لوحة التحكم */}
        <TodayWardCard
          forcedDateStr={selectedDate}
          onDateChange={setSelectedDate}
        />

        {/* 4) شريط الأسبوع (7 أيام) */}
        <WeekStripBar
          selectedDateStr={selectedDate}
          onSelectDate={setSelectedDate}
        />

        {/* 2) بطاقة الطريق إلى الختمة (مقياس موحد وبانر متقدم) */}
        <KhatmaJourneyCard />

        {/* 3) خريطة الأجزاء الثلاثين */}
        <JuzGridMap />

        {/* بطاقات الإحصائيات بأرقام لاتينية */}
        <StatsCards />

        {/* التبويبات التفصيلية */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="h-12 w-full rounded-2xl border border-border/80 bg-card/80 p-1 shadow-lg shadow-black/5 sm:w-auto">
            <TabsTrigger 
              value="overview" 
              className="rounded-xl px-5 transition-all data-[state=active]:bg-gold data-[state=active]:text-background data-[state=active]:shadow-md"
            >
              نظرة عامة
            </TabsTrigger>
            <TabsTrigger 
              value="ward"
              className="rounded-xl px-5 transition-all data-[state=active]:bg-gold data-[state=active]:text-background data-[state=active]:shadow-md"
            >
              ورد المراجعة
            </TabsTrigger>
            <TabsTrigger 
              value="surahs"
              className="rounded-xl px-5 transition-all data-[state=active]:bg-gold data-[state=active]:text-background data-[state=active]:shadow-md"
            >
              السور
            </TabsTrigger>
          </TabsList>

          {/* نظرة عامة */}
          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* العمود الأيمن */}
              <div className="lg:col-span-2 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <DailyGoal />
                  <ProgressRing />
                </div>
                <WeeklyChart />
              </div>

              {/* العمود الأيسر */}
              <div className="space-y-6">
                <SurahDetail />
              </div>
            </div>
          </TabsContent>

          {/* ورد المراجعة */}
          <TabsContent value="ward" className="mt-6">
            <WardPanel />
          </TabsContent>

          {/* السور */}
          <TabsContent value="surahs" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SurahList />
              <SurahDetail />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
"""

with open('app/page.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
print('Updated app/page.tsx successfully!')
