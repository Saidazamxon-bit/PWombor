'use client'

import { Fragment, useEffect, useMemo, useState } from 'react'
import { BarChart3, Bell, BookOpen, Boxes, CalendarClock, ChartNoAxesCombined, ChevronDown, ChevronLeft, ChevronRight, CircleHelp, FileBarChart, FileMinus2, LayoutDashboard, LogOut, Menu, Package, PackageCheck, PackagePlus, PackageOpen, ShoppingBag, ReceiptText, Plus, Search, Settings2, Tags, Truck, UserRound, Users, Warehouse, ArrowDownToLine, ArrowLeftRight, ArrowUpFromLine, CheckCircle2, AlertTriangle, MoreHorizontal, Download, X, TrendingUp, Pencil, Trash2, RefreshCw } from 'lucide-react'
import { allNavItems, dashboardCards as staticDashboardCards, detailText, getLocationBadge, getStatusClass, getTypeClass, guideContent, labelMap, money, navGroups, reportTypes, roles as staticRoles, productTypes, productTypeLabel, productTypeByPage, randomBarcode } from '@/lib/wms-data'
import { categoriesApi, dashboardApi, expiryApi, productsApi, barcodeApi, reportsApi, settingsApi, suppliersApi, transactionsApi, usersApi, warehousesApi } from '@/lib/api'
import { BarcodeScanButton } from '@/components/barcode-scanner'
import { BarcodeImage, downloadBarcodeLabel } from '@/components/barcode-image'

type Product = { id: string; productId: string; name: string; sku: string; barcode: string; category: string; categoryId: string | null; categoryParentId: string | null; unit: string; price: number; stock: number; minStock: number; warehouse: string; warehouseId: string; status: string; type?: string }
type Warehouse = { id: string; name: string; code: string; products: number; value: number }
type Supplier = { id: string; name: string; phone: string; orders: number; debt: number; status: string }
type AppUser = { id: string; name: string; email: string; role: string; active: boolean }
type ExpiryRow = { id: string; name: string; barcode: string; batch: string; expiry: string; days: number; qty: number; warehouse: string }
type Transaction = { id: string; docNo: string; type: string; reference: string; qty: number; amount: number; status: string; date?: string; createdAt?: string; created_at?: string; productName?: string; product?: string; productId?: string }
type Category = { id: string; name: string; parentId: string | null }
type CurrentUser = { id: string; username: string; role: string }

