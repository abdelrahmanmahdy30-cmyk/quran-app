"use client";

import { usePlanProgress } from "@/lib/use-plan-progress";
import { selectCompletedJuzCount } from "@/lib/unified-plan-store";
import { Card, CardContent } from "@/components/ui/card";

export function ProgressRing() {
  const { percentTotal, pagesDone, record, completedDaysCount } = usePlanProgress();
  const completedJuz = selectCompletedJuzCount(record);

  const size = 220;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentTotal / 100) * circumference;

  return (
    <Card className="overflow-hidden border border-border/80 bg-card/90 shadow-lg shadow-black/5 backdrop-blur">
      <CardContent className="relative pt-7">
        <div className="flex flex-col items-center">
          {/* الدائرة الرئيسية */}
          <div className="relative">
            <svg width={size} height={size} className="transform -rotate-90">
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="var(--secondary)"
                strokeWidth={strokeWidth}
              />
              <defs>
                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#d4af37" />
                </linearGradient>
              </defs>
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="url(#progressGradient)"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>

            {/* النص داخل الدائرة بنسبة موحدة وأرقام لاتينية */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-mono text-4xl font-extrabold text-foreground tracking-tight">
                {percentTotal}%
              </span>
              <span className="text-xs text-muted-foreground mt-1 font-mono">
                {pagesDone} من 604 صفحة
              </span>
            </div>
          </div>

          {/* تفاصيل إضافية مستمدة حصرياً من السجل الموحد */}
          <div className="grid grid-cols-2 gap-4 w-full mt-6 pt-4 border-t border-border">
            <div className="text-center">
              <p className="font-mono text-lg font-bold text-emerald-400">{completedDaysCount}</p>
              <p className="text-xs text-muted-foreground">يوم مكتمل</p>
            </div>
            <div className="text-center">
              <p className="font-mono text-lg font-bold text-gold">{completedJuz}</p>
              <p className="text-xs text-muted-foreground">جزء مكتمل</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
