"use client";

import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMemorizationStore } from "@/lib/memorization-store";
import { surahs, calculateProgress, getStrengthLevel, TOTAL_JUZ } from "@/lib/quran-data";
import { 
  Search, 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  Circle,
  Grid3X3,
  List,
  Star
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SurahDetail } from "@/components/dashboard/surah-detail";
import { ReviewSchedule } from "@/components/tracking/review-schedule";
import { Timeline } from "@/components/tracking/timeline";

export default function QuranPage() {
  const { progress, currentSurah, setCurrentSurah, updateSurahProgress, recordReview, recordDailyProgress } = useMemorizationStore();
  const [search, setSearch] = useState("");
  const [quickSurah, setQuickSurah] = useState(1);
  const [fromVerse, setFromVerse] = useState(1);
  const [toVerse, setToVerse] = useState(1);
  const [entryType, setEntryType] = useState<"memorization" | "review">("memorization");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedJuz, setSelectedJuz] = useState<number | null>(null);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'memorized':
        return <CheckCircle2 className="h-4 w-4 text-emerald-bright" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-gold" />;
      default:
        return <Circle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const filteredSurahs = surahs.filter((surah) => {
    const matchesSearch = surah.name.includes(search) || 
                         surah.englishName.toLowerCase().includes(search.toLowerCase());
    const matchesJuz = selectedJuz === null || surah.juz.includes(selectedJuz);
    return matchesSearch && matchesJuz;
  });

  const juzStats = Array.from({ length: TOTAL_JUZ }, (_, i) => {
    const juzNumber = i + 1;
    const juzSurahs = surahs.filter(s => s.juz.includes(juzNumber));
    const memorizedInJuz = juzSurahs.filter(s => {
      const p = progress.find(pr => pr.surahId === s.id);
      return p?.status === 'memorized';
    }).length;
    return {
      number: juzNumber,
      total: juzSurahs.length,
      memorized: memorizedInJuz,
      percent: Math.round((memorizedInJuz / juzSurahs.length) * 100) || 0
    };
  });

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* العنوان */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground flex items-center gap-3">
              <BookOpen className="h-8 w-8 text-gold" />
              القرآن الكريم
            </h1>
            <p className="text-muted-foreground mt-1">
              تصفح وتتبع حفظك لسور القرآن الكريم
            </p>
          </div>
          
          {/* أزرار العرض */}
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('grid')}
              className={viewMode === 'grid' ? 'bg-gold text-background' : 'border-border'}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('list')}
              className={viewMode === 'list' ? 'bg-gold text-background' : 'border-border'}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Tabs defaultValue="surahs" className="w-full">
          <TabsList className="bg-secondary border border-border">
            <TabsTrigger 
              value="surahs" 
              className="data-[state=active]:bg-gold data-[state=active]:text-background"
            >
              السور
            </TabsTrigger>
            <TabsTrigger 
              value="juz"
              className="data-[state=active]:bg-gold data-[state=active]:text-background"
            >
              الأجزاء
            </TabsTrigger>
            <TabsTrigger 
              value="review"
              className="data-[state=active]:bg-gold data-[state=active]:text-background"
            >
              المراجعة
            </TabsTrigger>
          </TabsList>

          {/* تبويب السور */}
          <TabsContent value="surahs" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                {/* البحث */}
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="ابحث عن سورة..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pr-10 bg-card border-border focus:border-gold/50"
                  />
                </div>

                <Card className="border-gold/20 bg-card/90 shadow-lg">
                  <CardHeader className="pb-3"><CardTitle className="text-lg">تسجيل يومي سريع</CardTitle></CardHeader>
                  <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                    <select value={quickSurah} onChange={(event) => { const id = Number(event.target.value); setQuickSurah(id); setToVerse(surahs.find((item) => item.id === id)?.verses ?? 1); }} className="rounded-md border border-border bg-secondary px-3 py-2 text-sm"><option value="">اختر السورة</option>{surahs.map((item) => <option key={item.id} value={item.id}>{item.id}. {item.name}</option>)}</select>
                    <Input type="number" min={1} value={fromVerse} onChange={(event) => setFromVerse(Number(event.target.value))} placeholder="من آية" />
                    <Input type="number" min={fromVerse} value={toVerse} onChange={(event) => setToVerse(Number(event.target.value))} placeholder="إلى آية" />
                    <select value={entryType} onChange={(event) => setEntryType(event.target.value as "memorization" | "review")} className="rounded-md border border-border bg-secondary px-3 py-2 text-sm"><option value="memorization">حفظ جديد</option><option value="review">مراجعة</option></select>
                    <Button onClick={() => { 
                      const item = surahs.find((entry) => entry.id === quickSurah); 
                      if (!item) return; 
                      const count = Math.max(0, Math.min(toVerse, item.verses) - Math.max(1, fromVerse) + 1); 
                      const current = progress.find((entry) => entry.surahId === quickSurah)?.versesMemorized ?? 0; 
                      if (entryType === "memorization") {
                        updateSurahProgress(quickSurah, Math.min(item.verses, current + count));
                      } else {
                        recordReview(quickSurah, count);
                      }
                    }} className="bg-gold text-background hover:bg-gold/90">تسجيل</Button>
                  </CardContent>
                </Card>

                {/* شبكة السور */}
                <Card className="bg-card border-border">
                  <CardContent className="pt-6">
                    <ScrollArea className="h-[600px]">
                      {viewMode === 'grid' ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                          {filteredSurahs.map((surah) => {
                            const surahProgress = progress.find(p => p.surahId === surah.id);
                            const isSelected = currentSurah === surah.id;
                            const progressPercent = calculateProgress(
                              surahProgress?.versesMemorized || 0,
                              surah.verses
                            );

                            return (
                              <button
                                key={surah.id}
                                onClick={() => setCurrentSurah(surah.id)}
                                className={cn(
                                  "relative p-4 rounded-xl transition-all duration-200 text-center",
                                  "border-2 hover:border-gold/50",
                                  isSelected 
                                    ? "bg-gold/10 border-gold" 
                                    : "bg-secondary/30 border-transparent",
                                  surahProgress?.status === 'memorized' && "border-emerald/50 bg-emerald/5"
                                )}
                              >
                                {/* رقم السورة */}
                                <div className={cn(
                                  "w-10 h-10 mx-auto rounded-lg flex items-center justify-center text-sm font-bold mb-2",
                                  surahProgress?.status === 'memorized' 
                                    ? "bg-emerald/20 text-emerald-bright"
                                    : surahProgress?.status === 'in_progress'
                                      ? "bg-gold/20 text-gold"
                                      : "bg-muted text-muted-foreground"
                                )}>
                                  {surah.id}
                                </div>
                                
                                {/* اسم السورة */}
                                <h3 className="font-semibold text-foreground text-sm truncate">
                                  {surah.name}
                                </h3>
                                
                                {/* عدد الآيات */}
                                <p className="text-xs text-muted-foreground mt-1">
                                  {surah.verses} آية
                                </p>

                                {/* أيقونة الحالة */}
                                <div className="absolute top-2 left-2">
                                  {getStatusIcon(surahProgress?.status || 'not_started')}
                                </div>

                                {/* شريط التقدم */}
                                {surahProgress?.status !== 'not_started' && (
                                  <div className="mt-2 h-1 bg-background rounded-full overflow-hidden">
                                    <div 
                                      className={cn(
                                        "h-full",
                                        surahProgress?.status === 'memorized' 
                                          ? "bg-emerald-bright"
                                          : "bg-gold"
                                      )}
                                      style={{ width: `${progressPercent}%` }}
                                    />
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {filteredSurahs.map((surah) => {
                            const surahProgress = progress.find(p => p.surahId === surah.id);
                            const isSelected = currentSurah === surah.id;
                            const progressPercent = calculateProgress(
                              surahProgress?.versesMemorized || 0,
                              surah.verses
                            );
                            const strength = getStrengthLevel(surahProgress?.strength || 0);

                            return (
                              <button
                                key={surah.id}
                                onClick={() => setCurrentSurah(surah.id)}
                                className={cn(
                                  "w-full p-4 rounded-lg transition-all duration-200 text-right",
                                  "border hover:border-gold/50 flex items-center gap-4",
                                  isSelected 
                                    ? "bg-gold/10 border-gold" 
                                    : "bg-secondary/30 border-transparent"
                                )}
                              >
                                <div className={cn(
                                  "w-12 h-12 rounded-lg flex items-center justify-center text-lg font-bold shrink-0",
                                  surahProgress?.status === 'memorized' 
                                    ? "bg-emerald/20 text-emerald-bright"
                                    : surahProgress?.status === 'in_progress'
                                      ? "bg-gold/20 text-gold"
                                      : "bg-muted text-muted-foreground"
                                )}>
                                  {surah.id}
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-semibold text-foreground">
                                      {surah.name}
                                    </h3>
                                    {getStatusIcon(surahProgress?.status || 'not_started')}
                                    <Badge 
                                      variant="outline" 
                                      className={cn(
                                        "text-xs border",
                                        surah.type === 'meccan' 
                                          ? "border-gold/30 text-gold" 
                                          : "border-emerald/30 text-emerald-bright"
                                      )}
                                    >
                                      {surah.type === 'meccan' ? 'مكية' : 'مدنية'}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                                    <span>{surah.verses} آية</span>
                                    <span>{surah.pages} صفحة</span>
                                    <span>جزء {surah.juz.join('، ')}</span>
                                    {surahProgress?.status !== 'not_started' && (
                                      <span className={strength.color}>
                                        {strength.label}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="text-left shrink-0">
                                  <span className="text-lg font-bold text-gold">
                                    {progressPercent}%
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>

              {/* تفاصيل السورة */}
              <div>
                <SurahDetail />
              </div>
            </div>
          </TabsContent>

          {/* تبويب الأجزاء */}
          <TabsContent value="juz" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-foreground">الأجزاء الثلاثون</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-3">
                      {juzStats.map((juz) => (
                        <button
                          key={juz.number}
                          onClick={() => setSelectedJuz(selectedJuz === juz.number ? null : juz.number)}
                          className={cn(
                            "p-4 rounded-xl text-center transition-all duration-200",
                            "border-2 hover:border-gold/50",
                            selectedJuz === juz.number 
                              ? "bg-gold/10 border-gold" 
                              : "bg-secondary/30 border-transparent",
                            juz.percent === 100 && "border-emerald/50 bg-emerald/5"
                          )}
                        >
                          <div className={cn(
                            "w-10 h-10 mx-auto rounded-full flex items-center justify-center text-lg font-bold mb-2",
                            juz.percent === 100 
                              ? "bg-emerald/20 text-emerald-bright"
                              : juz.percent > 0
                                ? "bg-gold/20 text-gold"
                                : "bg-muted text-muted-foreground"
                          )}>
                            {juz.number}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {juz.memorized}/{juz.total}
                          </p>
                          <div className="mt-2 h-1 bg-background rounded-full overflow-hidden">
                            <div 
                              className={cn(
                                "h-full",
                                juz.percent === 100 ? "bg-emerald-bright" : "bg-gold"
                              )}
                              style={{ width: `${juz.percent}%` }}
                            />
                          </div>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* خط الزمن */}
              <div>
                <Timeline />
              </div>
            </div>
          </TabsContent>

          {/* تبويب المراجعة */}
          <TabsContent value="review" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ReviewSchedule />
              <Timeline />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
