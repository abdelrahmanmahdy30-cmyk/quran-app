"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMemorizationStore } from "@/lib/memorization-store";
import { TOTAL_VERSES, calculateRemainingDays, calculateProgress, formatArabicDate } from "@/lib/quran-data";
import { Calendar, Target, TrendingUp, Flag, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export function Timeline() {
  const { stats, getPlanEstimate } = useMemorizationStore();
  
  const progressPercent = calculateProgress(stats.totalVersesMemorized, TOTAL_VERSES);
  const remainingDays = calculateRemainingDays(stats.targetEndDate);
  
  // حساب إجمالي أيام الخطة من تاريخ البداية والنهاية
  const startDate = new Date(stats.startDate);
  const targetDate = new Date(stats.targetEndDate);
  const totalPlanDays = Math.max(1, Math.ceil((targetDate.getTime() - startDate.getTime()) / 86400000));
  const daysPassed = Math.max(0, totalPlanDays - remainingDays);
  const expectedProgress = Math.min(100, Math.max(0, (daysPassed / totalPlanDays) * 100));
  
  // التقدير الحسابي الفعلي
  const estimate = getPlanEstimate();
  const isAhead = estimate.status === "ahead" || (estimate.status === "on_track" && progressPercent >= expectedProgress);

  // المعالم الرئيسية
  const milestones = [
    { percent: 0, label: 'البداية', icon: Flag, completed: true },
    { percent: 25, label: 'ربع القرآن', icon: Target, completed: progressPercent >= 25 },
    { percent: 50, label: 'نصف القرآن', icon: Target, completed: progressPercent >= 50 },
    { percent: 75, label: 'ثلاثة أرباع', icon: Target, completed: progressPercent >= 75 },
    { percent: 100, label: 'الختمة', icon: Flag, completed: progressPercent >= 100 },
  ];

  const getStatusText = () => {
    if (estimate.status === "completed") {
      return "تمت الختمة المباركة، ما شاء الله!";
    }
    if (estimate.status === "not_started" || !estimate.estimatedDate) {
      return "سجّل حفظك اليوم لحساب تاريخ الانتهاء المتوقع بناءً على سرعتك الفعلية.";
    }

    const formattedDate = formatArabicDate(estimate.estimatedDate);
    const diff = Math.abs(estimate.daysDifference);

    if (estimate.status === "ahead") {
      return `متقدم على خطتك بحوالي ${diff} يوم — بالسرعة دي هتخلص في ${formattedDate}`;
    }
    if (estimate.status === "behind") {
      return `متأخر عن خطتك بحوالي ${diff} يوم — بالسرعة دي هتخلص في ${formattedDate}`;
    }
    return `ماشي مع خطتك بالتمام — بالسرعة دي هتخلص في ${formattedDate}`;
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-foreground flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gold" />
            خط الزمن وتوقع الختم
          </CardTitle>
          <Badge 
            variant="outline" 
            className={cn(
              "border",
              isAhead 
                ? "border-emerald/30 text-emerald-bright" 
                : "border-orange-500/30 text-orange-400"
            )}
          >
            {isAhead ? 'متقدم' : 'يحتاج تسريع'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* شريط التقدم الزمني */}
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">التقدم الفعلي</span>
            <span className="text-foreground font-medium">{progressPercent}%</span>
          </div>
          <div className="relative h-4 bg-secondary rounded-full overflow-hidden">
            {/* التقدم المتوقع بحسب تاريخ اليوم والهدف */}
            <div 
              className="absolute inset-y-0 right-0 bg-muted-foreground/20"
              style={{ width: `${expectedProgress}%` }}
            />
            {/* التقدم الفعلي */}
            <div 
              className={cn(
                "absolute inset-y-0 right-0 transition-all duration-500",
                isAhead ? "bg-emerald-bright" : "bg-gold"
              )}
              style={{ width: `${progressPercent}%` }}
            />
            {/* المعالم */}
            {milestones.map((milestone) => (
              <div
                key={milestone.percent}
                className="absolute top-1/2 -translate-y-1/2"
                style={{ right: `${milestone.percent}%`, transform: `translateX(50%) translateY(-50%)` }}
              >
                <div className={cn(
                  "w-3 h-3 rounded-full border-2 border-background",
                  milestone.completed ? "bg-emerald-bright" : "bg-muted"
                )} />
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>البداية</span>
            <span>المتوقع بالجدول: {Math.round(expectedProgress)}%</span>
            <span>الهدف</span>
          </div>
        </div>

        {/* المعالم */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-foreground">المعالم الرئيسية</h4>
          <div className="grid grid-cols-5 gap-2">
            {milestones.map((milestone) => (
              <div
                key={milestone.percent}
                className={cn(
                  "text-center p-2 rounded-lg transition-all",
                  milestone.completed 
                    ? "bg-emerald/10 border border-emerald/30" 
                    : "bg-secondary/50"
                )}
              >
                <milestone.icon className={cn(
                  "h-5 w-5 mx-auto mb-1",
                  milestone.completed ? "text-emerald-bright" : "text-muted-foreground"
                )} />
                <span className={cn(
                  "text-xs",
                  milestone.completed ? "text-emerald-bright" : "text-muted-foreground"
                )}>
                  {milestone.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* الإحصائيات الزمنية */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-secondary/50">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-gold" />
              <span className="text-xs text-muted-foreground">الأيام المتبقية لهدفك</span>
            </div>
            <span className="text-2xl font-bold text-gold">
              {Math.max(0, remainingDays)}
            </span>
          </div>
          <div className="p-4 rounded-lg bg-secondary/50">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-emerald-bright" />
              <span className="text-xs text-muted-foreground">أيام لازمة بسرعتك</span>
            </div>
            <span className="text-2xl font-bold text-emerald-bright">
              {estimate.daysNeeded > 0 ? `${estimate.daysNeeded} يوم` : 'غير محدد'}
            </span>
          </div>
        </div>

        {/* التوقع والمقارنة بالهدف */}
        <div className={cn(
          "p-4 rounded-lg border flex items-start gap-3",
          isAhead 
            ? "bg-emerald/10 border-emerald/20 text-emerald-bright" 
            : "bg-orange-500/10 border-orange-500/20 text-orange-400"
        )}>
          <Clock className="h-5 w-5 shrink-0 mt-0.5" />
          <p className="text-sm leading-relaxed font-medium">
            {getStatusText()}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
