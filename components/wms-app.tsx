'use client'

import { useEffect, useMemo, useState } from 'react'
import { BarChart3, Bell, Boxes, CalendarClock, ChartNoAxesCombined, ChevronDown, ChevronLeft, ChevronRight, CircleHelp, FileBarChart, FileMinus2, LayoutDashboard, LogOut, Menu, Package, PackageCheck, PackagePlus, PackageOpen, ShoppingBag, ReceiptText, Plus, Search, Settings2, Tags, Truck, UserRound, Users, Warehouse, ArrowDownToLine, ArrowLeftRight, ArrowUpFromLine, CheckCircle2, AlertTriangle, MoreHorizontal, Download, X, TrendingUp, Pencil, Trash2, RefreshCw } from 'lucide-react'
import { allNavItems, chartData, categoryData, dashboardCards as staticDashboardCards, detailText, getStatusClass, getTypeClass, labelMap, money, navGroups, roles as staticRoles, productTypes, productTypeLabel, productTypeByPage, randomBarcode } from '@/lib/wms-data'
import { categoriesApi, dashboardApi, expiryApi, productsApi, barcodeApi, settingsApi, suppliersApi, transactionsApi, usersApi, warehousesApi } from '@/lib/api'
import { BarcodeScanButton } from '@/components/barcode-scanner'
import { BarcodeImage, downloadBarcodeLabel } from '@/components/barcode-image'

type Product = { id: string; productId: string; name: string; sku: string; barcode: string; category: string; unit: string; price: number; stock: number; minStock: number; warehouse: string; warehouseId: string; status: string; type?: string }
type Warehouse = { id: string; name: string; code: string; products: number; value: number }
type Supplier = { id: string; name: string; phone: string; orders: number; debt: number; status: string }
type AppUser = { id: string; name: string; email: string; role: string; active: boolean }
type ExpiryRow = { id: string; name: string; barcode: string; batch: string; expiry: string; days: number; qty: number; warehouse: string }
type Transaction = { id: string; docNo: string; type: string; reference: string; qty: number; amount: number; status: string }
type Category = { id: string; name: string }
type CurrentUser = { id: string; username: string; role: string }

