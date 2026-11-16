code = '''"use client";

import { useState, useMemo } from "react";
import { usePlanProgress } from "@/lib/use-plan-progress";
import { JUZ_META_RANGES, getJuzStatus, JuzStatus } from "@/lib/plan-ui-helpers";
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
import { Layers, CheckCircle2, Clock, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface JuzGridMapProps {
  className?: string;
}

export function JuzGridMap({ className }: JuzGridMapProps) {
  const { memorizedPagesSet, todayPlanDay } = usePlanProgress();

  const todayPagesSet = useMemo(() => {
    const s = new Set<number>();
    if (todayPlanDay && todayPlanDay.type === "study" && todayPlanDay.newPages) {
      todayPlanDay.newPages.forEach((p) => s.add(p.p));
    }
    return s;
  }, [todayPlanDay]);

  const [selectedJuz, setSelectedJuz] = useState<number | null>(null);

  // حساب إحصاءات الأجزاء
  const stats = useMemo(() => {
    let completed = 0;
    let inProgress = 0;
    let notStarted = 0;

    for (let j = 1; j <= 30; j++) {
      const st = getJuzStatus(j, memorizedPagesSet, todayPagesSet);
      if (st === "completed") completed++;
      else if (st === "in_progress") inProgress++;
      else notStarted++;
    }
    return { completed, inProgress, notStarted };
  }, [memorizedPagesSet, todayPagesSet]);

  const selectedMeta = selectedJuz ? JUZ_META_RANGES[selectedJuz - 1] : null;
  const selectedDoneCount = useMemo(() => {
    if (!selectedMeta) return 0;
    let count = 0;
    for (let p = selectedMeta.startPage; p <= selectedMeta.endPage; p++) {
      if (memorizedPagesSet.has(p)) count++;
    }
    return count;
  }, [selectedMeta, memorizedPagesSet]);

  return (
    <Card className={cn("overflow-hidden border border-border/70 bg-card/90 shadow-xl backdrop-blur-md", className)}>
      <CardHeader className="p-5 sm:p-6 pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-gold" />
            <CardTitle className="text-lg font-bold text-foreground sm:text-xl">
              خريطة الأجزاء الثلاثين
            </CardTitle>
          </div>

          {/* مفتاح الألوان (Legend) */}
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-md bg-emerald-500/80 border border-emerald-400" />
              <span className="text-muted-foreground">مكتمل ({stats.completed})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-md bg-gold border border-gold/70" />
              <span className="text-muted-foreground">جاري حفظه ({stats.inProgress})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-md bg-muted border border-border/60" />
              <span className="text-muted-foreground">غير مبدوء ({stats.notStarted})</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 sm:p-6 pt-2">
        {/* شبكة الـ 30 مربعاً */}
        <div className="grid grid-cols-5 gap-2 sm:grid-cols-6 md:grid-cols-10">
          {JUZ_META_RANGES.map((juz) => {
            const status = getJuzStatus(juz.juzNumber, memorizedPagesSet, todayPagesSet);

            return (
              <button
                key={juz.juzNumber}
                type="button"
                onClick={() => setSelectedJuz(juz.juzNumber)}
                className={cn(
                  "group relative flex flex-col items-center justify-center rounded-2xl border p-2.5 transition-all text-center focus:outline-none focus:ring-2 focus:ring-gold/50",
                  status === "completed" &&
                    "border-emerald-500/50 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 shadow-sm",
                  status === "in_progress" &&
                    "border-gold bg-gold/20 text-gold hover:bg-gold/30 shadow-md shadow-gold/10 ring-1 ring-gold/40 animate-pulse-subtle font-bold",
                  status === "not_started" &&
                    "border-border/50 bg-background/50 text-muted-foreground hover:border-border hover:bg-muted/30"
                )}
                title={`${juz.name}: ص ${juz.startPage} إلى ${juz.endPage}`}
              >
                <span className="font-mono text-base font-bold sm:text-lg">
                  {juz.juzNumber}
                </span>
                <span className="text-[10px] text-muted-foreground mt-0.5 truncate w-full">
                  ص {juz.startPage}-{juz.endPage}
                </span>
              </button>
            );
          })}
        </div>
      </CardContent>

      {/* نافذة تفاصيل الجزء عند النقر */}
      <Dialog open={selectedJuz !== null} onOpenChange={(open) => !open && setSelectedJuz(null)}>
        {selectedMeta && (
          <DialogContent className="max-w-sm rounded-2xl border-border bg-card p-6 text-foreground">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg font-bold text-gold">
                <BookOpen className="h-5 w-5" />
                {selectedMeta.name} (الجزء {selectedMeta.juzNumber})
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

              <div className="flex items-center justify-between rounded-xl bg-background/60 p-3 text-xs border border-border/40">
                <span className="text-muted-foreground">الحالة</span>
                <Badge
                  className={cn(
                    "text-xs font-semibold",
                    selectedDoneCount === selectedMeta.totalPages &&
                      "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
                    selectedDoneCount > 0 &&
                      selectedDoneCount < selectedMeta.totalPages &&
                      "bg-gold/20 text-gold border-gold/40",
                    selectedDoneCount === 0 && "bg-muted text-muted-foreground border-border"
                  )}
                >
                  {selectedDoneCount === selectedMeta.totalPages
                    ? "مكتمل 100%"
                    : selectedDoneCount > 0
                    ? `قيد الحفظ (${Math.round((selectedDoneCount / selectedMeta.totalPages) * 100)}%)`
                    : "غير مبدوء"}
                </Badge>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </Card>
  );
}
'''
with open('components/dashboard/juz-grid-map.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
print('Created components/dashboard/juz-grid-map.tsx successfully!')
