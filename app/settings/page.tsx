"use client";

import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useMemorizationStore } from "@/lib/memorization-store";
import { QURAN_EDITIONS } from "@/lib/quran-editions";
import { surahs } from "@/lib/quran-data";
import {
  loadUnifiedRecord,
  exportPlanAsJson,
  importPlanFromJson,
} from "@/lib/unified-plan-store";
import { Upload } from "lucide-react";
import { StartPlanDialog } from "@/components/plan/start-plan-dialog";
import { 
  Settings, 
  Target,
  Compass, 
  Bell, 
  RotateCcw,
  Save,
  Clock,
  Download,
  Check,
  BookOpen,
  CalendarDays,
  ShieldAlert,
  Award
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function SettingsPage() {
  const {
    stats,
    progress,
    dailyGoals,
    planConfig,
    resetProgress,
    updatePlanSettings,
    updatePlanConfig,
    getTodaysGoal,
    activateEmergencyPause,
    deactivateEmergencyPause,
    activateBreakRecovery,
    deactivateBreakRecovery,
    activatePostCompletion,
    deactivatePostCompletion,
  } = useMemorizationStore();

    const [importStatus, setImportStatus] = useState<string | null>(null);

  const exportUnifiedJson = () => {
    const record = loadUnifiedRecord();
    const content = exportPlanAsJson(record);
    const blob = new Blob([content], { type: "application/json;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hafiz-unified-plan-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = importPlanFromJson(content);
      if (res.success) {
        setImportStatus("تم استيراد الخطة بنجاح وتحديث السجل الموحد ✓");
        setTimeout(() => setImportStatus(null), 4000);
      } else {
        setImportStatus(`فشل الاستيراد: ${res.error || "ملف غير صالح"}`);
        setTimeout(() => setImportStatus(null), 5000);
      }
    };
    reader.readAsText(file);
  };
const exportData = (format: "json" | "csv") => {
    const payload = { exportedAt: new Date().toISOString(), stats, progress, dailyGoals, planConfig };
    const content = format === "json"
      ? JSON.stringify(payload, null, 2)
      : [
          "السورة,الآيات المحفوظة,القوة,الحالة,آخر مراجعة",
          ...progress.map((item) => `${item.surahId},${item.versesMemorized},${item.strength},${item.status},${item.lastReview ?? ""}`),
        ].join("\n");
    const blob = new Blob([content], { type: format === "json" ? "application/json" : "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `hafiz-progress.${format}`;
    link.click();
    URL.revokeObjectURL(url);
  };
  
  const currentGoal = getTodaysGoal();
  const [dailyTarget, setDailyTarget] = useState(currentGoal.targetVerses || 52);
  const [planMonths, setPlanMonths] = useState(planConfig.targetDurationMonths.toString() || "4");
  const [startDate, setStartDate] = useState(stats.startDate.split("T")[0]);
  const [targetEndDate, setTargetEndDate] = useState(stats.targetEndDate.split("T")[0]);
  
  // المعايير الذكية الإضافية
  const [editionId, setEditionId] = useState(planConfig.editionId || "madinah_604");
  const [memorizeDaysPerWeek, setMemorizeDaysPerWeek] = useState(planConfig.memorizeDaysPerWeek || 6);
  const [userLevel, setUserLevel] = useState(planConfig.userLevel || "intermediate");
  const [dailyAvailableMinutes, setDailyAvailableMinutes] = useState(planConfig.dailyAvailableMinutes || 45);
  const [hasPriorMemorization, setHasPriorMemorization] = useState(planConfig.hasPriorMemorization || false);

  const [notifications, setNotifications] = useState(true);
  const [reminderTime, setReminderTime] = useState("06:00");
  const [reviewReminder, setReviewReminder] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    try {
      const savedNotifs = localStorage.getItem("hafiz-settings-notifications");
      if (savedNotifs) {
        const parsed = JSON.parse(savedNotifs);
        if (typeof parsed.notifications === "boolean") setNotifications(parsed.notifications);
        if (parsed.reminderTime) setReminderTime(parsed.reminderTime);
        if (typeof parsed.reviewReminder === "boolean") setReviewReminder(parsed.reviewReminder);
      }
    } catch {}
  }, []);

  const handlePlanMonthsChange = (months: string) => {
    setPlanMonths(months);
    const m = parseInt(months, 10);
    const start = new Date(startDate);
    const newEnd = new Date(start);
    newEnd.setMonth(newEnd.getMonth() + m);
    setTargetEndDate(newEnd.toISOString().split("T")[0]);

    const days = m * 30;
    const recommendedVerses = Math.ceil(6236 / days);
    setDailyTarget(recommendedVerses);
  };

  const handleSave = () => {
    updatePlanSettings({
      dailyTarget,
      startDate: new Date(startDate).toISOString(),
      targetEndDate: new Date(targetEndDate).toISOString(),
    });

    updatePlanConfig({
      editionId: editionId as any,
      totalPages: editionId === "shamarly_521" ? 521 : 604,
      targetDurationMonths: parseInt(planMonths, 10),
      pagesPerDay: Math.max(1, Math.round(dailyTarget / 15)),
      memorizeDaysPerWeek,
      restDays: memorizeDaysPerWeek === 5 ? [4, 5] : memorizeDaysPerWeek === 6 ? [5] : [],
      userLevel: userLevel as any,
      dailyAvailableMinutes,
      hasPriorMemorization,
      startDate,
      targetEndDate,
    });

    try {
      localStorage.setItem(
        "hafiz-settings-notifications",
        JSON.stringify({ notifications, reminderTime, reviewReminder })
      );
      if (notifications && typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
      }
    } catch {}

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <MainLayout>
      <div className="space-y-6 max-w-3xl">
        {/* العنوان */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground flex items-center gap-3">
            <Settings className="h-8 w-8 text-gold" />
            الإعدادات
          </h1>
          <p className="text-muted-foreground mt-1">
            تخصيص تجربتك وخطة حفظك ومراجعتك في تطبيق حافظ
          </p>
        </div>

        {/* إعدادات الهدف والخطة */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Target className="h-5 w-5 text-gold" />
              إعدادات الهدف والخطة
            </CardTitle>
            <CardDescription>
              تحديد هدفك اليومي للحفظ، طبعة المصحف، وتواريخ خطتك
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* تخصيص نقطة البداية (المرحلة 3.6) */}
            <div className="p-4 rounded-2xl border border-gold/30 bg-gold/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <p className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Compass className="h-4 w-4 text-gold" />
                  البداية من أي سورة — خطة مخصصة متكيفة
                </p>
                <p className="text-xs text-muted-foreground">
                  اختر أي سورة أو آية لتبدأ حفظك منها مع ضبط مراجعة ما قبل البداية وتاريخ الختمة تلقائياً.
                </p>
              </div>
              <StartPlanDialog
                trigger={
                  <Button size="sm" className="bg-gold text-background hover:bg-gold-light font-bold text-xs shrink-0">
                    <Compass className="h-3.5 w-3.5 ml-1.5" />
                    تخصيص نقطة البداية
                  </Button>
                }
              />
            </div>

            {/* طبعة المصحف المعتمدة */}
            <div className="space-y-2">
              <Label className="text-foreground flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-gold" />
                طبعة المصحف المعتمدة
              </Label>
              <Select value={editionId} onValueChange={(v) => setEditionId(v as any)}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="اختر طبعة المصحف" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="madinah_604">مصحف المدينة النبوية (604 صفحة - مجمع الملك فهد)</SelectItem>
                  <SelectItem value="shamarly_521">مصحف الشمرلي / الحرمين (521 صفحة)</SelectItem>
                  <SelectItem value="custom">طبعة مخصصة</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {QURAN_EDITIONS[editionId]?.description}
              </p>
            </div>

            {/* الهدف اليومي */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-foreground">الهدف اليومي للحفظ</Label>
                <span className="text-lg font-bold text-gold">{dailyTarget} آية (~{Math.max(1, Math.round(dailyTarget / 15))} صفحة)</span>
              </div>
              <Slider
                value={[dailyTarget]}
                onValueChange={(v) => setDailyTarget(v[0])}
                min={10}
                max={150}
                step={1}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                الموصى به لإنهاء القرآن في {planMonths} أشهر: {Math.ceil(6236 / (parseInt(planMonths, 10) * 30))} آية يومياً
              </p>
            </div>

            {/* مدة الخطة وأيام الحفظ أسبوعياً */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-foreground">مدة خطة الحفظ</Label>
                <Select value={planMonths} onValueChange={handlePlanMonthsChange}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="اختر المدة" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="3">3 أشهر (مكثف جداً)</SelectItem>
                    <SelectItem value="4">4 أشهر (مكثف)</SelectItem>
                    <SelectItem value="6">6 أشهر (متوسط)</SelectItem>
                    <SelectItem value="12">سنة كاملة (مريح)</SelectItem>
                    <SelectItem value="18">سنة ونصف (هادئ)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">أيام الحفظ أسبوعياً (وأيام الراحة)</Label>
                <Select value={memorizeDaysPerWeek.toString()} onValueChange={(v) => setMemorizeDaysPerWeek(Number(v))}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="5">5 أيام حفظ (الخميس والجمعة راحة)</SelectItem>
                    <SelectItem value="6">6 أيام حفظ (الجمعة راحة)</SelectItem>
                    <SelectItem value="7">7 أيام (حفظ يومي طوال الأسبوع)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* مستوى المستخدم والوقت اليومي المتاح */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-foreground">مستوى الحفظ الحالي</Label>
                <Select value={userLevel} onValueChange={(v) => setUserLevel(v as any)}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="beginner">مبتدئ (تكرار مكثف وتثبيت أولي)</SelectItem>
                    <SelectItem value="intermediate">متوسط (متوازن)</SelectItem>
                    <SelectItem value="advanced">متقدم (استيعاب وسرعة)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-foreground flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    الوقت اليومي المتاح
                  </Label>
                  <span className="text-xs font-bold text-gold">{dailyAvailableMinutes} دقيقة</span>
                </div>
                <Slider
                  value={[dailyAvailableMinutes]}
                  onValueChange={(v) => setDailyAvailableMinutes(v[0])}
                  min={15}
                  max={120}
                  step={5}
                />
              </div>
            </div>

            {/* تاريخ البداية والهدف */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-foreground">تاريخ البداية</Label>
                <Input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">تاريخ الهدف (الختمة)</Label>
                <Input 
                  type="date" 
                  value={targetEndDate}
                  onChange={(e) => setTargetEndDate(e.target.value)}
                  className="bg-secondary border-border"
                />
              </div>
            </div>

            {/* المحفوظ السابق */}
            <div className="p-4 rounded-xl bg-secondary/40 border border-border flex items-center justify-between">
              <div>
                <Label className="text-foreground font-semibold">هل لديك محفوظ سابق؟</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  إدراج سورك المحفوظة في المراجعة البعيدة والمتوسطة دون تكرار حفظها كجديد
                </p>
              </div>
              <Switch
                checked={hasPriorMemorization}
                onCheckedChange={setHasPriorMemorization}
              />
            </div>
          </CardContent>
        </Card>

        {/* الظروف الطارئة والاستعادة ومرحلة ما بعد الختم */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-amber-400" />
              الظروف الطارئة ومرحلة ما بعد الختم
            </CardTitle>
            <CardDescription>
              التحكم في التوقف المؤقت للظروف الطارئة، العودة بعد الانقطاع، ومرحلة تثبيت القرآن
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* التوقف الطارئ */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border">
              <div>
                <p className="text-sm font-semibold text-foreground">وضع التوقف الطارئ (سفر / مرض / عذر)</p>
                <p className="text-xs text-muted-foreground">
                  {planConfig.emergencyPause?.isActive
                    ? `نشط حالياً (السبب: ${planConfig.emergencyPause.reason})`
                    : "تجميد الخطة مؤقتاً دون احتساب إخفاق في السلسلة أو انهيار الجدول"}
                </p>
              </div>
              {planConfig.emergencyPause?.isActive ? (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => deactivateEmergencyPause()}
                >
                  استئناف الخطة
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => activateEmergencyPause("voluntary")}
                  className="border-amber-500/40 text-amber-400 hover:bg-amber-500/10"
                >
                  تفعيل التوقف
                </Button>
              )}
            </div>

            {/* العودة بعد الانقطاع */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border">
              <div>
                <p className="text-sm font-semibold text-foreground">وضع العودة بعد الانقطاع (الاستعادة التدريجية)</p>
                <p className="text-xs text-muted-foreground">
                  {planConfig.breakRecovery?.isActive
                    ? "الوضع نشط حالياً مع تخفيف الحفظ بنسبة 50%"
                    : "تشخيص مستوى المحفوظ وتخفيف الحفظ الجديد للتركيز على استقرار المراجعة"}
                </p>
              </div>
              {planConfig.breakRecovery?.isActive ? (
                <Button
                  size="sm"
                  onClick={() => deactivateBreakRecovery()}
                  className="bg-blue-500 text-white hover:bg-blue-600"
                >
                  إنهاء وضع التعافي
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => activateBreakRecovery(14)}
                  className="border-blue-500/40 text-blue-400 hover:bg-blue-500/10"
                >
                  تفعيل الاستعادة
                </Button>
              )}
            </div>

            {/* ما بعد الختم */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border">
              <div>
                <p className="text-sm font-semibold text-foreground">مرحلة تثبيت القرآن والمحافظة عليه</p>
                <p className="text-xs text-muted-foreground">
                  {planConfig.postCompletion?.isActive
                    ? `نشط حالياً: دورة ختمة كل ${planConfig.postCompletion.cycleDays} يوماً`
                    : "دورات مراجعة مستمرة لكامل القرآن بعد الختم للحفاظ عليه مدى الحياة"}
                </p>
              </div>
              {planConfig.postCompletion?.isActive ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => deactivatePostCompletion()}
                  className="border-purple-500/40 text-purple-400"
                >
                  إيقاف مؤقت
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => activatePostCompletion(30)}
                  className="border-purple-500/40 text-purple-400 hover:bg-purple-500/10"
                >
                  بدء دورة التثبيت
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* إعدادات التنبيهات الأصلية */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Bell className="h-5 w-5 text-emerald-bright" />
              التنبيهات
            </CardTitle>
            <CardDescription>
              إدارة التنبيهات والتذكيرات
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-foreground">التنبيهات اليومية</Label>
                <p className="text-xs text-muted-foreground">تذكير يومي بموعد الحفظ</p>
              </div>
              <Switch
                checked={notifications}
                onCheckedChange={setNotifications}
              />
            </div>

            {notifications && (
              <div className="space-y-2">
                <Label className="text-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  وقت التذكير
                </Label>
                <Input 
                  type="time" 
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="bg-secondary border-border w-40"
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-foreground">تذكير المراجعة</Label>
                <p className="text-xs text-muted-foreground">تنبيه عند استحقاق مراجعة قريبة أو بعيدة لسورة</p>
              </div>
              <Switch
                checked={reviewReminder}
                onCheckedChange={setReviewReminder}
              />
            </div>
          </CardContent>
        </Card>

        {/* البيانات */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-destructive" />
              إدارة البيانات
            </CardTitle>
            <CardDescription>
              إعادة تعيين أو تصدير بياناتك
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={() => exportUnifiedJson()} className="gap-2 border-gold/40 text-gold hover:bg-gold/10">
                <Download className="h-4 w-4" /> تصدير السجل الموحد (JSON)
              </Button>
              <label className="inline-flex">
                <Button variant="outline" asChild className="gap-2 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 cursor-pointer">
                  <span>
                    <Upload className="h-4 w-4" /> استيراد سجل خطة (JSON)
                  </span>
                </Button>
                <input
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={handleImportJson}
                />
              </label>
              <Button variant="outline" onClick={() => exportData("csv")} className="gap-2 border-border text-xs">
                <Download className="h-4 w-4" /> تصدير CSV
              </Button>
            </div>
            {importStatus && (
              <p className="text-xs font-semibold text-emerald-400 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                {importStatus}
              </p>
            )}
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
              <h4 className="font-medium text-foreground mb-2">إعادة تعيين التقدم</h4>
              <p className="text-sm text-muted-foreground mb-4">
                سيتم حذف جميع بيانات الحفظ والتقدم نهائياً. هذا الإجراء لا يمكن التراجع عنه.
              </p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <RotateCcw className="h-4 w-4 ml-2" />
                    إعادة التعيين
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-card border-border">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-foreground">
                      هل أنت متأكد؟
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-muted-foreground">
                      سيتم حذف جميع بيانات الحفظ والتقدم. اكتب «تأكيد» في النافذة التالية للمتابعة.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="gap-2">
                    <AlertDialogCancel className="border-border">إلغاء</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => {
                        if (window.prompt("اكتب كلمة تأكيد للمتابعة:") === "تأكيد") resetProgress();
                      }}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      نعم، إعادة التعيين
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>

        {/* زر الحفظ */}
        <div className="flex items-center justify-end gap-3">
          {savedSuccess && (
            <span className="text-sm font-medium text-emerald-bright flex items-center gap-1">
              <Check className="h-4 w-4" /> تم حفظ الإعدادات وتحديث الخطة بنجاح
            </span>
          )}
          <Button onClick={handleSave} className="bg-gold text-background hover:bg-gold/90 font-medium">
            <Save className="h-4 w-4 ml-2" />
            حفظ الإعدادات
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}
