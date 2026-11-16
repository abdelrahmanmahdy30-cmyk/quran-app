"use client";

import { useState } from "react";
import { useMemorizationStore, type WardItem } from "@/lib/memorization-store";
import { type ReviewGrade } from "@/lib/smart-plan-engine";
import { surahs } from "@/lib/quran-data";
import { CheckCircle2, Clock, BookOpen, AlertCircle, ChevronDown, ChevronUp, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

// ========== بطاقة سورة واحدة في الورد ==========
function WardSurahCard({
  item,
  onReview,
  onUndo,
  reviewed,
}: {
  item: WardItem;
  onReview: (surahId: number) => void;
  onUndo: (surahId: number) => void;
  reviewed: boolean;
}) {
  const surah = surahs.find((s) => s.id === item.surahId);

  return (
    <div
      className={cn(
        "group flex items-center justify-between gap-3 rounded-xl border px-4 py-3 transition-all",
        reviewed
          ? "border-emerald/30 bg-emerald/10 opacity-70"
          : item.dueForReview
            ? "border-gold/20 bg-card hover:border-gold/40 hover:bg-card/80"
            : "border-border/40 bg-card/50"
      )}
    >
      {/* معلومات السورة */}
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold",
            reviewed
              ? "bg-emerald/20 text-emerald-bright"
              : item.dueForReview
                ? "bg-gold/20 text-gold"
                : "bg-muted text-muted-foreground"
          )}
        >
          {item.surahId}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-foreground text-sm">{item.surahName}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {item.versesMemorized} آية
            {item.daysSinceReview > 0 && (
              <span className={cn(
                "mr-2",
                item.dueForReview && !reviewed ? "text-amber-400" : "text-muted-foreground"
              )}>
                · آخر مراجعة: منذ {item.daysSinceReview} يوم
              </span>
            )}
          </p>
        </div>
      </div>

      {/* زر المراجعة */}
      {reviewed ? (
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => onUndo(item.surahId)}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
            تراجع
          </button>
          <div className="flex items-center gap-1 text-emerald-bright text-xs font-medium">
            <CheckCircle2 className="h-4 w-4" />
            <span>تمت</span>
          </div>
        </div>
      ) : (
        <button
          onClick={() => onReview(item.surahId)}
          className={cn(
            "shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
            item.dueForReview
              ? "bg-gold text-background hover:bg-gold/90 hover:shadow-md hover:shadow-gold/20"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          راجعت ✓
        </button>
      )}
    </div>
  );
}

