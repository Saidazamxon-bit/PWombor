// PHP backend bilan ishlash uchun yagona joy.
// Hosting manzilini .env.local (lokal) yoki Vercel Environment Variables (production)da sozlang:
//   NEXT_PUBLIC_API_URL=https://6a70174330801.xvest4.ru/PWombor/api

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://6a70174330801.xvest4.ru/PWombor/api'

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem('pwombor_token')
}

export function setToken(token: string | null) {
  if (typeof window === 'undefined') return
  if (token) window.localStorage.setItem('pwombor_token', token)
  else window.localStorage.removeItem('pwombor_token')
}

export function getStoredUser(): { id: string; username: string; role: string } | null {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem('pwombor_user')
  return raw ? JSON.parse(raw) : null
}

export function setStoredUser(user: any) {
  if (typeof window === 'undefined') return
  if (user) window.localStorage.setItem('pwombor_user', JSON.stringify(user))
  else window.localStorage.removeItem('pwombor_user')
}

type ApiOptions = { method?: string; body?: any; auth?: boolean }

export async function api(path: string, opts: ApiOptions = {}) {
  const { method = 'GET', body, auth = true } = opts
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (auth) {
    const token = getToken()
    if (token) headers['Authorization'] = `Bearer ${token}`
  }
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  let data: any = null
  try { data = await res.json() } catch { /* bo'sh javob */ }
  if (!res.ok) {
    const message = data?.error || `So'rov xato bilan tugadi (${res.status})`
    throw new Error(message)
  }
  return data
}

// ---- Auth ----
export const authApi = {
  register: (username: string, phone: string, password: string) =>
    api('/auth.php?action=register', { method: 'POST', body: { username, phone, password }, auth: false }),
  login: (username: string, password: string) =>
    api('/auth.php?action=login', { method: 'POST', body: { username, password }, auth: false }),
  me: () => api('/auth.php?action=me'),
  logout: () => api('/auth.php?action=logout', { method: 'POST' }),
}

// ---- Resurslar ----
export const productsApi = {
  list: (search?: string) => api(`/products.php${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  create: (input: any) => api('/products.php', { method: 'POST', body: input }),
  update: (input: any) => api('/products.php', { method: 'PUT', body: input }),
  remove: (id: string) => api(`/products.php?id=${id}`, { method: 'DELETE' }),
}

export const barcodeApi = {
  lookup: (code: string) => api(`/barcode.php?code=${encodeURIComponent(code)}`),
}

export const warehousesApi = {
  list: () => api('/warehouses.php'),
  create: (input: any) => api('/warehouses.php', { method: 'POST', body: input }),
  update: (input: any) => api('/warehouses.php', { method: 'PUT', body: input }),
  remove: (id: string) => api(`/warehouses.php?id=${id}`, { method: 'DELETE' }),
}

export const suppliersApi = {
  list: () => api('/suppliers.php'),
  create: (input: any) => api('/suppliers.php', { method: 'POST', body: input }),
  update: (input: any) => api('/suppliers.php', { method: 'PUT', body: input }),
  remove: (id: string) => api(`/suppliers.php?id=${id}`, { method: 'DELETE' }),
}

export const categoriesApi = {
  list: () => api('/categories.php'),
  create: (name: string) => api('/categories.php', { method: 'POST', body: { name } }),
  remove: (id: string) => api(`/categories.php?id=${id}`, { method: 'DELETE' }),
}

export const usersApi = {
  list: () => api('/users.php'),
  update: (input: any) => api('/users.php', { method: 'PUT', body: input }),
  remove: (id: string) => api(`/users.php?id=${id}`, { method: 'DELETE' }),
}

export const transactionsApi = {
  list: (type?: string) => api(`/transactions.php${type ? `?type=${type}` : ''}`),
  create: (input: any) => api('/transactions.php', { method: 'POST', body: input }),
}

export const expiryApi = {
  list: () => api('/expiry.php'),
  create: (input: any) => api('/expiry.php', { method: 'POST', body: input }),
  update: (input: any) => api('/expiry.php', { method: 'PUT', body: input }),
  remove: (id: string) => api(`/expiry.php?id=${id}`, { method: 'DELETE' }),
}

export const dashboardApi = { get: () => api('/dashboard.php') }

export const reportsApi = { get: (type: string, params?: Record<string, string>) => {
  const qs = new URLSearchParams({ type, ...params }).toString()
  return api(`/reports.php?${qs}`)
} }

export const settingsApi = {
  get: () => api('/settings.php'),
  set: (key: string, value: string) => api('/settings.php', { method: 'POST', body: { key, value } }),
}
