"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useMemorizationStore } from "@/lib/memorization-store";
import { calculateSrsItem } from "@/lib/spaced-repetition";
import { Bell, Flame, Target, RefreshCw, CheckCircle2, BellRing } from "lucide-react";

export function NotificationMenu() {
  const { stats, progress, getTodaysGoal } = useMemorizationStore();
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | "unsupported">("default");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotificationPermission(Notification.permission);
    } else {
      setNotificationPermission("unsupported");
    }
  }, []);

  const requestBrowserPermission = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === "granted") {
        new Notification("حافظ - تم تفعيل التنبيهات", {
          body: "سنقوم بتذكيرك يومياً بورد الحفظ وجدول المراجعة الذكية.",
          icon: "/icon.svg",
        });
      }
    }
  };

  const todaysGoal = getTodaysGoal();
  const versesRemaining = Math.max(0, todaysGoal.targetVerses - todaysGoal.completedVerses);

  // حساب السور المستحقة للمراجعة اليوم أو المتأخرة
  const dueReviews = progress
    .filter((p) => p.status !== "not_started" || p.versesMemorized > 0)
    .map((p) => calculateSrsItem(p))
    .filter((item) => item.urgency === "due_today" || item.urgency === "overdue");

  const alerts = [];

  if (versesRemaining > 0) {
    alerts.push({
      id: "goal",
      icon: <Target className="h-4 w-4 text-gold" />,
      title: "ورد الحفظ اليومي",
      description: `متبقي لك ${versesRemaining} آية لإكمال هدف اليوم (${todaysGoal.completedVerses}/${todaysGoal.targetVerses}).`,
      href: "/quran",
    });
  }

  if (dueReviews.length > 0) {
    alerts.push({
      id: "reviews",
      icon: <RefreshCw className="h-4 w-4 text-emerald-bright" />,
      title: "المراجعة الذكية",
      description: `لديك ${dueReviews.length} سورة مستحقة للمراجعة وتثبيت الحفظ اليوم.`,
      href: "/quran",
    });
  }

  if (stats.currentStreak > 0 && todaysGoal.completedVerses === 0) {
    alerts.push({
      id: "streak",
      icon: <Flame className="h-4 w-4 text-orange-400" />,
      title: "سلسلة الأيام في خطر!",
      description: `حافظ على إنجازك لـ ${stats.currentStreak} يوم متتالي، سجّل حفظ اليوم قبل منتصف الليل.`,
      href: "/quran",
    });
  }

  const alertCount = alerts.length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
          <Bell className="h-5 w-5" />
          {alertCount > 0 && (
            <span className="absolute top-1 left-1 flex h-4 w-4 items-center justify-center rounded-full bg-gold text-[10px] font-bold text-background animate-pulse">
              {alertCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-0 bg-card border-border shadow-xl text-right" dir="rtl">
        <div className="p-3 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground text-sm">التنبيهات والمهام</span>
            {alertCount > 0 && (
              <Badge variant="outline" className="text-xs border-gold/40 text-gold bg-gold/10">
                {alertCount} جديد
              </Badge>
            )}
          </div>
          {notificationPermission !== "granted" && notificationPermission !== "unsupported" && (
            <button
              type="button"
              onClick={requestBrowserPermission}
              className="text-[11px] text-emerald-bright hover:underline flex items-center gap-1"
            >
              <BellRing className="h-3 w-3" />
              تفعيل التنبيهات
            </button>
          )}
        </div>

        <div className="max-h-72 overflow-y-auto divide-y divide-border">
          {alerts.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              <CheckCircle2 className="h-8 w-8 text-emerald-bright mx-auto mb-2 opacity-80" />
              <p className="text-sm font-medium text-foreground">أنت على المسار الصحيح!</p>
              <p className="text-xs mt-1">لا توجد أي تنبيهات أو مهام متأخرة لليوم.</p>
            </div>
          ) : (
            alerts.map((alert) => (
              <Link
                key={alert.id}
                href={alert.href}
                onClick={() => setOpen(false)}
                className="flex items-start gap-3 p-3 transition-colors hover:bg-secondary/50 block"
              >
                <div className="p-2 rounded-lg bg-secondary shrink-0 mt-0.5">
                  {alert.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground">{alert.title}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                    {alert.description}
                  </p>
                </div>
              </Link>
            ))
          )}
        </div>

        <div className="p-2 bg-secondary/30 border-t border-border text-center">
          <Link
            href="/settings"
            onClick={() => setOpen(false)}
            className="text-xs text-muted-foreground hover:text-gold transition-colors"
          >
            تخصيص أوقات التذكير في الإعدادات
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
