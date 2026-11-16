"use client";

import { useState, useMemo, useEffect } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { SixMonthSchedule } from "@/components/plan/six-month-schedule";
import { TodayWardCard } from "@/components/plan/today-ward-card";
import { WeekStripBar } from "@/components/plan/week-strip-bar";
import { KhatmaJourneyCard } from "@/components/dashboard/khatma-journey-card";
import { JuzGridMap } from "@/components/dashboard/juz-grid-map";
import { useMemorizationStore } from "@/lib/memorization-store";
import { surahs, TOTAL_PAGES, TOTAL_VERSES } from "@/lib/quran-data";
import { QURAN_EDITIONS } from "@/lib/quran-editions";
import {
  type DayPlan,
  type PlanConfig,
  type MasteryLevel,
  type ReviewGrade,
  MASTERY_LEVELS_META,
  REVIEW_GRADES_META,
  NEAR_REVIEW_INTERVALS,
  buildSmartPlan,
  generatePostCompletionCycle,
} from "@/lib/smart-plan-engine";
import { cn } from "@/lib/utils";
import { PLAN_STORAGE_KEYS, calculatePlanSelectors, formatLocalDate } from "@/lib/unified-progress";
import { generatePlan } from "@/lib/plan-generator";
import { usePlanProgress } from "@/lib/use-plan-progress";
import { StudyDay } from "@/lib/six-month-plan-types";
import { StartPlanDialog } from "@/components/plan/start-plan-dialog";
import {
  CalendarDays,
  Compass,
  BookOpen,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  Target,
  Layers,
  Settings2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Award,
  ShieldAlert,
  TrendingUp,
  BarChart2,
  Check,
  Calendar,
  RefreshCw,
  HelpCircle,
  XCircle,
  Flame,
  Trophy,
  Star,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ============================================================
// خيارات مدة الخطة
// ============================================================
interface PlanOption {
  id: string;
  label: string;
  months: number;
  pagesPerDay: number;
  versesPerDay: number;
  color: string;
  intensity: string;
}

const PLAN_OPTIONS: PlanOption[] = [
  { id: "3m", label: "3 أشهر", months: 3, pagesPerDay: 7, versesPerDay: 69, color: "text-red-400", intensity: "مكثف جداً" },
  { id: "4m", label: "4 أشهر", months: 4, pagesPerDay: 5, versesPerDay: 52, color: "text-amber-400", intensity: "مكثف" },
  { id: "6m", label: "6 أشهر", months: 6, pagesPerDay: 4, versesPerDay: 35, color: "text-gold", intensity: "متوسط" },
  { id: "12m", label: "سنة", months: 12, pagesPerDay: 2, versesPerDay: 18, color: "text-emerald-bright", intensity: "مريح" },
  { id: "18m", label: "سنة ونصف", months: 18, pagesPerDay: 1, versesPerDay: 12, color: "text-blue-400", intensity: "هادئ" },
];

// ============================================================
// مكون: بطاقة يوم واحد
// ============================================================
function DayCard({
  day,
  onOpenReview,
  onPostpone,
  isManuallyCompleted,
  onToggleComplete,
}: {
  day: DayPlan;
  onOpenReview: (surahId?: number, surahName?: string) => void;
  onPostpone: (dateStr: string) => void;
  isManuallyCompleted?: boolean;
  onToggleComplete?: (dateStr: string) => void;
}) {
  const hasNearReviews = day.nearReviews && day.nearReviews.length > 0;
  const hasMediumReviews = day.mediumReviews && day.mediumReviews.length > 0;
  const hasDistantReviews = day.distantReviews && day.distantReviews.length > 0;
  const hasCumulative = day.cumulativeReviews && day.cumulativeReviews.length > 0;
  const isDone = day.isPast || isManuallyCompleted;

  return (
    <div
      className={cn(
        "relative flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border px-4 py-3 transition-all duration-300",
        day.isToday
          ? "border-gold/60 bg-gold/10 ring-1 ring-gold/30"
          : isDone
          ? "border-emerald-500/40 bg-emerald-500/8"
          : day.type === "review"
          ? "border-blue-500/20 bg-blue-500/5"
          : day.isRestDay
          ? "border-border/30 bg-card/30 opacity-75"
          : "border-border/50 bg-card/50 hover:border-gold/30"
      )}
    >
      <div className="flex items-center gap-3">
        {/* رقم اليوم والتاريخ */}
        <div className="flex flex-col items-center justify-start pt-0.5 min-w-[54px]">
          <span className={cn(
            "text-xs font-bold",
            day.isToday ? "text-gold" : day.isPast ? "text-emerald-bright" : "text-muted-foreground"
          )}>
            يوم {day.dayNumber}
          </span>
          <span className="text-[10px] text-muted-foreground/60 mt-0.5 whitespace-nowrap">
            {day.date.slice(5)}
          </span>
        </div>

        {/* الفاصل */}
        <div className={cn(
          "w-px self-stretch rounded-full h-8 sm:h-12 hidden sm:block",
          day.isToday ? "bg-gold/40" : day.isPast ? "bg-emerald/30" : day.type === "review" ? "bg-blue-500/30" : "bg-border/40"
        )} />
      </div>

      {/* محتوى اليوم */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
            day.isPast
              ? "bg-emerald/15 text-emerald-bright"
              : day.isRestDay
              ? "bg-muted text-muted-foreground"
              : day.type === "review"
              ? "bg-blue-500/15 text-blue-400"
              : "bg-emerald/15 text-emerald-bright"
          )}>
            {day.isPast ? (
              <><CheckCircle2 className="h-2.5 w-2.5" /> مكتمل</>
            ) : day.isRestDay ? (
              <><Clock className="h-2.5 w-2.5" /> يوم راحة وتثبيت</>
            ) : day.type === "review" ? (
              <><Clock className="h-2.5 w-2.5" /> مراجعة</>
            ) : (
              <><BookOpen className="h-2.5 w-2.5" /> حفظ جديد</>
            )}
          </span>

          {day.isToday && (
            <span className="text-[10px] font-bold text-gold animate-pulse">← اليوم</span>
          )}

          {day.rescheduleReason && (
            <Badge variant="outline" className="text-[9px] border-amber-500/30 text-amber-400 bg-amber-500/10">
              {day.rescheduleReason}
            </Badge>
          )}
        </div>

        {/* تفاصيل الحفظ */}
        {day.memorizeFrom > 0 && (
          <p className="text-sm font-medium text-foreground">
            حفظ جديد: ص {day.memorizeFrom} – {day.memorizeTo}
            <span className="text-xs text-muted-foreground mr-2">
              ({day.memorizeTo - day.memorizeFrom + 1} صفحة)
            </span>
          </p>
        )}

        {/* تفاصيل المراجعة */}
        {day.reviewFrom > 0 && day.reviewFrom !== day.memorizeFrom && (
          <p className="text-sm font-medium text-blue-400">
            مراجعة: ص {day.reviewFrom} – {day.reviewTo}
          </p>
        )}

        {/* تفاصيل أنواع المراجعة الذكية المترابطة */}
        <div className="flex items-center gap-1.5 mt-1 flex-wrap text-[10px]">
          {hasNearReviews && (
            <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/20">
              قريبة ({day.nearReviews.reduce((acc, r) => acc + (r.toPage - r.fromPage + 1), 0)} صفحة)
            </span>
          )}
          {hasMediumReviews && (
            <span className="px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/20">
              متوسطة
            </span>
          )}
          {hasDistantReviews && (
            <span className="px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-400 border border-purple-500/20">
              بعيدة (حماية القديم)
            </span>
          )}
          {hasCumulative && (
            <span className="px-1.5 py-0.5 rounded bg-gold/15 text-gold border border-gold/20">
              تراكمية ({day.cumulativeReviews[0]?.label})
            </span>
          )}
        </div>

        {day.surahs && day.surahs.length > 0 && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {day.surahs.join(" · ")}
            {day.surahs.length >= 3 && " ..."}
          </p>
        )}
      </div>

      {/* إجراءات اليوم التفاعلية */}
      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
        {/* زر التسميع والتقييم */}
        {!day.isRestDay && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onOpenReview(undefined, day.surahs[0])}
            className="h-7 text-xs border-gold/30 hover:bg-gold/10 hover:text-gold"
          >
            <Sparkles className="h-3 w-3 ml-1 text-gold" />
            تقييم التسميع
          </Button>
        )}

        {/* زر التأجيل عند العذر */}
        {!day.isPast && !day.isRestDay && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onPostpone(day.date)}
            className="h-7 text-[11px] text-muted-foreground hover:text-foreground"
            title="تأجيل مهام اليوم وإعادة جدولتها بسلاسة"
          >
            تأجيل
          </Button>
        )}

        {/* صندوق الإكمال الأخضر */}
        {!day.isRestDay && (
          <button
            onClick={() => onToggleComplete?.(day.date)}
            title={isDone ? "تم الإكمال ✓" : "انقر للتأشير كمكتمل"}
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 transition-all duration-300 group",
              isDone
                ? "border-emerald-500 bg-emerald-500 shadow-lg shadow-emerald-500/30"
                : "border-border/60 bg-card hover:border-emerald-500/60 hover:bg-emerald-500/10"
            )}
          >
            {isDone ? (
              <Check className="h-4 w-4 text-white" strokeWidth={3} />
            ) : (
              <Check className="h-4 w-4 text-transparent group-hover:text-emerald-500/40 transition-colors" strokeWidth={3} />
            )}
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================
// مكون: أسبوع قابل للطي
// ============================================================
function WeekBlock({
  weekNumber,
  days,
  monthNumber,
  onOpenReview,
  onPostpone,
  completedDays,
  onToggleComplete,
}: {
  weekNumber: number;
  days: DayPlan[];
  monthNumber: number;
  onOpenReview: (surahId?: number, surahName?: string) => void;
  onPostpone: (dateStr: string) => void;
  completedDays: Set<string>;
  onToggleComplete: (dateStr: string) => void;
}) {
  const hasToday = days.some((d) => d.isToday);
  const [open, setOpen] = useState(hasToday);
  const memorizeCount = days.filter((d) => d.memorizeFrom > 0).length;
  const reviewCount = days.filter((d) => d.type === "review" || d.nearReviews?.length > 0 || d.distantReviews?.length > 0).length;
  const fromPage = days.find((d) => d.memorizeFrom > 0)?.memorizeFrom ?? 0;
  const toPage = [...days].reverse().find((d) => d.memorizeTo > 0)?.memorizeTo ?? 0;

  const pastDays = days.filter((d) => d.isPast || d.isToday).length;
  const progressPct = days.length > 0 ? Math.round((pastDays / days.length) * 100) : 0;
  const isWeekDone = progressPct === 100;

  return (
    <div className={cn(
      "rounded-2xl border overflow-hidden",
      isWeekDone ? "border-emerald/30" : hasToday ? "border-gold/40" : "border-border/50"
    )}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-card hover:bg-muted/20 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold",
            isWeekDone ? "bg-emerald/20 text-emerald-bright" : hasToday ? "bg-gold/20 text-gold" : "bg-muted text-muted-foreground"
          )}>
            {isWeekDone ? <CheckCircle2 className="h-4 w-4" /> : weekNumber}
          </div>
          <div className="text-right">
            <p className="font-semibold text-sm text-foreground">
              الأسبوع {weekNumber}
              {hasToday && !isWeekDone && <span className="mr-2 text-gold text-xs">← هذا الأسبوع</span>}
              {isWeekDone && <span className="mr-2 text-emerald-bright text-xs">✓ مكتمل</span>}
            </p>
            <p className="text-xs text-muted-foreground">
              {fromPage > 0 && toPage > 0 && `ص ${fromPage}–${toPage} · `}
              {memorizeCount} يوم حفظ · {reviewCount} مراجعة
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* شريط تقدم الأسبوع */}
          <div className="hidden sm:flex flex-col items-end gap-1">
            <span className={cn(
              "text-xs font-bold",
              isWeekDone ? "text-emerald-bright" : hasToday ? "text-gold" : "text-muted-foreground"
            )}>{progressPct}%</span>
            <div className="h-1.5 w-20 rounded-full bg-muted overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-700",
                  isWeekDone ? "bg-emerald-bright" : "bg-gradient-to-l from-gold to-emerald"
                )}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
          {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 pt-2 space-y-2 bg-card/20">
          {days.map((day) => (
            <DayCard
              key={day.dayNumber}
              day={day}
              onOpenReview={onOpenReview}
              onPostpone={onPostpone}
              isManuallyCompleted={completedDays.has(day.date)}
              onToggleComplete={onToggleComplete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// مكون: شهر قابل للطي
// ============================================================
function MonthBlock({
  monthNumber,
  weeks,
  onOpenReview,
  onPostpone,
  completedDays,
  onToggleComplete,
}: {
  monthNumber: number;
  weeks: { weekNumber: number; days: DayPlan[] }[];
  onOpenReview: (surahId?: number, surahName?: string) => void;
  onPostpone: (dateStr: string) => void;
  completedDays: Set<string>;
  onToggleComplete: (dateStr: string) => void;
}) {
  const hasToday = weeks.some((w) => w.days.some((d) => d.isToday));
  const [open, setOpen] = useState(hasToday);
  const allDays = weeks.flatMap((w) => w.days);
  const fromPage = allDays.find((d) => d.memorizeFrom > 0)?.memorizeFrom ?? 0;
  const toPage = [...allDays].reverse().find((d) => d.memorizeTo > 0)?.memorizeTo ?? 0;
  const pagesInMonth = toPage > fromPage ? toPage - fromPage + 1 : 0;

  const pastDays = allDays.filter((d) => d.isPast || d.isToday).length;
  const progressPct = allDays.length > 0 ? Math.round((pastDays / allDays.length) * 100) : 0;
  const isMonthDone = progressPct === 100;

  return (
    <div className={cn(
      "rounded-3xl border overflow-hidden",
      isMonthDone ? "border-emerald/40 shadow-lg shadow-emerald/5" : hasToday ? "border-gold/40 shadow-lg shadow-gold/5" : "border-border/50"
    )}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full bg-card hover:bg-muted/20 transition-colors"
      >
        <div className="flex items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-4">
            <div className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold",
              isMonthDone ? "bg-emerald/20 text-emerald-bright" : hasToday ? "bg-gold/20 text-gold" : "bg-muted text-muted-foreground"
            )}>
              {isMonthDone ? <CheckCircle2 className="h-5 w-5" /> : monthNumber}
            </div>
            <div className="text-right">
              <p className="font-bold text-foreground">
                الشهر {monthNumber}
                {hasToday && !isMonthDone && <span className="mr-3 text-gold text-sm">← الشهر الحالي</span>}
                {isMonthDone && <span className="mr-3 text-emerald-bright text-sm">✓ مكتمل</span>}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {fromPage > 0 && toPage > 0 && `صفحة ${fromPage} إلى ${toPage}`}
                {pagesInMonth > 0 && ` (${pagesInMonth} صفحة)`}
                {` · ${weeks.length} أسابيع`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={cn(
              "text-sm font-bold",
              isMonthDone ? "text-emerald-bright" : hasToday ? "text-gold" : "text-muted-foreground"
            )}>{progressPct}%</span>
            {open ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
          </div>
        </div>

        <div className="px-5 pb-3">
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-700",
                isMonthDone
                  ? "bg-emerald-bright"
                  : progressPct > 0
                  ? "bg-gradient-to-l from-gold to-emerald"
                  : "bg-muted-foreground/20"
              )}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5 pt-2 space-y-3 bg-card/10">
          {weeks.map((w) => (
            <WeekBlock
              key={w.weekNumber}
              weekNumber={w.weekNumber}
              days={w.days}
              monthNumber={monthNumber}
              onOpenReview={onOpenReview}
              onPostpone={onPostpone}
              completedDays={completedDays}
              onToggleComplete={onToggleComplete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// الصفحة الرئيسية للخطة
// ============================================================
function formatMonthsCount(count: number): string {
  if (count === 1) return "شهر واحد";
  if (count === 2) return "شهران";
  if (count >= 3 && count <= 10) return `${count} أشهر`;
  return `${count} شهراً`;
}

export default function PlanPage() {
  const { record: unifiedRecord, toggleDay: unifiedToggleDay, aheadOrBehindPages } = usePlanProgress();
  const [selectedPlanDate, setSelectedPlanDate] = useState<string>("2026-11-01");
  const {
    planConfig,
    masteryRecords,
    planProposals,
    stats,
    updatePlanConfig,
    recordMasteryReview,
    activateEmergencyPause,
    deactivateEmergencyPause,
    activateBreakRecovery,
    deactivateBreakRecovery,
    acceptPlanProposal,
    dismissPlanProposal,
    rescheduleMissedDays,
    postponeDayTask,
    activatePostCompletion,
    deactivatePostCompletion,
    checkForPlanProposals,
    getRecoveryPlan,
  } = useMemorizationStore();

  const [selectedPlan, setSelectedPlan] = useState<PlanOption>(
    PLAN_OPTIONS.find((p) => p.months === planConfig.targetDurationMonths) || PLAN_OPTIONS[1]
  );

  // حوارات ومودالات النوافذ
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);
  const [recoveryModalOpen, setRecoveryModalOpen] = useState(false);
  const [proposalModalOpen, setProposalModalOpen] = useState(false);
  const [postCompModalOpen, setPostCompModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reportsModalOpen, setReportsModalOpen] = useState(false);

  // بيانات المراجعة المختارة
  const [reviewSurahId, setReviewSurahId] = useState<number>(114);
  const [reviewSurahName, setReviewSurahName] = useState<string>("الناس");
  const [reviewType, setReviewType] = useState<"near" | "medium" | "distant" | "cumulative">("near");
  const [selectedGrade, setSelectedGrade] = useState<ReviewGrade>("flawless");

  // بيانات التوقف الطارئ
  const [emergencyReason, setEmergencyReason] = useState<NonNullable<PlanConfig["emergencyPause"]>["reason"]>("travel");
  const [emergencyReturnDate, setEmergencyReturnDate] = useState("");
  const [emergencyNotes, setEmergencyNotes] = useState("");

  // بيانات الإعدادات المتقدمة المؤقتة
  const [tempEdition, setTempEdition] = useState(planConfig.editionId);
  const [tempDaysPerWeek, setTempDaysPerWeek] = useState(planConfig.memorizeDaysPerWeek);
  const [tempUserLevel, setTempUserLevel] = useState(planConfig.userLevel);
  const [tempMinutes, setTempMinutes] = useState(planConfig.dailyAvailableMinutes);
  const [tempHasPrior, setTempHasPrior] = useState(planConfig.hasPriorMemorization);

  // أيام تم تأشيرها يدوياً كمكتملة (بالإضافة للأيام الماضية التلقائية)
  const [planViewMode, setPlanViewMode] = useState<"six_month" | "custom">("six_month");

  const completedDays = useMemo(() => {
    return new Set(Object.keys(unifiedRecord.frozenDays));
  }, [unifiedRecord.frozenDays]);

  const handleToggleComplete = (dateStr: string) => {
    unifiedToggleDay(dateStr);
  };

  // فحص المقترحات الذكية عند التحميل
  useEffect(() => {
    checkForPlanProposals();
  }, [checkForPlanProposals]);

  // حساب الخطة الذكية الحية
  const plan = useMemo(
    () => buildSmartPlan(planConfig, masteryRecords),
    [planConfig, masteryRecords]
  );

  // التاريخ المحلي الحقيقي
  const todayLocalDate = useMemo(() => formatLocalDate(), []);

  // أيام خطة الـ 6 أشهر المعتمدة
  const sixMonthDays = useMemo(() => {
    return generatePlan().flatMap((m) => m.days);
  }, []);

  // تحديد أيام الخطة النشطة
  const activePlanDays = useMemo(() => {
    if (planViewMode === "six_month") {
      return sixMonthDays.map((d) => ({
        date: d.date,
        type: d.type,
        newPages: d.type === "study" ? (d as StudyDay).newPages : undefined,
      }));
    }
    return plan.map((d) => ({
      date: d.date,
      type: d.isRestDay ? "friday" : "study",
      newPages:
        d.memorizeTo >= d.memorizeFrom && d.memorizeFrom > 0
          ? Array.from(
              { length: d.memorizeTo - d.memorizeFrom + 1 },
              (_, i) => ({ p: d.memorizeFrom + i })
            )
          : undefined,
    }));
  }, [planViewMode, sixMonthDays, plan]);

  // محددات التقدم الصادرة من السجل الفعلي فقط (Pure Selectors)
  const planSelectors = useMemo(() => {
    return calculatePlanSelectors(activePlanDays, completedDays, todayLocalDate);
  }, [activePlanDays, completedDays, todayLocalDate]);

  // حساب العد التنازلي للختمة من المحددات الموحدة
  const khatmCountdown = useMemo(() => {
    const [y, m, d] = (planSelectors.khatmaDate || todayLocalDate).split("-").map(Number);
    const estimatedDate = new Date(y, (m || 1) - 1, d || 1);

    return {
      totalDays: planSelectors.totalDays,
      completedCount: planSelectors.daysDone,
      progressPct: planSelectors.percentTotal,
      estimatedDate,
      daysLeft: planSelectors.daysRemaining,
      remainingPages: planSelectors.pagesRemaining,
      completedPages: planSelectors.pagesDone,
      motivationalMsg: planSelectors.motivationalMsg,
    };
  }, [planSelectors, todayLocalDate]);

  // تجميع الخطة بالأشهر والأسابيع
  const grouped = useMemo(() => {
    const months: { monthNumber: number; weeks: { weekNumber: number; days: DayPlan[] }[] }[] = [];

    plan.forEach((day) => {
      let month = months.find((m) => m.monthNumber === day.monthNumber);
      if (!month) {
        month = { monthNumber: day.monthNumber, weeks: [] };
        months.push(month);
      }
      let week = month.weeks.find((w) => w.weekNumber === day.weekNumber);
      if (!week) {
        week = { weekNumber: day.weekNumber, days: [] };
        month.weeks.push(week);
      }
      week.days.push(day);
    });

    return months;
  }, [plan]);

  const recoveryPlan = useMemo(() => getRecoveryPlan(), [getRecoveryPlan]);
  const activeProposal = planProposals.find((p) => p.status === "pending");

  const handleSelectOption = (opt: PlanOption) => {
    setSelectedPlan(opt);
    const start = new Date(planConfig.startDate);
    const newEnd = new Date(start);
    newEnd.setMonth(newEnd.getMonth() + opt.months);

    updatePlanConfig({
      targetDurationMonths: opt.months,
      pagesPerDay: opt.pagesPerDay,
      targetEndDate: newEnd.toISOString().split("T")[0],
    });
  };

  const handleOpenReviewModal = (surahId?: number, surahName?: string) => {
    if (surahId) {
      setReviewSurahId(surahId);
      const s = surahs.find((item) => item.id === surahId);
      setReviewSurahName(s?.name || "");
    } else if (surahName) {
      const s = surahs.find((item) => item.name === surahName);
      if (s) {
        setReviewSurahId(s.id);
        setReviewSurahName(s.name);
      }
    }
    setReviewModalOpen(true);
  };

  const handleSubmitReview = (grade: ReviewGrade) => {
    recordMasteryReview(reviewSurahId, grade, reviewType);
    setReviewModalOpen(false);
  };

  const handleSaveAdvancedSettings = () => {
    updatePlanConfig({
      editionId: tempEdition,
      totalPages: tempEdition === "shamarly_521" ? 521 : 604,
      memorizeDaysPerWeek: tempDaysPerWeek,
      restDays: tempDaysPerWeek === 5 ? [4, 5] : tempDaysPerWeek === 6 ? [5] : [],
      userLevel: tempUserLevel,
      dailyAvailableMinutes: tempMinutes,
      hasPriorMemorization: tempHasPrior,
    });
    setConfigModalOpen(false);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* شريط الإشعار للمقترح الذكي (إن وُجد) */}
        {activeProposal && (
          <div className="rounded-2xl border border-gold/40 bg-gold/10 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-gold shrink-0 animate-pulse" />
              <div>
                <p className="text-sm font-bold text-foreground">{activeProposal.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{activeProposal.reason}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                onClick={() => acceptPlanProposal(activeProposal.id)}
                className="bg-gold text-background hover:bg-gold/90 text-xs font-semibold"
              >
                اعتماد التعديل
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => dismissPlanProposal(activeProposal.id)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                تجاهل
              </Button>
            </div>
          </div>
        )}

        {/* تنبيه التوقف الطارئ النشط (إن وُجد) */}
        {planConfig.emergencyPause?.isActive && (
          <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <ShieldAlert className="h-5 w-5 text-amber-400 shrink-0" />
              <div>
                <p className="text-sm font-bold text-foreground">الخطة في وضع التوقف الطارئ</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  السبب: {planConfig.emergencyPause.reason} — لا يتم احتساب غياب ولن ينهار جدولك.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={deactivateEmergencyPause}
              className="bg-emerald text-background hover:bg-emerald-bright text-xs font-semibold"
            >
              استئناف الخطة الآن
            </Button>
          </div>
        )}

        {/* تنبيه وضع التعافي من الانقطاع (إن وُجد) */}
        {planConfig.breakRecovery?.isActive && (
          <div className="rounded-2xl border border-blue-500/40 bg-blue-500/10 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <RotateCcw className="h-5 w-5 text-blue-400 shrink-0 animate-spin" />
              <div>
                <p className="text-sm font-bold text-foreground">وضع العودة بعد الانقطاع نشط (استعادة تدريجية)</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  تم تخفيف الحفظ الجديد بنسبة 50% للتركيز على استقرار المراجعة أولاً.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={deactivateBreakRecovery}
              className="bg-blue-500 text-white hover:bg-blue-600 text-xs font-semibold"
            >
              اكتمال الاستعادة والعودة للنسق الكامل
            </Button>
          </div>
        )}

        {/* رأس الصفحة الأصلي */}
        <div className="relative overflow-hidden rounded-3xl border border-gold/20 bg-gradient-to-br from-emerald/30 via-card to-card px-6 py-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
          <div className="relative shrink-0">
            <StartPlanDialog
              trigger={
                <Button className="bg-gold/15 border border-gold/50 text-gold hover:bg-gold/25 font-bold text-xs h-10 px-4 rounded-xl shadow-sm">
                  <Compass className="h-4 w-4 ml-2 text-gold" />
                  البداية من سورة محددة (خطة مخصصة)
                </Button>
              }
            />
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
        <JuzGridMap />

        {/* بانر "متقدم بـ N صفحة": يظهر فقط لو aheadOrBehindPages > 0 فعلاً، ولا يظهر في البداية */}
        {planSelectors.aheadOrBehindPages > 0 && (
          <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-emerald-400 shrink-0 animate-pulse" />
              <div>
                <p className="text-sm font-bold text-foreground">
                  ما شاء الله! أنت متقدم بـ {planSelectors.aheadOrBehindPages} صفحة عن الخطة المحددة 🚀
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  واصل هذا الأداء المميز لتختم القرآن في وقت قياسي بإذن الله.
                </p>
              </div>
            </div>
            <Badge variant="outline" className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold px-3 py-1">
              متقدم بـ {planSelectors.aheadOrBehindPages} صفحة
            </Badge>
          </div>
        )}

        {/* مبدل نمط العرض: جدول الـ 6 أشهر المعتمد vs المولّد التفاعلي المخصص */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-muted/40 border border-border/50 max-w-fit flex-wrap">
          <button
            type="button"
            onClick={() => setPlanViewMode("six_month")}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200",
              planViewMode === "six_month"
                ? "bg-gradient-to-r from-gold/20 via-emerald-500/20 to-gold/15 text-gold border border-gold/40 shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
            )}
          >
            <Sparkles className="h-4 w-4 text-gold" />
            <span>جدول الـ 6 أشهر المعتمد (نوفمبر 2026 – أبريل 2027)</span>
            <Badge variant="outline" className="text-[10px] bg-gold/15 text-gold border-gold/30 ms-1 font-bold">
              المعتمد
            </Badge>
          </button>
          <button
            type="button"
            onClick={() => setPlanViewMode("custom")}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200",
              planViewMode === "custom"
                ? "bg-card text-foreground border border-border shadow-sm font-bold"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
            )}
          >
            <Settings2 className="h-4 w-4 text-muted-foreground" />
            <span>المولّد التفاعلي المخصص</span>
          </button>
        </div>

        {planViewMode === "six_month" ? (
          <SixMonthSchedule
            completedDays={completedDays}
            onToggleComplete={handleToggleComplete}
          />
        ) : (
          <>




        {/* بطاقة اختيار مدة الخطة الأصلية مع شريط الأدوات المتقدمة */}
        <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="font-bold text-foreground flex items-center gap-2">
              <Target className="h-5 w-5 text-gold" />
              اختر مدة الخطة
            </h2>

            {/* أزرار الإجراءات السريعة المتقدمة */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfigModalOpen(true)}
                className="h-8 text-xs border-gold/30 hover:bg-gold/10 hover:text-gold"
              >
                <Settings2 className="h-3.5 w-3.5 ml-1.5 text-gold" />
                تخصيص الخطة (طبعة/راحة)
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setEmergencyModalOpen(true)}
                className="h-8 text-xs border-amber-500/30 hover:bg-amber-500/10 hover:text-amber-400"
              >
                <ShieldAlert className="h-3.5 w-3.5 ml-1.5 text-amber-400" />
                الظروف الطارئة
              </Button>

              {recoveryPlan && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRecoveryModalOpen(true)}
                  className="h-8 text-xs border-destructive/40 text-destructive hover:bg-destructive/10"
                >
                  <AlertTriangle className="h-3.5 w-3.5 ml-1.5" />
                  خطة التعافي ({recoveryPlan.missedDays} يوم)
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setPostCompModalOpen(true)}
                className="h-8 text-xs border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
              >
                <Award className="h-3.5 w-3.5 ml-1.5" />
                تثبيت القرآن (ما بعد الختم)
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setReportsModalOpen(true)}
                className="h-8 text-xs border-border hover:bg-muted"
              >
                <BarChart2 className="h-3.5 w-3.5 ml-1.5 text-muted-foreground" />
                التقارير
              </Button>
            </div>
          </div>

          {/* خيارات المدة */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {PLAN_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => handleSelectOption(opt)}
                className={cn(
                  "rounded-xl border px-4 py-3 text-center transition-all",
                  selectedPlan.id === opt.id
                    ? "border-gold/60 bg-gold/10 shadow-md shadow-gold/10"
                    : "border-border/50 bg-card/50 hover:border-gold/30"
                )}
              >
                <p className={cn("text-lg font-bold", selectedPlan.id === opt.id ? "text-gold" : "text-foreground")}>
                  {opt.label}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{opt.intensity}</p>
                <p className={cn("text-xs font-semibold mt-1", opt.color)}>
                  {opt.pagesPerDay} صفحة/يوم
                </p>
              </button>
            ))}
          </div>

          {/* ملخص الخطة الأصلي */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-border/40">
            {[
              { label: "إجمالي الأيام", value: `${selectedPlan.months * 30}`, sub: "يوم" },
              { label: "الصفحات يومياً", value: `${planConfig.pagesPerDay}`, sub: "صفحة" },
              { label: "أيام الحفظ أسبوعياً", value: `${planConfig.memorizeDaysPerWeek}`, sub: "أيام" },
              { label: "طبعة المصحف", value: QURAN_EDITIONS[planConfig.editionId]?.totalPages || 604, sub: "صفحة معتمدة" },
            ].map((s, i) => (
              <div key={i} className="text-center rounded-xl bg-muted/30 px-3 py-2">
                <p className="text-xl font-bold text-gold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-xs text-muted-foreground/60">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* الخطة التفصيلية المجمعة بالأشهر الأصلية */}
        <div className="space-y-4">
          <h2 className="font-bold text-foreground flex items-center gap-2">
            <Layers className="h-5 w-5 text-gold" />
            الخطة اليومية التفصيلية
            <span className="text-sm font-normal text-muted-foreground">
              ({formatMonthsCount(grouped.length)} · {plan.length} يوم)
            </span>
          </h2>

          <div className="space-y-4">
            {grouped.map((month) => (
              <MonthBlock
                key={month.monthNumber}
                monthNumber={month.monthNumber}
                weeks={month.weeks}
                onOpenReview={handleOpenReviewModal}
                onPostpone={(dateStr) => postponeDayTask(dateStr)}
                completedDays={completedDays}
                onToggleComplete={handleToggleComplete}
              />
            ))}
          </div>
        </div>
      </>
    )}
  </div>

  {/* نافذة تقييم التسميع الذكي (5 درجات تقييم) */}
      <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-gold" />
              <span>تسجيل وتقييم التسميع</span>
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              اختر السورة ودرجة التمكن الفعلية لإعادة حساب موعد المراجعة ومستوى الإتقان تلقائياً:
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">السورة</Label>
                <Select
                  value={reviewSurahId.toString()}
                  onValueChange={(v) => {
                    const id = Number(v);
                    setReviewSurahId(id);
                    setReviewSurahName(surahs.find((s) => s.id === id)?.name || "");
                  }}
                >
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border max-h-56">
                    {surahs.map((s) => (
                      <SelectItem key={s.id} value={s.id.toString()}>
                        {s.id}. سورة {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">نوع المراجعة</Label>
                <Select value={reviewType} onValueChange={(v) => setReviewType(v as any)}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="near">مراجعة قريبة (تثبيت حديث)</SelectItem>
                    <SelectItem value="medium">مراجعة متوسطة (دورية)</SelectItem>
                    <SelectItem value="distant">مراجعة بعيدة (قديم)</SelectItem>
                    <SelectItem value="cumulative">مراجعة تراكمية (كتلة متصلة)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* بطاقات درجات التقييم الخمس */}
            <div className="space-y-2 pt-1">
              <Label className="text-xs font-semibold text-foreground">درجة الإتقان في جلسة اليوم:</Label>
              <div className="grid grid-cols-1 gap-2">
                {(Object.keys(REVIEW_GRADES_META) as ReviewGrade[]).map((gradeKey) => {
                  const meta = REVIEW_GRADES_META[gradeKey];
                  return (
                    <button
                      key={gradeKey}
                      type="button"
                      onClick={() => handleSubmitReview(gradeKey)}
                      className={cn(
                        "w-full flex items-center justify-between p-3 rounded-xl border text-right transition-all group",
                        "hover:scale-[1.01] hover:border-gold/50 bg-secondary/40"
                      )}
                    >
                      <div>
                        <p className="font-bold text-sm text-foreground">{meta.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{meta.sublabel}</p>
                      </div>
                      <Badge className={cn("text-xs font-medium", meta.badgeClass)}>
                        {meta.scoreBonus > 0 ? `+${meta.scoreBonus}%` : `${meta.scoreBonus}%`}
                      </Badge>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* نافذة تخصيص الخطة المتقدمة */}
      <Dialog open={configModalOpen} onOpenChange={setConfigModalOpen}>
        <DialogContent className="sm:max-w-lg bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-gold" />
              <span>إعدادات الخطة المتقدمة</span>
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              ضبط معايير الخطة لتوافق ظروفك وطبعة مصحفك بدقة تامة:
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* طبعة المصحف */}
            <div className="space-y-1">
              <Label className="text-xs text-foreground">طبعة المصحف المعتمدة</Label>
              <Select value={tempEdition} onValueChange={(v) => setTempEdition(v as any)}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="madinah_604">مصحف المدينة النبوية (604 صفحة - مجمع الملك فهد)</SelectItem>
                  <SelectItem value="shamarly_521">مصحف الشمرلي / الحرمين (521 صفحة)</SelectItem>
                  <SelectItem value="custom">طبعة مخصصة</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* أيام الحفظ أسبوعياً وأيام الراحة */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-foreground">أيام الحفظ أسبوعياً</Label>
                <Select
                  value={tempDaysPerWeek.toString()}
                  onValueChange={(v) => setTempDaysPerWeek(Number(v))}
                >
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="5">5 أيام (يومان راحة)</SelectItem>
                    <SelectItem value="6">6 أيام (الجمعة راحة)</SelectItem>
                    <SelectItem value="7">7 أيام (طوال الأسبوع)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-foreground">مستوى الحفظ الحالي</Label>
                <Select value={tempUserLevel} onValueChange={(v) => setTempUserLevel(v as any)}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="beginner">مبتدئ (تكرار وتثبيت إضافي)</SelectItem>
                    <SelectItem value="intermediate">متوسط (متوازن)</SelectItem>
                    <SelectItem value="advanced">متقدم (سرعة واستيعاب عالي)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* الوقت اليومي المتاح */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-foreground">الوقت اليومي المتاح</Label>
                <span className="text-xs font-bold text-gold">{tempMinutes} دقيقة</span>
              </div>
              <Slider
                value={[tempMinutes]}
                onValueChange={(v) => setTempMinutes(v[0])}
                min={15}
                max={120}
                step={5}
              />
            </div>

            {/* المحفوظ السابق */}
            <div className="p-3 rounded-xl bg-secondary/50 border border-border flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">هل لديك محفوظ سابق؟</p>
                <p className="text-xs text-muted-foreground">إدراج محفوظك القديم في دورات المراجعة وتجاوزه في الحفظ الجديد</p>
              </div>
              <Button
                size="sm"
                variant={tempHasPrior ? "default" : "outline"}
                onClick={() => setTempHasPrior(!tempHasPrior)}
                className={tempHasPrior ? "bg-gold text-background" : "border-border"}
              >
                {tempHasPrior ? "مفعّل" : "لا يوجد"}
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setConfigModalOpen(false)}>إلغاء</Button>
            <Button onClick={handleSaveAdvancedSettings} className="bg-gold text-background hover:bg-gold/90 font-medium">
              حفظ وتطبيق على الخطة
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* نافذة الظروف الطارئة */}
      <Dialog open={emergencyModalOpen} onOpenChange={setEmergencyModalOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-amber-400" />
              <span>إدارة الظروف الطارئة والتوقف المؤقت</span>
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              الحياة مليئة بالظروف الطارئة. سجل ظرفك وسيقوم النظام بحماية خطتك وسلسلتك دون انهيار:
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label className="text-xs text-foreground">نوع العذر أو الظرف</Label>
              <Select value={emergencyReason} onValueChange={(v) => setEmergencyReason(v as any)}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="illness">مرض وعارض صحي</SelectItem>
                  <SelectItem value="travel">سفر وتنقل</SelectItem>
                  <SelectItem value="work_study">انشغال بالدراسة أو الاختبارات أو العمل</SelectItem>
                  <SelectItem value="family">ظروف عائلية والتزامات</SelectItem>
                  <SelectItem value="time_shortage">ضيق وقت مؤقت</SelectItem>
                  <SelectItem value="voluntary">توقف واستراحة اختيارية</SelectItem>
                  <SelectItem value="other">أسباب أخرى</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-foreground">تاريخ العودة المتوقع (اختياري)</Label>
              <Input
                type="date"
                value={emergencyReturnDate}
                onChange={(e) => setEmergencyReturnDate(e.target.value)}
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-foreground">ملاحظات إضافية</Label>
              <Input
                placeholder="اكتب ملاحظة لنفسك..."
                value={emergencyNotes}
                onChange={(e) => setEmergencyNotes(e.target.value)}
                className="bg-secondary border-border"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            {planConfig.emergencyPause?.isActive ? (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  deactivateEmergencyPause();
                  setEmergencyModalOpen(false);
                }}
              >
                إلغاء التوقف واستئناف الخطة
              </Button>
            ) : <span />}

            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setEmergencyModalOpen(false)}>إغلاق</Button>
              <Button
                onClick={() => {
                  activateEmergencyPause(emergencyReason, emergencyReturnDate || undefined, emergencyNotes || undefined);
                  setEmergencyModalOpen(false);
                }}
                className="bg-amber-500 text-black hover:bg-amber-400 font-medium"
              >
                تفعيل التوقف الطارئ
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* نافذة خطة التعافي */}
      <Dialog open={recoveryModalOpen} onOpenChange={setRecoveryModalOpen}>
        <DialogContent className="sm:max-w-lg bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-emerald-bright" />
              <span>خطة التعافي من الانقطاع</span>
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              تحليل دقيق للأيام الفائتة مع خطة استعادة واقعية لا تثقل كاهلك:
            </DialogDescription>
          </DialogHeader>

          {recoveryPlan && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20">
                  <p className="text-xl font-bold text-destructive">{recoveryPlan.missedDays}</p>
                  <p className="text-xs text-muted-foreground">أيام فائتة</p>
                </div>
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <p className="text-xl font-bold text-amber-400">{recoveryPlan.missedMemorizationPages}</p>
                  <p className="text-xs text-muted-foreground">صفحة متأخرة</p>
                </div>
                <div className="p-3 rounded-xl bg-gold/10 border border-gold/20">
                  <p className="text-xl font-bold text-gold">{recoveryPlan.urgentNearReviewsCount}</p>
                  <p className="text-xs text-muted-foreground">مراجعات ملحة</p>
                </div>
              </div>

              {/* مراحل التعافي */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-foreground">مراحل خطة التعافي الذكية:</p>
                {recoveryPlan.phases.map((ph, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-secondary/40 border border-border space-y-1">
                    <p className="font-bold text-sm text-gold">{ph.phaseName}</p>
                    <p className="text-xs text-muted-foreground">{ph.focus}</p>
                  </div>
                ))}
              </div>

              {/* أزرار اعتماد التعافي */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Button
                  onClick={() => {
                    rescheduleMissedDays(recoveryPlan.suggestedExtensionDays, "extend");
                    setRecoveryModalOpen(false);
                  }}
                  className="bg-gold text-background hover:bg-gold/90 text-xs font-semibold"
                >
                  تمديد الختمة {recoveryPlan.suggestedExtensionDays} يوماً (موصى به)
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    activateBreakRecovery(recoveryPlan.missedDays);
                    setRecoveryModalOpen(false);
                  }}
                  className="border-blue-500/40 text-blue-400 hover:bg-blue-500/10 text-xs font-semibold"
                >
                  تفعيل وضع العودة التدريجية (50% حمل)
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* نافذة مرحلة تثبيت القرآن والمحافظة عليه */}
      <Dialog open={postCompModalOpen} onOpenChange={setPostCompModalOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Award className="h-5 w-5 text-purple-400" />
              <span>مرحلة تثبيت القرآن والمحافظة عليه</span>
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              للحفاظ على القرآن كاملاً مدى الحياة عبر دورات مراجعة دورية يحددها المستخدم:
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <p className="text-xs text-muted-foreground">
              اختر دورة المراجعة الشاملة التي تناسب وقتك:
            </p>

            <div className="grid grid-cols-1 gap-2">
              {[
                { days: 7, label: "ختمة أسبوعية (حزب يومياً / ~4.5 أجزاء)", desc: "همة عالية للحفاظ المتفرغين" },
                { days: 10, label: "ختمة كل 10 أيام (3 أجزاء يومياً)", desc: "معدل ممتاز للمثبتين" },
                { days: 15, label: "ختمة كل 15 يوماً (جزآن يومياً)", desc: "معدل متوازن ومريح" },
                { days: 30, label: "ختمة شهرية (جزء يومياً)", desc: "الورد النبوي المعتاد للأمة" },
                { days: 60, label: "ختمة كل شهرين (نصف جزء يومياً)", desc: "هادئ لأصحاب المشاغل" },
              ].map((item) => (
                <button
                  key={item.days}
                  type="button"
                  onClick={() => {
                    activatePostCompletion(item.days);
                    setPostCompModalOpen(false);
                  }}
                  className="w-full p-3 rounded-xl border border-border bg-secondary/40 hover:border-purple-500/50 hover:bg-purple-500/10 text-right transition-all"
                >
                  <p className="font-bold text-sm text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* نافذة التقارير الأسبوعية والشهرية */}
      <Dialog open={reportsModalOpen} onOpenChange={setReportsModalOpen}>
        <DialogContent className="sm:max-w-lg bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-gold" />
              <span>تقارير الالتزام والإتقان الدورية</span>
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              ملخص دقيق لمسيرتك في الحفظ والمراجعة ومستوى الإتقان:
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* بطاقات الإحصائيات الشاملة */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-3 rounded-xl bg-secondary/40 border border-border text-center">
                <p className="text-lg font-bold text-gold">{stats.totalVersesMemorized}</p>
                <p className="text-xs text-muted-foreground">آية محفوظة</p>
              </div>
              <div className="p-3 rounded-xl bg-secondary/40 border border-border text-center">
                <p className="text-lg font-bold text-emerald-bright">{stats.totalPages}</p>
                <p className="text-xs text-muted-foreground">صفحة مكتملة</p>
              </div>
              <div className="p-3 rounded-xl bg-secondary/40 border border-border text-center">
                <p className="text-lg font-bold text-amber-400">{stats.currentStreak}</p>
                <p className="text-xs text-muted-foreground">سلسلة الأيام</p>
              </div>
              <div className="p-3 rounded-xl bg-secondary/40 border border-border text-center">
                <p className="text-lg font-bold text-blue-400">{stats.dailyAverage}</p>
                <p className="text-xs text-muted-foreground">معدل يومي</p>
              </div>
            </div>

            {/* تصنيف مستويات الإتقان الحالي */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-foreground">توزيع مستويات الإتقان للسور:</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(Object.keys(MASTERY_LEVELS_META) as MasteryLevel[]).map((levelKey) => {
                  const meta = MASTERY_LEVELS_META[levelKey];
                  const count = Object.values(masteryRecords).filter((r) => r.masteryLevel === levelKey).length;
                  return (
                    <div key={levelKey} className="p-2.5 rounded-xl border border-border/60 bg-card flex items-center justify-between">
                      <span className={cn("text-xs font-semibold", meta.color)}>{meta.label}</span>
                      <span className="text-xs font-bold text-foreground">{count} سورة</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}