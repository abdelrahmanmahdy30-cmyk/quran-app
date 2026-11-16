"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight, Mail, Save, UserRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const PROFILE_KEY = "quran-browser-profile"

type AccountDetails = {
  firstName: string
  fatherName: string
  familyName: string
}

function loadProfile(): AccountDetails {
  if (typeof window === "undefined") return { firstName: "", fatherName: "", familyName: "" }
  try {
    const raw = localStorage.getItem(PROFILE_KEY)
    if (!raw) return { firstName: "", fatherName: "", familyName: "" }
    return JSON.parse(raw) as AccountDetails
  } catch {
    return { firstName: "", fatherName: "", familyName: "" }
  }
}

export default function AccountPage() {
  const [account, setAccount] = useState<AccountDetails>({
    firstName: "",
    fatherName: "",
    familyName: "",
  })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setAccount(loadProfile())
  }, [])

  const updateField = (field: keyof AccountDetails, value: string) => {
    setAccount((current) => ({ ...current, [field]: value }))
    setSaved(false)
  }

  const saveProfile = () => {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(account))
    // نُطلق حدث storage حتى يلتقطه الـ Header في نفس التبويب
    window.dispatchEvent(new Event("storage"))
    setSaved(true)
  }

  const displayName = [account.firstName, account.fatherName, account.familyName]
    .filter(Boolean)
    .join(" ")
    .trim()

  return (
    <main dir="rtl" className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon" aria-label="العودة للرئيسية">
          <Link href="/"><ArrowRight className="h-5 w-5" /></Link>
        </Button>
        <div>
          <p className="text-sm text-muted-foreground">إدارة الحساب</p>
          <h1 className="text-2xl font-bold">بيانات حسابك</h1>
        </div>
      </div>

      <Card className="border-gold/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserRound className="h-5 w-5 text-gold" /> معلومات الحساب
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="firstName">الاسم الأول</Label>
            <Input
              id="firstName"
              value={account.firstName}
              onChange={(e) => updateField("firstName", e.target.value)}
              placeholder="اكتب اسمك الأول"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fatherName">اسم الأب</Label>
            <Input
              id="fatherName"
              value={account.fatherName}
              onChange={(e) => updateField("fatherName", e.target.value)}
              placeholder="اكتب اسم الأب"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="familyName">اسم العائلة</Label>
            <Input
              id="familyName"
              value={account.familyName}
              onChange={(e) => updateField("familyName", e.target.value)}
              placeholder="اكتب اسم العائلة"
            />
          </div>

          <Button
            type="button"
            onClick={saveProfile}
            className="gap-2 bg-gold text-background hover:bg-gold/90 sm:col-span-2"
          >
            <Save className="h-4 w-4" />
            {saved ? "✓ تم حفظ البيانات" : "حفظ الاسم"}
          </Button>

          {displayName && (
            <div className="rounded-xl bg-secondary/60 p-4 sm:col-span-2">
              <div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
                <UserRound className="h-4 w-4" /> الاسم المعروض
              </div>
              <p className="font-medium">{displayName}</p>
            </div>
          )}

          <div className="rounded-xl bg-secondary/60 p-4 sm:col-span-2">
            <div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" /> وضع التخزين
            </div>
            <p className="font-medium text-sm">محلي — محفوظ على هذا المتصفح فقط</p>
          </div>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        الاسم والبيانات محفوظة في المتصفح فقط. سيتم ربط الحساب السحابي في خطوة لاحقة.
      </p>
    </main>
  )
}
