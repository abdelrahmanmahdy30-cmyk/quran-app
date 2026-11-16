"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMemorizationStore } from "@/lib/memorization-store";
import { usePlanProgress } from "@/lib/use-plan-progress";
import { 
  surahs, 
  TOTAL_VERSES, 
  TOTAL_PAGES, 
  TOTAL_JUZ,
  calculateProgress, 
  calculateRemainingDays,
  getStrengthLevel 
} from "@/lib/quran-data";
import { 
  BarChart3, 
  TrendingUp, 
  BookOpen, 
  Calendar,
  Target,
  Award,
  Flame,
  Clock,
  CheckCircle2,
  Star
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  RadialBarChart,
  RadialBar,
  Legend
} from "recharts";
import { cn } from "@/lib/utils";

export default function StatsPage() {
  const { stats, progress, dailyGoals, getWeeklyData, masteryRecords } = useMemorizationStore();
  const {
    percentTotal,
    pagesDone,
    daysRemaining,
    completedDaysCount,
    streak,
    derivedQuran,
    allDays,
  } = usePlanProgress();
  
  const progressPercent = percentTotal;
  const remainingDays = daysRemaining;
  const weeklyData = getWeeklyData();
  const totalVersesMem = derivedQuran.totalVersesMemorized;
  
  // حسابات الإحصائيات المشتقة من السجل الموحد
  const memorizedSurahs = derivedQuran.completedSurahsCount;
  const inProgressSurahs = derivedQuran.inProgressSurahsCount;
  const notStartedSurahs = derivedQuran.notStartedSurahsCount;

  // توزيع مستويات الإتقان
  const masteryDist = {
    mastered: Object.values(masteryRecords).filter(r => r.masteryLevel === 'mastered').length,
    good: Object.values(masteryRecords).filter(r => r.masteryLevel === 'good').length,
    stabilizing: Object.values(masteryRecords).filter(r => r.masteryLevel === 'stabilizing').length,
    new: Object.values(masteryRecords).filter(r => r.masteryLevel === 'new').length,
    needs_reinforcement: Object.values(masteryRecords).filter(r => r.masteryLevel === 'needs_reinforcement').length,
    regressed: Object.values(masteryRecords).filter(r => r.masteryLevel === 'regressed').length,
  };
  
  // متوسط قوة الحفظ
  const memorizedWithStrength = progress.filter(p => p.status !== 'not_started');
  const avgStrength = memorizedWithStrength.length > 0
    ? Math.round(memorizedWithStrength.reduce((sum, p) => sum + p.strength, 0) / memorizedWithStrength.length)
    : 0;

  // بيانات الرسم الدائري
  const pieData = [
    { name: 'محفوظة', value: memorizedSurahs, color: 'var(--emerald-bright)' },
    { name: 'قيد الحفظ', value: inProgressSurahs, color: 'var(--gold)' },
    { name: 'لم يبدأ', value: notStartedSurahs, color: 'var(--muted)' },
  ];

  // بيانات توزيع القوة
  const strengthDistribution = [
    { range: 'ممتاز (90-100)', count: progress.filter(p => p.strength >= 90).length, fill: 'var(--emerald-bright)' },
    { range: 'جيد جداً (70-89)', count: progress.filter(p => p.strength >= 70 && p.strength < 90).length, fill: 'var(--gold)' },
    { range: 'جيد (50-69)', count: progress.filter(p => p.strength >= 50 && p.strength < 70).length, fill: 'var(--chart-4)' },
    { range: 'متوسط (30-49)', count: progress.filter(p => p.strength >= 30 && p.strength < 50).length, fill: 'var(--orange-400)' },
    { range: 'ضعيف (0-29)', count: progress.filter(p => p.strength > 0 && p.strength < 30).length, fill: 'var(--destructive)' },
  ].filter(d => d.count > 0);

  // تقدم الأجزاء المستخرج من الصفحات المحفوظة
  const juzProgress = derivedQuran.juzProgress.map((j) => ({
    juz: `${j.juz}`,
    percent: j.percent,
  }));

  // حساب الأيام الكلية والمتبقية ديناميكياً من الخطة
  const totalPlanDays = allDays.length > 0 ? allDays.length : 181;
  const planMonths = Math.round(totalPlanDays / 30);
  const daysPassed = completedDaysCount;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* العنوان */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-gold" />
            الإحصائيات والتقارير
          </h1>
          <p className="text-muted-foreground mt-1">
            تحليل شامل لتقدمك في حفظ القرآن الكريم
          </p>
        </div>

        {/* بطاقات الملخص */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">نسبة الإنجاز</p>
                  <p className="text-3xl font-bold text-gold">{progressPercent}%</p>
                </div>
                <div className="p-3 rounded-xl bg-gold/10">
                  <Target className="h-6 w-6 text-gold" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">السور المكتملة</p>
                  <p className="text-3xl font-bold text-emerald-bright">{memorizedSurahs}</p>
                </div>
                <div className="p-3 rounded-xl bg-emerald/10">
                  <Award className="h-6 w-6 text-emerald-bright" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">سلسلة الأيام</p>
                  <p className="text-3xl font-bold text-orange-400">{streak}</p>
                </div>
                <div className="p-3 rounded-xl bg-orange-500/10">
                  <Flame className="h-6 w-6 text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">متوسط القوة</p>
                  <p className="text-3xl font-bold text-chart-4">{avgStrength}%</p>
                </div>
                <div className="p-3 rounded-xl bg-chart-4/10">
                  <Star className="h-6 w-6 text-chart-4" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* الصف الأول من الرسوم البيانية */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* أداء الأسبوع */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-gold" />
                أداء الأسبوع
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorMemorized" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--gold)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="var(--gold)" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorReviewed" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--emerald)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="var(--emerald)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="day" 
                      tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                      axisLine={{ stroke: 'var(--border)' }}
                    />
                    <YAxis 
                      tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                      axisLine={{ stroke: 'var(--border)' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--card)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        direction: 'rtl',
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="memorized" 
                      stroke="var(--gold)" 
                      fillOpacity={1} 
                      fill="url(#colorMemorized)" 
                      name="الحفظ"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="reviewed" 
                      stroke="var(--emerald)" 
                      fillOpacity={1} 
                      fill="url(#colorReviewed)" 
                      name="المراجعة"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* توزيع السور */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-emerald-bright" />
                توزيع السور
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-8">
                <div className="h-[200px] w-[200px]" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'var(--card)',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-3">
                  {pieData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm text-foreground">{item.name}</span>
                      </div>
                      <span className="font-medium text-foreground">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* الصف الثاني */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* تقدم الأجزاء */}
          <Card className="bg-card border-border lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gold" />
                تقدم الأجزاء
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={juzProgress} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis 
                      dataKey="juz" 
                      tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
                      axisLine={{ stroke: 'var(--border)' }}
                    />
                    <YAxis 
                      tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                      axisLine={{ stroke: 'var(--border)' }}
                      domain={[0, 100]}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--card)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        direction: 'rtl',
                      }}
                      formatter={(value) => [`${value}%`, 'التقدم']}
                    />
                    <Bar 
                      dataKey="percent" 
                      fill="var(--gold)"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={20}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* توزيع قوة الحفظ */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Star className="h-5 w-5 text-emerald-bright" />
                توزيع القوة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {strengthDistribution.map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{item.range}</span>
                      <span className="font-medium text-foreground">{item.count}</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full transition-all"
                        style={{ 
                          width: `${(item.count / 114) * 100}%`,
                          backgroundColor: item.fill
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ملخص الخطة */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">ملخص الخطة ({planMonths > 0 ? `${planMonths} أشهر` : `${totalPlanDays} يوم`})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center p-4 rounded-xl bg-secondary/50">
                <Clock className="h-8 w-8 text-gold mx-auto mb-2" />
                <p className="text-2xl font-bold text-foreground">{daysPassed}</p>
                <p className="text-sm text-muted-foreground">يوم مضى</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-secondary/50">
                <Calendar className="h-8 w-8 text-emerald-bright mx-auto mb-2" />
                <p className="text-2xl font-bold text-foreground">{Math.max(0, remainingDays)}</p>
                <p className="text-sm text-muted-foreground">يوم متبقي</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-secondary/50">
                <BookOpen className="h-8 w-8 text-chart-4 mx-auto mb-2" />
                <p className="text-2xl font-bold text-foreground">
                  {totalVersesMem.toLocaleString('en-US')}
                </p>
                <p className="text-sm text-muted-foreground">آية محفوظة</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-secondary/50">
                <Target className="h-8 w-8 text-orange-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-foreground">
                  {(TOTAL_VERSES - totalVersesMem).toLocaleString('en-US')}
                </p>
                <p className="text-sm text-muted-foreground">آية متبقية</p>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* مستويات الإتقان */}
        {Object.values(masteryRecords).length > 0 && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Award className="h-5 w-5 text-gold" />
                مستويات الإتقان
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { key: 'mastered', label: 'متقن', color: 'text-emerald-bright', bg: 'bg-emerald/15', count: masteryDist.mastered },
                  { key: 'good', label: 'جيد', color: 'text-gold', bg: 'bg-gold/15', count: masteryDist.good },
                  { key: 'stabilizing', label: 'يتثبت', color: 'text-blue-400', bg: 'bg-blue-500/15', count: masteryDist.stabilizing },
                  { key: 'new', label: 'جديد', color: 'text-purple-400', bg: 'bg-purple-500/15', count: masteryDist.new },
                  { key: 'needs_reinforcement', label: 'يحتاج تعزيز', color: 'text-orange-400', bg: 'bg-orange-500/15', count: masteryDist.needs_reinforcement },
                  { key: 'regressed', label: 'تراجع', color: 'text-red-400', bg: 'bg-red-500/15', count: masteryDist.regressed },
                ].map((item) => (
                  <div key={item.key} className={cn('rounded-xl p-3 text-center', item.bg)}>
                    <p className={cn('text-2xl font-bold', item.color)}>{item.count}</p>
                    <p className="text-xs text-muted-foreground mt-1">{item.label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
