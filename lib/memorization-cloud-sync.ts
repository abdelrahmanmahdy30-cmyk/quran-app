"use client";

import { createClient, isSupabaseConfigured } from "./supabase/client";
import { useMemorizationStore } from "./memorization-store";
import { surahs, type MemorizationProgress, type DailyGoal, type UserStats } from "./quran-data";

let debounceTimer: NodeJS.Timeout | null = null;
let isHydrating = false;

/**
 * جلب بيانات الحفظ من Supabase ومزامنتها مع Zustand محلياً
 */
export async function hydrateMemorizationFromCloud(): Promise<void> {
  if (typeof window === "undefined" || !isSupabaseConfigured()) return;

  try {
    const supabase = createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      // المستخدم غير مسجل دخول — نعتمد على التخزين المحلي فقط
      return;
    }

    // جلب الملف الشخصي وتحديث الاسم المحلي
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, first_name, father_name, family_name")
      .eq("id", user.id)
      .maybeSingle();

    if (profile) {
      const storedProfile = {
        firstName: profile.first_name || "",
        fatherName: profile.father_name || "",
        familyName: profile.family_name || "",
      };
      try {
        localStorage.setItem("quran-browser-profile", JSON.stringify(storedProfile));
        window.dispatchEvent(new Event("storage"));
      } catch {
        // ignore storage errors
      }
    }

    // جلب بيانات التقدم من السحابة
    const [progressRes, goalsRes, statsRes] = await Promise.all([
      supabase
        .from("quran_progress")
        .select("surah_id, verses_memorized, strength, status, memorized_at, last_review")
        .eq("user_id", user.id),
      supabase
        .from("quran_daily_goals")
        .select("goal_date, target_verses, completed_verses, target_review, completed_review")
        .eq("user_id", user.id)
        .order("goal_date", { ascending: true })
        .limit(60),
      supabase
        .from("quran_user_stats")
        .select("total_verses_memorized, total_pages, current_streak, longest_streak, start_date, target_end_date, daily_average, weekly_progress")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

    const cloudProgress = progressRes.data;
    const cloudGoals = goalsRes.data;
    const cloudStats = statsRes.data;

    const currentStore = useMemorizationStore.getState();
    const hasLocalWork = currentStore.stats.totalVersesMemorized > 0;
    const hasCloudWork = (cloudProgress && cloudProgress.length > 0) || (cloudStats && cloudStats.total_verses_memorized > 0);

    // إذا لم تكن هناك بيانات على السحابة ولكن يوجد تقدم محلي (مثلاً بعد تسجيل حساب جديد)، نرفع البيانات للسحابة فوراً
    if (!hasCloudWork && hasLocalWork) {
      await syncMemorizationToCloud();
      return;
    }

    // إذا كانت هناك بيانات على السحابة، نقوم بدمجها وترقيتها إلى Zustand
    if (hasCloudWork && cloudProgress) {
      isHydrating = true;
      try {
        const cloudProgressMap = new Map((cloudProgress as any[]).map((row: any) => [row.surah_id, row]));

        const mergedProgress: MemorizationProgress[] = surahs.map((surah) => {
          const row: any = cloudProgressMap.get(surah.id);
          if (row) {
            return {
              surahId: surah.id,
              versesMemorized: row.verses_memorized,
              status: row.status as MemorizationProgress["status"],
              strength: row.strength,
              memorizedAt: row.memorized_at ? new Date(row.memorized_at).toISOString() : null,
              lastReview: row.last_review ? new Date(row.last_review) : null,
              reviewHistory: [],
            };
          }
          // إذا لم توجد في السحابة، نبقي على الحالة الافتراضية
          return {
            surahId: surah.id,
            versesMemorized: 0,
            status: "not_started" as const,
            strength: 0,
            memorizedAt: null,
            lastReview: null,
            reviewHistory: [],
          };
        });

        // دمج الأهداف اليومية
        let mergedGoals: DailyGoal[] = currentStore.dailyGoals;
        if (cloudGoals && cloudGoals.length > 0) {
          mergedGoals = (cloudGoals as any[]).map((g: any) => ({
            date: g.goal_date,
            targetVerses: g.target_verses,
            completedVerses: g.completed_verses,
            targetReview: g.target_review,
            completedReview: g.completed_review,
          }));
        }

        // دمج الإحصائيات
        let mergedStats: UserStats = currentStore.stats;
        if (cloudStats) {
          mergedStats = {
            totalVersesMemorized: cloudStats.total_verses_memorized ?? currentStore.stats.totalVersesMemorized,
            totalPages: cloudStats.total_pages ?? currentStore.stats.totalPages,
            currentStreak: cloudStats.current_streak ?? currentStore.stats.currentStreak,
            longestStreak: cloudStats.longest_streak ?? currentStore.stats.longestStreak,
            startDate: cloudStats.start_date ?? currentStore.stats.startDate,
            targetEndDate: cloudStats.target_end_date ?? currentStore.stats.targetEndDate,
            dailyAverage: Number(cloudStats.daily_average ?? currentStore.stats.dailyAverage),
            weeklyProgress: Array.isArray(cloudStats.weekly_progress)
              ? (cloudStats.weekly_progress as number[])
              : currentStore.stats.weeklyProgress,
          };
        }

        useMemorizationStore.setState({
          progress: mergedProgress,
          dailyGoals: mergedGoals,
          stats: mergedStats,
        });
      } finally {
        setTimeout(() => {
          isHydrating = false;
        }, 100);
      }
    }
  } catch (err) {
    // فشل هادئ لا يمنع عمل الموقع دون اتصال
    console.warn("[Hafiz Cloud Sync] Unable to hydrate from cloud:", err);
  }
}

/**
 * رفع الحالة الحالية إلى Supabase مع حماية بالـ debounce
 */
export async function syncMemorizationToCloud(): Promise<void> {
  if (typeof window === "undefined" || isHydrating || !isSupabaseConfigured()) return;

  try {
    const supabase = createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return; // غير مسجل دخول، لا حاجة للمزامنة السحابية
    }

    const { progress, dailyGoals, stats } = useMemorizationStore.getState();

    // 1. مزامنة تقدم السور (فقط السور التي بدأ حفظها لتقليل حجم البيانات)
    const activeProgress = progress.filter((p) => p.status !== "not_started" || p.versesMemorized > 0);
    if (activeProgress.length > 0) {
      const rows = activeProgress.map((p) => ({
        user_id: user.id,
        surah_id: p.surahId,
        verses_memorized: p.versesMemorized,
        strength: p.strength,
        status: p.status,
        memorized_at: p.memorizedAt ? new Date(p.memorizedAt).toISOString() : null,
        last_review: p.lastReview ? new Date(p.lastReview).toISOString() : null,
      }));

      await supabase.from("quran_progress").upsert(rows, { onConflict: "user_id,surah_id" });
    }

    // 2. مزامنة الأهداف اليومية (آخر 30 يوم)
    if (dailyGoals.length > 0) {
      const recentGoals = dailyGoals.slice(-30).map((g) => ({
        user_id: user.id,
        goal_date: g.date,
        target_verses: g.targetVerses,
        completed_verses: g.completedVerses,
        target_review: g.targetReview,
        completed_review: g.completedReview,
      }));

      await supabase.from("quran_daily_goals").upsert(recentGoals, { onConflict: "user_id,goal_date" });
    }

    // 3. مزامنة الإحصائيات العامة
    await supabase.from("quran_user_stats").upsert(
      {
        user_id: user.id,
        total_verses_memorized: stats.totalVersesMemorized,
        total_pages: stats.totalPages,
        current_streak: stats.currentStreak,
        longest_streak: stats.longestStreak,
        start_date: stats.startDate,
        target_end_date: stats.targetEndDate,
        daily_average: stats.dailyAverage,
        weekly_progress: stats.weeklyProgress,
      },
      { onConflict: "user_id" }
    );
  } catch (err) {
    console.warn("[Hafiz Cloud Sync] Sync failed:", err);
  }
}

/**
 * بدء الاستماع ومزامنة السحابة تلقائياً
 */
export function startMemorizationCloudSync(): () => void {
  if (typeof window === "undefined" || !isSupabaseConfigured()) return () => {};

  // تشغيل الجلب الأولي فور التحميل
  hydrateMemorizationFromCloud();

  // مراقبة تسجيل الدخول والخروج من Supabase
  const supabase = createClient();
  const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange((event: any) => {
    if (event === "SIGNED_IN" || event === "USER_UPDATED") {
      hydrateMemorizationFromCloud();
    }
  });

  // مراقبة أي تحديثات على الـ Zustand Store وجدولة حفظ سحابي مع Debounce
  const unsubStore = useMemorizationStore.subscribe(() => {
    if (isHydrating) return;
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      syncMemorizationToCloud();
    }, 600);
  });

  return () => {
    authSub.unsubscribe();
    unsubStore();
    if (debounceTimer) clearTimeout(debounceTimer);
  };
}
