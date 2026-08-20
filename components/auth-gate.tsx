'use client'

import { useEffect, useState } from 'react'
import { LoginPage } from '@/components/login-page'
import { WmsApp } from '@/components/wms-app'
import { authApi, getStoredUser, getToken, setStoredUser, setToken } from '@/lib/api'

export function AuthGate() {
  const [checking, setChecking] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const token = getToken()
    if (!token) { setChecking(false); return }
    const cached = getStoredUser()
    if (cached) setUser(cached)
    authApi.me()
      .then((me) => { setUser(me); setStoredUser(me) })
      .catch(() => { setToken(null); setStoredUser(null); setUser(null) })
      .finally(() => setChecking(false))
  }, [])

  const logout = () => {
    authApi.logout().catch(() => {})
    setToken(null)
    setStoredUser(null)
    setUser(null)
  }

  if (checking) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Yuklanmoqda...</div>
  }
  if (!user) {
    return <LoginPage onSuccess={setUser} />
  }
  return <WmsApp currentUser={user} onLogout={logout} />
}
