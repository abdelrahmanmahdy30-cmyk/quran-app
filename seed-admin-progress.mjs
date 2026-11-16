import fs from "node:fs"
import { createClient } from "@supabase/supabase-js"

for (const file of [".env.local", ".env"] ) {
  const path = `/vercel/share/v0-project/${file}`
  if (!fs.existsSync(path)) continue
  for (const line of fs.readFileSync(path, "utf8").split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^['\"]|['\"]$/g, "")
  }
}

const source = fs.readFileSync("/vercel/share/v0-project/lib/memorization-store.ts", "utf8")
const block = source.match(/const importedProgress:[\s\S]*?= \{([\s\S]*?)\n\};/)
if (!block) throw new Error("تعذر قراءة بيانات التقدم المستوردة")
const rows = [...block[1].matchAll(/(\d+): \{ verses: (\d+), memorizedAt: '([^']+)', strength: (\d+) \}/g)].map(([, surah, verses, date, strength]) => ({ surah_id: Number(surah), verses_memorized: Number(verses), memorized_at: `${date}T12:00:00.000Z`, strength: Number(strength), status: "in_progress", last_review: null }))
const supabase = createClient(process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })
const { data: users, error: usersError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
if (usersError) throw usersError
const admin = users.users.find((user) => user.email?.toLowerCase() === "abdelrahmanmahdy700@gmail.com")
if (!admin) throw new Error("لم يتم العثور على حساب الأدمن")
const progressRows = rows.map((row) => ({ ...row, user_id: admin.id }))
const { error: progressError } = await supabase.from("quran_progress").upsert(progressRows, { onConflict: "user_id,surah_id" })
if (progressError) throw progressError
const totalVerses = rows.reduce((sum, row) => sum + row.verses_memorized, 0)
const { error: statsError } = await supabase.from("quran_user_stats").upsert({ user_id: admin.id, total_verses_memorized: totalVerses, total_pages: 0, current_streak: 0, longest_streak: 0, start_date: "2026-03-14T12:00:00.000Z", target_end_date: "2026-07-12T12:00:00.000Z", daily_average: 0, weekly_progress: [0, 0, 0, 0, 0, 0, 0] }, { onConflict: "user_id" })
if (statsError) throw statsError
console.log(JSON.stringify({ adminId: admin.id, importedSurahs: rows.length, totalVerses }))
