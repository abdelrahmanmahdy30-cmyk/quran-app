"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePlanProgress } from "@/lib/use-plan-progress";
import { BookOpen, Calendar, FileText, Target, TrendingUp, CheckCircle2 } from "lucide-react";

export function StatsCards() {
  const { pagesDone, percentTotal, daysRemaining, dailyQuota, completedDaysCount, khatmaDate } = usePlanProgress();

  const statsData = [
    {
      title: "الصفحات المحفوظة",
      value: `${pagesDone}`,
      subtitle: "من 604 صفحة",
      icon: FileText,
      color: "text-gold",
      bgColor: "bg-gold/10",
      progress: percentTotal,
    },
    {
      title: "نسبة الإنجاز",
      value: `${percentTotal}%`,
      subtitle: "بمقياس الصفحات المقفول",
      icon: Target,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
      progress: percentTotal,
    },
    {
      title: "الأيام المكتملة",
      value: `${completedDaysCount}`,
      subtitle: completedDaysCount > 0 ? "أيام تم إنجاز كامل خطواتها" : "لم تكتمل أي أيام بعد",
      icon: CheckCircle2,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
    },
    {
      title: "الأيام المتبقية",
      value: `${daysRemaining}`,
      subtitle: `حتى الختمة ${khatmaDate}`,
      icon: Calendar,
      color: "text-sky-400",
      bgColor: "bg-sky-500/10",
    },
    {
      title: "الورد اليومي",
      value: `${dailyQuota}`,
      subtitle: "صفحات يومياً (حفظ جديد)",
      icon: BookOpen,
      color: "text-gold",
      bgColor: "bg-gold/10",
    },
    {
      title: "المصحف الشريف",
      value: "604",
      subtitle: "صفحة (رواية حفص)",
      icon: TrendingUp,
      color: "text-purple-400",
      bgColor: "bg-purple-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
      {statsData.map((stat, index) => (
        <Card
          key={index}
          className="group overflow-hidden border border-border/80 bg-card/90 shadow-lg shadow-black/5 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-gold/40 hover:shadow-xl hover:shadow-gold/5"
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <div className={`p-2 rounded-xl ${stat.bgColor}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`font-mono text-2xl font-bold tracking-tight ${stat.color}`}>
              {stat.value}
            </div>
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {stat.subtitle}
            </p>
            {stat.progress !== undefined && (
              <div className="mt-3 h-1.5 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-l from-gold to-emerald-500 transition-all duration-500"
                  style={{ width: `${stat.progress}%` }}
                />
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