const iconFor: Record<string, React.ElementType> = { LayoutDashboard, Package, PackageCheck, PackagePlus, PackageOpen, ShoppingBag, ReceiptText, Boxes, ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight, FileMinus2, Truck, ChartNoAxesCombined, FileBarChart, CalendarClock, Settings2, Users, Warehouse, Tags, BookOpen }
const productLikePages = new Set(['products', 'inventory', 'ready-products', 'raw-products', 'semi-products', 'available'])
const roleLabel: Record<string, string> = { admin: 'Administrator', manager: 'Ombor mudiri', operator: 'Operator' }
const txTypeKey: Record<string, string> = { purchases: 'kirim', sales: 'chiqim', sold: 'chiqim', transfers: 'transfer', writeoffs: 'hisobdan_chiqarish' }
const txTypeLabel: Record<string, string> = { purchases: 'Kirim', sales: 'Chiqim', sold: 'Chiqim', transfers: 'Ko‘chirish', writeoffs: 'Hisobdan chiqarish' }
const formatTxDate = (value?: string) => {
  if (!value) return '—'
  const date = new Date(value.replace(' ', 'T'))
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function Button({ children, onClick, variant = 'primary', className = '', type = 'button', disabled = false }: { children: React.ReactNode; onClick?: () => void; variant?: 'primary' | 'outline' | 'ghost'; className?: string; type?: 'button' | 'submit'; disabled?: boolean }) {
  return <button type={type} disabled={disabled} onClick={onClick} className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 ${variant === 'primary' ? 'bg-primary text-primary-foreground hover:bg-primary/90' : variant === 'outline' ? 'border bg-card text-foreground hover:bg-muted' : 'text-muted-foreground hover:bg-muted hover:text-foreground'} ${className}`}>{children}</button>
}
function Badge({ children, className = '' }: { children: React.ReactNode; className?: string }) { return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}>{children}</span> }
function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) { return <div className={`rounded-xl border bg-card ${className}`}>{children}</div> }
function PageHeader({ title, description, action, onAction }: { title: string; description?: string; action?: string; onAction?: () => void }) { return <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">{title}</h1>{description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}</div>{action && <Button onClick={onAction}><Plus className="size-4" />{action}</Button>}</div> }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="mt-4 block text-sm font-medium">{label}{children}</label> }
const inputCls = 'mt-2 h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-primary'

export function WmsApp({ currentUser, onLogout }: { currentUser: CurrentUser; onLogout: () => void }) {
  const [page, setPage] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [warehousesList, setWarehousesList] = useState<Warehouse[]>([])
  const [suppliersList, setSuppliersList] = useState<Supplier[]>([])
  const [usersList, setUsersList] = useState<AppUser[]>([])
  const [expiryList, setExpiryList] = useState<ExpiryRow[]>([])
  const [transactionsList, setTransactionsList] = useState<Transaction[]>([])
  const [categoriesList, setCategoriesList] = useState<Category[]>([])
  const [dashboardStats, setDashboardStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [backendError, setBackendError] = useState('')
  const [search, setSearch] = useState('')
  const [searchMode, setSearchMode] = useState<'name' | 'id' | 'barcode'>('name')
  const [toast, setToast] = useState('')
  const [modal, setModal] = useState<'product' | 'simple' | 'category' | 'warehouse' | 'transaction' | 'expiry' | null>(null)
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [presetProductType, setPresetProductType] = useState<string | undefined>(undefined)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [bolimFilter, setBolimFilter] = useState('')
  const [kategoriyaFilter, setKategoriyaFilter] = useState('')
  const [categoryDeleteError, setCategoryDeleteError] = useState<{ category: Category; message: string } | null>(null)
  const notifications = useMemo(() => [
    ...products
      .filter((product) => product.status === 'Kam qoldiq')
      .map((product) => ({
        title: 'Qoldiq kamaygan',
        text: `${product.name} minimal qoldiqdan past (${product.stock} ${product.unit})`,
        unread: true,
      })),
    ...transactionsList
      .filter((transaction) => transaction.type === 'Kirim')
      .slice(0, 3)
      .map((transaction) => ({
        title: 'Yangi kirim',
        text: `${transaction.reference} dan ${transaction.amount} so'mlik kirim`,
        unread: true,
      })),
    ...(dashboardStats?.expiringSoon > 0
      ? [{
          title: 'Muddati yaqinlashmoqda',
          text: `${dashboardStats.expiringSoon} ta partiya muddati yaqinlashmoqda`,
          unread: true,
        }]
      : []),
  ], [products, transactionsList, dashboardStats])
  const filteredProducts = useMemo(() => {
    let base = products
    const wantedType = productTypeByPage[page]
    if (wantedType) base = base.filter((p) => (p.type || 'tayyor') === wantedType)
    if (page === 'available') base = base.filter((p) => p.stock > 0)
    if (bolimFilter) base = base.filter((p) => p.categoryId === bolimFilter || p.categoryParentId === bolimFilter)
    if (kategoriyaFilter) base = base.filter((p) => p.categoryId === kategoriyaFilter)
    const q = search.trim().toLowerCase()
    if (!q) return base
    return base.filter((p) => {
      if (searchMode === 'id') return p.productId.toLowerCase().includes(q)
      if (searchMode === 'barcode') return (p.barcode || '').toLowerCase().includes(q)
      return p.name.toLowerCase().includes(q)
    })
  }, [products, search, searchMode, page, bolimFilter, kategoriyaFilter])
  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(''), 3000) }
  const go = (key: string) => { setPage(key); setMobileOpen(false); setSearch(''); setBolimFilter(''); setKategoriyaFilter('') }
  const pageTitle = labelMap[page] ?? 'Bosh sahifa'
  const initials = currentUser.username.slice(0, 2).toUpperCase()

  const loadData = async () => {
    setLoading(true)
    const tasks: [string, Promise<any>][] = [
      ['Mahsulotlar', productsApi.list()],
      ['Omborlar', warehousesApi.list()],
      ['Yetkazib beruvchilar', suppliersApi.list()],
      ['Foydalanuvchilar', usersApi.list()],
      ['Yaroqlilik muddati', expiryApi.list()],
      ['Operatsiyalar', transactionsApi.list()],
      ['Kategoriyalar', categoriesApi.list()],
      ['Statistika', dashboardApi.get()],
    ]
    const results = await Promise.allSettled(tasks.map(([, p]) => p))
    const failed = results.map((r, i) => [tasks[i][0], r] as const).filter(([, r]) => r.status === 'rejected')
    if (failed.length > 0) {
      const reason = failed.map(([name, r]) => `${name}: ${(r as PromiseRejectedResult).reason?.message ?? 'xato'}`).join(' | ')
      setBackendError(`Backend bilan bog‘lanishda muammo — ${reason}`)
    } else {
      setBackendError('')
    }
    const [pRes, wRes, sRes, uRes, eRes, tRes, cRes, dRes] = results
    if (pRes.status === 'fulfilled') setProducts(pRes.value)
    if (wRes.status === 'fulfilled') setWarehousesList(wRes.value)
    if (sRes.status === 'fulfilled') setSuppliersList(sRes.value)
    if (uRes.status === 'fulfilled') setUsersList(uRes.value)
    if (eRes.status === 'fulfilled') setExpiryList(eRes.value)
    if (tRes.status === 'fulfilled') setTransactionsList(tRes.value)
    if (cRes.status === 'fulfilled') setCategoriesList(cRes.value)
    if (dRes.status === 'fulfilled') setDashboardStats(dRes.value)
    setLoading(false)
  }
  useEffect(() => { loadData() }, [])

  const withNotify = async (fn: () => Promise<any>, successMsg: string) => {
    try { await fn(); await loadData(); notify(successMsg) }
    catch (e: any) { notify(`Xatolik: ${e?.message ?? 'saqlanmadi'}`) }
  }

  const saveProduct = (input: any) => withNotify(
    () => editingProduct ? productsApi.update({ id: editingProduct.id, ...input }) : productsApi.create(input),
    editingProduct ? 'Mahsulot yangilandi' : 'Mahsulot muvaffaqiyatli saqlandi'
  )
  const saveWarehouse = (input: { name: string; code: string }) => withNotify(
    () => editingWarehouse ? warehousesApi.update({ id: editingWarehouse.id, ...input }) : warehousesApi.create(input),
    editingWarehouse ? 'Ombor yangilandi' : 'Yangi ombor qo‘shildi'
  )
  const deleteWarehouse = (w: Warehouse) => { if (confirm(`"${w.name}" omborini o‘chirasizmi?`)) withNotify(() => warehousesApi.remove(w.id), 'Ombor o‘chirildi') }
  const deleteProduct = (p: Product) => { if (confirm(`"${p.name}" ni o‘chirasizmi?`)) withNotify(() => productsApi.remove(p.id), 'Mahsulot o‘chirildi') }

  const saveSimpleEntry = async (text: string, parentId?: string | null) => {
    if (page === 'suppliers') return withNotify(() => suppliersApi.create({ name: text }), 'Yetkazib beruvchi qo‘shildi')
    if (page === 'categories') return withNotify(() => categoriesApi.create(text, parentId), parentId ? 'Kategoriya qo‘shildi' : 'Bo‘lim qo‘shildi')
    return Promise.resolve()
  }

  const saveTransaction = (input: any) => withNotify(
    () => transactionsApi.create({ ...input, type: txTypeKey[page] }),
    'Yangi hujjat muvaffaqiyatli yaratildi'
  )

  const saveExpiry = (input: any) => withNotify(() => expiryApi.create(input), 'Partiya qo‘shildi')
  const deleteExpiry = (row: ExpiryRow) => { if (confirm(`"${row.name}" partiyasini o‘chirasizmi?`)) withNotify(() => expiryApi.remove(row.id), 'Partiya o‘chirildi') }
  const toggleUserActive = (u: AppUser) => withNotify(() => usersApi.update({ id: u.id, isActive: !u.active }), 'Foydalanuvchi holati yangilandi')
  const changeUserRole = (u: AppUser, role: string) => withNotify(() => usersApi.update({ id: u.id, role }), 'Rol yangilandi')
  const deleteCategory = async (category: Category, force = false) => {
    try { await categoriesApi.remove(category.id, force); setCategoryDeleteError(null); await loadData(); notify(force ? 'Bo‘lim va kategoriyalari o‘chirildi' : 'Kategoriya o‘chirildi') }
    catch (e: any) { if (!force) setCategoryDeleteError({ category, message: e?.message ?? 'Bu bo‘limni o‘chirib bo‘lmaydi' }); else notify(`Xatolik: ${e?.message ?? 'o‘chirilmadi'}`) }
  }

  return <div className="min-h-screen bg-background text-foreground">
    <aside className={`fixed inset-y-0 left-0 z-40 hidden flex-col bg-sidebar text-sidebar-foreground transition-all duration-200 lg:flex ${sidebarOpen ? 'w-64' : 'w-[76px]'}`}>
      <div className="flex h-20 items-center border-b border-sidebar-border px-5">{sidebarOpen ? <div><div className="text-lg font-black tracking-tight text-white">PW <span className="text-cyan-300">OMBOR</span></div><div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Print Work WMS</div></div> : <div className="mx-auto text-xl font-black text-white">PW</div>}</div>
      <nav className="flex-1 overflow-y-auto px-3 py-5">{navGroups.map((group) => <div key={group.label} className="mb-5"><div className={`mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 ${!sidebarOpen && 'sr-only'}`}>{group.label}</div>{group.items.map((item) => { const Icon = iconFor[item.icon] ?? Package; return <button key={item.key} onClick={() => go(item.key)} title={!sidebarOpen ? item.label : undefined} className={`mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${page === item.key ? 'bg-primary text-white shadow-sm' : 'text-slate-300 hover:bg-white/10 hover:text-white'} ${!sidebarOpen && 'justify-center px-0'}`}><Icon className="size-[18px] shrink-0" />{sidebarOpen && <span>{item.label}</span>}</button> })}</div>)}</nav>
      <div className="border-t border-sidebar-border p-3"><button onClick={() => notify('Yordam markazi tez orada ishga tushadi')} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-300 hover:bg-white/10 ${!sidebarOpen && 'justify-center px-0'}`}><CircleHelp className="size-[18px]" />{sidebarOpen && 'Yordam markazi'}</button><button onClick={() => setSidebarOpen(!sidebarOpen)} className={`mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-400 hover:bg-white/10 ${!sidebarOpen && 'justify-center px-0'}`}>{sidebarOpen ? <><ChevronLeft className="size-[18px]" />Yig‘ish</> : <ChevronRight className="size-[18px]" />}</button></div>
    </aside>
    {mobileOpen && <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setMobileOpen(false)} />}
    <aside className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-sidebar text-sidebar-foreground transition-transform lg:hidden ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}><div className="flex h-20 items-center justify-between border-b border-sidebar-border px-5"><div className="text-lg font-black text-white">PW <span className="text-cyan-300">OMBOR</span></div><Button variant="ghost" onClick={() => setMobileOpen(false)}><X className="size-5 text-white" /></Button></div><nav className="overflow-y-auto px-3 py-5">{navGroups.flatMap((g) => g.items).map((item) => { const Icon = iconFor[item.icon] ?? Package; return <button key={item.key} onClick={() => go(item.key)} className={`mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm ${page === item.key ? 'bg-primary text-white' : 'text-slate-300'}`}><Icon className="size-[18px]" />{item.label}</button> })}</nav></aside>
    <div className={`transition-[padding] duration-200 ${sidebarOpen ? 'lg:pl-64' : 'lg:pl-[76px]'}`}>
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-card/95 px-4 backdrop-blur md:px-6">
        <div className="flex items-center gap-3"><Button variant="ghost" className="lg:hidden" onClick={() => setMobileOpen(true)}><Menu className="size-5" /></Button><div className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex"><span>PW OMBOR</span><ChevronRight className="size-4" /><span className="font-medium text-foreground">{pageTitle}</span></div><div className="flex items-center gap-2 sm:hidden"><span className="text-sm font-black text-primary">PW OMBOR</span></div></div>
        <div className="flex items-center gap-1 md:gap-3">
          <div className="relative"><Button variant="ghost" onClick={() => setNotificationsOpen(!notificationsOpen)}><Bell className="size-5" />{notifications.length > 0 && <span className="absolute right-1 top-1 size-2 rounded-full bg-cyan-400" />}</Button>{notificationsOpen && <Card className="absolute right-0 top-12 z-50 w-80 p-3 shadow-xl"><div className="flex items-center justify-between border-b pb-3"><b>Bildirishnomalar</b><Badge className="bg-primary/10 text-primary">{notifications.length} yangi</Badge></div>{notifications.length > 0 ? notifications.map((n) => <div key={`${n.title}-${n.text}`} className="border-b py-3 last:border-0"><div className="flex gap-2"><span className={`mt-1 size-2 shrink-0 rounded-full ${n.unread ? 'bg-primary' : 'bg-muted'}`} /><div><p className="text-sm font-medium">{n.title}</p><p className="text-xs text-muted-foreground">{n.text}</p></div></div></div>) : <div className="py-6 text-center text-sm text-muted-foreground">Hozircha bildirishnoma yo‘q</div>}</Card>}</div>
          <div className="relative">
            <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="hidden items-center gap-2 border-l pl-3 sm:flex"><div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{initials}</div><div className="hidden text-right md:block"><div className="text-sm font-semibold">{currentUser.username}</div><div className="text-xs text-muted-foreground">{roleLabel[currentUser.role] ?? currentUser.role}</div></div><ChevronDown className="size-4 text-muted-foreground" /></button>
            {userMenuOpen && <Card className="absolute right-0 top-12 z-50 w-48 p-2 shadow-xl"><button onClick={onLogout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"><LogOut className="size-4" />Chiqish</button></Card>}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1440px] p-4 md:p-6 lg:p-8">
        {!loading && backendError && <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900"><AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-500" /><div><b className="block">Backendga to‘liq ulanib bo‘lmadi</b><p className="mt-1 text-amber-800">{backendError}</p><p className="mt-2 text-xs text-amber-700">Tekshiring: NEXT_PUBLIC_API_URL to‘g‘ri sozlanganmi, PHP fayllar hostingga yuklanganmi, schema.sql import qilinganmi.</p></div></div>}
        {page === 'dashboard'
          ? <Dashboard stats={dashboardStats} onNavigate={go} products={products} transactions={transactionsList} onAction={(key) => { setEditingProduct(null); setPresetProductType(undefined); setModal(key === 'products' ? 'product' : (['purchases', 'sales', 'transfers'].includes(key) ? 'transaction' : 'simple')) }} />
          : page === 'analytics'
          ? <AnalyticsPage products={products} transactions={transactionsList} warehouses={warehousesList} categories={categoriesList} />
          : page === 'reports'
          ? <ReportsPage products={products} transactions={transactionsList} warehouses={warehousesList} />
          : page === 'guide'
          ? <GuidePage onNavigate={go} />
          : page === 'warehouses'
          ? <WarehousesPage warehouses={warehousesList} loading={loading} onAdd={() => { setEditingWarehouse(null); setModal('warehouse') }} onEdit={(w) => { setEditingWarehouse(w); setModal('warehouse') }} onDelete={deleteWarehouse} />
          : page === 'settings'
          ? <SettingsPage onNotify={notify} />
          : page === 'users'
          ? <UsersPage users={usersList} currentUser={currentUser} onToggleActive={toggleUserActive} onChangeRole={changeUserRole} />
          : page === 'expiry'
          ? <ExpiryPage rows={expiryList} onAdd={() => setModal('expiry')} onDelete={deleteExpiry} />
          : <PageContent page={page} title={pageTitle} products={filteredProducts} transactions={transactionsList} suppliers={suppliersList} users={usersList} expiry={expiryList} categories={categoriesList} search={search} setSearch={setSearch} searchMode={searchMode} setSearchMode={setSearchMode} bolimFilter={bolimFilter} setBolimFilter={setBolimFilter} kategoriyaFilter={kategoriyaFilter} setKategoriyaFilter={setKategoriyaFilter} onProduct={setSelectedProduct} onDeleteProduct={deleteProduct} onAddCategory={() => setModal('category')} onDeleteCategory={deleteCategory}
              onEditProduct={(p) => { setEditingProduct(p); setModal('product') }}
              onAction={() => { setEditingProduct(null); setPresetProductType(productTypeByPage[page]); setModal(productLikePages.has(page) ? 'product' : txTypeKey[page] ? 'transaction' : 'simple') }} onNavigate={go} />}
      </main>
    </div>
    {selectedProduct && <ProductDrawer product={selectedProduct} onClose={() => setSelectedProduct(null)} />}
    {modal === 'warehouse' && <WarehouseModal warehouse={editingWarehouse} onClose={() => { setModal(null); setEditingWarehouse(null) }} onSave={async (input) => { await saveWarehouse(input); setModal(null); setEditingWarehouse(null) }} />}
    {modal === 'product' && <ProductModal warehouses={warehousesList} categories={categoriesList} product={editingProduct} presetType={presetProductType} onClose={() => { setModal(null); setEditingProduct(null); setPresetProductType(undefined) }} onSave={async (input) => { await saveProduct(input); setModal(null); setEditingProduct(null); setPresetProductType(undefined) }} />}
    {modal === 'category' && <CategoryModal categories={categoriesList} onClose={() => setModal(null)} onSave={async (name, parentId) => { await withNotify(() => categoriesApi.create(name, parentId), parentId ? 'Kategoriya qo‘shildi' : 'Bo‘lim qo‘shildi'); setModal(null) }} />}
    {categoryDeleteError && <CategoryDeleteModal category={categoryDeleteError.category} message={categoryDeleteError.message} onClose={() => setCategoryDeleteError(null)} onForce={() => deleteCategory(categoryDeleteError.category, true)} />}
    {modal === 'transaction' && txTypeKey[page] && <TransactionModal pageKey={page} label={txTypeLabel[page]} products={products} warehouses={warehousesList} suppliers={suppliersList} categories={categoriesList} onClose={() => setModal(null)} onSave={async (input) => { await saveTransaction(input); setModal(null) }} />}
    {modal === 'expiry' && <ExpiryModal products={products} warehouses={warehousesList} onClose={() => setModal(null)} onSave={async (input) => { await saveExpiry(input); setModal(null) }} />}
    {modal === 'simple' && <SimpleModal page={page} onClose={() => setModal(null)} onSave={async (text) => { await saveSimpleEntry(text); setModal(null) }} />}
    {toast && <div className="fixed bottom-5 right-5 z-[60] flex items-center gap-3 rounded-lg bg-sidebar px-4 py-3 text-sm font-medium text-white shadow-xl"><CheckCircle2 className="size-4 text-cyan-300" />{toast}</div>}
  </div>
}

function Dashboard({ stats, onNavigate, products, transactions, onAction }: { stats: any; onNavigate: (key: string) => void; products: Product[]; transactions: Transaction[]; onAction: (key: string) => void }) {
  const lowStockProducts = products.filter((p) => p.status === 'Kam qoldiq')
  const transactionTrend = useMemo(() => {
    const relevant = transactions.filter((transaction) => transaction.type === 'Kirim' || transaction.type === 'Chiqim')
    const parseDate = (value?: string) => {
      if (!value) return null
      const normalized = value.toLowerCase()
      if (normalized.includes('bugun')) return new Date()
      if (normalized.includes('kecha')) { const date = new Date(); date.setDate(date.getDate() - 1); return date }
      const parsed = new Date(value)
      return Number.isNaN(parsed.getTime()) ? null : parsed
    }
    const dated = relevant.map((transaction) => ({ transaction, date: parseDate(transaction.date) }))
    const hasDates = dated.some((item) => item.date)
    if (!hasDates) return relevant.slice(0, 7).reverse().map((transaction, index) => ({ label: `#${index + 1}`, kirim: transaction.type === 'Kirim' ? Number(transaction.amount) || 0 : 0, chiqim: transaction.type === 'Chiqim' ? Number(transaction.amount) || 0 : 0 }))
    const days = Array.from({ length: 7 }, (_, index) => { const date = new Date(); date.setHours(0, 0, 0, 0); date.setDate(date.getDate() - (6 - index)); return date })
    return days.map((day) => {
      const nextDay = new Date(day); nextDay.setDate(nextDay.getDate() + 1)
      const dayTransactions = dated.filter((item) => item.date && item.date >= day && item.date < nextDay)
      return { label: day.toLocaleDateString('uz-UZ', { weekday: 'short' }), kirim: dayTransactions.filter((item) => item.transaction.type === 'Kirim').reduce((sum, item) => sum + (Number(item.transaction.amount) || 0), 0), chiqim: dayTransactions.filter((item) => item.transaction.type === 'Chiqim').reduce((sum, item) => sum + (Number(item.transaction.amount) || 0), 0) }
    })
  }, [transactions])
  const categoryRows = useMemo(() => {
    const rows = new Map<string, number>()
    products.forEach((product) => { if (product.category) rows.set(product.category, (rows.get(product.category) || 0) + product.stock * product.price) })
    const total = [...rows.values()].reduce((sum, value) => sum + value, 0)
    return [...rows.entries()].map(([name, value], index) => ({ name, value, percent: total ? value / total * 100 : 0, color: ['#175CD3', '#22B8CF', '#7C5CFC', '#F59E0B', '#10B981'][index % 5] }))
  }, [products])
  const totalCategoryValue = categoryRows.reduce((sum, row) => sum + row.value, 0)
  const categoryGradient = categoryRows.reduce((gradient, row) => {
    const start = gradient.end
    const end = start + row.percent
    return { end, value: `${gradient.value}${gradient.value ? ', ' : ''}${row.color} ${start}% ${end}%` }
  }, { end: 0, value: '' }).value
  const maxTrendValue = Math.max(...transactionTrend.flatMap((row) => [row.kirim, row.chiqim]), 1)
  const cards = stats ? [
    { label: 'Inventar qiymati', value: money(stats.inventoryValue), icon: 'Package' },
    { label: 'Bu oy kirim', value: money(stats.summary?.month?.kirim ?? 0), icon: 'ArrowDownToLine' },
    { label: 'Bu oy chiqim', value: money(stats.summary?.month?.chiqim ?? 0), icon: 'TrendingUp' },
    { label: 'Kam qoldiq', value: `${stats.lowStock ?? lowStockProducts.length} ta`, icon: 'AlertTriangle' },
  ] : staticDashboardCards
  return <>
    <PageHeader title="Bosh sahifa" description="Omboringiz holati bo‘yicha qisqa ko‘rinish" />
    <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">{cards.map((card: any, i: number) => { const Icon = iconFor[card.icon] ?? TrendingUp; return <Card key={card.label} className="p-4 md:p-5"><div className="flex items-start justify-between"><div className={`flex size-9 items-center justify-center rounded-lg ${i === 3 ? 'bg-amber-100 text-amber-700' : 'bg-primary/10 text-primary'}`}><Icon className="size-4" /></div></div><div className="mt-4 text-lg font-bold md:text-2xl">{card.value}</div><div className="mt-1 text-xs text-muted-foreground md:text-sm">{card.label}</div></Card> })}</div>
    {stats && <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
      <Card className="p-4"><div className="text-xs text-muted-foreground">Bugun kirim / chiqim</div><div className="mt-1 text-sm font-semibold">{money(stats.summary?.today?.kirim ?? 0)} / {money(stats.summary?.today?.chiqim ?? 0)}</div></Card>
      <Card className="p-4"><div className="text-xs text-muted-foreground">Bu hafta kirim / chiqim</div><div className="mt-1 text-sm font-semibold">{money(stats.summary?.week?.kirim ?? 0)} / {money(stats.summary?.week?.chiqim ?? 0)}</div></Card>
      <Card className="p-4"><div className="text-xs text-muted-foreground">Jami mahsulot turi</div><div className="mt-1 text-sm font-semibold">{stats.totalProducts ?? 0} ta</div></Card>
      <Card className="p-4"><div className="text-xs text-muted-foreground">Muddati yaqin partiyalar</div><div className="mt-1 text-sm font-semibold">{stats.expiringSoon ?? 0} ta</div></Card>
    </div>}
    <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr] lg:gap-6">
      <Card className="p-4 md:p-6"><div className="mb-5 flex items-start justify-between"><div><h2 className="font-semibold">Savdo va kirim dinamikasi</h2><p className="mt-1 text-xs text-muted-foreground">Tranzaksiyalardan olingan so‘nggi 7 kun</p></div></div>{transactionTrend.length > 0 ? <><div className="relative h-56"><div className="absolute inset-0 flex flex-col justify-between text-[10px] text-muted-foreground"><span>{money(maxTrendValue)}</span><span>0</span></div><div className="ml-12 flex h-full items-end gap-2 border-b border-l pb-0 pl-3 sm:gap-4">{transactionTrend.map((row) => <div key={row.label} className="flex h-full flex-1 items-end justify-center gap-1"><div className="w-1/3 rounded-t bg-primary/85" style={{ height: `${row.chiqim / maxTrendValue * 100}%` }} title={`${row.label}: Savdo — ${money(row.chiqim)}`} /><div className="w-1/3 rounded-t bg-cyan-400/70" style={{ height: `${row.kirim / maxTrendValue * 100}%` }} title={`${row.label}: Kirim — ${money(row.kirim)}`} /></div>)}</div></div><div className="ml-12 mt-2 flex gap-2 text-[10px] text-muted-foreground">{transactionTrend.map((row) => <span key={row.label} className="min-w-0 flex-1 truncate text-center">{row.label}</span>)}</div><div className="mt-5 flex gap-5 text-xs text-muted-foreground"><span className="flex items-center gap-2"><i className="size-2 rounded-full bg-primary" />Savdo</span><span className="flex items-center gap-2"><i className="size-2 rounded-full bg-cyan-400" />Kirim</span></div></> : <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">Hozircha ma’lumot yo‘q</div>}</Card>
      <Card className="p-4 md:p-6"><div className="mb-4 flex items-center justify-between"><div><h2 className="font-semibold">Kategoriyalar</h2><p className="mt-1 text-xs text-muted-foreground">Inventar qiymati bo‘yicha real taqsimot</p></div><Button variant="ghost" onClick={() => onNavigate('products')}>Batafsil <ChevronRight className="size-4" /></Button></div>{categoryRows.length > 0 ? <div className="flex items-center gap-6"><div className="relative flex size-36 shrink-0 items-center justify-center rounded-full" style={{ background: `conic-gradient(${categoryGradient})` }} title={`Jami: ${money(totalCategoryValue)}`}><div className="flex size-24 items-center justify-center rounded-full bg-card text-center"><div><b className="block text-lg">{products.length}</b><span className="text-[10px] text-muted-foreground">qator</span></div></div></div><div className="flex flex-1 flex-col gap-3 text-xs">{categoryRows.map((row) => <div key={row.name} className="flex items-center gap-2" title={`${row.name} — ${money(row.value)}, ${Math.round(row.percent)}%`}><i className="size-2 shrink-0 rounded-full" style={{ background: row.color }} />{row.name}<span className="ml-auto font-semibold">{Math.round(row.percent)}%</span></div>)}</div></div> : <div className="flex h-36 items-center justify-center text-sm text-muted-foreground">Hozircha ma’lumot yo‘q</div>}</Card>
    </div>
    <div className="mt-4 grid gap-4 lg:grid-cols-[1.6fr_1fr] lg:gap-6">
      <Card className="overflow-hidden"><div className="flex items-center justify-between border-b p-4 md:p-6"><div><h2 className="font-semibold">So‘nggi operatsiyalar</h2><p className="mt-1 text-xs text-muted-foreground">Oxirgi kirim va chiqimlar</p></div><Button variant="ghost" onClick={() => onNavigate('purchases')}>Barchasi <ChevronRight className="size-4" /></Button></div><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-muted/50 text-xs text-muted-foreground"><tr><th className="px-4 py-3 font-medium md:px-6">Hujjat</th><th className="px-4 py-3 font-medium">Turi</th><th className="hidden px-4 py-3 font-medium md:table-cell">Izoh</th><th className="px-4 py-3 font-medium">Sana</th><th className="px-4 py-3 font-medium">Summa</th><th className="px-4 py-3 font-medium">Holat</th></tr></thead><tbody>{transactions.slice(0, 8).map((t) => <tr key={t.id} className="border-b last:border-0"><td className="px-4 py-3 font-semibold md:px-6">{t.docNo}</td><td className="px-4 py-3"><Badge className={getTypeClass(t.type)}>{t.type}</Badge></td><td className="hidden px-4 py-3 text-muted-foreground md:table-cell">{t.reference}</td><td className="px-4 py-3 text-xs text-muted-foreground">{t.date || t.createdAt || t.created_at || '—'}</td><td className="px-4 py-3 font-medium">{t.amount ? money(t.amount) : '—'}</td><td className="px-4 py-3"><Badge className="status-success"><CheckCircle2 className="mr-1 size-3" />{t.status}</Badge></td></tr>)}</tbody></table></div>{transactions.length === 0 && <div className="p-8 text-center text-sm text-muted-foreground">Hozircha operatsiya yo‘q</div>}</Card>
      <Card><div className="flex items-center justify-between border-b p-4 md:p-6"><div><h2 className="font-semibold">Kam qoldiq</h2><p className="mt-1 text-xs text-muted-foreground">Diqqat talab qiladigan mahsulotlar</p></div><AlertTriangle className="size-5 text-amber-500" /></div><div className="flex flex-col">{lowStockProducts.map((p) => <button key={p.id} onClick={() => onNavigate('inventory')} className="flex items-center justify-between border-b p-4 text-left last:border-0 hover:bg-muted/30"><div><p className="text-sm font-semibold">{p.name}</p><p className="mt-1 text-xs text-muted-foreground">{p.sku}{p.barcode ? ` • kod: ${p.barcode}` : ''} • {p.warehouse}</p></div><div className="text-right"><b className="text-amber-600">{p.stock} {p.unit}</b><p className="text-[11px] text-muted-foreground">min: {p.minStock}</p></div></button>)}{lowStockProducts.length === 0 && <div className="p-6 text-center text-sm text-muted-foreground">Kam qoldiq yo‘q</div>}</div><div className="p-4"><Button variant="outline" className="w-full" onClick={() => onNavigate('inventory')}>Qoldiqlarni ko‘rish</Button></div></Card>
    </div>
    <div className="mt-6"><div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">Tezkor amallar</h2></div><div className="grid grid-cols-2 gap-3 md:grid-cols-4">{['products', 'purchases', 'sales', 'transfers'].map((key, i) => <button key={key} onClick={() => onAction(key)} className="flex items-center gap-3 rounded-xl border bg-card p-4 text-left transition hover:border-primary hover:shadow-sm"><div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">{i === 0 ? <Plus className="size-4" /> : i === 1 ? <ArrowDownToLine className="size-4" /> : i === 2 ? <ArrowUpFromLine className="size-4" /> : <ArrowLeftRight className="size-4" />}</div><span className="text-sm font-semibold">{['Mahsulot qo‘shish', 'Kirim yaratish', 'Chiqim yaratish', 'Ko‘chirish'][i]}</span></button>)}</div></div>
  </>
}

