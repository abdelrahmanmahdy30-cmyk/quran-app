"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMemorizationStore } from "@/lib/memorization-store";
import { surahs, getStrengthLevel } from "@/lib/quran-data";
import { calculateSrsItem, type SrsSurahItem } from "@/lib/spaced-repetition";
import {
  type ReviewGrade,
  type MasteryLevel,
  MASTERY_LEVELS_META,
  REVIEW_GRADES_META,
} from "@/lib/smart-plan-engine";
import { RefreshCw, CheckCircle2, Clock, Sparkles, AlertTriangle, Calendar, Award } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type FilterTab = "due" | "overdue" | "all" | "mastered";

export function ReviewSchedule() {
  const { progress, masteryRecords, recordMasteryReview, setCurrentSurah } = useMemorizationStore();
  const [selectedSurah, setSelectedSurah] = useState<SrsSurahItem | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<FilterTab>("due");

  // تحويل كافة السور النشطة لنظام التكرار المتباعد
  const srsItems = progress
    .filter((p) => p.status !== "not_started" || p.versesMemorized > 0)
    .map((p) => calculateSrsItem(p))
    .sort((a, b) => {
      if (a.urgency === "overdue" && b.urgency !== "overdue") return -1;
      if (b.urgency === "overdue" && a.urgency !== "overdue") return 1;
      if (a.urgency === "due_today" && b.urgency !== "due_today") return -1;
      if (b.urgency === "due_today" && a.urgency !== "due_today") return 1;
      return a.daysUntilReview - b.daysUntilReview;
    });

  const overdueList = srsItems.filter((i) => i.urgency === "overdue");
  const dueTodayList = srsItems.filter((i) => i.urgency === "due_today" || i.urgency === "overdue");
  const masteredList = srsItems.filter((i) => i.urgency === "mastered" || i.strength >= 90);

  // تصفية القائمة بحسب التبويب النشط
  const displayedItems = srsItems.filter((item) => {
    if (activeTab === "due") return item.urgency === "due_today" || item.urgency === "overdue";
    if (activeTab === "overdue") return item.urgency === "overdue";
    if (activeTab === "mastered") return item.urgency === "mastered" || item.strength >= 90;
    return true; // "all"
  });

  const openReviewModal = (item: SrsSurahItem) => {
    setSelectedSurah(item);
    setCurrentSurah(item.surahId);
    setReviewModalOpen(true);
  };

  const handleCompleteReview = (grade: ReviewGrade) => {
    if (!selectedSurah) return;
    recordMasteryReview(selectedSurah.surahId, grade);
    setReviewModalOpen(false);
    setSelectedSurah(null);
  };

  const currentSurahMeta = selectedSurah ? surahs.find((s) => s.id === selectedSurah.surahId) : null;
  const currentSurahMastery = selectedSurah ? masteryRecords[selectedSurah.surahId] : null;

  return (
    <>
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-lg text-foreground flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-emerald-bright" />
              <span>المراجعة الذكية بالتكرار المتباعد</span>
            </CardTitle>

            {/* أزرار التبويبات */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setActiveTab("due")}
                className={cn(
                  "px-3 py-1 text-xs rounded-full transition-colors flex items-center gap-1.5 border",
                  activeTab === "due"
                    ? "bg-emerald/20 text-emerald-bright border-emerald/40 font-medium"
                    : "bg-secondary text-muted-foreground border-transparent hover:text-foreground"
                )}
              >
                <span>اليوم والمتأخر</span>
                <span className="w-5 h-5 rounded-full bg-emerald-bright/20 flex items-center justify-center text-[10px]">
                  {dueTodayList.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("overdue")}
                className={cn(
                  "px-3 py-1 text-xs rounded-full transition-colors flex items-center gap-1.5 border",
                  activeTab === "overdue"
                    ? "bg-destructive/20 text-destructive border-destructive/40 font-medium"
                    : "bg-secondary text-muted-foreground border-transparent hover:text-foreground"
                )}
              >
                <span>المتأخر</span>
                <span className="w-5 h-5 rounded-full bg-destructive/20 flex items-center justify-center text-[10px]">
                  {overdueList.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className={cn(
                  "px-3 py-1 text-xs rounded-full transition-colors flex items-center gap-1.5 border",
                  activeTab === "all"
                    ? "bg-gold/20 text-gold border-gold/40 font-medium"
                    : "bg-secondary text-muted-foreground border-transparent hover:text-foreground"
                )}
              >
                <span>الكل</span>
                <span className="w-5 h-5 rounded-full bg-gold/20 flex items-center justify-center text-[10px]">
                  {srsItems.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("mastered")}
                className={cn(
                  "px-3 py-1 text-xs rounded-full transition-colors flex items-center gap-1.5 border",
                  activeTab === "mastered"
                    ? "bg-purple-500/20 text-purple-400 border-purple-500/40 font-medium"
                    : "bg-secondary text-muted-foreground border-transparent hover:text-foreground"
                )}
              >
                <span>المتقنة</span>
                <span className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center text-[10px]">
                  {masteredList.length}
                </span>
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {displayedItems.length === 0 ? (
            <div className="text-center py-10">
              <CheckCircle2 className="h-12 w-12 text-emerald-bright mx-auto mb-3 opacity-90 animate-pulse" />
              <p className="text-foreground font-semibold text-base">ما شاء الله تبارك الله!</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                {activeTab === "due"
                  ? "أتممت جميع المراجعات المستحقة لليوم بنجاح، حفظك في أمان."
                  : activeTab === "overdue"
                  ? "لا توجد أي سور متأخرة عن موعد مراجعتها."
                  : "لا توجد سور في هذا التصنيف حالياً."}
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[360px] pr-4">
              <div className="space-y-3">
                {displayedItems.map((item) => {
                  const surah = surahs.find((s) => s.id === item.surahId);
                  if (!surah) return null;

                  const strengthMeta = getStrengthLevel(item.strength);
                  const mastery = masteryRecords[item.surahId];
                  const masteryMeta = mastery ? MASTERY_LEVELS_META[mastery.masteryLevel] : null;

                  return (
                    <div
                      key={item.surahId}
                      className={cn(
                        "p-4 rounded-xl border transition-all duration-200 bg-secondary/40 hover:bg-secondary/70",
                        item.urgency === "overdue"
                          ? "border-destructive/30 hover:border-destructive/60"
                          : item.urgency === "due_today"
                          ? "border-emerald/30 hover:border-emerald-bright/50"
                          : "border-border hover:border-gold/30"
                      )}
                    >
                      <div className="flex items-center justify-between gap-3">
                        {/* معلومات السورة والرمز */}
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div
                            className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0",
                              item.strength < 50
                                ? "bg-destructive/20 text-destructive"
                                : item.strength < 75
                                ? "bg-orange-500/20 text-orange-400"
                                : "bg-emerald/20 text-emerald-bright"
                            )}
                          >
                            {surah.id}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-foreground text-base">
                                {surah.name}
                              </span>

                              {masteryMeta && (
                                <Badge variant="outline" className={cn("text-xs", masteryMeta.badgeClass)}>
                                  {masteryMeta.label}
                                </Badge>
                              )}

                              {item.urgency === "overdue" && (
                                <Badge variant="outline" className="text-xs bg-destructive/15 text-destructive border-destructive/30">
                                  <AlertTriangle className="h-3 w-3 ml-1" />
                                  متأخرة منذ {Math.abs(item.daysUntilReview)} يوم
                                </Badge>
                              )}
                              {item.urgency === "due_today" && (
                                <Badge variant="outline" className="text-xs bg-emerald/15 text-emerald-bright border-emerald/30">
                                  <Clock className="h-3 w-3 ml-1" />
                                  مستحقة اليوم
                                </Badge>
                              )}
                              {item.urgency === "upcoming" && (
                                <Badge variant="outline" className="text-xs bg-gold/15 text-gold border-gold/30">
                                  <Calendar className="h-3 w-3 ml-1" />
                                  بعد {item.daysUntilReview} يوم
                                </Badge>
                              )}
                              {item.urgency === "mastered" && (
                                <Badge variant="outline" className="text-xs bg-purple-500/15 text-purple-400 border-purple-500/30">
                                  <Award className="h-3 w-3 ml-1" />
                                  متقنة
                                </Badge>
                              )}
                            </div>

                            <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground flex-wrap">
                              <span className={strengthMeta.color}>
                                قوة التثبيت: {item.strength}% ({strengthMeta.label})
                              </span>
                              <span>·</span>
                              <span>الفاصل الدوري: كل {item.intervalDays} يوم</span>
                            </div>
                          </div>
                        </div>

                        {/* زر التسميع والمراجعة */}
                        <Button
                          size="sm"
                          onClick={() => openReviewModal(item)}
                          className={cn(
                            "shrink-0 font-medium",
                            item.urgency === "overdue"
                              ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              : "bg-emerald text-background hover:bg-emerald-bright"
                          )}
                        >
                          <RefreshCw className="h-3.5 w-3.5 ml-1.5" />
                          تسميع وتقييم
                        </Button>
                      </div>

                      {/* شريط مؤشر القوة */}
                      <div className="mt-3 h-1.5 bg-background/80 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full transition-all duration-300",
                            item.strength < 50
                              ? "bg-destructive"
                              : item.strength < 75
                              ? "bg-orange-400"
                              : "bg-gradient-to-l from-emerald to-emerald-bright"
                          )}
                          style={{ width: `${item.strength}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* نافذة جلسة المراجعة والتقييم الذكي (5 درجات إتقان دقيقة) */}
      <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-gold" />
              <span>تقييم مراجعة سورة {currentSurahMeta?.name}</span>
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              قيّم مستوى تمكّنك الفعلي من السورة لإعادة حساب موعد المراجعة القادمة بدقة تامة:
            </DialogDescription>
          </DialogHeader>

          {selectedSurah && (
            <div className="space-y-4 py-2">
              <div className="p-3 rounded-lg bg-secondary/50 border border-border text-center space-y-1">
                <p className="text-xs text-muted-foreground">مستوى الإتقان والقوة الحالية</p>
                <p className="text-2xl font-bold text-gold">{selectedSurah.strength}%</p>
                {currentSurahMastery && (
                  <Badge className={cn("text-xs font-medium", MASTERY_LEVELS_META[currentSurahMastery.masteryLevel]?.badgeClass)}>
                    {MASTERY_LEVELS_META[currentSurahMastery.masteryLevel]?.label}
                  </Badge>
                )}
              </div>

              {/* أزرار خيارات التقييم الخمسة */}
              <div className="space-y-2 pt-1">
                {(Object.keys(REVIEW_GRADES_META) as ReviewGrade[]).map((gradeKey) => {
                  const meta = REVIEW_GRADES_META[gradeKey];
                  return (
                    <button
                      key={gradeKey}
                      type="button"
                      onClick={() => handleCompleteReview(gradeKey)}
                      className={cn(
                        "w-full flex items-center justify-between p-3 rounded-xl border text-right transition-all",
                        "hover:scale-[1.01] hover:border-gold/50 bg-secondary/40"
                      )}
                    >
                      <div>
                        <p className="font-bold text-sm text-foreground">{meta.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{meta.sublabel}</p>
                      </div>
                      <Badge className={cn("text-xs font-medium", meta.badgeClass)}>
                        {meta.scoreBonus > 0 ? `+${meta.scoreBonus}%` : `${meta.scoreBonus}%`}
                      </Badge>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
