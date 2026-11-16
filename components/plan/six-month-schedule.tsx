"use client";

import { useState, useMemo } from "react";
import {
  MonthPlan,
  PlanDay,
  StudyDay,
  FridayDay,
  formatPageSurahs,
} from "@/lib/six-month-plan-types";
import { generatePlan } from "@/lib/plan-generator";
import { usePlanProgress } from "@/lib/use-plan-progress";
import { cn } from "@/lib/utils";
import {
  CalendarDays,
  CheckCircle2,
  Circle,
  BookOpen,
  Layers,
  Search,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Check,
  Lock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface SixMonthScheduleProps {
  completedDays?: Set<string>;
  onToggleComplete?: (dateStr: string) => void;
}

export function SixMonthSchedule({}: SixMonthScheduleProps = {}) {
  const {
    isDayCompleted,
    isStepDone,
    toggleStep,
    toggleDay,
    todayLocalDate,
    canMarkDay,
    completedDaysCount,
    percentTotal,
  } = usePlanProgress();

  const [monthsData] = useState<MonthPlan[]>(() => generatePlan());
  const [selectedMonthIdx, setSelectedMonthIdx] = useState<number | "all">(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "study" | "friday" | "completed" | "pending">("all");
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());

  const toggleExpand = (date: string) => {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  };

  const getMonthStats = (m: MonthPlan) => {
    const done = m.days.filter((d) => isDayCompleted(d.date)).length;
    const total = m.days.length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    return { done, total, pct };
  };

  const filteredDaysByMonth = useMemo(() => {
    if (!monthsData || monthsData.length === 0) return [];

    const result: { month: MonthPlan; monthIdx: number; days: PlanDay[] }[] = [];
    const q = searchQuery.trim().toLowerCase();

    monthsData.forEach((m, idx) => {
      if (selectedMonthIdx !== "all" && selectedMonthIdx !== idx) return;

      const filtered = m.days.filter((day) => {
        const isDone = isDayCompleted(day.date);
        if (filterType === "study" && day.type !== "study") return false;
        if (filterType === "friday" && day.type !== "friday") return false;
        if (filterType === "completed" && !isDone) return false;
        if (filterType === "pending" && isDone) return false;

        if (q) {
          const matchDate = day.date.includes(q);
          const matchName = day.dayName.includes(q);
          let matchSurah = false;
          if (day.type === "study") {
            matchSurah = (day as StudyDay).newPages.some((p) =>
              p.s.some((s) => s.n.includes(q))
            );
          }
          if (!matchDate && !matchName && !matchSurah) return false;
        }

        return true;
      });

      result.push({ month: m, monthIdx: idx, days: filtered });
    });

    return result;
  }, [monthsData, selectedMonthIdx, filterType, searchQuery, isDayCompleted]);

  return (
    <div className="space-y-6">
      {/* شريط الإحصائيات المختصر للجدول */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm">
          <span className="text-xs text-muted-foreground">الأيام المكتملة</span>
          <p className="font-mono text-2xl font-bold text-emerald-400 mt-1">
            {completedDaysCount} <span className="text-xs font-normal text-muted-foreground">/ 181</span>
          </p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm">
          <span className="text-xs text-muted-foreground">نسبة الإنجاز</span>
          <p className="font-mono text-2xl font-bold text-gold mt-1">
            {percentTotal}%
          </p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm">
          <span className="text-xs text-muted-foreground">أيام الحفظ</span>
          <p className="font-mono text-2xl font-bold text-foreground mt-1">
            155 <span className="text-xs font-normal text-muted-foreground">يوماً</span>
          </p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm">
          <span className="text-xs text-muted-foreground">جمعات الراحة</span>
          <p className="font-mono text-2xl font-bold text-foreground mt-1">
            26 <span className="text-xs font-normal text-muted-foreground">جمعة</span>
          </p>
        </div>
      </div>

      {/* شريط اختيار الأشهر */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border/50 pb-4">
        <button
          type="button"
          onClick={() => setSelectedMonthIdx("all")}
          className={cn(
            "rounded-xl px-4 py-2 text-xs font-semibold transition-all",
            selectedMonthIdx === "all"
              ? "bg-gold text-background shadow-md shadow-gold/20 font-bold"
              : "bg-card text-muted-foreground border border-border hover:text-foreground"
          )}
        >
          جميع الأشهر (181 يوماً)
        </button>

        {monthsData.map((m, idx) => {
          const st = getMonthStats(m);
          const isSelected = selectedMonthIdx === idx;
          return (
            <button
              key={m.name}
              type="button"
              onClick={() => setSelectedMonthIdx(idx)}
              className={cn(
                "rounded-xl px-4 py-2 text-xs font-semibold transition-all flex items-center gap-2",
                isSelected
                  ? "bg-gold text-background shadow-md shadow-gold/20 font-bold"
                  : "bg-card text-muted-foreground border border-border hover:text-foreground"
              )}
            >
              <span>{m.name}</span>
              <span className={cn(
                "font-mono text-[10px] px-1.5 py-0.5 rounded-full",
                isSelected ? "bg-black/20 text-background" : "bg-muted text-muted-foreground"
              )}>
                {st.done}/{st.total}
              </span>
            </button>
          );
        })}
      </div>

      {/* البحث والفلترة */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute end-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ابحث باسم السورة، اليوم، أو التاريخ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pe-9 h-10 text-xs rounded-xl bg-card border-border"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto">
          {[
            { id: "all", label: "الكل" },
            { id: "study", label: "أيام الحفظ" },
            { id: "friday", label: "الجمعات" },
            { id: "completed", label: "المكتملة" },
            { id: "pending", label: "المتبقية" },
          ].map((flt) => (
            <button
              key={flt.id}
              type="button"
              onClick={() => setFilterType(flt.id as any)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                filterType === flt.id
                  ? "bg-emerald-500 text-white shadow-sm"
                  : "bg-card/60 text-muted-foreground hover:bg-muted/50 border border-border/40"
              )}
            >
              {flt.label}
            </button>
          ))}
        </div>
      </div>

      {/* عرض الأيام بالجدول */}
      <div className="space-y-6">
        {filteredDaysByMonth.map(({ month, monthIdx, days }) => {
          const mStat = getMonthStats(month);
          return (
            <div
              key={month.name}
              className="rounded-3xl border border-border/70 bg-card/60 overflow-hidden shadow-lg backdrop-blur-md"
            >
              {/* رأس الشهر */}
              <div className="p-4 sm:p-5 border-b border-border/50 bg-card/90 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gold/15 border border-gold/30 flex items-center justify-center font-bold text-gold">
                    {monthIdx + 1}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground">{month.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      من صفحة {month.pageFrom} إلى {month.pageTo} ({month.totalPages} صفحة) · {month.studyDaysCount} حفظ و {month.fridaysCount} جمعة
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-emerald-400">
                    {mStat.done} / {mStat.total} يوم مكتمل ({mStat.pct}%)
                  </span>
                </div>
              </div>

              {/* قائمة الأيام */}
              <div className="p-3 sm:p-4 space-y-2.5">
                {days.length === 0 ? (
                  <p className="text-center text-xs text-muted-foreground py-6">
                    لا توجد أيام مطابقة للبحث أو الفلتر المحدد.
                  </p>
                ) : (
                  days.map((day) => {
                    const isCompleted = isDayCompleted(day.date);
                    const isFuture = !canMarkDay(day.date);
                    const isFriday = day.type === "friday";
                    const isExpanded = expandedDays.has(day.date);

                    const sDay = !isFriday ? (day as StudyDay) : null;
                    const fDay = isFriday ? (day as FridayDay) : null;

                    const newDone = !isFriday && isStepDone(day.date, "new");
                    const nearDone = isStepDone(day.date, "near");
                    const farDone = isStepDone(day.date, "far");

                    return (
                      <div
                        key={day.date}
                        className={cn(
                          "rounded-2xl border transition-all duration-200 overflow-hidden",
                          isCompleted
                            ? "border-emerald-500/40 bg-emerald-950/20"
                            : isFriday
                            ? "border-blue-500/30 bg-blue-950/10"
                            : "border-border/60 bg-card/40 hover:border-gold/30"
                        )}
                      >
                        {/* صف اليوم الرئيسي */}
                        <div className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            {/* زر إكمال اليوم */}
                            <button
                              type="button"
                              disabled={isFuture}
                              onClick={() => toggleDay(day.date)}
                              title={
                                isFuture
                                  ? `يوم مستقبلي (${day.date}) — ممنوع التعليم`
                                  : isCompleted
                                  ? "إلغاء إكمال اليوم"
                                  : "إكمال اليوم بالكامل"
                              }
                              className={cn(
                                "h-8 w-8 rounded-xl border flex items-center justify-center shrink-0 transition-all",
                                isFuture && "opacity-40 cursor-not-allowed bg-muted/20 border-border/40 text-muted-foreground",
                                !isFuture && isCompleted && "bg-emerald-500 border-emerald-400 text-white shadow-md cursor-pointer",
                                !isFuture && !isCompleted && "bg-card border-border text-muted-foreground hover:border-gold hover:text-gold cursor-pointer"
                              )}
                            >
                              {isFuture ? (
                                <Lock className="h-3.5 w-3.5" />
                              ) : isCompleted ? (
                                <Check className="h-4 w-4 stroke-[3]" />
                              ) : (
                                <Circle className="h-4 w-4" />
                              )}
                            </button>

                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-foreground">
                                  {day.dayName}
                                </span>
                                <span className="font-mono text-xs text-muted-foreground">
                                  {day.date}
                                </span>
                                {isFriday && (
                                  <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30 text-[10px] px-2 py-0">
                                    جمعة راحة ومراجعة
                                  </Badge>
                                )}
                              </div>

                              {/* ملخص الصفحات */}
                              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                                {!isFriday && sDay && (
                                  <span className="text-gold font-medium">
                                    حفظ: ص {sDay.newPages.map((p) => p.p).join("-")} ({sDay.summaryFrom || sDay.newPages[0]?.s[0]?.n})
                                  </span>
                                )}
                                {!isFriday && sDay && sDay.nearPages.length > 0 && (
                                  <span className="text-blue-400 font-mono text-[11px]">
                                    · قريبة: {sDay.nearPages.length} ص
                                  </span>
                                )}
                                {day.farPages && day.farPages.length > 0 && (
                                  <span className="text-emerald-400 font-mono text-[11px]">
                                    · بعيدة: {day.farPages.length} ص
                                  </span>
                                )}
                                {isFriday && fDay && (
                                  <span className="text-blue-400 font-medium">
                                    مراجعة الأسبوع ({fDay.nearPages.length} ص) + بعيدة ({fDay.farPages.length} ص)
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* أزرار الخطوات الفردية وزر التوسيع */}
                          <div className="flex items-center gap-2 self-end sm:self-center">
                            {/* خطوات الحفظ/المراجعة */}
                            {!isFriday && (
                              <button
                                type="button"
                                disabled={isFuture}
                                onClick={() => toggleStep(day.date, "new")}
                                title={isFuture ? "يوم مستقبلي" : "حفظ جديد"}
                                className={cn(
                                  "px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1",
                                  isFuture && "opacity-40 cursor-not-allowed border-border/40 text-muted-foreground",
                                  !isFuture && newDone && "bg-gold/20 text-gold border-gold/40 shadow-sm cursor-pointer",
                                  !isFuture && !newDone && "bg-card border-border text-muted-foreground hover:border-gold hover:text-gold cursor-pointer"
                                )}
                              >
                                {newDone ? <Check className="h-3 w-3 stroke-[3]" /> : <Circle className="h-3 w-3" />}
                                <span>حفظ جديد</span>
                              </button>
                            )}

                            <button
                              type="button"
                              disabled={isFuture}
                              onClick={() => toggleStep(day.date, "near")}
                              title={isFuture ? "يوم مستقبلي" : isFriday ? "مراجعة الأسبوع" : "مراجعة قريبة"}
                              className={cn(
                                "px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1",
                                isFuture && "opacity-40 cursor-not-allowed border-border/40 text-muted-foreground",
                                !isFuture && nearDone && "bg-blue-500/20 text-blue-400 border-blue-500/40 shadow-sm cursor-pointer",
                                !isFuture && !nearDone && "bg-card border-border text-muted-foreground hover:border-blue-400 hover:text-blue-400 cursor-pointer"
                              )}
                            >
                              {nearDone ? <Check className="h-3 w-3 stroke-[3]" /> : <Circle className="h-3 w-3" />}
                              <span>{isFriday ? "مراجعة الأسبوع" : "قريبة"}</span>
                            </button>

                            {(day.farPages && day.farPages.length > 0) && (
                              <button
                                type="button"
                                disabled={isFuture}
                                onClick={() => toggleStep(day.date, "far")}
                                title={isFuture ? "يوم مستقبلي" : "مراجعة بعيدة"}
                                className={cn(
                                  "px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1",
                                  isFuture && "opacity-40 cursor-not-allowed border-border/40 text-muted-foreground",
                                  !isFuture && farDone && "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-sm cursor-pointer",
                                  !isFuture && !farDone && "bg-card border-border text-muted-foreground hover:border-emerald-400 hover:text-emerald-400 cursor-pointer"
                                )}
                              >
                                {farDone ? <Check className="h-3 w-3 stroke-[3]" /> : <Circle className="h-3 w-3" />}
                                <span>بعيدة</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => toggleExpand(day.date)}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all"
                            >
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>

                        {/* التفاصيل الممتدة عند النقر */}
                        {isExpanded && (
                          <div className="p-3.5 bg-background/50 border-t border-border/40 space-y-2 text-xs">
                            {!isFriday && sDay && (
                              <div>
                                <span className="font-bold text-gold">تفاصيل الحفظ الجديد: </span>
                                <span className="text-foreground">
                                  {sDay.newPages.map((p) => `ص ${p.p} (${formatPageSurahs(p)})`).join(" | ")}
                                </span>
                              </div>
                            )}
                            {day.nearPages && day.nearPages.length > 0 && (
                              <div>
                                <span className="font-bold text-blue-400">تفاصيل المراجعة القريبة: </span>
                                <span className="text-muted-foreground">
                                  {day.nearPages.map((p) => `ص ${p.p}`).join(", ")}
                                </span>
                              </div>
                            )}
                            {day.farPages && day.farPages.length > 0 && (
                              <div>
                                <span className="font-bold text-emerald-400">تفاصيل المراجعة البعيدة: </span>
                                <span className="text-muted-foreground">
                                  {day.farPages.map((p) => `ص ${p.p}`).join(", ")}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