const iconFor: Record<string, React.ElementType> = { LayoutDashboard, Package, PackageCheck, PackagePlus, PackageOpen, ShoppingBag, ReceiptText, Boxes, ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight, FileMinus2, Truck, ChartNoAxesCombined, FileBarChart, CalendarClock, Settings2, Users, Warehouse, Tags }
const productLikePages = new Set(['products', 'inventory', 'ready-products', 'raw-products', 'semi-products', 'available'])
const roleLabel: Record<string, string> = { admin: 'Administrator', manager: 'Ombor mudiri', operator: 'Operator' }
const txTypeKey: Record<string, string> = { purchases: 'kirim', sales: 'chiqim', sold: 'chiqim', transfers: 'transfer', writeoffs: 'hisobdan_chiqarish' }
const txTypeLabel: Record<string, string> = { purchases: 'Kirim', sales: 'Chiqim', sold: 'Chiqim', transfers: 'Ko‘chirish', writeoffs: 'Hisobdan chiqarish' }

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
  const [modal, setModal] = useState<'product' | 'simple' | 'warehouse' | 'transaction' | 'expiry' | null>(null)
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [presetProductType, setPresetProductType] = useState<string | undefined>(undefined)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
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
    const q = search.trim().toLowerCase()
    if (!q) return base
    return base.filter((p) => {
      if (searchMode === 'id') return p.productId.toLowerCase().includes(q)
      if (searchMode === 'barcode') return (p.barcode || '').toLowerCase().includes(q)
      return p.name.toLowerCase().includes(q)
    })
  }, [products, search, searchMode, page])
  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(''), 3000) }
  const go = (key: string) => { setPage(key); setMobileOpen(false); setSearch('') }
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

  const saveSimpleEntry = async (text: string) => {
    if (page === 'suppliers') return withNotify(() => suppliersApi.create({ name: text }), 'Yetkazib beruvchi qo‘shildi')
    if (page === 'categories') return withNotify(() => categoriesApi.create(text), 'Kategoriya qo‘shildi')
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
          : page === 'warehouses'
          ? <WarehousesPage warehouses={warehousesList} loading={loading} onAdd={() => { setEditingWarehouse(null); setModal('warehouse') }} onEdit={(w) => { setEditingWarehouse(w); setModal('warehouse') }} onDelete={deleteWarehouse} />
          : page === 'settings'
          ? <SettingsPage onNotify={notify} />
          : page === 'users'
          ? <UsersPage users={usersList} currentUser={currentUser} onToggleActive={toggleUserActive} onChangeRole={changeUserRole} />
          : page === 'expiry'
          ? <ExpiryPage rows={expiryList} onAdd={() => setModal('expiry')} onDelete={deleteExpiry} />
          : <PageContent page={page} title={pageTitle} products={filteredProducts} transactions={transactionsList} suppliers={suppliersList} users={usersList} expiry={expiryList} categories={categoriesList} search={search} setSearch={setSearch} searchMode={searchMode} setSearchMode={setSearchMode} onProduct={setSelectedProduct} onDeleteProduct={deleteProduct}
              onEditProduct={(p) => { setEditingProduct(p); setModal('product') }}
              onAction={() => { setEditingProduct(null); setPresetProductType(productTypeByPage[page]); setModal(productLikePages.has(page) ? 'product' : txTypeKey[page] ? 'transaction' : 'simple') }} onNavigate={go} />}
      </main>
    </div>
    {selectedProduct && <ProductDrawer product={selectedProduct} onClose={() => setSelectedProduct(null)} />}
    {modal === 'warehouse' && <WarehouseModal warehouse={editingWarehouse} onClose={() => { setModal(null); setEditingWarehouse(null) }} onSave={async (input) => { await saveWarehouse(input); setModal(null); setEditingWarehouse(null) }} />}
    {modal === 'product' && <ProductModal warehouses={warehousesList} categories={categoriesList} product={editingProduct} presetType={presetProductType} onClose={() => { setModal(null); setEditingProduct(null); setPresetProductType(undefined) }} onSave={async (input) => { await saveProduct(input); setModal(null); setEditingProduct(null); setPresetProductType(undefined) }} />}
    {modal === 'transaction' && txTypeKey[page] && <TransactionModal pageKey={page} label={txTypeLabel[page]} products={products} warehouses={warehousesList} suppliers={suppliersList} categories={categoriesList} onClose={() => setModal(null)} onSave={async (input) => { await saveTransaction(input); setModal(null) }} />}
    {modal === 'expiry' && <ExpiryModal products={products} warehouses={warehousesList} onClose={() => setModal(null)} onSave={async (input) => { await saveExpiry(input); setModal(null) }} />}
    {modal === 'simple' && <SimpleModal page={page} onClose={() => setModal(null)} onSave={async (text) => { await saveSimpleEntry(text); setModal(null) }} />}
    {toast && <div className="fixed bottom-5 right-5 z-[60] flex items-center gap-3 rounded-lg bg-sidebar px-4 py-3 text-sm font-medium text-white shadow-xl"><CheckCircle2 className="size-4 text-cyan-300" />{toast}</div>}
  </div>
}

