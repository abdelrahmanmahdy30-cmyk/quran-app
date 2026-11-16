"use client";

import { useState, useEffect, useCallback } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { QURAN_EDITIONS } from "@/lib/quran-editions";
import {
  loadUnifiedRecord,
  exportPlanAsJson,
  importPlanFromJson,
  updatePlanStartDate,
  formatLocalDateStr,
  getAllPlanDays,
} from "@/lib/unified-plan-store";
import type { StudyDay } from "@/lib/six-month-plan-types";
import { usePlanProgress } from "@/lib/use-plan-progress";
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
  Award,
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
  // ─── Unified plan data ────────────────────────────────────────────────────
  const {
    record,
    allDays,
    khatmaDate,
    dailyQuota,
    daysRemaining,
    resetProgress,
  } = usePlanProgress();

  // ─── Import / export state ────────────────────────────────────────────────
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // ─── Preference state (UI-only, stored in localStorage) ───────────────────
  const [editionId, setEditionId] = useState("madinah_604");
  const [memorizeDaysPerWeek, setMemorizeDaysPerWeek] = useState(6);
  const [userLevel, setUserLevel] = useState("intermediate");
  const [dailyAvailableMinutes, setDailyAvailableMinutes] = useState(45);
  const [hasPriorMemorization, setHasPriorMemorization] = useState(false);

  // ─── Plan start-date (writable) ───────────────────────────────────────────
  const [startDate, setStartDate] = useState<string>(record.startDate);

  // ─── Notifications (localStorage only) ───────────────────────────────────
  const [notifications, setNotifications] = useState(true);
  const [reminderTime, setReminderTime] = useState("06:00");
  const [reviewReminder, setReviewReminder] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // ─── Sync startDate when record changes (e.g. after import) ──────────────
  useEffect(() => {
    setStartDate(record.startDate);
  }, [record.startDate]);

  // ─── Load UI prefs from localStorage once ─────────────────────────────────
  useEffect(() => {
    try {
      const savedNotifs = localStorage.getItem("hafiz-settings-notifications");
      if (savedNotifs) {
        const parsed = JSON.parse(savedNotifs) as {
          notifications?: boolean;
          reminderTime?: string;
          reviewReminder?: boolean;
        };
        if (typeof parsed.notifications === "boolean") setNotifications(parsed.notifications);
        if (parsed.reminderTime) setReminderTime(parsed.reminderTime);
        if (typeof parsed.reviewReminder === "boolean") setReviewReminder(parsed.reviewReminder);
      }

      const savedPrefs = localStorage.getItem("hafiz-settings-prefs");
      if (savedPrefs) {
        const prefs = JSON.parse(savedPrefs) as {
          editionId?: string;
          memorizeDaysPerWeek?: number;
          userLevel?: string;
          dailyAvailableMinutes?: number;
          hasPriorMemorization?: boolean;
        };
        if (prefs.editionId) setEditionId(prefs.editionId);
        if (prefs.memorizeDaysPerWeek) setMemorizeDaysPerWeek(prefs.memorizeDaysPerWeek);
        if (prefs.userLevel) setUserLevel(prefs.userLevel);
        if (prefs.dailyAvailableMinutes) setDailyAvailableMinutes(prefs.dailyAvailableMinutes);
        if (typeof prefs.hasPriorMemorization === "boolean")
          setHasPriorMemorization(prefs.hasPriorMemorization);
      }
    } catch {}
  }, []);

  // ─── Export unified JSON ──────────────────────────────────────────────────
  const exportUnifiedJson = useCallback(() => {
    const latestRecord = loadUnifiedRecord();
    const content = exportPlanAsJson(latestRecord);
    const blob = new Blob([content], { type: "application/json;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hafiz-unified-plan-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  // ─── Import JSON ──────────────────────────────────────────────────────────
  const handleImportJson = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
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
  }, []);

  // ─── Export CSV (progress summary from unified record) ───────────────────
  const exportCsv = useCallback(() => {
    const latestRecord = loadUnifiedRecord();
    const days = getAllPlanDays(latestRecord);
    const header = "اليوم,التاريخ,الصفحات,مكتمل";
    const rows = days.map((d, i) => {
      const done = latestRecord.steps[d.date] !== undefined;
      const pageNums = d.type === "study" ? (d as StudyDay).newPages.join("،") : "راحة";
      return `${i + 1},${d.date},"${pageNums}",${done ? "نعم" : "لا"}`;
    });
    const content = [header, ...rows].join("\n");
    const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "hafiz-progress.csv";
    link.click();
    URL.revokeObjectURL(url);
  }, []);

  // ─── Save settings ────────────────────────────────────────────────────────
  const handleSave = useCallback(() => {
    // 1. Update startDate in unified store (only if changed)
    const latestRecord = loadUnifiedRecord();
    if (startDate && startDate !== latestRecord.startDate) {
      updatePlanStartDate(latestRecord, startDate);
    }

    // 2. Save notification prefs
    try {
      localStorage.setItem(
        "hafiz-settings-notifications",
        JSON.stringify({ notifications, reminderTime, reviewReminder })
      );
      if (
        notifications &&
        typeof window !== "undefined" &&
        "Notification" in window &&
        Notification.permission === "default"
      ) {
        Notification.requestPermission();
      }
    } catch {}

    // 3. Save UI prefs
    try {
      localStorage.setItem(
        "hafiz-settings-prefs",
        JSON.stringify({
          editionId,
          memorizeDaysPerWeek,
          userLevel,
          dailyAvailableMinutes,
          hasPriorMemorization,
        })
      );
    } catch {}

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  }, [
    startDate,
    notifications,
    reminderTime,
    reviewReminder,
    editionId,
    memorizeDaysPerWeek,
    userLevel,
    dailyAvailableMinutes,
    hasPriorMemorization,
  ]);

  // ─── Derived display values from unified store ────────────────────────────
  const planDurationDays = allDays.length; // دائماً 181 يوماً
  const planMonthsDisplay = Math.round(planDurationDays / 30); // ≈ 6 أشهر

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

        {/* ملخص الخطة الحالية */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-gold" />
              ملخص الخطة الحالية
            </CardTitle>
            <CardDescription>
              بيانات حية من السجل الموحد — تتطابق مع لوحة التحكم والخطة والإحصائيات
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div className="p-3 rounded-xl bg-secondary/40 border border-border">
                <p className="text-xs text-muted-foreground mb-1">تاريخ البداية</p>
                <p className="text-sm font-bold text-foreground">{record.startDate}</p>
              </div>
              <div className="p-3 rounded-xl bg-secondary/40 border border-border">
                <p className="text-xs text-muted-foreground mb-1">تاريخ الختمة</p>
                <p className="text-sm font-bold text-gold">{khatmaDate}</p>
              </div>
              <div className="p-3 rounded-xl bg-secondary/40 border border-border">
                <p className="text-xs text-muted-foreground mb-1">الورد اليومي</p>
                <p className="text-sm font-bold text-foreground">{dailyQuota} صفحة</p>
              </div>
              <div className="p-3 rounded-xl bg-secondary/40 border border-border">
                <p className="text-xs text-muted-foreground mb-1">الأيام المتبقية</p>
                <p className="text-sm font-bold text-foreground">{daysRemaining} يوم</p>
              </div>
            </div>
          </CardContent>
        </Card>

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
            {/* تخصيص نقطة البداية */}
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

            {/* طبعة المصحف */}
            <div className="space-y-2">
              <Label className="text-foreground flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-gold" />
                طبعة المصحف المعتمدة
              </Label>
              <Select value={editionId} onValueChange={(v) => setEditionId(v)}>
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

            {/* الهدف اليومي للحفظ (عرض من المتجر الموحد) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-foreground">الورد اليومي (من الخطة الموحدة)</Label>
                <span className="text-lg font-bold text-gold">{dailyQuota} صفحة</span>
              </div>
              <p className="text-xs text-muted-foreground">
                محسوب تلقائياً بناءً على خطة {planDurationDays} يوماً (~{planMonthsDisplay} أشهر)
              </p>
            </div>

            {/* أيام الحفظ أسبوعياً ومستوى المستخدم */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-foreground">أيام الحفظ أسبوعياً (تفضيل)</Label>
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

              <div className="space-y-2">
                <Label className="text-foreground">مستوى الحفظ الحالي</Label>
                <Select value={userLevel} onValueChange={(v) => setUserLevel(v)}>
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
            </div>

            {/* الوقت اليومي المتاح */}
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

            {/* تاريخ البداية (قابل للتعديل) */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-foreground">تاريخ البداية</Label>
                <Input
                  type="date"
                  value={startDate}
                  max={formatLocalDateStr()}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-secondary border-border"
                />
                <p className="text-xs text-muted-foreground">
                  لا يمكن اختيار تاريخ مستقبلي. تغيير التاريخ يُعيد حساب الجدول.
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">تاريخ الختمة (محسوب)</Label>
                <Input
                  type="date"
                  value={khatmaDate}
                  readOnly
                  className="bg-secondary/50 border-border opacity-70 cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground">
                  مشتق تلقائياً من الخطة الموحدة (181 يوم دراسي)
                </p>
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

        {/* إعدادات التنبيهات */}
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

        {/* إدارة البيانات */}
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
              <Button variant="outline" onClick={exportUnifiedJson} className="gap-2 border-gold/40 text-gold hover:bg-gold/10">
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
              <Button variant="outline" onClick={exportCsv} className="gap-2 border-border text-xs">
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
