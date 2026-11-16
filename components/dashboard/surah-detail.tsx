"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { useMemorizationStore } from "@/lib/memorization-store";
import { surahs, calculateProgress, getStrengthLevel } from "@/lib/quran-data";
import { 
  CheckCircle2, 
  Clock, 
  BookOpen, 
  RefreshCw, 
  Star,
  Plus,
  Minus,
  RotateCcw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatArabicDate } from "@/lib/date-utils";

export function SurahDetail() {
  const { 
    currentSurah, 
    progress, 
    updateSurahProgress, 
    markSurahComplete,
    updateStrength,
    recordReview,
    getSurahProgress,
    undoSurahAction
  } = useMemorizationStore();
  
  const surah = surahs.find(s => s.id === currentSurah);
  const surahProgress = getSurahProgress(currentSurah);
  
  const [localVerses, setLocalVerses] = useState(surahProgress?.versesMemorized || 0);

  useEffect(() => {
    setLocalVerses(surahProgress?.versesMemorized || 0);
  }, [currentSurah, surahProgress?.versesMemorized]);

  if (!surah) {
    return (
      <Card className="bg-card border-border h-full flex items-center justify-center">
        <CardContent className="text-center py-12">
          <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">اختر سورة من القائمة</p>
        </CardContent>
      </Card>
    );
  }

  const progressPercent = calculateProgress(surahProgress?.versesMemorized || 0, surah.verses);
  const strength = getStrengthLevel(surahProgress?.strength || 0);
  const isComplete = surahProgress?.status === 'memorized';
  const memorizedAt = surahProgress?.memorizedAt ? new Date(surahProgress.memorizedAt) : null;
  const lastReview = surahProgress?.lastReview ? new Date(surahProgress.lastReview) : null;
  const hasLaterReview = Boolean(memorizedAt && lastReview && lastReview.getTime() > memorizedAt.getTime());
  const formatDate = (date: Date) => formatArabicDate(date);

  const handleVersesChange = (value: number[]) => {
    setLocalVerses(value[0]);
  };

  const handleSaveProgress = () => {
    updateSurahProgress(currentSurah, localVerses);
  };

  const handleMarkComplete = () => {
    markSurahComplete(currentSurah);
    setLocalVerses(surah.verses);
  };

  const handleStrengthChange = (delta: number) => {
    const newStrength = Math.min(100, Math.max(0, (surahProgress?.strength || 0) + delta));
    updateStrength(currentSurah, newStrength);
  };

  return (
    <Card className="bg-card border-border h-full">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-2xl text-foreground font-serif">
              سورة {surah.name}
            </CardTitle>
            <p className="text-muted-foreground text-sm mt-1">
              {surah.englishName}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className={cn(
                "border",
                surah.type === 'meccan' 
                  ? "border-gold/30 text-gold" 
                  : "border-emerald/30 text-emerald-bright"
              )}
            >
              {surah.type === 'meccan' ? 'مكية' : 'مدنية'}
            </Badge>
            {isComplete && (
              <Badge className="bg-emerald-bright text-background">
                <CheckCircle2 className="h-3 w-3 ml-1" />
                محفوظة
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* معلومات السورة */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-lg bg-secondary/50">
            <div className="text-2xl font-bold text-gold">{surah.verses}</div>
            <div className="text-xs text-muted-foreground">آية</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-secondary/50">
            <div className="text-2xl font-bold text-emerald-bright">{surah.pages}</div>
            <div className="text-xs text-muted-foreground">صفحة</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-secondary/50">
            <div className="text-2xl font-bold text-foreground">
              {surah.juz.join('، ')}
            </div>
            <div className="text-xs text-muted-foreground">جزء</div>
          </div>
        </div>

        {/* تقدم الحفظ */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className={cn("h-5 w-5", isComplete ? "text-emerald-bright" : "text-gold")} />
              <span className="font-medium text-foreground">تقدم الحفظ</span>
            </div>
            <span className={cn("text-lg font-bold", isComplete ? "text-emerald-bright" : "text-gold")}>{progressPercent}%</span>
          </div>
          
          <div className="space-y-3">
            <Slider
              value={[localVerses]}
              onValueChange={handleVersesChange}
              max={surah.verses}
              step={1}
              className="w-full"
            />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {localVerses} من {surah.verses} آية
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 border-border"
                  onClick={() => setLocalVerses(Math.max(0, localVerses - 1))}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 border-border"
                  onClick={() => setLocalVerses(Math.min(surah.verses, localVerses + 1))}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleSaveProgress}
              className="flex-1 bg-gold text-background hover:bg-gold/90"
            >
              حفظ التقدم
            </Button>
            {!isComplete && (
              <Button 
                onClick={handleMarkComplete}
                variant="outline"
                className="flex-1 border-emerald/30 text-emerald-bright hover:bg-emerald/10"
              >
                <CheckCircle2 className="h-4 w-4 ml-2" />
                إتمام السورة
              </Button>
            )}
          </div>
        </div>

        {/* قوة الحفظ */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-emerald-bright" />
              <span className="font-medium text-foreground">قوة الحفظ</span>
            </div>
            <span className={cn("text-lg font-bold", strength.color)}>
              {surahProgress?.strength || 0}%
            </span>
          </div>
          
          <div className="h-3 bg-secondary rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full transition-all duration-300",
                (surahProgress?.strength || 0) >= 70 
                  ? "bg-emerald-bright" 
                  : (surahProgress?.strength || 0) >= 40 
                    ? "bg-gold" 
                    : "bg-orange-400"
              )}
              style={{ width: `${surahProgress?.strength || 0}%` }}
            />
          </div>

          <div className="flex items-center justify-between">
            <span className={cn("text-sm font-medium", strength.color)}>
              {strength.label}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStrengthChange(-10)}
                className="border-border hover:bg-destructive/10 hover:text-destructive"
              >
                <Minus className="h-3 w-3 ml-1" />
                ضعف
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStrengthChange(10)}
                className="border-border hover:bg-emerald/10 hover:text-emerald-bright"
              >
                <Plus className="h-3 w-3 ml-1" />
                تحسن
              </Button>
            </div>
          </div>
        </div>

        {/* سجل الحفظ والمراجعة */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-emerald-bright" />
              <span className="font-medium text-foreground">سجل الحفظ والمراجعة</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => undoSurahAction(currentSurah)}
                disabled={!surahProgress?.reviewHistory?.length}
                className="border-destructive/30 text-destructive hover:bg-destructive/10 gap-1"
              >
                <RotateCcw className="h-3 w-3" />
                تراجع
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => recordReview(currentSurah)}
                disabled={surahProgress?.status === 'not_started'}
                className="border-emerald/30 text-emerald-bright"
              >
                <RefreshCw className="h-3 w-3 ml-1" />
                سجل مراجعة اليوم
              </Button>
            </div>
          </div>

          <div className={cn("grid grid-cols-1 gap-3 text-sm", hasLaterReview && "sm:grid-cols-2")}>
            {memorizedAt && (
              <div className="p-3 rounded-lg bg-secondary/50">
                <span className="text-muted-foreground block">تاريخ الحفظ</span>
                <span className="font-medium text-foreground">{formatDate(memorizedAt)}</span>
              </div>
            )}
            {hasLaterReview && lastReview && (
              <div className="p-3 rounded-lg bg-secondary/50">
                <span className="text-muted-foreground block">آخر مراجعة</span>
                <span className="font-medium text-foreground">{formatDate(lastReview)}</span>
              </div>
            )}
          </div>

          {(surahProgress?.reviewHistory?.length ?? 0) > 0 && (
            <div className="max-h-40 overflow-y-auto space-y-2 rounded-lg border border-border p-3">
              {[...(surahProgress?.reviewHistory || [])].reverse().map((record, index) => (
                <div key={`${record.date}-${index}`} className="flex items-center justify-between gap-3 text-xs">
                  <span className="text-muted-foreground">
                    {formatArabicDate(new Date(record.date))}
                  </span>
                  <Badge variant="outline" className={record.type === 'memorization' ? 'border-gold/30 text-gold' : 'border-emerald/30 text-emerald-bright'}>
                    {record.type === 'memorization' ? 'إتمام الحفظ' : 'مراجعة'}
                  </Badge>
                  <span className="text-foreground">{record.verses} آية</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