function AnalyticsPage({ products, transactions, warehouses, categories }: { products: Product[]; transactions: Transaction[]; warehouses: Warehouse[]; categories: Category[] }) {
  const totalValue = products.reduce((sum, product) => sum + product.stock * product.price, 0)
  const lowStock = products.filter((product) => product.status === 'Kam qoldiq').length
  const categoryRows = categories.map((category) => ({ name: category.name, value: products.filter((product) => product.category === category.name).reduce((sum, product) => sum + product.stock * product.price, 0) })).filter((row) => row.value > 0)
  const knownCategories = new Set(categoryRows.map((row) => row.name))
  const uncategorizedValue = products.filter((product) => !knownCategories.has(product.category)).reduce((sum, product) => sum + product.stock * product.price, 0)
  if (uncategorizedValue > 0) categoryRows.push({ name: 'Boshqa', value: uncategorizedValue })
  const maxCategory = Math.max(...categoryRows.map((row) => row.value), 1)
  const warehouseRows = warehouses.map((warehouse) => { const rows = products.filter((product) => product.warehouse === warehouse.name); return { name: warehouse.name, count: rows.length, value: rows.reduce((sum, product) => sum + product.stock * product.price, 0) } })
  const maxWarehouse = Math.max(...warehouseRows.map((row) => row.value), 1)
  const trendRows = transactions.filter((transaction) => transaction.type === 'Kirim' || transaction.type === 'Chiqim').slice(0, 7).reverse().map((transaction, index) => ({ label: transaction.date || `#${index + 1}`, kirim: transaction.type === 'Kirim' ? transaction.amount : 0, chiqim: transaction.type === 'Chiqim' ? transaction.amount : 0 }))
  const maxTrend = Math.max(...trendRows.flatMap((row) => [row.kirim, row.chiqim]), 1)
  const typeRows = productTypes.map((type) => { const rows = products.filter((product) => (product.type || 'tayyor') === type.key); return { ...type, count: rows.length, value: rows.reduce((sum, product) => sum + product.stock * product.price, 0) } })
  const movement = new Map<string, { name: string; count: number; value: number }>()
  transactions.filter((transaction) => transaction.type === 'Kirim' || transaction.type === 'Chiqim').forEach((transaction) => { const name = transaction.productName || transaction.product || transaction.reference || 'Noma’lum mahsulot'; const row = movement.get(name) || { name, count: 0, value: 0 }; row.count += Number(transaction.qty) || 1; row.value += Number(transaction.amount) || 0; movement.set(name, row) })
  const topProducts = [...movement.values()].sort((a, b) => b.count - a.count).slice(0, 5)
  return <>
    <PageHeader title="Analitika" description="Real ombor ma’lumotlari asosida taqsimot va operatsiyalar tahlili" />
    <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4"><AnalyticsCard label="Jami inventar qiymati" value={money(totalValue)} /><AnalyticsCard label="Jami mahsulot soni" value={`${products.length} ta`} /><AnalyticsCard label="Kam qoldiqdagi mahsulotlar" value={`${lowStock} ta`} /><AnalyticsCard label="Faol omborlar" value={`${warehouses.length} ta`} /></div>
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="p-5"><h2 className="font-semibold">Kategoriyalar bo‘yicha qiymat</h2><div className="mt-5 flex flex-col gap-3">{categoryRows.map((row) => <div key={row.name}><div className="mb-1 flex justify-between text-xs"><span>{row.name}</span><span className="font-semibold">{totalValue ? Math.round(row.value / totalValue * 100) : 0}% · {money(row.value)}</span></div><div className="h-3 rounded-full bg-muted"><div className="h-3 rounded-full bg-primary" style={{ width: `${row.value / maxCategory * 100}%` }} /></div></div>)}{categoryRows.length === 0 && <EmptyState text="Hozircha ma’lumot yo‘q" />}</div></Card>
      <Card className="p-5"><h2 className="font-semibold">Omborlar bo‘yicha taqsimot</h2><div className="mt-5 flex flex-col gap-4">{warehouseRows.map((row) => <div key={row.name}><div className="flex justify-between text-sm"><span className="font-medium">{row.name}</span><span>{row.count} ta · {money(row.value)}</span></div><div className="mt-2 h-3 rounded-full bg-muted"><div className="h-3 rounded-full bg-cyan-400" style={{ width: `${row.value / maxWarehouse * 100}%` }} /></div></div>)}{warehouseRows.length === 0 && <EmptyState text="Hozircha ma’lumot yo‘q" />}</div></Card>
      <Card className="p-5"><div className="flex items-start justify-between"><div><h2 className="font-semibold">Kirim / Chiqim dinamikasi</h2><p className="mt-1 text-xs text-muted-foreground">Sana mavjud bo‘lmasa, so‘nggi tranzaksiyalar tartibi</p></div><div className="flex gap-3 text-xs"><span className="flex items-center gap-1"><i className="size-2 rounded-full bg-cyan-400" />Kirim</span><span className="flex items-center gap-1"><i className="size-2 rounded-full bg-primary" />Chiqim</span></div></div><div className="mt-5 flex h-48 items-end gap-2 border-b border-l px-3 pb-0 pt-3">{trendRows.map((row) => <div key={`${row.label}-${row.kirim}-${row.chiqim}`} className="flex h-full flex-1 items-end justify-center gap-1"><div className="w-1/3 rounded-t bg-cyan-400" style={{ height: `${row.kirim / maxTrend * 100}%` }} title={`Kirim: ${money(row.kirim)}`} /><div className="w-1/3 rounded-t bg-primary" style={{ height: `${row.chiqim / maxTrend * 100}%` }} title={`Chiqim: ${money(row.chiqim)}`} /></div>)}{trendRows.length === 0 && <div className="m-auto text-sm text-muted-foreground">Hozircha ma’lumot yo‘q</div>}</div><div className="mt-2 flex gap-2 overflow-hidden text-[10px] text-muted-foreground">{trendRows.map((row) => <span key={row.label} className="min-w-0 flex-1 truncate text-center">{row.label}</span>)}</div></Card>
      <Card className="p-5"><h2 className="font-semibold">Mahsulot turlari</h2><div className="mt-4 grid gap-3 sm:grid-cols-3">{typeRows.map((row) => <div key={row.key} className="rounded-lg border bg-muted/20 p-4"><p className="text-xs text-muted-foreground">{row.label}</p><p className="mt-2 text-xl font-bold">{row.count} ta</p><p className="mt-1 text-xs text-muted-foreground">{money(row.value)}</p></div>)}</div></Card>
    </div>
    <Card className="mt-6 overflow-hidden"><div className="border-b p-5"><h2 className="font-semibold">Eng ko‘p harakat qilgan TOP-5 mahsulot</h2><p className="mt-1 text-xs text-muted-foreground">Kirim va chiqim hujjatlaridagi miqdor bo‘yicha</p></div><div className="overflow-x-auto"><table className="w-full min-w-[600px] text-left text-sm"><thead className="bg-muted/50 text-xs text-muted-foreground"><tr><th className="px-5 py-3">Mahsulot</th><th className="px-5 py-3">Harakat miqdori</th><th className="px-5 py-3">Operatsiya summasi</th></tr></thead><tbody>{topProducts.map((row) => <tr key={row.name} className="border-b last:border-0"><td className="px-5 py-4 font-medium">{row.name}</td><td className="px-5 py-4">{row.count}</td><td className="px-5 py-4">{money(row.value)}</td></tr>)}</tbody></table></div>{topProducts.length === 0 && <EmptyState text="Hozircha ma’lumot yo‘q" />}</Card>
  </>
}

