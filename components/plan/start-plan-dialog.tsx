"use client";

import { useState, useMemo } from "react";
import { createHafs, surahNamesAr, Surah } from "quran-meta";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  formatLocalDateStr,
  loadUnifiedRecord,
  saveUnifiedRecord,
  setActivePlanId,
  DEFAULT_PLAN_ID,
} from "@/lib/unified-plan-store";
import { Compass, BookOpen, Calendar, Sparkles, Check, RotateCcw } from "lucide-react";

const hafs = createHafs();

export interface StartPlanDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export function StartPlanDialog({ open: controlledOpen, onOpenChange: controlledOnOpenChange, trigger }: StartPlanDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;
  const setIsOpen = isControlled ? controlledOnOpenChange! : setInternalOpen;

  // إعداد قائمة السور من quran-meta بدقة
  const surahsList = useMemo(() => {
    return Array.from({ length: 114 }, (_, i) => {
      const sNum = (i + 1) as Surah;
      const name = surahNamesAr[sNum]?.[1] || `سورة ${sNum}`;
      const page = hafs.findPage(sNum, 1);
      const ayahCount = hafs.getAyahCountInSurah(sNum);
      return {
        num: i + 1,
        name,
        page,
        ayahCount,
      };
    });
  }, []);

  const [selectedSurah, setSelectedSurah] = useState<number>(1);
  const [selectedAyah, setSelectedAyah] = useState<number>(1);
  const [startDate, setStartDate] = useState<string>(() => formatLocalDateStr());
  const [priorPagesMemorized, setPriorPagesMemorized] = useState<boolean>(false);
  const [wrapAround, setWrapAround] = useState<boolean>(false);
  const [createdSuccess, setCreatedSuccess] = useState<boolean>(false);

  // حساب صفحة البداية الحقيقية من السورة والآية عبر quran-meta
  const calculatedStartPage = useMemo(() => {
    try {
      const p = hafs.findPage(selectedSurah as Surah, (selectedAyah || 1) as Parameters<typeof hafs.findPage>[1]);
      return p && p >= 1 && p <= 604 ? p : 1;
    } catch {
      return 1;
    }
  }, [selectedSurah, selectedAyah]);

  const selectedSurahMeta = useMemo(() => {
    return surahsList.find((s) => s.num === selectedSurah) || surahsList[0];
  }, [surahsList, selectedSurah]);

  const handleSurahChange = (val: string) => {
    const sNum = parseInt(val, 10);
    setSelectedSurah(sNum);
    setSelectedAyah(1);
  };

  const handleCreatePlan = () => {
    // إنشاء معرف فريد للخطة الجديدة بناءً على خيارات المستخدم
    const planSlug = selectedSurah === 1 && calculatedStartPage === 1
      ? DEFAULT_PLAN_ID
      : `plan-s${selectedSurah}-p${calculatedStartPage}-${startDate}`;

    const newRecord = loadUnifiedRecord(planSlug);
    newRecord.planId = planSlug;
    newRecord.startPage = calculatedStartPage;
    newRecord.startDate = startDate;
    newRecord.wrapAround = wrapAround;
    newRecord.priorPagesMemorized = priorPagesMemorized;

    saveUnifiedRecord(newRecord);
    setActivePlanId(planSlug);

    setCreatedSuccess(true);
    setTimeout(() => {
      setCreatedSuccess(false);
      setIsOpen(false);
    }, 1200);
  };

  const handleResetToDefault = () => {
    setActivePlanId(DEFAULT_PLAN_ID);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[540px] bg-card border-border text-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5 text-xl font-bold font-serif text-gold">
            <Compass className="h-6 w-6 text-gold" />
            البداية من أي سورة — خطة مخصصة
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            حدد السورة أو الآية التي تود بدء حفظك منها، وسيقوم النظام تلقائياً بإنشاء خطة متكاملة ومستقلة تتكيف مع تقدمك.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-3">
          {/* 1. اختيار السورة */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold flex items-center justify-between">
              <span className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-gold" />
                سورة البداية
              </span>
              <span className="text-xs text-gold font-mono bg-gold/10 px-2 py-0.5 rounded-full">
                ص {calculatedStartPage} في المصحف
              </span>
            </Label>
            <Select value={String(selectedSurah)} onValueChange={handleSurahChange}>
              <SelectTrigger className="bg-secondary/60 border-border h-11 text-right">
                <SelectValue placeholder="اختر السورة" />
              </SelectTrigger>
              <SelectContent className="max-h-60 bg-card border-border">
                {surahsList.map((s) => (
                  <SelectItem key={s.num} value={String(s.num)}>
                    {s.num}. سورة {s.name} (ص {s.page})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 2. الآية الاختيارية وتاريخ البدء */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground">
                من آية (اختياري)
              </Label>
              <Input
                type="number"
                min={1}
                max={selectedSurahMeta.ayahCount}
                value={selectedAyah}
                onChange={(e) => setSelectedAyah(Math.max(1, Math.min(selectedSurahMeta.ayahCount, parseInt(e.target.value, 10) || 1)))}
                className="bg-secondary/60 border-border h-10"
              />
              <span className="text-[10px] text-muted-foreground">
                آيات السورة: {selectedSurahMeta.ayahCount}
              </span>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-gold" />
                تاريخ بداية الخطة
              </Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-secondary/60 border-border h-10 font-mono text-xs"
              />
            </div>
          </div>

          {/* 3. سؤال الصفحات السابقة */}
          <div className="rounded-xl border border-border/80 bg-secondary/30 p-3.5 space-y-2">
            <Label className="text-xs font-bold text-foreground block">
              هل الصفحات قبل نقطة البداية (ص 1 إلى ص {Math.max(1, calculatedStartPage - 1)}) محفوظة لديك سابقاً؟
            </Label>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setPriorPagesMemorized(false)}
                className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all text-center ${
                  !priorPagesMemorized
                    ? "bg-gold/15 border-gold text-gold font-bold shadow-sm"
                    : "border-border text-muted-foreground hover:bg-secondary"
                }`}
              >
                لا (الافتراضي: تجاهل ولا تراجع)
              </button>
              <button
                type="button"
                onClick={() => setPriorPagesMemorized(true)}
                className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all text-center ${
                  priorPagesMemorized
                    ? "bg-emerald-500/20 border-emerald-500 text-emerald-400 font-bold shadow-sm"
                    : "border-border text-muted-foreground hover:bg-secondary"
                }`}
              >
                نعم (تدخل في المراجعة البعيدة)
              </button>
            </div>
          </div>

          {/* 4. خيار إكمال المصحف (wrapAround) */}
          <div className="flex items-center justify-between rounded-xl border border-border/80 bg-secondary/30 p-3.5">
            <div className="space-y-0.5 pe-4">
              <p className="text-xs font-bold text-foreground">
                إكمال الحفظ بعد ص 604 (wrapAround)
              </p>
              <p className="text-[11px] text-muted-foreground">
                عند الوصول لسورة الناس، يكمل البرنامج من ص 1 حتى ما قبل نقطة بدايتك لختم المصحف كاملاً.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setWrapAround(!wrapAround)}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                wrapAround ? "bg-gold" : "bg-muted"
              }`}
            >
              <div
                className={`bg-background w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  wrapAround ? "-translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-border/60">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleResetToDefault}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5 me-1.5" />
            العودة للخطة المعتمدة (ص 1)
          </Button>

          <Button
            type="button"
            onClick={handleCreatePlan}
            disabled={createdSuccess}
            className="bg-gold text-background hover:bg-gold-light font-bold text-xs px-5 h-9"
          >
            {createdSuccess ? (
              <span className="flex items-center gap-1.5 text-background">
                <Check className="h-4 w-4" />
                تم تفعيل الخطة بنجاح
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4" />
                تفعيل الخطة وبدء الحفظ
              </span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
