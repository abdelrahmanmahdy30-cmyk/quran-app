"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePlanProgress } from "@/lib/use-plan-progress";
import { getWeekDays } from "@/lib/plan-ui-helpers";
import { StudyDay } from "@/lib/six-month-plan-types";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

export function WeeklyChart() {
  const { record, allDays, todayLocalDate } = usePlanProgress();

  const weeklyData = useMemo(() => {
    const weekDays = getWeekDays(allDays, todayLocalDate);
    return weekDays.map((d) => {
      const stepState = record.steps[d.date];
      let memorizedPages = 0;
      let reviewedPages = 0;

      if (d.type === "study") {
        const sDay = d as StudyDay;
        if (stepState?.new && sDay.newPages) {
          memorizedPages = sDay.newPages.length;
        }
        if (stepState?.near && sDay.nearPages) {
          reviewedPages += sDay.nearPages.length;
        }
        if (stepState?.far && sDay.farPages) {
          reviewedPages += sDay.farPages.length;
        }
      } else if (d.type === "friday") {
        if (stepState?.near && d.nearPages) {
          reviewedPages += d.nearPages.length;
        }
        if (stepState?.far && d.farPages) {
          reviewedPages += d.farPages.length;
        }
      }

      return {
        day: d.dayName,
        memorized: memorizedPages,
        reviewed: reviewedPages,
      };
    });
  }, [allDays, record.steps, todayLocalDate]);

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-lg text-foreground">أداء الأسبوع (بالصفحات)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis 
                dataKey="day" 
                tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                axisLine={{ stroke: 'var(--border)' }}
                tickLine={{ stroke: 'var(--border)' }}
              />
              <YAxis 
                tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                axisLine={{ stroke: 'var(--border)' }}
                tickLine={{ stroke: 'var(--border)' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  direction: 'rtl',
                }}
                labelStyle={{ color: 'var(--foreground)' }}
                cursor={{ fill: 'var(--muted)', opacity: 0.2 }}
                formatter={(value: any, name: any) => [
                  `${value} صفحات`,
                  name === 'memorized' ? 'الحفظ' : 'المراجعة'
                ]}
              />
              <Legend 
                wrapperStyle={{ direction: 'rtl' }}
                formatter={(value) => (
                  <span style={{ color: 'var(--foreground)', marginRight: '8px' }}>
                    {value === 'memorized' ? 'الحفظ' : 'المراجعة'}
                  </span>
                )}
              />
              <Bar 
                dataKey="memorized" 
                name="memorized"
                fill="var(--gold)"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
              <Bar 
                dataKey="reviewed" 
                name="reviewed"
                fill="var(--emerald)"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
