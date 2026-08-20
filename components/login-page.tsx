'use client'

import { useState } from 'react'
import { Boxes, Eye, EyeOff, Lock, Phone, User } from 'lucide-react'
import { authApi, setStoredUser, setToken } from '@/lib/api'

export function LoginPage({ onSuccess }: { onSuccess: (user: any) => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const formatPhoneInput = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 12)
    let out = '+'
    if (digits.length > 0) out += digits.slice(0, 3)
    if (digits.length > 3) out += ' ' + digits.slice(3, 5)
    if (digits.length > 5) out += ' ' + digits.slice(5, 8)
    if (digits.length > 8) out += ' ' + digits.slice(8, 10)
    if (digits.length > 10) out += ' ' + digits.slice(10, 12)
    return out
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!username || !password || (mode === 'register' && !phone)) {
      setError('Barcha maydonlarni to‘ldiring.')
      return
    }
    setLoading(true)
    try {
      const res = mode === 'login'
        ? await authApi.login(username, password)
        : await authApi.register(username, phone, password)
      setToken(res.token)
      setStoredUser(res.user)
      onSuccess(res.user)
    } catch (err: any) {
      setError(err?.message || 'Xatolik yuz berdi. Qaytadan urinib ko‘ring.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-sm rounded-2xl border bg-card p-8 shadow-xl">
        <div className="flex flex-col items-center text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Boxes className="size-7" />
          </div>
          <h1 className="mt-4 text-xl font-bold tracking-tight">PW OMBOR</h1>
          <p className="mt-1 text-sm text-muted-foreground">Print Work uchun aqlli ombor boshqaruvi</p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
          <button
            type="button"
            onClick={() => { setMode('login'); setError('') }}
            className={`rounded-md py-2 text-sm font-semibold transition ${mode === 'login' ? 'bg-card shadow-sm' : 'text-muted-foreground'}`}
          >
            Kirish
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError('') }}
            className={`rounded-md py-2 text-sm font-semibold transition ${mode === 'register' ? 'bg-card shadow-sm' : 'text-muted-foreground'}`}
          >
            Ro‘yxatdan o‘tish
          </button>
        </div>

        <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
          <label className="block text-sm font-medium">
            Username
            <div className="relative mt-2">
              <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value.trim())}
                placeholder="masalan: javohir"
                className="h-11 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none focus:border-primary"
                autoComplete="username"
              />
            </div>
          </label>

          {mode === 'register' && (
            <label className="block text-sm font-medium">
              Telefon raqam
              <div className="relative mt-2">
                <Phone className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={phone}
                  onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
                  placeholder="+998 90 123 45 67"
                  inputMode="tel"
                  className="h-11 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none focus:border-primary"
                />
              </div>
            </label>
          )}

          <label className="block text-sm font-medium">
            Parol
            <div className="relative mt-2">
              <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className="h-11 w-full rounded-lg border bg-background pl-9 pr-9 text-sm outline-none focus:border-primary"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
              <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </label>

          {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
          >
            {loading ? 'Yuklanmoqda...' : mode === 'login' ? 'Kirish' : 'Ro‘yxatdan o‘tish'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Tizimga birinchi bo‘lib ro‘yxatdan o‘tgan foydalanuvchi avtomatik administrator huquqini oladi.
        </p>
      </div>
    </div>
  )
}