function Dashboard({ stats, onNavigate, products, transactions, onAction }: { stats: any; onNavigate: (key: string) => void; products: Product[]; transactions: Transaction[]; onAction: (key: string) => void }) {
  const lowStockProducts = products.filter((p) => p.status === 'Kam qoldiq')
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
      <Card className="p-4 md:p-6"><div className="mb-5 flex items-start justify-between"><div><h2 className="font-semibold">Savdo va kirim dinamikasi</h2><p className="mt-1 text-xs text-muted-foreground">So‘nggi 7 kun, mln so‘m</p></div></div><div className="relative h-56"><div className="absolute inset-0 flex flex-col justify-between text-[10px] text-muted-foreground"><span>20 mln</span><span>15 mln</span><span>10 mln</span><span>5 mln</span><span>0</span></div><div className="ml-10 flex h-full items-end gap-2 border-b border-l pb-0 pl-3 sm:gap-4">{chartData.map((d) => <div key={d.name} className="flex h-full flex-1 items-end gap-1"><div className="w-full rounded-t bg-primary/85" style={{ height: `${d.sales * 4.5}%` }} /><div className="w-full rounded-t bg-cyan-400/70" style={{ height: `${d.purchases * 4.5}%` }} /><span className="absolute bottom-[-22px] text-[10px] text-muted-foreground">{d.name}</span></div>)}</div></div><div className="mt-8 flex gap-5 text-xs text-muted-foreground"><span className="flex items-center gap-2"><i className="size-2 rounded-full bg-primary" />Savdo</span><span className="flex items-center gap-2"><i className="size-2 rounded-full bg-cyan-400" />Kirim</span></div></Card>
      <Card className="p-4 md:p-6"><div className="mb-4 flex items-center justify-between"><div><h2 className="font-semibold">Kategoriyalar</h2><p className="mt-1 text-xs text-muted-foreground">Inventar taqsimoti</p></div><Button variant="ghost" onClick={() => onNavigate('products')}>Batafsil <ChevronRight className="size-4" /></Button></div><div className="flex items-center gap-6"><div className="relative flex size-36 shrink-0 items-center justify-center rounded-full" style={{ background: 'conic-gradient(#175CD3 0 38%, #22B8CF 38% 62%, #7C5CFC 62% 83%, #9AA8BA 83% 100%)' }}><div className="flex size-24 items-center justify-center rounded-full bg-card text-center"><div><b className="block text-lg">{products.length}</b><span className="text-[10px] text-muted-foreground">qator</span></div></div></div><div className="flex flex-col gap-3 text-xs">{categoryData.map((c) => <div key={c.name} className="flex items-center gap-2"><i className="size-2 rounded-full" style={{ background: c.color }} />{c.name}<span className="ml-auto font-semibold">{c.value}%</span></div>)}</div></div></Card>
    </div>
    <div className="mt-4 grid gap-4 lg:grid-cols-[1.6fr_1fr] lg:gap-6">
      <Card className="overflow-hidden"><div className="flex items-center justify-between border-b p-4 md:p-6"><div><h2 className="font-semibold">So‘nggi operatsiyalar</h2><p className="mt-1 text-xs text-muted-foreground">Oxirgi kirim va chiqimlar</p></div><Button variant="ghost" onClick={() => onNavigate('purchases')}>Barchasi <ChevronRight className="size-4" /></Button></div><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-muted/50 text-xs text-muted-foreground"><tr><th className="px-4 py-3 font-medium md:px-6">Hujjat</th><th className="px-4 py-3 font-medium">Turi</th><th className="hidden px-4 py-3 font-medium md:table-cell">Izoh</th><th className="px-4 py-3 font-medium">Summa</th><th className="px-4 py-3 font-medium">Holat</th></tr></thead><tbody>{transactions.slice(0, 8).map((t) => <tr key={t.id} className="border-b last:border-0"><td className="px-4 py-3 font-semibold md:px-6">{t.docNo}</td><td className="px-4 py-3"><Badge className={getTypeClass(t.type)}>{t.type}</Badge></td><td className="hidden px-4 py-3 text-muted-foreground md:table-cell">{t.reference}</td><td className="px-4 py-3 font-medium">{t.amount ? money(t.amount) : '—'}</td><td className="px-4 py-3"><Badge className="status-success"><CheckCircle2 className="mr-1 size-3" />{t.status}</Badge></td></tr>)}</tbody></table></div>{transactions.length === 0 && <div className="p-8 text-center text-sm text-muted-foreground">Hozircha operatsiya yo‘q</div>}</Card>
      <Card><div className="flex items-center justify-between border-b p-4 md:p-6"><div><h2 className="font-semibold">Kam qoldiq</h2><p className="mt-1 text-xs text-muted-foreground">Diqqat talab qiladigan mahsulotlar</p></div><AlertTriangle className="size-5 text-amber-500" /></div><div className="flex flex-col">{lowStockProducts.map((p) => <button key={p.id} onClick={() => onNavigate('inventory')} className="flex items-center justify-between border-b p-4 text-left last:border-0 hover:bg-muted/30"><div><p className="text-sm font-semibold">{p.name}</p><p className="mt-1 text-xs text-muted-foreground">{p.sku}{p.barcode ? ` • kod: ${p.barcode}` : ''} • {p.warehouse}</p></div><div className="text-right"><b className="text-amber-600">{p.stock} {p.unit}</b><p className="text-[11px] text-muted-foreground">min: {p.minStock}</p></div></button>)}{lowStockProducts.length === 0 && <div className="p-6 text-center text-sm text-muted-foreground">Kam qoldiq yo‘q</div>}</div><div className="p-4"><Button variant="outline" className="w-full" onClick={() => onNavigate('inventory')}>Qoldiqlarni ko‘rish</Button></div></Card>
    </div>
    <div className="mt-6"><div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">Tezkor amallar</h2></div><div className="grid grid-cols-2 gap-3 md:grid-cols-4">{['products', 'purchases', 'sales', 'transfers'].map((key, i) => <button key={key} onClick={() => onAction(key)} className="flex items-center gap-3 rounded-xl border bg-card p-4 text-left transition hover:border-primary hover:shadow-sm"><div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">{i === 0 ? <Plus className="size-4" /> : i === 1 ? <ArrowDownToLine className="size-4" /> : i === 2 ? <ArrowUpFromLine className="size-4" /> : <ArrowLeftRight className="size-4" />}</div><span className="text-sm font-semibold">{['Mahsulot qo‘shish', 'Kirim yaratish', 'Chiqim yaratish', 'Ko‘chirish'][i]}</span></button>)}</div></div>
  </>
}