// ========== قسم تصنيف (جديد / قريب / بعيد) ==========
function WardSection({
  title,
  subtitle,
  icon: Icon,
  items,
  color,
  onReview,
  onUndo,
  reviewedIds,
  defaultOpen,
}: {
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  items: WardItem[];
  color: string;
  onReview: (surahId: number) => void;
  onUndo: (surahId: number) => void;
  reviewedIds: Set<number>;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const dueCount = items.filter((i) => i.dueForReview && !reviewedIds.has(i.surahId)).length;

  if (items.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border/60 overflow-hidden">
      {/* رأس القسم */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-card hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", color)}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="text-right">
            <p className="font-semibold text-sm text-foreground">{title}</p>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {dueCount > 0 && (
            <span className="rounded-full bg-gold/20 px-2 py-0.5 text-xs font-bold text-gold">
              {dueCount} للمراجعة
            </span>
          )}
          <span className="text-xs text-muted-foreground">{items.length} سورة</span>
          {open ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* محتوى القسم */}
      {open && (
        <div className="px-4 pb-4 pt-2 space-y-2 bg-card/30">
          {items.map((item) => (
            <WardSurahCard
              key={item.surahId}
              item={item}
              onReview={onReview}
              onUndo={onUndo}
              reviewed={reviewedIds.has(item.surahId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ========== المكون الرئيسي: لوحة الورد اليومي ==========
export function WardPanel() {
  const { getDailyWard, recordMasteryReview, undoSurahAction } = useMemorizationStore();
  const ward = getDailyWard();
  const [reviewedIds, setReviewedIds] = useState<Set<number>>(new Set());

  const handleReview = (surahId: number) => {
    recordMasteryReview(surahId, 'flawless' as ReviewGrade);
    setReviewedIds((prev) => new Set([...prev, surahId]));
  };

  const handleUndo = (surahId: number) => {
    undoSurahAction(surahId);
    setReviewedIds((prev) => {
      const next = new Set(prev);
      next.delete(surahId);
      return next;
    });
  };

  const totalDue = ward.todayTotal.length;
  const reviewedCount = ward.todayTotal.filter((i) => reviewedIds.has(i.surahId)).length;
  const allDone = totalDue > 0 && reviewedCount === totalDue;

  const totalMemorized = ward.jadid.length + ward.qareeb.length + ward.baeed.length;

  return (
    <div className="rounded-3xl border border-border/60 bg-card p-5 space-y-4 shadow-xl shadow-black/5">
      {/* العنوان */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-gold" />
            ورد المراجعة
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {totalMemorized === 0
              ? "لم تحفظ سوراً بعد"
              : `${totalMemorized} سورة محفوظة`}
          </p>
        </div>

        {/* شارة اليوم */}
        {totalDue > 0 && (
          <div
            className={cn(
              "flex flex-col items-center justify-center rounded-2xl px-4 py-2 text-center min-w-[72px]",
              allDone
                ? "bg-emerald/20 border border-emerald/30"
                : "bg-gold/10 border border-gold/20"
            )}
          >
            <span className={cn("text-2xl font-bold", allDone ? "text-emerald-bright" : "text-gold")}>
              {reviewedCount}/{totalDue}
            </span>
            <span className="text-xs text-muted-foreground">اليوم</span>
          </div>
        )}
      </div>

      {/* إذا لم يكن هناك شيء */}
      {totalMemorized === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground gap-2">
          <BookOpen className="h-10 w-10 opacity-30" />
          <p className="text-sm">ابدأ بتسجيل ما حفظت من السور</p>
          <p className="text-xs opacity-70">سيظهر هنا ورد مراجعتك تلقائياً</p>
        </div>
      ) : (
        <>
          {/* تنبيه إذا لا شيء للمراجعة اليوم */}
          {totalDue === 0 && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald/30 bg-emerald/10 px-4 py-3 text-sm text-emerald-bright">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>لا توجد سور مستحقة المراجعة اليوم 🎉</span>
            </div>
          )}

          {/* تنبيه إذا اكتمل الورد */}
          {allDone && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald/30 bg-emerald/10 px-4 py-3 text-sm text-emerald-bright">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>أحسنت! أتممت ورد اليوم كاملاً 🌟</span>
            </div>
          )}

          {/* الأقسام */}
          <div className="space-y-3">
            <WardSection
              title="الجديد"
              subtitle="حُفظ منذ ≤ 7 أيام · يُراجع يومياً"
              icon={AlertCircle}
              items={ward.jadid}
              color="bg-red-500/15 text-red-400"
              onReview={handleReview}
              onUndo={handleUndo}
              reviewedIds={reviewedIds}
              defaultOpen={ward.jadid.some((i) => i.dueForReview)}
            />
            <WardSection
              title="القريب"
              subtitle="حُفظ منذ 7-30 يوم · يُراجع أسبوعياً"
              icon={Clock}
              items={ward.qareeb}
              color="bg-amber-500/15 text-amber-400"
              onReview={handleReview}
              onUndo={handleUndo}
              reviewedIds={reviewedIds}
              defaultOpen={ward.qareeb.some((i) => i.dueForReview)}
            />
            <WardSection
              title="البعيد"
              subtitle="حُفظ منذ > 30 يوم · يُراجع شهرياً"
              icon={BookOpen}
              items={ward.baeed}
              color="bg-blue-500/15 text-blue-400"
              onReview={handleReview}
              onUndo={handleUndo}
              reviewedIds={reviewedIds}
              defaultOpen={ward.baeed.some((i) => i.dueForReview)}
            />
          </div>
        </>
      )}
    </div>
  );
}
