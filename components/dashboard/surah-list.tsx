"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMemorizationStore } from "@/lib/memorization-store";
import { surahs, calculateProgress, getStrengthLevel } from "@/lib/quran-data";
import { Search, CheckCircle2, Circle, Clock, BookOpen, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface SurahListProps {
  onSelectSurah?: (surahId: number) => void;
}

export function SurahList({ onSelectSurah }: SurahListProps) {
  const { progress, setCurrentSurah, currentSurah } = useMemorizationStore();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<'all' | 'memorized' | 'in_progress' | 'not_started'>('all');

  const filteredSurahs = surahs.filter((surah) => {
    const matchesSearch = surah.name.includes(search) || 
                         surah.englishName.toLowerCase().includes(search.toLowerCase());
    
    if (!matchesSearch) return false;
    
    const surahProgress = progress.find(p => p.surahId === surah.id);
    if (filter === 'all') return true;
    return surahProgress?.status === filter;
  });

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

  const handleSelectSurah = (surahId: number) => {
    setCurrentSurah(surahId);
    onSelectSurah?.(surahId);
  };

  const memorizedCount = progress.filter(p => p.status === 'memorized').length;
  const inProgressCount = progress.filter(p => p.status === 'in_progress').length;
  const notStartedCount = progress.filter(p => p.status === 'not_started').length;

  return (
    <Card className="bg-card border-border h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-foreground flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-gold" />
            السور القرآنية
          </CardTitle>
          <Badge variant="outline" className="border-gold/30 text-gold">
            {memorizedCount} / 114
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* البحث */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ابحث عن سورة..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-10 bg-secondary border-border focus:border-gold/50"
          />
        </div>

        {/* الفلاتر */}
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
            className={cn(
              "text-xs",
              filter === 'all' 
                ? "bg-gold text-background hover:bg-gold/90" 
                : "border-border hover:bg-gold/10 hover:text-gold"
            )}
          >
            الكل ({surahs.length})
          </Button>
          <Button
            variant={filter === 'memorized' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('memorized')}
            className={cn(
              "text-xs",
              filter === 'memorized' 
                ? "bg-emerald-bright text-background hover:bg-emerald-bright/90" 
                : "border-border hover:bg-emerald/10 hover:text-emerald-bright"
            )}
          >
            محفوظة ({memorizedCount})
          </Button>
          <Button
            variant={filter === 'in_progress' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('in_progress')}
            className={cn(
              "text-xs",
              filter === 'in_progress' 
                ? "bg-gold text-background hover:bg-gold/90" 
                : "border-border hover:bg-gold/10 hover:text-gold"
            )}
          >
            قيد الحفظ ({inProgressCount})
          </Button>
          <Button
            variant={filter === 'not_started' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('not_started')}
            className={cn(
              "text-xs",
              filter === 'not_started' 
                ? "bg-muted text-foreground" 
                : "border-border hover:bg-muted"
            )}
          >
            لم يبدأ ({notStartedCount})
          </Button>
        </div>

        {/* قائمة السور */}
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-2">
            {filteredSurahs.map((surah) => {
              const surahProgress = progress.find(p => p.surahId === surah.id);
              const progressPercent = calculateProgress(
                surahProgress?.versesMemorized || 0,
                surah.verses
              );
              const strength = getStrengthLevel(surahProgress?.strength || 0);
              const isSelected = currentSurah === surah.id;

              return (
                <button
                  key={surah.id}
                  onClick={() => handleSelectSurah(surah.id)}
                  className={cn(
                    "w-full p-3 rounded-lg transition-all duration-200 text-right",
                    "border border-transparent hover:border-gold/30",
                    isSelected 
                      ? "bg-gold/10 border-gold/50" 
                      : "bg-secondary/50 hover:bg-secondary"
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1">
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold",
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
                          <span className="font-semibold text-foreground truncate">
                            {surah.name}
                          </span>
                          {getStatusIcon(surahProgress?.status || 'not_started')}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{surah.verses} آية</span>
                          <span>•</span>
                          <span>{surah.pages} صفحة</span>
                          <span>•</span>
                          <span className={surah.type === 'meccan' ? 'text-gold' : 'text-emerald-bright'}>
                            {surah.type === 'meccan' ? 'مكية' : 'مدنية'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {surahProgress?.status !== 'not_started' && (
                        <div className="text-left">
                          <div className="text-sm font-medium text-foreground">
                            {progressPercent}%
                          </div>
                          <div className={cn("text-xs", strength.color)}>
                            {strength.label}
                          </div>
                        </div>
                      )}
                      <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  {surahProgress?.status !== 'not_started' && (
                    <div className="mt-2 h-1.5 bg-background rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full transition-all duration-300",
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
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
