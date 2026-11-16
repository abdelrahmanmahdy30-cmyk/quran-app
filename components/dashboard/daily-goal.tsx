"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePlanProgress } from "@/lib/use-plan-progress";
import { StudyDay } from "@/lib/six-month-plan-types";
import { CheckCircle2, BookOpen, RefreshCw, Calendar } from "lucide-react";

export function DailyGoal() {
  const { allDays, todayLocalDate, isDayCompleted, isStepDone, percentTotal, pagesDone } = usePlanProgress();

  const currentDay = allDays.find((d) => d.date === todayLocalDate) || allDays[0];
  const isCompleted = isDayCompleted(currentDay.date);

  const newPages = (currentDay.type === "study") ? (currentDay as StudyDay).newPages : [];
  const nearPages = (currentDay.type === "study") ? (currentDay as StudyDay).nearPages : [];
  const farPages = currentDay.farPages || [];

  const isNewDone = isStepDone(currentDay.date, "new");
  const isNearDone = isStepDone(currentDay.date, "near");
  const isFarDone = isStepDone(currentDay.date, "far");

  return (
    <Card className="bg-card border-border shadow-lg shadow-black/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-foreground flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gold" />
            هدف اليوم ({currentDay.dayName} {currentDay.date})
          </CardTitle>
          <span className="text-xs font-mono text-muted-foreground">
            الإنجاز الكلي: {percentTotal}% ({pagesDone}/604)
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* الحفظ الجديد */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gold/10">
                <BookOpen className="h-4 w-4 text-gold" />
              </div>
              <div>
                <p className="font-medium text-foreground">الحفظ الجديد ({newPages.length} صفحات)</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {newPages.length > 0
                    ? `ص ${newPages[0].p} إلى ص ${newPages[newPages.length - 1].p}`
                    : "راحة من الحفظ الجديد"}
                </p>
              </div>
            </div>
            {isNewDone ? (
              <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                <CheckCircle2 className="h-3.5 w-3.5" /> مكتمل
              </span>
            ) : (
              <span className="text-xs font-medium text-gold bg-gold/10 px-2.5 py-1 rounded-full border border-gold/20">
                قيد الحفظ
              </span>
            )}
          </div>

          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                isNewDone ? "bg-emerald-500" : "bg-gold"
              }`}
              style={{ width: isNewDone ? "100%" : "0%" }}
            />
          </div>
        </div>

        {/* المراجعة (قريبة وبعيدة) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <RefreshCw className="h-4 w-4 text-blue-400" />
              </div>
              <div>
                <p className="font-medium text-foreground">المراجعة اليومية</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {nearPages.length} قريبة + {farPages.length} بعيدة
                </p>
              </div>
            </div>
            {isNearDone && isFarDone ? (
              <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                <CheckCircle2 className="h-3.5 w-3.5" /> مكتمل
              </span>
            ) : (
              <span className="text-xs font-medium text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20">
                {(isNearDone || isFarDone) ? "مكتمل جزئياً" : "بانتظار المراجعة"}
              </span>
            )}
          </div>

          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-500"
              style={{
                width:
                  isNearDone && isFarDone
                    ? "100%"
                    : isNearDone || isFarDone
                    ? "50%"
                    : "0%",
              }}
            />
          </div>
        </div>

        {/* حالة اليوم */}
        {isCompleted && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center flex items-center justify-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <p className="text-xs text-emerald-400 font-bold">
              ما شاء الله! اكتمل ورد هذا اليوم بالكامل ✓
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
