"use client";

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
  const { resetProgress: resetMemorizationStore } = useMemorizationStore();
  const { percentTotal, pagesDone, streak, resetProgress: resetPlanProgress } = usePlanProgress();
  const handleFullReset = () => { resetMemorizationStore(); resetPlanProgress(); };
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
              {streak}
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
                  onClick={handleFullReset}
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
