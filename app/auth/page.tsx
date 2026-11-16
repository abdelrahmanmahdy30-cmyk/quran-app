"use client"

import { FormEvent, useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"

export default function AuthPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [firstName, setFirstName] = useState('')
  const [fatherName, setFatherName] = useState('')
  const [familyName, setFamilyName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'error' | 'success'>('error')
  const [showResend, setShowResend] = useState(false)
  const [busy, setBusy] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) router.push('/')
      setIsChecking(false)
    }
    checkAuth()
  }, [router])

  async function resendConfirmation() {
    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail) {
      setMessageType('error')
      setMessage('اكتب بريدك الإلكتروني أولًا لإعادة إرسال رسالة التفعيل.')
      return
    }

    setBusy(true)
    setMessage('')
    const supabase = createClient()
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: normalizedEmail,
      options: {
        emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ?? `${window.location.origin}/auth/callback`,
      },
    })
    setMessageType(error ? 'error' : 'success')
    setMessage(error ? 'تعذر إرسال رسالة التفعيل الآن. حاول مرة أخرى بعد قليل.' : 'تم إرسال رسالة تفعيل جديدة إلى بريدك الإلكتروني.')
    setBusy(false)
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    setShowResend(false)

    if (mode === 'signup' && (!firstName.trim() || !fatherName.trim() || !familyName.trim() || !username.trim())) {
      setMessageType('error')
      setMessage('من فضلك أكمل الاسم الأول واسم الأب واسم العائلة.')
      setBusy(false)
      return
    }

    if (mode === 'signup' && password !== confirmPassword) {
      setMessageType('error')
      setMessage('كلمات المرور غير متطابقة.')
      setBusy(false)
      return
    }

    if (password.length < 6) {
      setMessageType('error')
      setMessage('كلمة المرور يجب أن تكون 6 أحرف على الأقل.')
      setBusy(false)
      return
    }

    const supabase = createClient()
    const normalizedEmail = email.trim().toLowerCase()
    const result = mode === 'signin'
      ? await supabase.auth.signInWithPassword({ email: normalizedEmail, password })
      : await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ?? `${window.location.origin}/auth/callback`,
            data: {
              first_name: firstName.trim(),
              father_name: fatherName.trim(),
              family_name: familyName.trim(),
              display_name: `${firstName.trim()} ${fatherName.trim()} ${familyName.trim()}`.replace(/\s+/g, " ").trim(),
              username: username.trim().toLowerCase(),
            },
          },
        })

    if (result.error) {
      console.error("[v0] Supabase auth error:", result.error)
      setMessageType('error')
      const errorCode = 'code' in result.error ? result.error.code : undefined
      const errorMessage = result.error.message.toLowerCase()

      if (mode === 'signin' && (errorCode === 'email_not_confirmed' || errorMessage.includes('email not confirmed'))) {
        setShowResend(true)
        setMessage('الحساب غير مفعّل بعد. افتح رسالة التأكيد في بريدك الإلكتروني ثم حاول تسجيل الدخول مرة أخرى.')
      } else if (mode === 'signin' && (errorCode === 'invalid_credentials' || errorMessage.includes('invalid login credentials'))) {
        setMessage('البريد الإلكتروني أو كلمة المرور غير صحيحة. تأكد من كتابة البريد المستخدم عند إنشاء الحساب.')
      } else if (errorCode === 'email_address_invalid') {
        setMessage('اكتب بريدًا إلكترونيًا صحيحًا مثل name@example.com.')
      } else if (errorCode === 'user_already_exists' || errorMessage.includes('already registered') || errorMessage.includes('already been registered')) {
        setMessage('هذا البريد الإلكتروني مستخدم بالفعل. جرّب تسجيل الدخول بدلًا من إنشاء حساب جديد.')
      } else if (errorMessage.includes('username') && (errorMessage.includes('duplicate') || errorMessage.includes('taken') || errorMessage.includes('already'))) {
        setMessage('اسم المستخدم مستخدم بالفعل. اختر اسم مستخدم آخر.')
      } else if (errorCode === 'weak_password' || errorMessage.includes('weak password') || errorMessage.includes('password should')) {
        setMessage('كلمة المرور ضعيفة. استخدم 6 أحرف على الأقل مع مزيج أقوى من الحروف والأرقام.')
      } else if (errorCode === 'over_email_send_rate_limit' || errorMessage.includes('rate limit')) {
        setMessage('تم تجاوز حد إرسال الرسائل مؤقتًا. انتظر قليلًا ثم حاول مرة أخرى.')
      } else if (errorMessage.includes('password')) {
        setMessage('كلمة المرور يجب أن تكون 6 أحرف على الأقل.')
      } else {
        setMessage(mode === 'signin' ? 'تعذر تسجيل الدخول الآن. تحقق من البريد وكلمة المرور وحاول مرة أخرى.' : 'تعذر إنشاء الحساب. تحقق من البيانات وحاول مرة أخرى.')
      }
    } else if (mode === 'signup' && !result.data.session) {
      setMessageType('success')
      setMessage('تم إنشاء الحساب بنجاح! تحقق من بريدك الإلكتروني لتأكيد الحساب.')
      setTimeout(() => {
        setMode('signin')
        setFirstName('')
        setFatherName('')
        setFamilyName('')
        setEmail('')
        setPassword('')
        setConfirmPassword('')
        setMessage('')
      }, 3000)
    } else {
      router.push('/')
      router.refresh()
    }
    setBusy(false)
  }

  if (isChecking) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <Spinner />
      </main>
    )
  }

  return (
    <main dir="rtl" className="min-h-screen bg-gradient-to-br from-background via-background to-gold/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">حافظ</h1>
          <p className="text-muted-foreground">تطبيق حفظ وتتبع تقدم القرآن الكريم</p>
        </div>

        <Card className="border-border bg-card shadow-2xl">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl">
              {mode === 'signin' ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {mode === 'signin' 
                ? 'ادخل إلى حسابك لمتابعة التقدم'
                : 'أنشئ حسابًا لحفظ تقدمك على أجهزتك المختلفة'}
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              {mode === 'signup' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="auth-username" className="text-sm font-medium">اسم المستخدم</label>
                    <Input id="auth-username" required autoComplete="username" placeholder="username" value={username} onChange={(e) => setUsername(e.target.value)} disabled={busy} className="bg-secondary" />
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <label htmlFor="auth-first-name" className="text-sm font-medium">الاسم الأول</label>
                    <Input id="auth-first-name" required autoComplete="given-name" placeholder="محمد" value={firstName} onChange={(e) => setFirstName(e.target.value)} disabled={busy} className="bg-secondary" />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="auth-father-name" className="text-sm font-medium">اسم الأب</label>
                    <Input id="auth-father-name" required autoComplete="additional-name" placeholder="أحمد" value={fatherName} onChange={(e) => setFatherName(e.target.value)} disabled={busy} className="bg-secondary" />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="auth-family-name" className="text-sm font-medium">اسم العائلة</label>
                    <Input id="auth-family-name" required autoComplete="family-name" placeholder="علي" value={familyName} onChange={(e) => setFamilyName(e.target.value)} disabled={busy} className="bg-secondary" />
                  </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="auth-email" className="text-sm font-medium">البريد الإلكتروني</label>
                <Input 
                  id="auth-email" 
                  type="email" 
                  required 
                  autoComplete="email" 
                  placeholder="your@email.com" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  disabled={busy}
                  className="bg-secondary"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="auth-password" className="text-sm font-medium">كلمة المرور</label>
                <Input 
                  id="auth-password" 
                  type="password" 
                  required 
                  minLength={6} 
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} 
                  placeholder="••••••" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  disabled={busy}
                  className="bg-secondary"
                />
              </div>

              {mode === 'signup' && (
                <div className="space-y-2">
                  <label htmlFor="auth-confirm" className="text-sm font-medium">تأكيد كلمة المرور</label>
                  <Input 
                    id="auth-confirm" 
                    type="password" 
                    required 
                    minLength={6} 
                    autoComplete="new-password" 
                    placeholder="••••••" 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                    disabled={busy}
                    className="bg-secondary"
                  />
                </div>
              )}

              {message && (
                <div className={`p-3 rounded-lg text-sm ${
                  messageType === 'error' 
                    ? 'bg-destructive/10 text-destructive border border-destructive/20' 
                    : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                }`}>
                  {message}
                </div>
              )}

              {showResend && mode === 'signin' && (
                <Button type="button" variant="link" className="w-full text-gold" onClick={resendConfirmation} disabled={busy}>
                  إعادة إرسال رسالة تفعيل الحساب
                </Button>
              )}

              <Button 
                type="submit" 
                disabled={busy} 
                className="w-full bg-gold text-background hover:bg-gold/90 font-semibold"
              >
                {busy ? (
                  <div className="flex items-center gap-2">
                    <Spinner className="w-4 h-4" />
                    جارٍ التنفيذ...
                  </div>
                ) : (
                  mode === 'signin' ? 'دخول' : 'إنشاء الحساب'
                )}
              </Button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-card text-muted-foreground">أو</span>
                </div>
              </div>

              <Button 
                type="button" 
                variant="outline" 
                className="w-full border-border"
                onClick={() => { 
                  setMessage('') 
                  setMode(mode === 'signin' ? 'signup' : 'signin') 
                  setPassword('')
                  setConfirmPassword('')
                }}
                disabled={busy}
              >
                {mode === 'signin' 
                  ? 'ليس لديك حساب؟ أنشئ حسابًا' 
                  : 'لديك حساب؟ سجّل الدخول'}
              </Button>

              <p className="text-center text-xs text-muted-foreground pt-2">
                بإنشاء حساب، توافق على حفظ بيانات التقدم على خوادمنا الآمنة.
              </p>
            </form>
          </CardContent>
        </Card>

        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="space-y-2">
            <div className="text-2xl font-bold text-gold">114</div>
            <p className="text-xs text-muted-foreground">سورة قرآنية</p>
          </div>
          <div className="space-y-2">
            <div className="text-2xl font-bold text-emerald-500">6236</div>
            <p className="text-xs text-muted-foreground">آية كريمة</p>
          </div>
          <div className="space-y-2">
            <div className="text-2xl font-bold text-blue-500">30</div>
            <p className="text-xs text-muted-foreground">جزء قرآني</p>
          </div>
        </div>
      </div>
    </main>
  )
}
