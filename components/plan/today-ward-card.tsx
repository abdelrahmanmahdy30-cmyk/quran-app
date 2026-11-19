"use client";

import { useState, useMemo } from "react";
import { PlanDay, StudyDay, FridayDay, PageEntry } from "@/lib/six-month-plan-types";
import { getPageJuz } from "@/lib/plan-ui-helpers";
import { usePlanProgress } from "@/lib/use-plan-progress";
import { canMarkDayAsCompleted } from "@/lib/unified-progress";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  Circle,
  Calendar,
  BookOpen,
  ChevronRight,
  ChevronLeft,
  Star,
  Lock,
  Layers,
  Sparkles,
  Award,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface TodayWardCardProps {
  forcedDateStr?: string;
  onDateChange?: (dateStr: string) => void;
  className?: string;
}

export function TodayWardCard({ forcedDateStr, onDateChange, className }: TodayWardCardProps) {
  const {
    allDays,
    todayLocalDate,
    isDayCompleted,
    toggleDay,
    isSubTaskDone,
    toggleSubTask,
    canMarkDay,
  } = usePlanProgress();

  // اليوم المحدد للعرض (الافتراضي هو اليوم الفعلي، أو أول يوم بالخطة)
  const [internalDate, setInternalDate] = useState<string>(() => {
    return forcedDateStr || todayLocalDate || "2026-11-01";
  });

  const currentDateStr = forcedDateStr || internalDate;

  const currentDayIndex = useMemo(() => {
    const idx = allDays.findIndex((d) => d.date === currentDateStr);
    return idx >= 0 ? idx : 0;
  }, [allDays, currentDateStr]);

  const currentDay = allDays[currentDayIndex] || allDays[0];

  const handleSelectDate = (dateStr: string) => {
    setInternalDate(dateStr);
    if (onDateChange) onDateChange(dateStr);
  };

  const hasPrev = currentDayIndex > 0;
  const hasNext = currentDayIndex < allDays.length - 1;

  const handlePrevDay = () => {
    if (hasPrev) handleSelectDate(allDays[currentDayIndex - 1].date);
  };

  const handleNextDay = () => {
    if (hasNext) handleSelectDate(allDays[currentDayIndex + 1].date);
  };

  const handleGoToday = () => {
    handleSelectDate(todayLocalDate);
  };

  const isToday = currentDay.date === todayLocalDate;
  const isCompleted = isDayCompleted(currentDay.date);
  const isFuture = !canMarkDay(currentDay.date);

  // حالة نافذة تقييم التسميع
  const [evalDialogOpen, setEvalDialogOpen] = useState(false);
  const [selectedRating, setSelectedRating] = useState<string>("excellent");
  const [ratingSaved, setRatingSaved] = useState(false);

  const handleSaveEvaluation = () => {
    setRatingSaved(true);
    setTimeout(() => {
      setRatingSaved(false);
      setEvalDialogOpen(false);
    }, 1200);
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-b from-card/95 via-card/90 to-card/80 p-5 shadow-2xl shadow-black/10 backdrop-blur-md sm:p-7",
        isCompleted && "border-emerald-500/30",
        className
      )}
    >
      {/* هالات خلفية جمالية */}
      <div className="pointer-events-none absolute -top-24 end-0 h-64 w-64 rounded-full bg-gold/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 start-0 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl" />

      {/* الشريط العلوي لبيانات اليوم والتنقل */}
      <div className="relative mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-border/50 pb-5">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-2xl text-lg font-bold shadow-inner",
              isCompleted
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "bg-gold/20 text-gold border border-gold/30"
            )}
          >
            {currentDay.type === "study" ? (currentDay as StudyDay).dayNumber : "جمعة"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-foreground sm:text-2xl">
                ورد {isToday ? "اليوم" : currentDay.dayName}
              </h2>
              {isToday && (
                <Badge className="bg-gold text-background font-semibold text-xs px-2.5 py-0.5">
                  اليوم الحقيقي
                </Badge>
              )}
              {isCompleted ? (
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40 text-xs gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  مكتمل
                </Badge>
              ) : isFuture ? (
                <Badge variant="outline" className="text-muted-foreground border-border text-xs gap-1">
                  <Lock className="h-3 w-3" />
                  قادم
                </Badge>
              ) : (
                <Badge variant="outline" className="text-amber-400 border-amber-500/30 text-xs">
                  قيد الإنجاز
                </Badge>
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
              {currentDay.dayName} {currentDay.date}
              {currentDay.type === "study" && ` · يوم حفظ ${(currentDay as StudyDay).dayNumber} من 155`}
            </p>
          </div>
        </div>

        {/* أزرار التنقل بين الأيام */}
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevDay}
            disabled={!hasPrev}
            className="h-9 px-2.5 rounded-xl border-border/60 hover:bg-muted/50"
            title="اليوم السابق"
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">السابق</span>
          </Button>

          {!isToday && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleGoToday}
              className="h-9 px-3 rounded-xl border-gold/40 text-xs font-medium text-gold hover:bg-gold/10"
            >
              اليوم
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleNextDay}
            disabled={!hasNext}
            className="h-9 px-2.5 rounded-xl border-border/60 hover:bg-muted/50"
            title="اليوم التالي"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">التالي</span>
          </Button>
        </div>
      </div>

      {/* تحذير منع الأيام المستقبلية إن وُجد */}
      {isFuture && (
        <div className="mb-5 flex items-center gap-2.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-300 sm:text-sm">
          <Lock className="h-4 w-4 shrink-0 text-amber-400" />
          <span>هذا اليوم قادم في جدول الخطة — يُمنع تعليم أيام مستقبلية قبل موعدها حفاظاً على دقة التقدم.</span>
        </div>
      )}

      {/* ============================================================ */}
      {/* حالة يوم الجمعة: بطاقة راحة ومراجعة */}
      {/* ============================================================ */}
      {currentDay.type === "friday" ? (
        <div className="space-y-5">
          <div className="rounded-2xl border border-purple-500/30 bg-purple-500/10 p-4 text-purple-200">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-400" />
              <h3 className="font-bold text-base text-purple-300">يوم الجمعة: راحة ومراجعة مباركة</h3>
            </div>
            <p className="mt-1 text-xs text-purple-300/80">
              لا يوجد حفظ جديد اليوم. استثمر يومك في مراجعة حصيلة الأسبوع والورد البعيد.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* خطوة 1 الجمعة: مراجعة الأسبوع */}
            <StepCard
              stepNumber={1}
              title="مراجعة ورد الأسبوع"
              badgeColor="bg-purple-500/20 text-purple-300 border-purple-500/30"
              borderColor="border-purple-500/30"
              bgColor="bg-purple-500/5"
              checkboxChecked={isSubTaskDone(currentDay.date, "week")}
              onToggleCheckbox={() => toggleSubTask(currentDay.date, "week")}
              disabled={isFuture}
              pages={(currentDay as FridayDay).weekPages || []}
              emptyMsg="لا توجد صفحات حفظ لهذا الأسبوع"
            />

            {/* خطوة 2 الجمعة: المراجعة البعيدة (أخضر) */}
            <StepCard
              stepNumber={2}
              title={`مراجعة بعيدة (${currentDay.farCount} صفحة)`}
              badgeColor="bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
              borderColor="border-emerald-500/40"
              bgColor="bg-emerald-500/5"
              checkboxChecked={isSubTaskDone(currentDay.date, "far")}
              onToggleCheckbox={() => toggleSubTask(currentDay.date, "far")}
              disabled={isFuture}
              pages={currentDay.farPages || []}
              emptyMsg="لا يوجد ورد بعيد اليوم"
            />
          </div>

          {/* زر إنجاز ورد الجمعة بالكامل */}
          <div className="pt-2">
            <Button
              onClick={() => toggleDay(currentDay.date)}
              disabled={isFuture}
              className={cn(
                "w-full h-12 rounded-2xl font-bold text-sm sm:text-base gap-2 transition-all shadow-lg",
                isCompleted
                  ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/20"
                  : "bg-purple-600 hover:bg-purple-500 text-white shadow-purple-900/20"
              )}
            >
              <CheckCircle2 className="h-5 w-5" />
              {isCompleted ? "تم إنجاز ورد الجمعة كاملاً (انقر للإلغاء)" : "تعليم يوم الجمعة كمكتمل"}
            </Button>
          </div>
        </div>
      ) : (
        /* ============================================================ */
        /* حالة يوم الحفظ العادي (السبت - الخميس): 3 خطوات بألوان ثابتة */
        /* ============================================================ */
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* الخطوة 1: مراجعة بعيدة (أخضر) */}
            <StepCard
              stepNumber={1}
              title={`مراجعة بعيدة (${currentDay.farCount} صفحة)`}
              badgeColor="bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
              borderColor="border-emerald-500/40"
              bgColor="bg-emerald-500/5"
              checkboxChecked={isSubTaskDone(currentDay.date, "far")}
              onToggleCheckbox={() => toggleSubTask(currentDay.date, "far")}
              disabled={isFuture || currentDay.farCount === 0}
              pages={currentDay.farPages || []}
              emptyMsg="لا يوجد ورد بعيد (بداية الخطة المباركة)"
            />

            {/* الخطوة 2: مراجعة قريبة (أزرق) */}
            <StepCard
              stepNumber={2}
              title={`مراجعة قريبة (${(currentDay.nearPages || []).length} صفحات)`}
              badgeColor="bg-sky-500/20 text-sky-400 border-sky-500/30"
              borderColor="border-sky-500/40"
              bgColor="bg-sky-500/5"
              checkboxChecked={isSubTaskDone(currentDay.date, "near")}
              onToggleCheckbox={() => toggleSubTask(currentDay.date, "near")}
              disabled={isFuture || (currentDay.nearPages || []).length === 0}
              pages={currentDay.nearPages || []}
              emptyMsg="لا يوجد ورد قريب في اليوم الأول"
            />

            {/* الخطوة 3: حفظ جديد (ذهبي - الأبرز بإطار ذهبي) */}
            <div
              className={cn(
                "relative flex flex-col justify-between rounded-2xl border-2 border-gold/70 bg-gradient-to-b from-gold/15 to-gold/5 p-4 sm:p-5 shadow-xl shadow-gold/10 transition-all",
                isSubTaskDone(currentDay.date, "memorize") && "border-gold bg-gold/20"
              )}
            >
              {/* شارة الخطوة مع مربع التحقق المستقل */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gold text-background text-xs font-bold">
                      3
                    </span>
                    <span className="font-bold text-gold text-sm sm:text-base">
                      حفظ جديد ({((currentDay as StudyDay).newPages || []).length} صفحات)
                    </span>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-xs text-muted-foreground select-none">تم الحفظ</span>
                    <Checkbox
                      checked={isSubTaskDone(currentDay.date, "memorize")}
                      onCheckedChange={() => toggleSubTask(currentDay.date, "memorize")}
                      disabled={isFuture}
                      className="border-gold data-[state=checked]:bg-gold data-[state=checked]:text-background"
                    />
                  </label>
                </div>

                {/* قائمة صفحات الحفظ الجديد */}
                <div className="space-y-2 mb-4">
                  {((currentDay as StudyDay).newPages || []).map((page) => (
                    <PageItemRow key={page.p} page={page} highlightColor="border-gold/40 text-gold" />
                  ))}
                </div>
              </div>

              {/* الأزرار تحت الحفظ الجديد: زر رئيسي "تم الحفظ" وزر ثانوي "تقييم التسميع" */}
              <div className="space-y-2 pt-2 border-t border-gold/20">
                <Button
                  onClick={() => toggleDay(currentDay.date)}
                  disabled={isFuture}
                  className={cn(
                    "w-full h-11 rounded-xl font-bold text-sm gap-2 transition-all shadow-md",
                    isCompleted
                      ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/20"
                      : "bg-gold hover:bg-gold/90 text-background shadow-gold/20"
                  )}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {isCompleted ? "تم الحفظ وإتمام اليوم ✓" : "تم الحفظ"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEvalDialogOpen(true)}
                  className="w-full h-9 rounded-xl border-gold/30 bg-background/50 text-xs font-medium text-gold hover:bg-gold/10 gap-1.5"
                >
                  <Star className="h-3.5 w-3.5 text-gold" />
                  تقييم التسميع
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* نافذة حوار تقييم التسميع */}
      <Dialog open={evalDialogOpen} onOpenChange={setEvalDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl border-border bg-card p-6 text-foreground">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-gold">
              <Star className="h-5 w-5" />
              تقييم تسميع ورد اليوم
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              سجّل تقييم إتقانك لحفظ اليوم ({currentDay.dayName} {currentDay.date}) لمتابعة ثبات المحفوظ.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 my-4">
            {[
              { id: "excellent", label: "ممتاز (متقن بلا أخطاء)", stars: "⭐⭐⭐⭐⭐", desc: "استرسال سلس وتجويد متقن" },
              { id: "very_good", label: "جيد جداً (خطأ أو خطآن)", stars: "⭐⭐⭐⭐", desc: "تردد يسير مع استدراك فوري" },
              { id: "good", label: "جيد (يحتاج مراجعة قريبة)", stars: "⭐⭐⭐", desc: "عدة وقفات تحتاج تعزيزاً" },
              { id: "needs_work", label: "يحتاج تثبيت", stars: "⭐⭐", desc: "صعوبة في الربط وتكرار الأخطاء" },
            ].map((opt) => (
              <label
                key={opt.id}
                onClick={() => setSelectedRating(opt.id)}
                className={cn(
                  "flex items-center justify-between rounded-xl border p-3 cursor-pointer transition-all",
                  selectedRating === opt.id
                    ? "border-gold bg-gold/15 text-gold"
                    : "border-border/60 bg-muted/20 hover:border-border"
                )}
              >
                <div>
                  <p className="font-semibold text-sm text-foreground">{opt.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
                </div>
                <span className="text-xs">{opt.stars}</span>
              </label>
            ))}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEvalDialogOpen(false)}
              className="rounded-xl border-border"
            >
              إلغاء
            </Button>
            <Button
              size="sm"
              onClick={handleSaveEvaluation}
              className="rounded-xl bg-gold text-background hover:bg-gold/90 font-bold px-4"
            >
              {ratingSaved ? "تم الحفظ بنجاح ✓" : "حفظ التقييم"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================
// مكوّن بطاقة الخطوة (مراجعة بعيدة / مراجعة قريبة / مراجعة أسبوعية)
// ============================================================
interface StepCardProps {
  stepNumber: number;
  title: string;
  badgeColor: string;
  borderColor: string;
  bgColor: string;
  checkboxChecked: boolean;
  onToggleCheckbox: () => void;
  disabled?: boolean;
  pages: PageEntry[];
  emptyMsg: string;
}

function StepCard({
  stepNumber,
  title,
  badgeColor,
  borderColor,
  bgColor,
  checkboxChecked,
  onToggleCheckbox,
  disabled,
  pages,
  emptyMsg,
}: StepCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col justify-between rounded-2xl border p-4 sm:p-5 transition-all",
        borderColor,
        bgColor,
        checkboxChecked && "opacity-90"
      )}
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className={cn("flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold border", badgeColor)}>
              {stepNumber}
            </span>
            <span className="font-bold text-sm sm:text-base text-foreground">{title}</span>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-xs text-muted-foreground select-none">تمت</span>
            <Checkbox
              checked={checkboxChecked}
              onCheckedChange={onToggleCheckbox}
              disabled={disabled || pages.length === 0}
              className="data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
            />
          </label>
        </div>

        {/* عرض الصفحات */}
        <div className="space-y-2 max-h-56 overflow-y-auto pe-1 scrollbar-thin">
          {pages.length > 0 ? (
            pages.map((page) => <PageItemRow key={page.p} page={page} />)
          ) : (
            <div className="rounded-xl border border-dashed border-border/60 p-4 text-center text-xs text-muted-foreground">
              {emptyMsg}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// صف لعرض بيانات صفحة واحدة (رقم الصفحة + السور والآيات + الجزء)
// ============================================================
function PageItemRow({ page, highlightColor }: { page: PageEntry; highlightColor?: string }) {
  const juzNumber = getPageJuz(page.p);

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 rounded-xl bg-background/60 border border-border/40 px-3 py-2 text-xs transition-colors hover:border-border/80",
        highlightColor
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="font-bold text-foreground shrink-0">ص {page.p}</span>
        <span className="text-muted-foreground shrink-0">·</span>
        <span className="truncate text-muted-foreground">
          {page.s.map((s) => `${s.n} (${s.f}${s.f !== s.t ? `-${s.t}` : ""})`).join(" + ")}
        </span>
      </div>
      <Badge variant="outline" className="shrink-0 text-[10px] px-1.5 py-0 border-border/60 text-muted-foreground font-mono">
        الجزء {juzNumber}
      </Badge>
    </div>
  );
}
