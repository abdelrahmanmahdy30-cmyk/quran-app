"use client";

import { useMemo } from "react";
import { usePlanProgress } from "@/lib/use-plan-progress";
import { getWeekDays } from "@/lib/plan-ui-helpers";
import { canMarkDayAsCompleted } from "@/lib/unified-progress";
import { PlanDay, StudyDay } from "@/lib/six-month-plan-types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CalendarDays,
  CheckCircle2,
  Lock,
  Sparkles,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface WeekStripBarProps {
  selectedDateStr?: string;
  onSelectDate?: (dateStr: string) => void;
  className?: string;
}

export function WeekStripBar({ selectedDateStr, onSelectDate, className }: WeekStripBarProps) {
  const { allDays, todayLocalDate, isDayCompleted, canMarkDay } = usePlanProgress();

  const weekDays = useMemo(() => {
    return getWeekDays(allDays, selectedDateStr || todayLocalDate);
  }, [allDays, selectedDateStr, todayLocalDate]);

  const activeDate = selectedDateStr || todayLocalDate;

  return (
    <Card className={cn("overflow-hidden border border-border/70 bg-card/90 shadow-xl backdrop-blur-md", className)}>
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-gold" />
            <span className="font-bold text-sm text-foreground">شريط الأسبوع</span>
          </div>
          <span className="text-xs text-muted-foreground">
            انقر على أي يوم لاستعراض ورده وإنجازه
          </span>
        </div>

        {/* شبكة الأيام السبعة */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-7">
          {weekDays.map((day) => {
            const isCompleted = isDayCompleted(day.date);
            const isToday = day.date === todayLocalDate;
            const isSelected = day.date === activeDate;
            const isFuture = !canMarkDay(day.date);
            const isFriday = day.type === "friday";

            // تحديد الحالة بدقة وفقاً للمطلوب
            let statusLabel = "فائت";
            let statusBadgeClass = "bg-muted text-muted-foreground border-border/40";

            if (isCompleted) {
              statusLabel = "مكتمل";
              statusBadgeClass = "bg-emerald-500/20 text-emerald-400 border-emerald-500/40";
            } else if (isToday) {
              statusLabel = "اليوم";
              statusBadgeClass = "bg-gold text-background font-bold";
            } else if (isFriday) {
              statusLabel = "راحة";
              statusBadgeClass = "bg-purple-500/20 text-purple-300 border-purple-500/40";
            } else if (isFuture) {
              statusLabel = "قادم";
              statusBadgeClass = "bg-background/80 text-muted-foreground border-border/50";
            }

            return (
              <button
                key={day.date}
                type="button"
                onClick={() => {
                  if (onSelectDate) onSelectDate(day.date);
                }}
                className={cn(
                  "relative flex flex-col items-center justify-between rounded-2xl border p-3 transition-all text-center focus:outline-none",
                  isSelected && "ring-2 ring-gold/70 border-gold shadow-lg shadow-gold/10",
                  !isSelected && "border-border/60 bg-background/50 hover:border-border hover:bg-muted/30",
                  isCompleted && "border-emerald-500/30 bg-emerald-500/5",
                  isToday && !isSelected && "border-gold/50 bg-gold/5",
                  isFuture && "opacity-75"
                )}
                title={isFuture ? "يوم قادم في الخطة — لا يمكن تعليمه قبل موعده" : `${day.dayName} ${day.date}`}
              >
                {/* اسم اليوم */}
                <span className="text-xs font-semibold text-foreground">
                  {day.dayName}
                </span>

                {/* تاريخ اليوم (أرقام لاتينية) */}
                <span className="font-mono text-xs text-muted-foreground my-1.5">
                  {day.date.slice(5)} {/* MM-DD */}
                </span>

                {/* شارة الحالة بدقة وفق المواصفات */}
                <div className="flex items-center gap-1">
                  {isCompleted && <CheckCircle2 className="h-3 w-3 text-emerald-400" />}
                  {isFuture && !isCompleted && <Lock className="h-3 w-3 text-muted-foreground" />}
                  <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", statusBadgeClass)}>
                    {statusLabel}
                  </Badge>
                </div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
