code = '''"use client";

import { usePlanProgress } from "@/lib/use-plan-progress";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Calendar,
  Clock,
  BookOpen,
  Trophy,
  Flame,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface KhatmaJourneyCardProps {
  className?: string;
}

export function KhatmaJourneyCard({ className }: KhatmaJourneyCardProps) {
  const {
    pagesDone,
    percentTotal,
    daysRemaining,
    khatmaDate,
    dailyQuota,
    aheadOrBehindPages,
    isAhead,
    selectors,
  } = usePlanProgress();

  return (
    <Card
      className={cn(
        "relative overflow-hidden border border-border/70 bg-gradient-to-br from-card/95 via-card/90 to-card/80 shadow-xl backdrop-blur-md",
        className
      )}
    >
      {/* هالة خلفية */}
      <div className="pointer-events-none absolute -end-12 -top-12 h-44 w-44 rounded-full bg-gold/10 blur-2xl" />

      <CardContent className="p-5 sm:p-6 space-y-5">
        {/* العنوان والنسبة الموحدة */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-gold" />
              <h3 className="font-bold text-lg text-foreground sm:text-xl">
                الطريق إلى الختمة
              </h3>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              المصحف الشريف 604 صفحة · بمقياس الصفحات المكتملة
            </p>
          </div>

          <div className="text-end">
            <span className="font-mono text-3xl sm:text-4xl font-extrabold text-gold tracking-tight">
              {percentTotal}%
            </span>
            <p className="text-xs text-muted-foreground">
              {pagesDone} من 604 صفحة
            </p>
          </div>
        </div>

        {/* شريط التقدم بنسبة واحدة موحدة */}
        <div className="space-y-1.5">
          <Progress value={percentTotal} className="h-3 rounded-full bg-secondary" />
          <div className="flex justify-between text-[11px] text-muted-foreground">
            <span>البداية (ص 1)</span>
            <span>الختمة الخميس {khatmaDate} (ص 604)</span>
          </div>
        </div>

        {/* بانر "متقدم" يظهر فقط عند وجود تقدم فعلي مثبت */}
        {isAhead && (
          <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2.5 text-xs font-medium text-emerald-300">
            <Sparkles className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>
              أنت متقدم بـ <strong className="font-bold text-emerald-300">{aheadOrBehindPages} صفحة</strong> عن الجدول المعتمد لتاريخ اليوم! استمر بثبات.
            </span>
          </div>
        )}

        {/* البطاقات الثلاث: الأيام المتبقية + الورد اليومي + تاريخ الختمة */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {/* 1. الأيام المتبقية */}
          <div className="rounded-2xl border border-border/60 bg-background/50 p-3.5 text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground mb-1">
              <Clock className="h-3.5 w-3.5 text-sky-400" />
              <span>الأيام المتبقية</span>
            </div>
            <p className="font-mono text-2xl font-bold text-foreground">
              {daysRemaining}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">يوماً حتى الختمة</p>
          </div>

          {/* 2. الورد اليومي */}
          <div className="rounded-2xl border border-border/60 bg-background/50 p-3.5 text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground mb-1">
              <BookOpen className="h-3.5 w-3.5 text-gold" />
              <span>الورد اليومي</span>
            </div>
            <p className="font-mono text-2xl font-bold text-gold">
              {dailyQuota > 0 ? `${dailyQuota}` : "4"}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">صفحات يومياً (حفظ جديد)</p>
          </div>

          {/* 3. تاريخ الختمة */}
          <div className="rounded-2xl border border-border/60 bg-background/50 p-3.5 text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground mb-1">
              <Calendar className="h-3.5 w-3.5 text-emerald-400" />
              <span>تاريخ الختمة</span>
            </div>
            <p className="font-mono text-base font-bold text-emerald-400 sm:text-lg">
              {khatmaDate}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">الخميس (ص 604 - الناس 6)</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
'''
with open('components/dashboard/khatma-journey-card.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
print('Created components/dashboard/khatma-journey-card.tsx successfully!')
