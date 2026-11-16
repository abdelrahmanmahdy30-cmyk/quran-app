import { redirect } from "next/navigation"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight, ChevronLeft, Mail, ShieldCheck, Users } from "lucide-react"

const ADMIN_EMAIL = "abdelrahmanmahdy700@gmail.com"

type Profile = {
  id: string
  display_name: string | null
  created_at: string
}

type Account = {
  id: string
  email: string
  createdAt: string
  confirmed: boolean
  displayName: string
}

export default async function AdminAccountsPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email?.toLowerCase() !== ADMIN_EMAIL) {
    redirect("/")
  }

  const adminClient = createSupabaseClient(
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )

  const [{ data: usersData, error: usersError }, { data: profiles, error: profilesError }] = await Promise.all([
    adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    adminClient.from("profiles").select("id,display_name,created_at").order("created_at", { ascending: false }),
  ])

  if (usersError || profilesError) {
    throw new Error("تعذر تحميل بيانات الحسابات")
  }

  const profileById = new Map((profiles as Profile[]).map((profile) => [profile.id, profile]))
  const accounts: Account[] = usersData.users.map((account) => {
    const metadata = account.user_metadata as Record<string, string | undefined>
    const profile = profileById.get(account.id)
    const displayName = profile?.display_name || metadata.display_name || [metadata.first_name, metadata.father_name, metadata.family_name].filter(Boolean).join(" ") || "بدون اسم"

    return {
      id: account.id,
      email: account.email ?? "بدون بريد",
      createdAt: account.created_at,
      confirmed: Boolean(account.email_confirmed_at),
      displayName,
    }
  })

  return (
    <main dir="rtl" className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" aria-label="العودة للرئيسية">
            <Link href="/"><ArrowRight className="h-5 w-5" /></Link>
          </Button>
          <div>
            <p className="text-sm text-muted-foreground">لوحة الإدارة</p>
            <h1 className="text-2xl font-bold">الحسابات المسجلة</h1>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-gold/20 bg-gold/10 px-4 py-2 text-sm text-gold">
          <ShieldCheck className="h-4 w-4" /> المدير: {ADMIN_EMAIL}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-gold/20">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-xl bg-gold/10 p-3 text-gold"><Users className="h-5 w-5" /></div>
            <div><p className="text-sm text-muted-foreground">إجمالي الحسابات</p><p className="text-2xl font-bold">{accounts.length}</p></div>
          </CardContent>
        </Card>
        <Card className="border-emerald-500/20">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-600"><ShieldCheck className="h-5 w-5" /></div>
            <div><p className="text-sm text-muted-foreground">حسابات مفعّلة</p><p className="text-2xl font-bold">{accounts.filter((account) => account.confirmed).length}</p></div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border">
        <CardHeader><CardTitle>كل الحسابات</CardTitle></CardHeader>
        <CardContent>
          {accounts.length === 0 ? (
            <div className="rounded-xl bg-secondary/60 p-8 text-center text-muted-foreground">لا توجد حسابات مسجلة حتى الآن.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-right text-sm">
                <thead><tr className="border-b border-border text-muted-foreground"><th className="p-3 font-medium">الاسم</th><th className="p-3 font-medium">البريد الإلكتروني</th><th className="p-3 font-medium">تاريخ التسجيل</th><th className="p-3 font-medium">الحالة</th></tr></thead>
                <tbody>
                  {accounts.map((account) => (
                    <tr key={account.id} className="border-b border-border/60 last:border-0">
                      <td className="p-3 font-medium"><Link className="inline-flex items-center gap-1 hover:text-gold" href={`/admin/accounts/${account.id}`}>{account.displayName}<ChevronLeft className="h-4 w-4" /></Link></td>
                      <td className="p-3"><span className="inline-flex items-center gap-2" dir="ltr"><Mail className="h-4 w-4 text-muted-foreground" />{account.email}</span></td>
                      <td className="p-3 text-muted-foreground">{new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium" }).format(new Date(account.createdAt))}</td>
                      <td className="p-3"><span className={account.confirmed ? "rounded-full bg-emerald-500/10 px-3 py-1 text-emerald-600" : "rounded-full bg-amber-500/10 px-3 py-1 text-amber-600"}>{account.confirmed ? "مفعّل" : "بانتظار التفعيل"}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