function AnalyticsCard({ label, value }: { label: string; value: string }) { return <Card className="p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-3 text-lg font-bold md:text-2xl">{value}</p></Card> }
function EmptyState({ text }: { text: string }) { return <div className="p-8 text-center text-sm text-muted-foreground">{text}</div> }

function ReportsPage({ products, transactions, warehouses }: { products: Product[]; transactions: Transaction[]; warehouses: Warehouse[] }) {
  const [selectedType, setSelectedType] = useState(reportTypes[0])
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [warehouse, setWarehouse] = useState('')
  const [rows, setRows] = useState<Record<string, any>[]>([])
  const [columns, setColumns] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [generated, setGenerated] = useState(false)

  const fallback = () => {
    const productRows = products.filter((product) => !warehouse || product.warehouse === warehouse)
    if (selectedType === 'Ombor qoldig‘i') return productRows.map((product) => ({ Nomi: product.name, Ombor: product.warehouse, Qoldiq: `${product.stock} ${product.unit}`, Narx: product.price, 'Jami qiymat': product.stock * product.price }))
    if (selectedType === 'Inventarizatsiya') return productRows.map((product) => ({ ID: product.productId, Nomi: product.name, Turi: productTypeLabel[product.type || 'tayyor'], Qoldiq: product.stock, 'Min. qoldiq': product.minStock, Holat: product.status }))
    const txRows = transactions.filter((transaction) => (selectedType === 'Savdo hisoboti' ? transaction.type === 'Chiqim' : transaction.type === 'Kirim' || transaction.type === 'Chiqim')).filter((transaction) => { const date = transaction.date || transaction.createdAt || transaction.created_at || ''; return (!from || date.includes(from)) && (!to || date.includes(to)) })
    if (selectedType === 'Savdo hisoboti') return [{ 'Jami chiqim soni': txRows.length, 'Jami summa': txRows.reduce((sum, transaction) => sum + (Number(transaction.amount) || 0), 0) }]
    return txRows.map((transaction) => ({ Hujjat: transaction.docNo || transaction.id, Turi: transaction.type, Sana: transaction.date || transaction.createdAt || transaction.created_at || '—', Izoh: transaction.reference, Summa: transaction.amount || 0 }))
  }

  const createReport = async () => {
    setLoading(true); setGenerated(true)
    const params: Record<string, string> = {}; if (from) params.from = from; if (to) params.to = to; if (warehouse) params.warehouse = warehouse
    let data: any = null
    try { data = await reportsApi.get(selectedType, params) } catch { data = null }
    const backendRows = Array.isArray(data) ? data : Array.isArray(data?.rows) ? data.rows : Array.isArray(data?.data) ? data.data : null
    const result = backendRows && backendRows.length > 0 ? backendRows : fallback()
    setRows(result); setColumns(Object.keys(result[0] || {})); setLoading(false)
  }

  const downloadCsv = () => {
    const csv = [columns, ...rows.map((row) => columns.map((column) => String(row[column] ?? '').replace(/"/g, '""')))].map((line) => line.map((cell) => `"${cell}"`).join(',')).join('\n')
    const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })); link.download = `${selectedType}.csv`; link.click(); URL.revokeObjectURL(link.href)
  }

  const downloadPdf = () => {
    setPdfLoading(true)
    const generatedAt = new Date()
    const timestamp = generatedAt.toLocaleString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })
    const fileTimestamp = `${generatedAt.getFullYear()}${String(generatedAt.getMonth() + 1).padStart(2, '0')}${String(generatedAt.getDate()).padStart(2, '0')}-${String(generatedAt.getHours()).padStart(2, '0')}${String(generatedAt.getMinutes()).padStart(2, '0')}${String(generatedAt.getSeconds()).padStart(2, '0')}`
    const fileName = `${selectedType}-${fileTimestamp}.pdf`
    const escapeHtml = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    const moneyColumns = new Set(['Narx', 'Jami qiymat', 'Summa', 'Jami summa'])
    const formatReportValue = (column: string, value: unknown) => {
      if (value == null || value === '') return '—'
      if (column === 'Sana') return formatTxDate(String(value))
      if (moneyColumns.has(column) && typeof value === 'number') return money(value)
      return String(value)
    }
    const filterText = from || to ? `Davr: ${from || '—'} — ${to || '—'}` : 'Barcha davrlar'
    const warehouseText = warehouse ? `Ombor: ${warehouse}` : 'Barcha omborlar'
    const totalAmount = rows.reduce((sum, row) => sum + (Number(row.Summa ?? row['Jami summa']) || 0), 0)
    const tableHead = columns.map((column) => `<th>${escapeHtml(column)}</th>`).join('')
    const tableBody = rows.map((row) => `<tr>${columns.map((column) => `<td>${escapeHtml(formatReportValue(column, row[column]))}</td>`).join('')}</tr>`).join('')
    const summary = selectedType === 'Savdo hisoboti' ? `<strong>Jami chiqim soni: ${rows.length} ta | Jami summa: ${money(totalAmount)}</strong>` : `<strong>Jami qatorlar: ${rows.length} ta</strong>`
    const printWindow = window.open('', '_blank', 'width=1200,height=800')
    if (!printWindow) { setPdfLoading(false); return }
    printWindow.document.write(`<!doctype html><html lang="uz"><head><meta charset="utf-8"><title>${escapeHtml(fileName)}</title><style>
      @page { size: A4 landscape; margin: 14mm; } * { box-sizing: border-box; } body { color: #111827; font-family: Arial, sans-serif; font-size: 10px; margin: 0; } h1 { font-size: 20px; margin: 0 0 4px; } h2 { font-size: 14px; margin: 12px 0 4px; } p { margin: 3px 0; } .meta { color: #374151; margin-bottom: 14px; } table { border-collapse: collapse; width: 100%; table-layout: auto; } th, td { border: 1px solid #d1d5db; padding: 5px 6px; text-align: left; vertical-align: top; overflow-wrap: anywhere; } th { background: #f3f4f6; font-weight: 700; } thead { display: table-header-group; } tr { page-break-inside: avoid; } .footer { border-top: 1px solid #d1d5db; margin-top: 12px; padding-top: 7px; } .print-page::after { content: 'Sahifa ' counter(page) '/' counter(pages); float: right; }
    </style></head><body><div class="print-page"><h1>PW OMBOR — Print Work WMS</h1><h2>${escapeHtml(selectedType)}</h2><div class="meta"><p>Hisobot turi: ${escapeHtml(selectedType)}</p><p>Yaratilgan sana: ${escapeHtml(timestamp)}</p><p>${escapeHtml(filterText)}</p><p>${escapeHtml(warehouseText)}</p></div><table><thead><tr>${tableHead}</tr></thead><tbody>${tableBody}</tbody></table><div class="footer">${summary}</div></div><script>window.onload = function () { window.print(); window.onafterprint = function () { window.close(); }; }<\/script></body></html>`)
    printWindow.document.close()
    setPdfLoading(false)
  }

  return <>
    <PageHeader title="Hisobotlar" description="Ombor va operatsiyalar bo‘yicha hisobotlarni yarating va yuklab oling." />
    <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{reportTypes.map((type) => <button key={type} onClick={() => { setSelectedType(type); setGenerated(false) }} className={`rounded-xl border p-4 text-left transition ${selectedType === type ? 'border-primary bg-primary/5 shadow-sm' : 'bg-card hover:border-primary'}`}><FileBarChart className="size-5 text-primary" /><p className="mt-3 text-sm font-semibold">{type}</p><p className="mt-1 text-xs text-muted-foreground">{type === 'Ombor qoldig‘i' ? 'Joriy qoldiq va qiymat' : type === 'Kirim-chiqim' ? 'Operatsiyalar tarixi' : type === 'Savdo hisoboti' ? 'Chiqimlar yig‘indisi' : 'To‘liq inventar holati'}</p></button>)}</div>
    <Card className="p-5"><div className="grid gap-4 md:grid-cols-4 md:items-end"><Field label="Boshlanish sanasi"><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={inputCls} /></Field><Field label="Tugash sanasi"><input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={inputCls} /></Field><Field label="Ombor"><select value={warehouse} onChange={(e) => setWarehouse(e.target.value)} className={inputCls}><option value="">Barcha omborlar</option>{warehouses.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}</select></Field><Button onClick={createReport} disabled={loading}>{loading ? 'Yuklanmoqda...' : 'Hisobotni yaratish'}</Button></div></Card>
    {generated && <Card className="mt-6 overflow-hidden"><div className="flex flex-col gap-3 border-b p-5 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-semibold">{selectedType}</h2><p className="mt-1 text-xs text-muted-foreground">{rows.length} ta natija</p></div>{rows.length > 0 && <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={downloadCsv}><Download className="size-4" />CSV yuklab olish</Button><Button onClick={downloadPdf} disabled={pdfLoading}><Download className="size-4" />{pdfLoading ? 'Tayyorlanmoqda...' : 'PDF yuklab olish'}</Button></div>}</div>{rows.length > 0 ? <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm"><thead className="bg-muted/50 text-xs text-muted-foreground"><tr>{columns.map((column) => <th key={column} className="px-5 py-3 font-medium">{column}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={index} className="border-b last:border-0 hover:bg-muted/30">{columns.map((column) => <td key={column} className="px-5 py-4">{column === 'Sana' ? formatTxDate(String(row[column] ?? '')) : typeof row[column] === 'number' ? money(row[column]) : String(row[column] ?? '—')}</td>)}</tr>)}</tbody></table></div> : <EmptyState text="Hozircha ma’lumot yo‘q" />}</Card>}
  </>
}

function GuidePage({ onNavigate }: { onNavigate: (key: string) => void }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState('')
  const [selected, setSelected] = useState('')
  const visible = guideContent.filter((item) => `${item.title} ${item.text}`.toLowerCase().includes(query.trim().toLowerCase()))
  const flow = [{ key: 'suppliers', label: 'Yetkazib beruvchi', description: 'Mahsulot olib keluvchi hamkorni tanlang yoki qo‘shing.', color: 'bg-amber-100 text-amber-800' }, { key: 'purchases', label: 'Kirim yaratish', description: 'Miqdor, narx va omborni kiritib qoldiqni oshiring.', color: 'bg-cyan-100 text-cyan-800' }, { key: 'inventory', label: 'Ombor\n(qoldiq oshadi)', description: 'Joriy qoldiq, birlik va mahsulot holatini ko‘ring.', color: 'bg-blue-100 text-blue-800' }, { key: 'products', label: 'Mahsulot turlari', description: 'Tayyor, xom va yarim tayyor mahsulotlarni ajrating.', color: 'bg-violet-100 text-violet-800' }, { key: 'available', label: 'Sotuvda mavjud', description: 'Qoldig‘i bor mahsulotlar shu yerda ko‘rinadi.', color: 'bg-emerald-100 text-emerald-800' }, { key: 'sales', label: 'Chiqim / Sotilgan', description: 'Sotuvni qayd eting va ombor qoldig‘ini kamaytiring.', color: 'bg-rose-100 text-rose-800' }, { key: 'sales', label: 'Mijoz', description: 'Mijoz buyurtmasiga mos chiqim hujjatini tekshiring.', color: 'bg-slate-100 text-slate-800' }]
  const sideBranches = [{ key: 'transfers', label: 'Ko‘chirish → boshqa ombor', description: 'Mahsulot miqdorini bir ombordan boshqasiga o‘tkazing.' }, { key: 'writeoffs', label: 'Hisobdan chiqarish → yo‘q qilinadi', description: 'Buzilgan yoki yaroqsiz mahsulotni sabab bilan chiqaring.' }, { key: 'expiry', label: 'Yaroqlilik muddati kuzatuvi', description: 'Partiya sanasi va qolgan kunlarni nazorat qiling.' }, { key: 'analytics', label: 'Analitika', description: 'Real qoldiq va operatsiyalarni grafiklarda tahlil qiling.' }, { key: 'reports', label: 'Hisobotlar', description: 'Filtrlangan ma’lumotni jadval va CSV ko‘rinishida oling.' }]
  return <>
    <PageHeader title="Qo‘llanma" description="PW OMBOR bo‘limlari va ish jarayonlari bo‘yicha amaliy yo‘riqnoma" />
    <div className="relative mb-6"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Qo‘llanmadan qidirish..." className="h-11 w-full rounded-lg border bg-card pl-10 pr-3 text-sm outline-none focus:border-primary" /></div>
    <Card className="mb-6 overflow-hidden p-5"><h2 className="font-semibold">Ombor ish jarayoni</h2><div className="mt-5 flex flex-wrap items-center justify-center gap-2">{flow.map((item, index) => <Fragment key={`${item.key}-${item.label}`}><button title={item.description} onClick={() => { setSelected(item.key); onNavigate(item.key) }} className={`whitespace-pre-line rounded-lg px-3 py-3 text-center text-xs font-semibold transition hover:-translate-y-0.5 hover:shadow ${item.color}`}>{item.label}</button>{index < flow.length - 1 && <ChevronRight className="size-4 text-muted-foreground" />}</Fragment>)}</div><div className="mt-4 flex flex-wrap justify-center gap-2">{sideBranches.map((branch) => <button key={branch.key} title={branch.description} onClick={() => { setSelected(branch.key); onNavigate(branch.key) }} className="rounded-lg border border-dashed px-3 py-2 text-xs font-medium text-muted-foreground transition hover:border-primary hover:text-primary">↘ {branch.label}</button>)}</div>{selected && <p className="mt-4 rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">{sideBranches.find((item) => item.key === selected)?.description || flow.find((item) => item.key === selected)?.description}</p>}</Card>
    <div className="space-y-3">{visible.map((item) => { const isOpen = query.trim() ? true : open === item.key; return <Card key={item.key} className="overflow-hidden"><button onClick={() => setOpen(open === item.key ? '' : item.key)} className="flex w-full items-center justify-between p-4 text-left"><span className="font-semibold">{item.title}</span><ChevronDown className={`size-4 transition ${isOpen ? 'rotate-180' : ''}`} /></button>{isOpen && <div className="border-t px-4 pb-5 pt-3 text-sm leading-6 text-muted-foreground">{item.text}</div>}</Card> })}{visible.length === 0 && <Card><EmptyState text="Hozircha ma’lumot yo‘q" /></Card>}</div>
  </>
}

function PageContent({ page, title, products, transactions, suppliers, users, expiry, categories, search, setSearch, searchMode, setSearchMode, bolimFilter, setBolimFilter, kategoriyaFilter, setKategoriyaFilter, onProduct, onDeleteProduct, onEditProduct, onAction, onNavigate, onAddCategory, onDeleteCategory }: { page: string; title: string; products: Product[]; transactions: Transaction[]; suppliers: Supplier[]; users: AppUser[]; expiry: ExpiryRow[]; categories: Category[]; search: string; setSearch: (s: string) => void; searchMode: 'name' | 'id' | 'barcode'; setSearchMode: (m: 'name' | 'id' | 'barcode') => void; bolimFilter: string; setBolimFilter: (s: string) => void; kategoriyaFilter: string; setKategoriyaFilter: (s: string) => void; onProduct: (p: Product) => void; onDeleteProduct: (p: Product) => void; onEditProduct: (p: Product) => void; onAction: () => void; onNavigate: (key: string) => void; onAddCategory: () => void; onDeleteCategory: (category: Category) => void }) {
  const isProductPage = page === 'products' || page === 'inventory' || page === 'ready-products' || page === 'raw-products' || page === 'semi-products' || page === 'available'
  const searchPlaceholder = searchMode === 'id' ? 'Mahsulot ID raqami...' : searchMode === 'barcode' ? 'Shtrix kodni kiriting...' : 'Mahsulot nomi...'
  const productPageDesc: Record<string, string> = {
    products: 'Mahsulot katalogi va narxlar boshqaruvi — barcha mahsulotlar to‘liq holda shu yerda.',
    inventory: 'Barcha omborlardagi mahsulot qoldiqlari',
    'ready-products': 'Tayyor mahsulotlar ro‘yxati',
    'raw-products': 'Xom ashyo ro‘yxati',
    'semi-products': 'Yarim tayyor mahsulotlar ro‘yxati',
    available: 'Qoldig‘i mavjud, hozir sotuvga tayyor mahsulotlar',
  }
  if (isProductPage) return <><PageHeader title={title} description={productPageDesc[page]} action="Mahsulot qo‘shish" onAction={onAction} /><Card className="overflow-hidden"><div className="flex flex-col gap-3 border-b p-4 md:flex-row md:items-center md:justify-between md:p-5">
    <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
      <select value={searchMode} onChange={(e) => setSearchMode(e.target.value as any)} className="h-10 shrink-0 rounded-lg border bg-background px-3 text-sm outline-none focus:border-primary">
        <option value="name">Nom bo‘yicha</option>
        <option value="id">ID bo‘yicha</option>
        <option value="barcode">Shtrix kod bo‘yicha</option>
        </select>
          <div className="relative w-full"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={searchPlaceholder} className="h-10 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none focus:border-primary" /></div>
      <select value={bolimFilter} onChange={(e) => { setBolimFilter(e.target.value); setKategoriyaFilter('') }} className="h-10 shrink-0 rounded-lg border bg-background px-3 text-sm outline-none focus:border-primary"><option value="">Barcha bo‘limlar</option>{categories.filter((category) => !category.parentId).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select>
      <select value={kategoriyaFilter} onChange={(e) => setKategoriyaFilter(e.target.value)} disabled={!bolimFilter} className="h-10 shrink-0 rounded-lg border bg-background px-3 text-sm outline-none focus:border-primary disabled:opacity-50"><option value="">Barcha kategoriyalar</option>{categories.find((category) => category.id === bolimFilter)?.name && <option value={bolimFilter}>{categories.find((category) => category.id === bolimFilter)?.name} (bo‘limning o‘zi)</option>}{categories.filter((category) => category.parentId === bolimFilter).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select>
    </div>
  </div><div className="overflow-x-auto"><table className="w-full min-w-[980px] text-left text-sm"><thead className="bg-muted/50 text-xs text-muted-foreground"><tr><th className="px-5 py-3">ID</th><th className="px-5 py-3">Mahsulot</th><th className="px-5 py-3">Turi</th><th className="px-5 py-3">Shtrix kod</th><th className="px-5 py-3">Kategoriya</th><th className="px-5 py-3">Ombor</th><th className="px-5 py-3">Qoldiq</th><th className="px-5 py-3">Narx</th><th className="px-5 py-3">Holat</th><th className="px-5 py-3">Joylashuv</th><th className="px-5 py-3"></th></tr></thead><tbody>{products.map((p) => { const location = getLocationBadge(p); const sectionName = categories.find((category) => category.id === (p.categoryParentId || p.categoryId))?.name; const categoryName = p.categoryParentId ? p.category : '—'; return <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30"><td className="px-5 py-4 font-mono text-xs text-muted-foreground">#{p.productId}</td><td className="cursor-pointer px-5 py-4" onClick={() => onProduct(p)}><div className="font-semibold">{p.name}</div><div className="mt-0.5 text-xs text-muted-foreground">{p.unit}</div></td><td className="px-5 py-4 text-xs text-muted-foreground">{productTypeLabel[p.type || 'tayyor']}</td><td className="px-5 py-4 font-mono text-xs text-muted-foreground">{p.barcode || '—'}</td><td className="px-5 py-4"><div className="text-xs text-muted-foreground">{sectionName || 'Bo‘limsiz'}</div><div className="font-semibold">{categoryName}</div></td><td className="px-5 py-4">{p.warehouse}</td><td className="px-5 py-4 font-semibold">{p.stock} {p.unit}</td><td className="px-5 py-4">{money(p.price)}</td><td className="px-5 py-4"><Badge className={getStatusClass(p.status)}>{p.status}</Badge></td><td className="px-5 py-4"><Badge className={location.className}>{location.label}</Badge></td><td className="px-5 py-4"><div className="flex justify-end gap-1">{p.barcode && <Button variant="ghost" onClick={() => downloadBarcodeLabel(p)}><Download className="size-4" /></Button>}<Button variant="ghost" onClick={() => onEditProduct(p)}><Pencil className="size-4" /></Button><Button variant="ghost" onClick={() => onDeleteProduct(p)}><Trash2 className="size-4" /></Button></div></td></tr> })}</tbody></table></div>{products.length === 0 && <div className="p-12 text-center text-sm text-muted-foreground">Mahsulot topilmadi</div>}</Card></>

  const txType: Record<string, string> = { purchases: 'Kirim', sales: 'Chiqim', sold: 'Chiqim', transfers: 'Ko‘chirish', writeoffs: 'Hisobdan chiqarish' }
  if (txType[page]) {
    const rows = transactions.filter((t) => t.type === txType[page])
    return <><PageHeader title={title} description={detailText[page] ?? 'Hujjatlar ro‘yxati'} action="Yangi yaratish" onAction={onAction} /><Card className="overflow-hidden"><div className="overflow-x-auto"><table className="w-full min-w-[750px] text-left text-sm"><thead className="bg-muted/50 text-xs text-muted-foreground"><tr><th className="px-5 py-3 font-medium">Hujjat</th><th className="px-5 py-3 font-medium">Izoh</th><th className="px-5 py-3 font-medium">Sana</th><th className="px-5 py-3 font-medium">Miqdor</th><th className="px-5 py-3 font-medium">Summa</th><th className="px-5 py-3 font-medium">Holat</th></tr></thead><tbody>{rows.map((t) => <tr key={t.id} className="border-b last:border-0 hover:bg-muted/30"><td className="px-5 py-4 font-semibold">{t.docNo}</td><td className="px-5 py-4 text-muted-foreground">{t.reference}</td><td className="px-5 py-4 text-xs text-muted-foreground">{t.date || t.createdAt || t.created_at || '—'}</td><td className="px-5 py-4">{t.qty || '—'}</td><td className="px-5 py-4">{t.amount ? money(t.amount) : '—'}</td><td className="px-5 py-4"><Badge className="status-success">{t.status}</Badge></td></tr>)}</tbody></table></div>{rows.length === 0 && <div className="p-12 text-center text-sm text-muted-foreground">Hozircha hujjat yo‘q</div>}</Card></>
  }

  if (page === 'categories') {
    const sections = categories.filter((category) => !category.parentId)
    return <><PageHeader title={title} description={detailText[page]} action="Kategoriya qo‘shish" onAction={onAddCategory} /><Card className="p-5"><div className="space-y-5">{sections.map((section) => { const children = categories.filter((category) => category.parentId === section.id); return <div key={section.id} className="rounded-xl border bg-muted/20 p-4"><div className="flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-wider text-primary">Bo‘lim</p><h2 className="mt-1 text-lg font-bold">{section.name}</h2></div><Button variant="ghost" onClick={() => onDeleteCategory(section)}><Trash2 className="size-4" /></Button></div><div className="mt-3 space-y-2 border-l-2 border-primary/20 pl-4">{children.map((child) => <div key={child.id} className="flex items-center justify-between rounded-lg border bg-card px-3 py-2 text-sm"><span>{child.name}</span><Button variant="ghost" onClick={() => onDeleteCategory(child)}><Trash2 className="size-4" /></Button></div>)}{children.length === 0 && <p className="text-sm text-muted-foreground">Bu bo‘limda kategoriya yo‘q</p>}</div></div>})}{sections.length === 0 && <EmptyState text="Hozircha kategoriya yo‘q" />}</div></Card></>
  }

  const data = page === 'suppliers' ? suppliers : page === 'users' ? users : page === 'roles' ? staticRoles : page === 'expiry' ? expiry : null
  if (data) return <GenericTable page={page} title={title} data={data} onAction={onAction} />
  return <><PageHeader title={title} description={detailText[page] ?? 'Ombor operatsiyalarini samarali boshqaring.'} action={page === 'settings' ? undefined : 'Yangi yaratish'} onAction={onAction} /><Card className="p-6"><div className="flex min-h-60 flex-col items-center justify-center text-center"><div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><ChartNoAxesCombined className="size-7" /></div><h2 className="text-lg font-semibold">{title} bo‘yicha boshqaruv</h2><p className="mt-2 max-w-md text-sm text-muted-foreground">Bu bo‘lim tez orada to‘liq ishga tushiriladi.</p></div></Card></>
}

function GenericTable({ page, title, data, onAction }: { page: string; title: string; data: any[]; onAction: () => void }) {
  const cols = Object.keys(data[0] ?? {}).filter((k) => k !== 'id')
  return <><PageHeader title={title} description={detailText[page]} action={page === 'roles' ? undefined : 'Yangi qo‘shish'} onAction={page === 'roles' ? undefined : onAction} /><Card className="overflow-hidden"><div className="flex items-center justify-between border-b p-4"><div className="relative w-full max-w-sm"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input placeholder="Qidirish..." className="h-10 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none focus:border-primary" /></div></div><div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm"><thead className="bg-muted/50 text-xs text-muted-foreground"><tr>{cols.map((k) => <th key={k} className="px-5 py-3 font-medium">{k === 'name' ? title.slice(0, -1) : k}</th>)}</tr></thead><tbody>{data.map((row, index) => <tr key={row.id ?? index} className="border-b last:border-0 hover:bg-muted/30">{cols.map((key) => { const value = row[key]; return <td key={key} className="px-5 py-4">{key === 'status' ? <Badge className={getStatusClass(String(value))}>{String(value)}</Badge> : key === 'active' ? <Badge className={value ? 'status-success' : 'status-muted'}>{value ? 'Faol' : 'Faol emas'}</Badge> : key === 'debt' ? money(Number(value)) : String(value)}</td> })}</tr>)}</tbody></table></div>{data.length === 0 && <div className="p-12 text-center text-sm text-muted-foreground">Hozircha ma’lumot yo‘q</div>}</Card></>
}

function ProductDrawer({ product, onClose }: { product: Product; onClose: () => void }) { return <><div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} /><div className="fixed inset-y-0 right-0 z-50 w-full max-w-md overflow-y-auto bg-card p-6 shadow-2xl"><div className="flex items-start justify-between"><div><p className="text-xs font-semibold uppercase tracking-wider text-primary">Mahsulot tafsilotlari</p><h2 className="mt-2 text-xl font-bold">{product.name}</h2><p className="mt-1 font-mono text-xs text-muted-foreground">ID: {product.productId} • SKU: {product.sku}</p></div><Button variant="ghost" onClick={onClose}><X className="size-5" /></Button></div><div className="mt-8 grid grid-cols-2 gap-3"><Card className="bg-muted/30 p-4"><div className="text-xs text-muted-foreground">Qoldiq</div><div className="mt-2 text-xl font-bold">{product.stock}</div><div className="text-xs text-muted-foreground">{product.unit}</div></Card><Card className="bg-muted/30 p-4"><div className="text-xs text-muted-foreground">Sotuv narxi</div><div className="mt-2 text-lg font-bold">{money(product.price)}</div></Card></div>{product.barcode && <Card className="mt-4 flex flex-col items-center bg-muted/20 p-4"><div className="mb-2 text-xs text-muted-foreground">Shtrix kod (ID: {product.productId})</div><BarcodeImage value={product.barcode} className="max-w-full" /><Button variant="outline" className="mt-3" onClick={() => downloadBarcodeLabel(product)}><Download className="size-4" />Shtrix kod + ID yuklab olish</Button></Card>}<div className="mt-8 flex flex-col gap-4">{[['Kategoriya', product.category], ['Ombor', product.warehouse], ['Minimal qoldiq', `${product.minStock} ${product.unit}`], ['Holat', product.status]].map(([a, b]) => <div key={a} className="flex items-center justify-between border-b pb-3 text-sm"><span className="text-muted-foreground">{a}</span><span className="font-semibold">{b}</span></div>)}</div><Button className="mt-8 w-full" onClick={onClose}>Yopish</Button></div></> }

function CategoryModal({ categories, onClose, onSave }: { categories: Category[]; onClose: () => void; onSave: (name: string, parentId: string | null) => Promise<void> }) {
  const [mode, setMode] = useState<'section' | 'category'>('section')
  const [name, setName] = useState('')
  const [parentId, setParentId] = useState('')
  const [saving, setSaving] = useState(false)
  const sections = categories.filter((category) => !category.parentId)
  return <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 p-4" onClick={onClose}><div className="mx-auto mt-[12vh] max-w-md rounded-xl border bg-card p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}><div className="flex items-center justify-between"><div><h2 className="text-lg font-bold">{mode === 'section' ? 'Bo‘lim qo‘shish' : 'Kategoriya qo‘shish'}</h2><p className="mt-1 text-sm text-muted-foreground">Avval yozuv turini tanlang.</p></div><Button variant="ghost" onClick={onClose}><X className="size-5" /></Button></div><div className="mt-5 grid grid-cols-2 gap-2"><label className={`cursor-pointer rounded-lg border p-3 text-sm ${mode === 'section' ? 'border-primary bg-primary/5' : ''}`}><input type="radio" checked={mode === 'section'} onChange={() => { setMode('section'); setParentId('') }} className="mr-2" />Bo‘lim</label><label className={`cursor-pointer rounded-lg border p-3 text-sm ${mode === 'category' ? 'border-primary bg-primary/5' : ''}`}><input type="radio" checked={mode === 'category'} onChange={() => setMode('category')} className="mr-2" />Kategoriya</label></div><Field label={mode === 'section' ? 'Bo‘lim nomi' : 'Kategoriya nomi'}><input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="Masalan: Kitoblar" className={inputCls} /></Field>{mode === 'category' && <Field label="Bo‘lim"><select value={parentId} onChange={(event) => setParentId(event.target.value)} className={inputCls}><option value="">Bo‘limni tanlang</option>{sections.map((section) => <option key={section.id} value={section.id}>{section.name}</option>)}</select></Field>}<div className="mt-6 flex justify-end gap-2"><Button variant="outline" onClick={onClose}>Bekor qilish</Button><Button disabled={saving} onClick={async () => { if (!name.trim() || (mode === 'category' && !parentId)) return; setSaving(true); await onSave(name.trim(), mode === 'category' ? parentId : null); setSaving(false) }}>{saving ? 'Saqlanmoqda...' : 'Saqlash'}</Button></div></div></div>
}

function CategoryDeleteModal({ category, message, onClose, onForce }: { category: Category; message: string; onClose: () => void; onForce: () => void }) {
  return <div className="fixed inset-0 z-50 bg-black/40 p-4" onClick={onClose}><div className="mx-auto mt-[18vh] max-w-md rounded-xl border bg-card p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}><h2 className="text-lg font-bold">{category.name} ni o‘chirish</h2><p className="mt-3 text-sm text-muted-foreground">{message}</p><p className="mt-3 text-sm">Baribir bo‘lim va unga tegishli barcha kategoriyalar o‘chirilsinmi?</p><div className="mt-6 flex justify-end gap-2"><Button variant="outline" onClick={onClose}>Bekor qilish</Button><Button onClick={onForce}>Baribir hammasini o‘chirish</Button></div></div></div>
}

function SimpleModal({ page, onClose, onSave }: { page: string; onClose: () => void; onSave: (name: string) => Promise<void> | void }) {
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const labelFor: Record<string, string> = { suppliers: 'Yetkazib beruvchi nomi', categories: 'Kategoriya nomi' }
  return <><div className="fixed inset-0 z-50 bg-black/40 p-4" onClick={onClose}><div className="mx-auto mt-[12vh] max-w-md rounded-xl border bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}><div className="flex items-center justify-between"><div><h2 className="text-lg font-bold">Yangi qo‘shish</h2><p className="mt-1 text-sm text-muted-foreground">Maydonni to‘ldirib, davom eting.</p></div><Button variant="ghost" onClick={onClose}><X className="size-5" /></Button></div><label className="mt-6 block text-sm font-medium">{labelFor[page] ?? 'Nomi'}<input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Masalan: Yangi material" className={inputCls} /></label><div className="mt-6 flex justify-end gap-2"><Button variant="outline" onClick={onClose}>Bekor qilish</Button><Button className="disabled:opacity-60" onClick={async () => { if (!name) return; setSaving(true); await onSave(name); setSaving(false) }}>{saving ? 'Saqlanmoqda...' : 'Saqlash'}</Button></div></div></div></>
}

function WarehousesPage({ warehouses, loading, onAdd, onEdit, onDelete }: { warehouses: Warehouse[]; loading: boolean; onAdd: () => void; onEdit: (w: Warehouse) => void; onDelete: (w: Warehouse) => void }) {
  return <>
    <PageHeader title="Omborlar" description="Omborlar va ularning sig‘imini boshqaring. Ma’lumotlar bazasiga real vaqtda saqlanadi." action="Ombor qo‘shish" onAction={onAdd} />
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[650px] text-left text-sm">
          <thead className="bg-muted/50 text-xs text-muted-foreground"><tr><th className="px-5 py-3 font-medium">Ombor</th><th className="px-5 py-3 font-medium">Kod</th><th className="px-5 py-3 font-medium">Mahsulotlar</th><th className="px-5 py-3 font-medium">Qiymat</th><th className="px-5 py-3"></th></tr></thead>
          <tbody>{warehouses.map((w) => <tr key={w.id} className="border-b last:border-0 hover:bg-muted/30"><td className="px-5 py-4 font-semibold">{w.name}</td><td className="px-5 py-4 font-mono text-xs text-muted-foreground">{w.code}</td><td className="px-5 py-4">{w.products}</td><td className="px-5 py-4">{money(w.value)}</td><td className="px-5 py-4"><div className="flex justify-end gap-1"><Button variant="ghost" onClick={() => onEdit(w)}><Pencil className="size-4" /></Button><Button variant="ghost" onClick={() => onDelete(w)}><Trash2 className="size-4" /></Button></div></td></tr>)}</tbody>
        </table>
      </div>
      {!loading && warehouses.length === 0 && <div className="p-12 text-center text-sm text-muted-foreground">Hozircha omborlar yo‘q</div>}
    </Card>
  </>
}

function WarehouseModal({ warehouse, onClose, onSave }: { warehouse: Warehouse | null; onClose: () => void; onSave: (input: { name: string; code: string }) => void }) {
  const [name, setName] = useState(warehouse?.name ?? '')
  const [code, setCode] = useState(warehouse?.code ?? '')
  const [saving, setSaving] = useState(false)
  return <><div className="fixed inset-0 z-50 bg-black/40 p-4" onClick={onClose}><div className="mx-auto mt-[12vh] max-w-md rounded-xl border bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
    <div className="flex items-center justify-between"><div><h2 className="text-lg font-bold">{warehouse ? 'Omborni tahrirlash' : 'Ombor qo‘shish'}</h2><p className="mt-1 text-sm text-muted-foreground">Maydonlarni to‘ldirib, davom eting.</p></div><Button variant="ghost" onClick={onClose}><X className="size-5" /></Button></div>
    <label className="mt-6 block text-sm font-medium">Ombor nomi<input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Masalan: Markaziy ombor" className={inputCls} /></label>
    <label className="mt-4 block text-sm font-medium">Ombor kodi<input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Masalan: MRK-04" className={inputCls} /></label>
    <div className="mt-6 flex justify-end gap-2"><Button variant="outline" onClick={onClose}>Bekor qilish</Button><Button className="disabled:opacity-60" onClick={async () => { if (!name || !code) return; setSaving(true); await onSave({ name, code }); setSaving(false) }}>{saving ? 'Saqlanmoqda...' : 'Saqlash'}</Button></div>
  </div></div></>
}

function ProductModal({ warehouses, categories, product, presetType, onClose, onSave }: { warehouses: Warehouse[]; categories: Category[]; product?: Product | null; presetType?: string; onClose: () => void; onSave: (input: any) => void }) {
  const isEdit = !!product
  const [name, setName] = useState(product?.name ?? '')
  const [warehouse, setWarehouse] = useState(product?.warehouse ?? warehouses[0]?.name ?? '')
  const [bolimId, setBolimId] = useState<string | null>(product?.categoryParentId ?? (product?.categoryId && categories.find((category) => category.id === product.categoryId && !category.parentId)?.id) ?? '')
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? '')
  const [type, setType] = useState(product?.type ?? presetType ?? 'tayyor')
  const [unit, setUnit] = useState(product?.unit ?? 'dona')
  const [stock, setStock] = useState(product ? String(product.stock) : '')
  const [minStock, setMinStock] = useState(product ? String(product.minStock) : '')
  const [price, setPrice] = useState(product ? String(product.price) : '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  // Oyna ochilgan zahoti — hech narsa kiritilmasa ham — ko'rinadigan tasodifiy shtrix kod. Faqat vizual: "Saqlash" bosilmasa, hech qayerga yozilmaydi.
  const [previewBarcode, setPreviewBarcode] = useState(() => product?.barcode || randomBarcode())
  const sections = categories.filter((category) => !category.parentId)
  const childCategories = categories.filter((category) => category.parentId != null && String(category.parentId) === String(bolimId))
  const sectionCategory = sections.find((section) => String(section.id) === String(bolimId))
  const selectedCategory = categories.find((category) => String(category.id) === String(categoryId))
  return <><div className="fixed inset-0 z-50 bg-black/40 p-4 overflow-y-auto" onClick={onClose}><div className="mx-auto my-[6vh] max-w-md rounded-xl border bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
    <div className="flex items-center justify-between"><div><h2 className="text-lg font-bold">{isEdit ? 'Mahsulotni tahrirlash' : 'Mahsulot qo‘shish'}</h2><p className="mt-1 text-sm text-muted-foreground">{isEdit ? 'Mahsulot maʼlumotlarini yangilang.' : 'ID raqami saqlaganingizda avtomatik beriladi.'}</p></div><Button variant="ghost" onClick={onClose}><X className="size-5" /></Button></div>

    <div className="mt-4 flex flex-col items-center gap-2 rounded-lg border border-dashed bg-muted/30 p-4">
      <span className="text-xs text-muted-foreground">{isEdit ? 'Shtrix kod' : 'Vaqtinchalik shtrix kod (namuna)'}</span>
      <BarcodeImage value={previewBarcode} className="max-w-full" />
      {!isEdit && <button type="button" onClick={() => setPreviewBarcode(randomBarcode())} className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"><RefreshCw className="size-3" />Boshqasini ko‘rsatish</button>}
    </div>

    <Field label="Mahsulot nomi"><input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Masalan: List" className={inputCls} /></Field>
    <Field label="Mahsulot turi">
      <select value={type} onChange={(e) => setType(e.target.value)} className={inputCls}>
        {productTypes.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
      </select>
    </Field>
    <Field label="Bo‘lim"><select value={String(bolimId)} onChange={(e) => { setBolimId(e.target.value || null); setCategoryId('') }} className={inputCls}><option value="">Bo‘limni tanlang</option>{sections.map((section) => <option key={section.id} value={section.id}>{section.name}</option>)}</select></Field>
    <Field label="Kategoriya"><select value={String(categoryId)} onChange={(e) => setCategoryId(e.target.value)} disabled={!bolimId} className={inputCls + ' disabled:opacity-50'}><option value="">Kategoriyani tanlang</option>{sectionCategory && <option value={sectionCategory.id}>{sectionCategory.name} (bo‘limning o‘zi)</option>}{childCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></Field>
    <Field label="Ombor"><select value={warehouse} onChange={(e) => setWarehouse(e.target.value)} className={inputCls}>{warehouses.map((w) => <option key={w.id} value={w.name}>{w.name}</option>)}</select></Field>
    <div className="mt-4 grid grid-cols-2 gap-3">
      <Field label="O‘lchov birligi"><input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="dona / metr / quti" className={inputCls} /></Field>
      <Field label="Narx"><input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="numeric" placeholder="0" className={inputCls} /></Field>
    </div>
    <div className="mt-4 grid grid-cols-2 gap-3">
      <Field label="Qoldiq (nechta bor)"><input value={stock} onChange={(e) => setStock(e.target.value)} inputMode="numeric" placeholder="0" className={inputCls} /></Field>
      <Field label="Min. qoldiq"><input value={minStock} onChange={(e) => setMinStock(e.target.value)} inputMode="numeric" placeholder="0" className={inputCls} /></Field>
    </div>
    {!isEdit && <p className="mt-4 rounded-lg bg-primary/5 px-3 py-2 text-xs text-muted-foreground">Saqlagach, mahsulotga tizim tomonidan avtomatik ID raqami va shtrix kod beriladi — mahsulot ustiga bosib, uni yuklab olishingiz mumkin.</p>}
    {error && <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}
    <div className="mt-6 flex justify-end gap-2"><Button variant="outline" onClick={onClose}>Bekor qilish</Button><Button disabled={saving} onClick={async () => { if (!name || !warehouse || !bolimId || !categoryId || !selectedCategory) { setError('Mahsulot nomi, bo‘lim, kategoriya va omborni to‘ldiring.'); return }; setSaving(true); setError(''); try { await onSave({ name, warehouse, categoryId, category: selectedCategory.name, type, unit, stock: Number(stock) || 0, minStock: Number(minStock) || 0, price: Number(price) || 0 }) } catch (e: any) { setError(e?.message ?? 'Xatolik') } finally { setSaving(false) } }}>{saving ? 'Saqlanmoqda...' : 'Saqlash'}</Button></div>
  </div></div></>
}

// Kirim / Chiqim / Ko'chirish / Hisobdan chiqarish uchun yagona shakl
function TransactionModal({ pageKey, label, products, warehouses, suppliers, categories, onClose, onSave }: { pageKey: string; label: string; products: Product[]; warehouses: Warehouse[]; suppliers: Supplier[]; categories: Category[]; onClose: () => void; onSave: (input: any) => void }) {
  const [barcode, setBarcode] = useState('')
  const [barcodeStatus, setBarcodeStatus] = useState<'idle' | 'looking' | 'found' | 'notfound'>('idle')
  const [productName, setProductName] = useState('')
  const [category, setCategory] = useState('')
  const [unit, setUnit] = useState('dona')
  const [warehouse, setWarehouse] = useState(warehouses[0]?.name ?? '')
  const [targetWarehouse, setTargetWarehouse] = useState(warehouses[1]?.name ?? warehouses[0]?.name ?? '')
  const [qty, setQty] = useState('')
  const [price, setPrice] = useState('')
  const [operationDate, setOperationDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [supplier, setSupplier] = useState('')
  const [reference, setReference] = useState('')
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Mavjud mahsulot ro'yxatdan tanlansa, uning birligi/narxi/turi avtomatik to'ldiriladi
  const handleProductPick = (value: string) => {
    setProductName(value)
    const match = products.find((p) => p.name === value)
    if (match) { setUnit(match.unit); setPrice(String(match.price)); setCategory(match.category); setBarcode(match.barcode || '') }
  }

  // Shtrix kod skanerlansa yoki qo'lda kiritilsa - bazadan mahsulotni qidiradi va maydonlarni avtomatik to'ldiradi
  const lookupBarcode = async (code: string) => {
    const clean = code.trim()
    setBarcode(clean)
    if (!clean) { setBarcodeStatus('idle'); return }
    setBarcodeStatus('looking')
    try {
      const found = await barcodeApi.lookup(clean)
      setProductName(found.name)
      setCategory(found.category)
      setUnit(found.unit)
      setPrice(String(found.price))
      // Agar mahsulot shu omborda mavjud bo'lsa, joriy qoldiqni ko'rsatish uchun ombor tanlovini ham moslashtiramiz
      if (found.stocks?.length && !found.stocks.some((s: any) => s.warehouse === warehouse)) {
        setWarehouse(found.stocks[0].warehouse)
      }
      setBarcodeStatus('found')
    } catch {
      setBarcodeStatus('notfound')
    }
  }

  const submit = async () => {
    setError('')
    if (!productName || !qty || Number(qty) <= 0 || !warehouse) { setError('Mahsulot nomi, miqdor va omborni to‘ldiring.'); return }
    if (pageKey === 'transfers' && (!targetWarehouse || targetWarehouse === warehouse)) { setError('Ko‘chirish uchun boshqa manzil ombor tanlang.'); return }
    setSaving(true)
    try {
      await onSave({
        productName, barcode: barcodeStatus === 'found' ? barcode : undefined, category, unit, price: Number(price) || 0, qty: Number(qty), warehouse, date: operationDate,
        targetWarehouse: pageKey === 'transfers' ? targetWarehouse : undefined,
        supplier: pageKey === 'purchases' ? supplier : undefined,
        reference: reference || undefined,
        reason: pageKey === 'writeoffs' ? reason : undefined,
      })
    } catch (e: any) {
      setError(e?.message ?? 'Xatolik yuz berdi')
    } finally {
      setSaving(false)
    }
  }

  return <><div className="fixed inset-0 z-50 bg-black/40 p-4 overflow-y-auto" onClick={onClose}><div className="mx-auto my-[6vh] max-w-md rounded-xl border bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
    <div className="flex items-center justify-between"><div><h2 className="text-lg font-bold">{label} yaratish</h2><p className="mt-1 text-sm text-muted-foreground">Shtrix kodni skanerlang yoki mahsulotni qo‘lda tanlang.</p></div><Button variant="ghost" onClick={onClose}><X className="size-5" /></Button></div>

    <Field label="Shtrix kod">
      <div className="flex gap-2">
        <input value={barcode} onChange={(e) => lookupBarcode(e.target.value.replace(/\D/g, ''))} placeholder="Kodni kiriting yoki kamera bilan skanerlang" inputMode="numeric" className={inputCls + ' flex-1'} />
        <div className="mt-2"><BarcodeScanButton onScan={lookupBarcode} /></div>
      </div>
      {barcodeStatus === 'looking' && <p className="mt-1 text-xs text-muted-foreground">Qidirilmoqda...</p>}
      {barcodeStatus === 'found' && <p className="mt-1 text-xs text-emerald-600">Mahsulot topildi: {productName}</p>}
      {barcodeStatus === 'notfound' && <p className="mt-1 text-xs text-amber-600">Bu kodga mos mahsulot topilmadi — pastda mahsulot nomini qo‘lda kiriting.</p>}
    </Field>

    <Field label="Mahsulot nomi"><input list="pw-products" value={productName} onChange={(e) => handleProductPick(e.target.value)} placeholder="Masalan: List" className={inputCls} /><datalist id="pw-products">{Array.from(new Set(products.map((p) => p.name))).map((n) => <option key={n} value={n} />)}</datalist></Field>
    <Field label="Bo‘lim / kategoriya"><select value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls}><option value="">Bo‘lim yoki kategoriyani tanlang</option>{categories.filter((item) => !item.parentId).map((section) => <Fragment key={section.id}><option value={section.name}>{section.name} (bo‘lim)</option>{categories.filter((item) => item.parentId === section.id).map((child) => <option key={child.id} value={child.name}>— {child.name}</option>)}</Fragment>)}</select></Field>

    <div className="mt-4 grid grid-cols-2 gap-3">
      <Field label={pageKey === 'transfers' ? 'Qaysi ombordan' : 'Ombor'}><select value={warehouse} onChange={(e) => setWarehouse(e.target.value)} className={inputCls}>{warehouses.map((w) => <option key={w.id} value={w.name}>{w.name}</option>)}</select></Field>
      {pageKey === 'transfers'
        ? <Field label="Qaysi omborga"><select value={targetWarehouse} onChange={(e) => setTargetWarehouse(e.target.value)} className={inputCls}>{warehouses.map((w) => <option key={w.id} value={w.name}>{w.name}</option>)}</select></Field>
        : <Field label="O‘lchov birligi"><input value={unit} onChange={(e) => setUnit(e.target.value)} className={inputCls} /></Field>}
    </div>

    <div className="mt-4 grid grid-cols-2 gap-3">
      <Field label="Miqdor (nechta)"><input autoFocus value={qty} onChange={(e) => setQty(e.target.value)} inputMode="numeric" placeholder="0" className={inputCls} /></Field>
      <Field label="Narx (birlik)"><input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="numeric" placeholder="0" className={inputCls} /></Field>
    </div>

    <Field label="Operatsiya sanasi"><input type="date" value={operationDate} onChange={(e) => setOperationDate(e.target.value)} className={inputCls} /></Field>

    {pageKey === 'purchases' && <Field label="Yetkazib beruvchi"><input list="pw-suppliers" value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="Kompaniya nomi" className={inputCls} /><datalist id="pw-suppliers">{suppliers.map((s) => <option key={s.id} value={s.name} />)}</datalist></Field>}
    {pageKey === 'writeoffs' && <Field label="Sababi"><input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Masalan: buzilgan, muddati o‘tgan..." className={inputCls} /></Field>}
    <Field label="Izoh (ixtiyoriy)"><input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Qo‘shimcha izoh" className={inputCls} /></Field>

    {error && <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}
    <div className="mt-6 flex justify-end gap-2"><Button variant="outline" onClick={onClose}>Bekor qilish</Button><Button className="disabled:opacity-60" onClick={submit} disabled={saving}>{saving ? 'Saqlanmoqda...' : 'Saqlash'}</Button></div>
  </div></div></>
}

function ExpiryPage({ rows, onAdd, onDelete }: { rows: ExpiryRow[]; onAdd: () => void; onDelete: (r: ExpiryRow) => void }) {
  return <>
    <PageHeader title="Yaroqlilik muddati" description="Partiyalar va yaroqlilik muddatlarini nazorat qiling." action="Partiya qo‘shish" onAction={onAdd} />
    <Card className="overflow-hidden"><div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm">
      <thead className="bg-muted/50 text-xs text-muted-foreground"><tr><th className="px-5 py-3 font-medium">Mahsulot</th><th className="px-5 py-3 font-medium">Shtrix kod</th><th className="px-5 py-3 font-medium">Partiya</th><th className="px-5 py-3 font-medium">Ombor</th><th className="px-5 py-3 font-medium">Muddati</th><th className="px-5 py-3 font-medium">Qolgan kun</th><th className="px-5 py-3 font-medium">Soni</th><th className="px-5 py-3"></th></tr></thead>
      <tbody>{rows.map((r) => <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30">
        <td className="px-5 py-4 font-semibold">{r.name}</td>
        <td className="px-5 py-4 font-mono text-xs text-muted-foreground">{r.barcode || '—'}</td>
        <td className="px-5 py-4 font-mono text-xs text-muted-foreground">{r.batch}</td>
        <td className="px-5 py-4">{r.warehouse}</td>
        <td className="px-5 py-4">{r.expiry}</td>
        <td className="px-5 py-4"><Badge className={r.days <= 15 ? 'status-warning' : 'status-success'}>{r.days} kun</Badge></td>
        <td className="px-5 py-4">{r.qty}</td>
        <td className="px-5 py-4"><Button variant="ghost" onClick={() => onDelete(r)}><Trash2 className="size-4" /></Button></td>
      </tr>)}</tbody>
    </table></div>{rows.length === 0 && <div className="p-12 text-center text-sm text-muted-foreground">Hozircha partiya yo‘q</div>}</Card>
  </>
}

function ExpiryModal({ products, warehouses, onClose, onSave }: { products: Product[]; warehouses: Warehouse[]; onClose: () => void; onSave: (input: any) => void }) {
  const [productName, setProductName] = useState('')
  const [warehouse, setWarehouse] = useState(warehouses[0]?.name ?? '')
  const [batch, setBatch] = useState('')
  const [expiry, setExpiry] = useState('')
  const [qty, setQty] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  return <><div className="fixed inset-0 z-50 bg-black/40 p-4 overflow-y-auto" onClick={onClose}><div className="mx-auto my-[6vh] max-w-md rounded-xl border bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
    <div className="flex items-center justify-between"><div><h2 className="text-lg font-bold">Partiya qo‘shish</h2><p className="mt-1 text-sm text-muted-foreground">Mahsulot avval ro‘yxatga qo‘shilgan bo‘lishi kerak.</p></div><Button variant="ghost" onClick={onClose}><X className="size-5" /></Button></div>
    <Field label="Mahsulot"><input autoFocus list="pw-exp-products" value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="Mavjud mahsulotni tanlang" className={inputCls} /><datalist id="pw-exp-products">{Array.from(new Set(products.map((p) => p.name))).map((n) => <option key={n} value={n} />)}</datalist></Field>
    <Field label="Ombor"><select value={warehouse} onChange={(e) => setWarehouse(e.target.value)} className={inputCls}>{warehouses.map((w) => <option key={w.id} value={w.name}>{w.name}</option>)}</select></Field>
    <div className="mt-4 grid grid-cols-2 gap-3">
      <Field label="Partiya raqami"><input value={batch} onChange={(e) => setBatch(e.target.value)} placeholder="Masalan: SW-24-08" className={inputCls} /></Field>
      <Field label="Miqdor"><input value={qty} onChange={(e) => setQty(e.target.value)} inputMode="numeric" placeholder="0" className={inputCls} /></Field>
    </div>
    <Field label="Yaroqlilik muddati"><input type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} className={inputCls} /></Field>
    {error && <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}
    <div className="mt-6 flex justify-end gap-2"><Button variant="outline" onClick={onClose}>Bekor qilish</Button><Button disabled={saving} onClick={async () => { if (!productName || !warehouse || !expiry || !qty) { setError('Barcha maydonlarni to‘ldiring.'); return }; setSaving(true); try { await onSave({ productName, warehouse, batch, expiry, qty: Number(qty) }) } catch (e: any) { setError(e?.message ?? 'Xatolik'); } finally { setSaving(false) } }}>{saving ? 'Saqlanmoqda...' : 'Saqlash'}</Button></div>
  </div></div></>
}

function UsersPage({ users, currentUser, onToggleActive, onChangeRole }: { users: AppUser[]; currentUser: CurrentUser; onToggleActive: (u: AppUser) => void; onChangeRole: (u: AppUser, role: string) => void }) {
  const isAdmin = currentUser.role === 'admin'
  return <>
    <PageHeader title="Foydalanuvchilar" description="Foydalanuvchilar va ularning tizimdagi kirishlarini boshqaring." />
    <Card className="overflow-hidden"><div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm">
      <thead className="bg-muted/50 text-xs text-muted-foreground"><tr><th className="px-5 py-3 font-medium">Foydalanuvchi</th><th className="px-5 py-3 font-medium">Telefon</th><th className="px-5 py-3 font-medium">Rol</th><th className="px-5 py-3 font-medium">Holat</th>{isAdmin && <th className="px-5 py-3"></th>}</tr></thead>
      <tbody>{users.map((u) => <tr key={u.id} className="border-b last:border-0 hover:bg-muted/30">
        <td className="px-5 py-4 font-semibold">{u.name}</td>
        <td className="px-5 py-4 text-muted-foreground">{u.email}</td>
        <td className="px-5 py-4">{isAdmin ? <select value={u.role} onChange={(e) => onChangeRole(u, e.target.value)} className="h-9 rounded-lg border bg-background px-2 text-xs"><option value="Administrator">Administrator</option><option value="Ombor mudiri">Ombor mudiri</option><option value="Operator">Operator</option></select> : u.role}</td>
        <td className="px-5 py-4"><Badge className={u.active ? 'status-success' : 'status-muted'}>{u.active ? 'Faol' : 'Faol emas'}</Badge></td>
        {isAdmin && <td className="px-5 py-4"><Button variant="outline" onClick={() => onToggleActive(u)}>{u.active ? 'Bloklash' : 'Faollashtirish'}</Button></td>}
      </tr>)}</tbody>
    </table></div>{users.length === 0 && <div className="p-12 text-center text-sm text-muted-foreground">Hozircha foydalanuvchi yo‘q</div>}</Card>
  </>
}

function SettingsPage({ onNotify }: { onNotify: (msg: string) => void }) {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    settingsApi.get().then(setSettings).catch(() => onNotify('Sozlamalarni yuklab bo‘lmadi')).finally(() => setLoading(false))
  }, [])

  const update = (key: string, value: string) => setSettings((s) => ({ ...s, [key]: value }))

  const saveAll = async () => {
    setSaving(true)
    try {
      await Promise.all(Object.entries(settings).map(([key, value]) => settingsApi.set(key, value)))
      onNotify('Sozlamalar saqlandi')
    } catch (e: any) {
      onNotify(`Xatolik: ${e?.message ?? 'saqlanmadi'}`)
    } finally {
      setSaving(false)
    }
  }

  const fields: [string, string][] = [['company_name', 'Kompaniya nomi'], ['app_name', 'Tizim nomi'], ['currency', 'Valyuta belgisi']]

  return <>
    <PageHeader title="Tizim sozlamalari" description="Tizim, bildirishnomalar va integratsiya sozlamalari." />
    <Card className="max-w-lg p-6">
      {loading ? <div className="text-sm text-muted-foreground">Yuklanmoqda...</div> : <>
        {fields.map(([key, label]) => (
          <Field key={key} label={label}><input value={settings[key] ?? ''} onChange={(e) => update(key, e.target.value)} className={inputCls} /></Field>
        ))}
        <Button className="mt-6" onClick={saveAll} disabled={saving}>{saving ? 'Saqlanmoqda...' : 'Saqlash'}</Button>
      </>}
    </Card>
  </>
}
