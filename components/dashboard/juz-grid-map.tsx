"use client";

import React, { useState, useMemo } from "react";
import { usePlanProgress } from "@/lib/use-plan-progress";
import { JUZ_META_RANGES } from "@/lib/plan-ui-helpers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Layers, CheckCircle2, Clock, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { StudyDay } from "@/lib/six-month-plan-types";

interface JuzGridMapProps {
  className?: string;
}

export function JuzGridMap({ className }: JuzGridMapProps) {
  const {
    record,
    allDays,
    todayLocalDate,
    isPageMemorized,
    getJuzStatus,
    markPage,
    unmarkPage,
    canMarkDay,
  } = usePlanProgress();

  const [selectedJuz, setSelectedJuz] = useState<number | null>(null);

  // خريطة الصفحة إلى تاريخ يوم الحفظ الخاص بها
  const pageToDateMap = useMemo(() => {
    const map = new Map<number, string>();
    for (const d of allDays) {
      if (d.type === "study") {
        for (const p of (d as StudyDay).newPages) {
          map.set(p.p, d.date);
        }
      }
    }
    return map;
  }, [allDays]);

  // حساب إحصاءات الأجزاء
  const stats = useMemo(() => {
    let completed = 0;
    let inProgress = 0;
    let notStarted = 0;

    for (let j = 1; j <= 30; j++) {
      const st = getJuzStatus(j);
      if (st === "completed") completed++;
      else if (st === "in_progress") inProgress++;
      else notStarted++;
    }
    return { completed, inProgress, notStarted };
  }, [getJuzStatus]);

  const selectedMeta = selectedJuz ? JUZ_META_RANGES[selectedJuz - 1] : null;

  const selectedPagesList = useMemo(() => {
    if (!selectedMeta) return [];
    const list = [];
    for (let p = selectedMeta.startPage; p <= selectedMeta.endPage; p++) {
      const pageDate = pageToDateMap.get(p);
      const isFuture = pageDate ? !canMarkDay(pageDate) : false;
      const isDone = isPageMemorized(p);
      list.push({ pageNum: p, isDone, isFuture, pageDate });
    }
    return list;
  }, [selectedMeta, pageToDateMap, canMarkDay, isPageMemorized]);

  const selectedDoneCount = useMemo(() => {
    return selectedPagesList.filter((p) => p.isDone).length;
  }, [selectedPagesList]);

  const handleTogglePage = (p: { pageNum: number; isDone: boolean; isFuture: boolean }) => {
    if (p.isFuture) return;
    if (p.isDone) {
      unmarkPage(p.pageNum);
    } else {
      markPage(p.pageNum);
    }
  };

  return (
    <Card className={cn("overflow-hidden border border-border/70 bg-card/90 shadow-xl backdrop-blur-md", className)}>
      <CardHeader className="p-5 sm:p-6 pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-gold" />
            <CardTitle className="text-lg font-bold text-foreground">
              خريطة أجزاء القرآن الكريم (30 جزءاً)
            </CardTitle>
          </div>

          {/* مفتاح الألوان (Legend) */}
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-md bg-emerald-500 shadow-sm shadow-emerald-500/50" />
              <span className="text-muted-foreground">مكتمل ({stats.completed})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-md bg-gold shadow-sm shadow-gold/50 animate-pulse" />
              <span className="text-muted-foreground">جاري حفظه ({stats.inProgress})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-md bg-muted/60 border border-border/50" />
              <span className="text-muted-foreground">غير مبدوء ({stats.notStarted})</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 sm:p-6 pt-2">
        <div className="grid grid-cols-5 gap-2.5 sm:grid-cols-6 md:grid-cols-10">
          {Array.from({ length: 30 }, (_, i) => i + 1).map((juzNum) => {
            const status = getJuzStatus(juzNum);
            const isCompleted = status === "completed";
            const isInProgress = status === "in_progress";

            return (
              <button
                key={juzNum}
                type="button"
                onClick={() => setSelectedJuz(juzNum)}
                className={cn(
                  "relative flex h-14 flex-col items-center justify-center rounded-2xl border text-center transition-all duration-300",
                  "hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-gold/50",
                  isCompleted &&
                    "border-emerald-500/60 bg-gradient-to-b from-emerald-500/25 to-emerald-950/40 text-emerald-300 shadow-md shadow-emerald-950/30",
                  isInProgress &&
                    "border-gold/80 bg-gradient-to-b from-gold/30 to-amber-950/40 text-gold shadow-lg shadow-gold/15 ring-1 ring-gold/40",
                  !isCompleted &&
                    !isInProgress &&
                    "border-border/50 bg-muted/20 text-muted-foreground/70 hover:border-border hover:bg-muted/40"
                )}
              >
                <span className="text-[10px] font-medium leading-none text-muted-foreground/80">
                  جزء
                </span>
                <span className="font-mono text-base font-bold leading-tight mt-0.5">
                  {juzNum}
                </span>

                {isCompleted && (
                  <CheckCircle2 className="absolute bottom-1 end-1 h-3 w-3 text-emerald-400" />
                )}
                {isInProgress && (
                  <span className="absolute bottom-1 end-1 h-2 w-2 rounded-full bg-gold animate-ping" />
                )}
              </button>
            );
          })}
        </div>
      </CardContent>

      {/* نافذة تفاصيل الجزء وصفحاته */}
      <Dialog open={selectedJuz !== null} onOpenChange={(open) => !open && setSelectedJuz(null)}>
        {selectedMeta && (
          <DialogContent className="max-w-md rounded-2xl border-border bg-card p-6 text-foreground">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl font-bold text-gold">
                <Layers className="h-5 w-5" />
                الجزء {selectedMeta.juzNumber}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                من الصفحة {selectedMeta.startPage} إلى الصفحة {selectedMeta.endPage} ({selectedMeta.totalPages} صفحة)
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 my-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">الصفحات المنجزة</span>
                  <span className="font-mono font-bold text-foreground">
                    {selectedDoneCount} / {selectedMeta.totalPages} صفحة
                  </span>
                </div>
                <Progress
                  value={Math.round((selectedDoneCount / selectedMeta.totalPages) * 100)}
                  className="h-2.5 rounded-full"
                />
              </div>

              {/* شبكة صفحات الجزء مع إمكانية التحديد ومنع الأيام المستقبلية */}
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-muted-foreground">صفحات الجزء:</p>
                <div className="grid grid-cols-5 gap-2 max-h-48 overflow-y-auto p-1">
                  {selectedPagesList.map((p) => (
                    <button
                      key={p.pageNum}
                      type="button"
                      disabled={p.isFuture}
                      onClick={() => handleTogglePage(p)}
                      title={p.isFuture ? `صفحة مستقبلية (تاريخها ${p.pageDate})` : `صفحة ${p.pageNum}`}
                      className={cn(
                        "h-9 rounded-xl border flex items-center justify-center text-xs font-mono font-bold transition-all",
                        p.isFuture && "opacity-40 cursor-not-allowed border-border/40 bg-muted/20 text-muted-foreground",
                        !p.isFuture && p.isDone && "bg-emerald-600 text-white border-emerald-500 shadow-sm cursor-pointer",
                        !p.isFuture && !p.isDone && "bg-background border-border/60 text-foreground hover:border-gold hover:text-gold cursor-pointer"
                      )}
                    >
                      {p.isFuture ? <Lock className="h-3 w-3 inline" /> : p.pageNum}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </Card>
  );
}
