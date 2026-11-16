code_stats = '''"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMemorizationStore } from "@/lib/memorization-store";
import { usePlanProgress } from "@/lib/use-plan-progress";
import { BookOpen, Calendar, FileText, Target, TrendingUp, Award } from "lucide-react";

export function StatsCards() {
  const { progress } = useMemorizationStore();
  const { pagesDone, percentTotal, daysRemaining, dailyQuota } = usePlanProgress();

  const completedSurahs = progress.filter((p) => p.status === "memorized").length;
  const inProgressSurahs = progress.filter((p) => p.status === "in_progress").length;

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
      title: "السور المكتملة",
      value: `${completedSurahs}`,
      subtitle: `${inProgressSurahs} قيد الحفظ`,
      icon: Award,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
    },
    {
      title: "الأيام المتبقية",
      value: `${daysRemaining}`,
      subtitle: "حتى الختمة 2027-04-29",
      icon: Calendar,
      color: "text-sky-400",
      bgColor: "bg-sky-500/10",
    },
    {
      title: "الورد اليومي",
      value: `${dailyQuota > 0 ? dailyQuota : 4}`,
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
'''

code_ring = '''"use client";

import { usePlanProgress } from "@/lib/use-plan-progress";
import { useMemorizationStore } from "@/lib/memorization-store";
import { calculateCompletedJuzCount } from "@/lib/quran-metadata";
import { Card, CardContent } from "@/components/ui/card";

export function ProgressRing() {
  const { percentTotal, pagesDone } = usePlanProgress();
  const { progress } = useMemorizationStore();

  const completedJuz = calculateCompletedJuzCount(progress);
  const completedSurahs = progress.filter((p) => p.status === "memorized").length;

  const size = 220;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentTotal / 100) * circumference;

  return (
    <Card className="overflow-hidden border border-border/80 bg-card/90 shadow-lg shadow-black/5 backdrop-blur">
      <CardContent className="relative pt-7">
        <div className="flex flex-col items-center">
          {/* الدائرة الرئيسية */}
          <div className="relative">
            <svg width={size} height={size} className="transform -rotate-90">
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="var(--secondary)"
                strokeWidth={strokeWidth}
              />
              <defs>
                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#d4af37" />
                </linearGradient>
              </defs>
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="url(#progressGradient)"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>

            {/* النص داخل الدائرة بنسبة موحدة وأرقام لاتينية */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-mono text-4xl font-extrabold text-foreground tracking-tight">
                {percentTotal}%
              </span>
              <span className="text-xs text-muted-foreground mt-1 font-mono">
                {pagesDone} من 604 صفحة
              </span>
            </div>
          </div>

          {/* تفاصيل إضافية */}
          <div className="grid grid-cols-2 gap-4 w-full mt-6 pt-4 border-t border-border">
            <div className="text-center">
              <p className="font-mono text-lg font-bold text-emerald-400">{completedSurahs}</p>
              <p className="text-xs text-muted-foreground">سورة مكتملة</p>
            </div>
            <div className="text-center">
              <p className="font-mono text-lg font-bold text-gold">{completedJuz}</p>
              <p className="text-xs text-muted-foreground">جزء مكتمل</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
'''

code_header = '''"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useMemorizationStore } from "@/lib/memorization-store";
import { usePlanProgress } from "@/lib/use-plan-progress";
import { formatArabicDate } from "@/lib/quran-data";
import { Menu, Flame, RotateCcw } from "lucide-react";
import { NotificationMenu } from "./notification-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { stats, resetProgress } = useMemorizationStore();
  const { percentTotal, pagesDone } = usePlanProgress();
  const [displayName, setDisplayName] = useState<string | null>(null);

  useEffect(() => {
    setDisplayName(getLocalDisplayName());

    const handleStorage = () => setDisplayName(getLocalDisplayName());
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border">
      <div className="flex items-center justify-between px-4 lg:px-6 h-16">
        {/* القسم الأيمن */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="hidden sm:block">
            <p className="text-sm text-muted-foreground font-mono">
              {formatArabicDate(new Date())}
            </p>
          </div>
        </div>

        {/* القسم الأوسط - مقياس التقدم الموحد */}
        <div className="hidden md:flex items-center gap-4 flex-1 max-w-md mx-8">
          <div className="flex-1">
            <div className="flex items-center justify-between text-xs mb-1 font-mono">
              <span className="text-muted-foreground font-sans">التقدم الموحد</span>
              <span className="text-gold font-bold">{percentTotal}% ({pagesDone}/604 صفحة)</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-l from-gold to-emerald-500 transition-all duration-500"
                style={{ width: `${percentTotal}%` }}
              />
            </div>
          </div>
        </div>

        {/* القسم الأيسر */}
        <div className="flex items-center gap-3">
          <Link
            href="/account"
            className="hidden max-w-64 truncate text-xs text-muted-foreground transition-colors hover:text-gold lg:block"
            title="فتح بيانات الحساب"
          >
            {displayName ? `أهلاً ${displayName}` : "بيانات الحساب"}
          </Link>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20">
            <Flame className="h-4 w-4 text-orange-400" />
            <span className="text-sm font-medium text-orange-400 font-mono">
              {stats.currentStreak}
            </span>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                <RotateCcw className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-card border-border">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-foreground">
                  إعادة تعيين التقدم؟
                </AlertDialogTitle>
                <AlertDialogDescription className="text-muted-foreground">
                  سيتم حذف جميع بيانات الحفظ والتقدم. هذا الإجراء لا يمكن التراجع عنه.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="gap-2">
                <AlertDialogCancel className="border-border">إلغاء</AlertDialogCancel>
                <AlertDialogAction
                  onClick={resetProgress}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  إعادة التعيين
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <NotificationMenu />
        </div>
      </div>
    </header>
  );
}
'''

with open('components/dashboard/stats-cards.tsx', 'w', encoding='utf-8') as f:
    f.write(code_stats)

with open('components/dashboard/progress-ring.tsx', 'w', encoding='utf-8') as f:
    f.write(code_ring)

with open('components/layout/header.tsx', 'w', encoding='utf-8') as f:
    f.write(code_header)

print('Updated stats-cards, progress-ring, and header!')