function PageContent({ page, title, products, transactions, suppliers, users, expiry, categories, search, setSearch, searchMode, setSearchMode, onProduct, onDeleteProduct, onEditProduct, onAction, onNavigate }: { page: string; title: string; products: Product[]; transactions: Transaction[]; suppliers: Supplier[]; users: AppUser[]; expiry: ExpiryRow[]; categories: Category[]; search: string; setSearch: (s: string) => void; searchMode: 'name' | 'id' | 'barcode'; setSearchMode: (m: 'name' | 'id' | 'barcode') => void; onProduct: (p: Product) => void; onDeleteProduct: (p: Product) => void; onEditProduct: (p: Product) => void; onAction: () => void; onNavigate: (key: string) => void }) {
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
    <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center md:max-w-lg">
      <select value={searchMode} onChange={(e) => setSearchMode(e.target.value as any)} className="h-10 shrink-0 rounded-lg border bg-background px-3 text-sm outline-none focus:border-primary">
        <option value="name">Nom bo‘yicha</option>
        <option value="id">ID bo‘yicha</option>
        <option value="barcode">Shtrix kod bo‘yicha</option>
      </select>
      <div className="relative w-full"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={searchPlaceholder} className="h-10 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none focus:border-primary" /></div>
    </div>
  </div><div className="overflow-x-auto"><table className="w-full min-w-[980px] text-left text-sm"><thead className="bg-muted/50 text-xs text-muted-foreground"><tr><th className="px-5 py-3">ID</th><th className="px-5 py-3">Mahsulot</th><th className="px-5 py-3">Turi</th><th className="px-5 py-3">Shtrix kod</th><th className="px-5 py-3">Kategoriya</th><th className="px-5 py-3">Ombor</th><th className="px-5 py-3">Qoldiq</th><th className="px-5 py-3">Narx</th><th className="px-5 py-3">Holat</th><th className="px-5 py-3"></th></tr></thead><tbody>{products.map((p) => <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30"><td className="px-5 py-4 font-mono text-xs text-muted-foreground">#{p.productId}</td><td className="cursor-pointer px-5 py-4" onClick={() => onProduct(p)}><div className="font-semibold">{p.name}</div><div className="mt-0.5 text-xs text-muted-foreground">{p.unit}</div></td><td className="px-5 py-4 text-xs text-muted-foreground">{productTypeLabel[p.type || 'tayyor']}</td><td className="px-5 py-4 font-mono text-xs text-muted-foreground">{p.barcode || '—'}</td><td className="px-5 py-4">{p.category}</td><td className="px-5 py-4">{p.warehouse}</td><td className="px-5 py-4 font-semibold">{p.stock} {p.unit}</td><td className="px-5 py-4">{money(p.price)}</td><td className="px-5 py-4"><Badge className={getStatusClass(p.status)}>{p.status}</Badge></td><td className="px-5 py-4"><div className="flex justify-end gap-1">{p.barcode && <Button variant="ghost" onClick={() => downloadBarcodeLabel(p)}><Download className="size-4" /></Button>}<Button variant="ghost" onClick={() => onEditProduct(p)}><Pencil className="size-4" /></Button><Button variant="ghost" onClick={() => onDeleteProduct(p)}><Trash2 className="size-4" /></Button></div></td></tr>)}</tbody></table></div>{products.length === 0 && <div className="p-12 text-center text-sm text-muted-foreground">Mahsulot topilmadi</div>}</Card></>

  const txType: Record<string, string> = { purchases: 'Kirim', sales: 'Chiqim', sold: 'Chiqim', transfers: 'Ko‘chirish', writeoffs: 'Hisobdan chiqarish' }
  if (txType[page]) {
    const rows = transactions.filter((t) => t.type === txType[page])
    return <><PageHeader title={title} description={detailText[page] ?? 'Hujjatlar ro‘yxati'} action="Yangi yaratish" onAction={onAction} /><Card className="overflow-hidden"><div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm"><thead className="bg-muted/50 text-xs text-muted-foreground"><tr><th className="px-5 py-3 font-medium">Hujjat</th><th className="px-5 py-3 font-medium">Izoh</th><th className="px-5 py-3 font-medium">Miqdor</th><th className="px-5 py-3 font-medium">Summa</th><th className="px-5 py-3 font-medium">Holat</th></tr></thead><tbody>{rows.map((t) => <tr key={t.id} className="border-b last:border-0 hover:bg-muted/30"><td className="px-5 py-4 font-semibold">{t.docNo}</td><td className="px-5 py-4 text-muted-foreground">{t.reference}</td><td className="px-5 py-4">{t.qty || '—'}</td><td className="px-5 py-4">{t.amount ? money(t.amount) : '—'}</td><td className="px-5 py-4"><Badge className="status-success">{t.status}</Badge></td></tr>)}</tbody></table></div>{rows.length === 0 && <div className="p-12 text-center text-sm text-muted-foreground">Hozircha hujjat yo‘q</div>}</Card></>
  }

  if (page === 'categories') return <><PageHeader title={title} description={detailText[page]} action="Kategoriya qo‘shish" onAction={onAction} /><Card className="overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-muted/50 text-xs text-muted-foreground"><tr><th className="px-5 py-3 font-medium">Kategoriya</th></tr></thead><tbody>{categories.map((c) => <tr key={c.id} className="border-b last:border-0"><td className="px-5 py-4 font-medium">{c.name}</td></tr>)}</tbody></table></div>{categories.length === 0 && <div className="p-12 text-center text-sm text-muted-foreground">Hozircha kategoriya yo‘q</div>}</Card></>

  const data = page === 'suppliers' ? suppliers : page === 'users' ? users : page === 'roles' ? staticRoles : page === 'expiry' ? expiry : null
  if (data) return <GenericTable page={page} title={title} data={data} onAction={onAction} />
  return <><PageHeader title={title} description={detailText[page] ?? 'Ombor operatsiyalarini samarali boshqaring.'} action={page === 'settings' ? undefined : 'Yangi yaratish'} onAction={onAction} /><Card className="p-6"><div className="flex min-h-60 flex-col items-center justify-center text-center"><div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><ChartNoAxesCombined className="size-7" /></div><h2 className="text-lg font-semibold">{title} bo‘yicha boshqaruv</h2><p className="mt-2 max-w-md text-sm text-muted-foreground">Bu bo‘lim tez orada to‘liq ishga tushiriladi.</p></div></Card></>
}

function GenericTable({ page, title, data, onAction }: { page: string; title: string; data: any[]; onAction: () => void }) {
  const cols = Object.keys(data[0] ?? {}).filter((k) => k !== 'id')
  return <><PageHeader title={title} description={detailText[page]} action={page === 'roles' ? undefined : 'Yangi qo‘shish'} onAction={page === 'roles' ? undefined : onAction} /><Card className="overflow-hidden"><div className="flex items-center justify-between border-b p-4"><div className="relative w-full max-w-sm"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input placeholder="Qidirish..." className="h-10 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none focus:border-primary" /></div></div><div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm"><thead className="bg-muted/50 text-xs text-muted-foreground"><tr>{cols.map((k) => <th key={k} className="px-5 py-3 font-medium">{k === 'name' ? title.slice(0, -1) : k}</th>)}</tr></thead><tbody>{data.map((row, index) => <tr key={row.id ?? index} className="border-b last:border-0 hover:bg-muted/30">{cols.map((key) => { const value = row[key]; return <td key={key} className="px-5 py-4">{key === 'status' ? <Badge className={getStatusClass(String(value))}>{String(value)}</Badge> : key === 'active' ? <Badge className={value ? 'status-success' : 'status-muted'}>{value ? 'Faol' : 'Faol emas'}</Badge> : key === 'debt' ? money(Number(value)) : String(value)}</td> })}</tr>)}</tbody></table></div>{data.length === 0 && <div className="p-12 text-center text-sm text-muted-foreground">Hozircha ma’lumot yo‘q</div>}</Card></>
}

function ProductDrawer({ product, onClose }: { product: Product; onClose: () => void }) { return <><div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} /><div className="fixed inset-y-0 right-0 z-50 w-full max-w-md overflow-y-auto bg-card p-6 shadow-2xl"><div className="flex items-start justify-between"><div><p className="text-xs font-semibold uppercase tracking-wider text-primary">Mahsulot tafsilotlari</p><h2 className="mt-2 text-xl font-bold">{product.name}</h2><p className="mt-1 font-mono text-xs text-muted-foreground">ID: {product.productId} • SKU: {product.sku}</p></div><Button variant="ghost" onClick={onClose}><X className="size-5" /></Button></div><div className="mt-8 grid grid-cols-2 gap-3"><Card className="bg-muted/30 p-4"><div className="text-xs text-muted-foreground">Qoldiq</div><div className="mt-2 text-xl font-bold">{product.stock}</div><div className="text-xs text-muted-foreground">{product.unit}</div></Card><Card className="bg-muted/30 p-4"><div className="text-xs text-muted-foreground">Sotuv narxi</div><div className="mt-2 text-lg font-bold">{money(product.price)}</div></Card></div>{product.barcode && <Card className="mt-4 flex flex-col items-center bg-muted/20 p-4"><div className="mb-2 text-xs text-muted-foreground">Shtrix kod (ID: {product.productId})</div><BarcodeImage value={product.barcode} className="max-w-full" /><Button variant="outline" className="mt-3" onClick={() => downloadBarcodeLabel(product)}><Download className="size-4" />Shtrix kod + ID yuklab olish</Button></Card>}<div className="mt-8 flex flex-col gap-4">{[['Kategoriya', product.category], ['Ombor', product.warehouse], ['Minimal qoldiq', `${product.minStock} ${product.unit}`], ['Holat', product.status]].map(([a, b]) => <div key={a} className="flex items-center justify-between border-b pb-3 text-sm"><span className="text-muted-foreground">{a}</span><span className="font-semibold">{b}</span></div>)}</div><Button className="mt-8 w-full" onClick={onClose}>Yopish</Button></div></> }

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
  const [category, setCategory] = useState(product?.category ?? '')
  const [type, setType] = useState(product?.type ?? presetType ?? 'tayyor')
  const [unit, setUnit] = useState(product?.unit ?? 'dona')
  const [stock, setStock] = useState(product ? String(product.stock) : '')
  const [minStock, setMinStock] = useState(product ? String(product.minStock) : '')
  const [price, setPrice] = useState(product ? String(product.price) : '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  // Oyna ochilgan zahoti — hech narsa kiritilmasa ham — ko'rinadigan tasodifiy shtrix kod. Faqat vizual: "Saqlash" bosilmasa, hech qayerga yozilmaydi.
  const [previewBarcode, setPreviewBarcode] = useState(() => product?.barcode || randomBarcode())
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
    <Field label="Kategoriya"><input list="pw-categories" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Mavjudidan tanlang yoki yangi yozing" className={inputCls} /><datalist id="pw-categories">{categories.map((c) => <option key={c.id} value={c.name} />)}</datalist></Field>
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
    <div className="mt-6 flex justify-end gap-2"><Button variant="outline" onClick={onClose}>Bekor qilish</Button><Button disabled={saving} onClick={async () => { if (!name || !warehouse) { setError('Mahsulot nomi va omborni to‘ldiring.'); return }; setSaving(true); setError(''); try { await onSave({ name, warehouse, category, type, unit, stock: Number(stock) || 0, minStock: Number(minStock) || 0, price: Number(price) || 0 }) } catch (e: any) { setError(e?.message ?? 'Xatolik') } finally { setSaving(false) } }}>{saving ? 'Saqlanmoqda...' : 'Saqlash'}</Button></div>
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
        productName, barcode: barcodeStatus === 'found' ? barcode : undefined, category, unit, price: Number(price) || 0, qty: Number(qty), warehouse,
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
    <Field label="Turi (kategoriya)"><input list="pw-categories-2" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Ro‘yxatdan tanlang yoki yangi yozing" className={inputCls} /><datalist id="pw-categories-2">{categories.map((c) => <option key={c.id} value={c.name} />)}</datalist></Field>

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
