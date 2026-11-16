import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { ArrowRight, CalendarDays, CheckCircle2, ClipboardList, History, Mail, ShieldCheck } from "lucide-react"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatArabicDate } from "@/lib/date-utils"

const ADMIN_EMAIL = "abdelrahmanmahdy700@gmail.com"

export default async function AccountDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerClient()
  const { data: { user: admin } } = await supabase.auth.getUser()
  if (!admin || admin.email?.toLowerCase() !== ADMIN_EMAIL) redirect("/")

  const adminClient = createSupabaseClient(
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )

  const [{ data: account }, { data: profile }, { data: progress }, { data: history }, { data: goals }, { data: stats }] = await Promise.all([
    adminClient.auth.admin.getUserById(id),
    adminClient.from("profiles").select("display_name,created_at").eq("id", id).maybeSingle(),
    adminClient.from("quran_progress").select("surah_id,verses_memorized,memorized_at,last_review,strength,status").eq("user_id", id).order("surah_id"),
    adminClient.from("quran_review_history").select("surah_id,event_date,verses,strength,event_type").eq("user_id", id).order("event_date", { ascending: false }),
    adminClient.from("quran_daily_goals").select("goal_date,target_verses,completed_verses,target_review,completed_review").eq("user_id", id).order("goal_date", { ascending: false }).limit(30),
    adminClient.from("quran_user_stats").select("total_verses_memorized,total_pages,current_streak,longest_streak,start_date,target_end_date,daily_average").eq("user_id", id).maybeSingle(),
  ])

  if (!account.user) notFound()
  const metadata = account.user.user_metadata as Record<string, string | undefined>
  const name = profile?.display_name || [metadata.first_name, metadata.father_name, metadata.family_name].filter(Boolean).join(" ") || "بدون اسم"
  const memorized = progress?.filter((item) => item.status === "memorized").length ?? 0

  return (
    <main dir="rtl" className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" aria-label="العودة للحسابات"><Link href="/admin/accounts"><ArrowRight className="h-5 w-5" /></Link></Button>
          <div><p className="text-sm text-muted-foreground">تفاصيل الحساب</p><h1 className="text-2xl font-bold">كل تقدم {name}</h1></div>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/10 px-4 py-2 text-sm text-gold"><ShieldCheck className="h-4 w-4" /> عرض المدير</span>
      </div>

      <Card className="border-gold/20"><CardContent className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
        <Info icon={<Mail className="h-4 w-4" />} label="البريد" value={account.user.email ?? "بدون بريد"} ltr />
        <Info label="تاريخ التسجيل" value={formatArabicDate(account.user.created_at)} />
        <Info label="السور المحفوظة" value={`${memorized}`} />
        <Info label="آخر دخول" value={formatArabicDate(account.user.last_sign_in_at)} />
      </CardContent></Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="إجمالي الآيات" value={stats?.total_verses_memorized ?? 0} />
        <Metric label="إجمالي الصفحات" value={stats?.total_pages ?? 0} />
        <Metric label="التتابع الحالي" value={`${stats?.current_streak ?? 0} يوم`} />
        <Metric label="إجمالي الأحداث" value={history?.length ?? 0} />
      </div>

      <Card><CardHeader><CardTitle className="flex items-center gap-2"><ClipboardList className="h-5 w-5 text-gold" /> تقدم كل سورة</CardTitle></CardHeader><CardContent>
        <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-right text-sm"><thead><tr className="border-b text-muted-foreground"><th className="p-3">السورة</th><th className="p-3">الآيات</th><th className="p-3">الحالة</th><th className="p-3">القوة</th><th className="p-3">تاريخ الحفظ</th><th className="p-3">آخر مراجعة</th></tr></thead><tbody>
          {(progress ?? []).map((item) => <tr key={item.surah_id} className="border-b last:border-0"><td className="p-3 font-medium">سورة رقم {item.surah_id}</td><td className="p-3">{item.verses_memorized}</td><td className="p-3">{item.status === "memorized" ? "محفوظة" : item.status === "in_progress" ? "قيد الحفظ" : item.status === "needs_review" ? "تحتاج مراجعة" : "لم تبدأ"}</td><td className="p-3">{item.strength}%</td><td className="p-3 text-muted-foreground">{formatArabicDate(item.memorized_at)}</td><td className="p-3 text-muted-foreground">{formatArabicDate(item.last_review)}</td></tr>)}
        </tbody></table></div>
        {(progress ?? []).length === 0 && <p className="py-8 text-center text-muted-foreground">لم يسجل هذا الحساب أي تقدم بعد.</p>}
      </CardContent></Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><History className="h-5 w-5 text-gold" /> سجل الحفظ والمراجعة بالتفصيل</CardTitle></CardHeader><CardContent className="space-y-3">
          {(history ?? []).map((item, index) => <div key={`${item.surah_id}-${item.event_date}-${index}`} className="rounded-xl bg-secondary/60 p-3"><div className="flex items-center justify-between gap-3"><span className="font-medium">سورة رقم {item.surah_id} — {item.event_type === "memorization" ? "حفظ" : "مراجعة"}</span><span className="text-xs text-muted-foreground">{formatArabicDate(item.event_date, true)}</span></div><p className="mt-1 text-sm text-muted-foreground">{item.verses} آية · قوة التثبيت {item.strength}%</p></div>)}
          {(history ?? []).length === 0 && <p className="py-8 text-center text-muted-foreground">لا يوجد سجل أحداث.</p>}
        </CardContent></Card>

        <Card><CardHeader><CardTitle className="flex items-center gap-2"><CalendarDays className="h-5 w-5 text-gold" /> الأهداف اليومية</CardTitle></CardHeader><CardContent className="space-y-3">
          {(goals ?? []).map((goal) => <div key={goal.goal_date} className="flex items-center justify-between rounded-xl bg-secondary/60 p-3"><div><p className="font-medium">{formatArabicDate(goal.goal_date)}</p><p className="text-sm text-muted-foreground">حفظ: {goal.completed_verses}/{goal.target_verses} · مراجعة: {goal.completed_review}/{goal.target_review}</p></div><CheckCircle2 className={(goal.completed_verses >= goal.target_verses && goal.completed_review >= goal.target_review) ? "h-5 w-5 text-emerald-600" : "h-5 w-5 text-muted-foreground"} /></div>)}
          {(goals ?? []).length === 0 && <p className="py-8 text-center text-muted-foreground">لا توجد أهداف يومية مسجلة.</p>}
        </CardContent></Card>
      </div>
    </main>
  )
}

function Info({ label, value, icon, ltr }: { label: string; value: string; icon?: React.ReactNode; ltr?: boolean }) {
  return <div className="rounded-xl bg-secondary/60 p-4"><p className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">{icon}{label}</p><p className="font-medium" dir={ltr ? "ltr" : undefined}>{value}</p></div>
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-bold">{value}</p></CardContent></Card>
}
