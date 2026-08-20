export type Product = { id: string; name: string; sku: string; category: string; unit: string; price: number; stock: number; minStock: number; warehouse: string; status: 'Faol' | 'Kam qoldiq' }
export type Transaction = { id: string; type: 'Kirim' | 'Chiqim' | 'Ko‘chirish' | 'Hisobdan chiqarish'; reference: string; date: string; amount: number; status: 'Yakunlangan' | 'Kutilmoqda' }

export const products: Product[] = [
  { id: '1', name: 'Silikon bo‘yoq — Oq', sku: 'SW-001', category: 'Bo‘yoqlar', unit: 'dona', price: 185000, stock: 248, minStock: 40, warehouse: 'Asosiy ombor', status: 'Faol' },
  { id: '2', name: 'Qog‘oz A4 80g', sku: 'PR-204', category: 'Qog‘oz', unit: 'quti', price: 52000, stock: 86, minStock: 100, warehouse: 'Asosiy ombor', status: 'Kam qoldiq' },
  { id: '3', name: 'Laminatsiya plyonkasi A3', sku: 'LM-042', category: 'Sarflov materiallari', unit: 'paket', price: 76000, stock: 132, minStock: 30, warehouse: 'Print ombori', status: 'Faol' },
  { id: '4', name: 'Banner mato 440g', sku: 'BN-440', category: 'Banner', unit: 'metr', price: 28500, stock: 640, minStock: 200, warehouse: 'Print ombori', status: 'Faol' },
  { id: '5', name: 'Kraft karton 300g', sku: 'KT-300', category: 'Qog‘oz', unit: 'dona', price: 4100, stock: 54, minStock: 80, warehouse: 'Asosiy ombor', status: 'Kam qoldiq' },
  { id: '6', name: 'Rangli siyoh — Cyan', sku: 'IN-C01', category: 'Siyohlar', unit: 'dona', price: 340000, stock: 19, minStock: 10, warehouse: 'Print ombori', status: 'Faol' },
]

export const transactions: Transaction[] = [
  { id: 'K-1048', type: 'Kirim', reference: 'FARGO TRADE MCHJ', date: 'Bugun, 10:42', amount: 12840000, status: 'Yakunlangan' },
  { id: 'S-0834', type: 'Chiqim', reference: 'PRINT WORK BUYURTMA #834', date: 'Bugun, 09:15', amount: 4260000, status: 'Yakunlangan' },
  { id: 'T-0142', type: 'Ko‘chirish', reference: 'Asosiy → Print ombori', date: 'Kecha, 17:30', amount: 0, status: 'Yakunlangan' },
  { id: 'K-1047', type: 'Kirim', reference: 'PAPER HOUSE LLC', date: 'Kecha, 14:12', amount: 6840000, status: 'Yakunlangan' },
]

export const navGroups = [
  { label: 'Asosiy', items: [{ key: 'dashboard', label: 'Bosh sahifa', icon: 'LayoutDashboard' }, { key: 'products', label: 'Mahsulotlar', icon: 'Package' }, { key: 'ready-products', label: 'Tayyor mahsulotlar', icon: 'PackageCheck' }, { key: 'raw-products', label: 'Xom mahsulotlar', icon: 'PackagePlus' }, { key: 'semi-products', label: 'Yarim tayyor mahsulotlar', icon: 'PackageOpen' }, { key: 'inventory', label: 'Ombordagi mahsulotlar', icon: 'Boxes' }] },
  { label: 'Operatsiyalar', items: [{ key: 'purchases', label: 'Kirim qilingan mahsulotlar', icon: 'ArrowDownToLine' }, { key: 'sales', label: 'Chiqim qilingan mahsulotlar', icon: 'ArrowUpFromLine' }, { key: 'available', label: 'Sotuvda mavjud mahsulotlar', icon: 'ShoppingBag' }, { key: 'sold', label: 'Sotilgan mahsulotlar', icon: 'ReceiptText' }, { key: 'transfers', label: 'Ko‘chirishlar', icon: 'ArrowLeftRight' }, { key: 'writeoffs', label: 'Hisobdan chiqarish', icon: 'FileMinus2' }] },
  { label: 'Boshqaruv', items: [{ key: 'suppliers', label: 'Yetkazib beruvchilar', icon: 'Truck' }, { key: 'analytics', label: 'Analitika', icon: 'ChartNoAxesCombined' }, { key: 'reports', label: 'Hisobotlar', icon: 'FileBarChart' }, { key: 'expiry', label: 'Yaroqlilik muddati', icon: 'CalendarClock' }] },
  { label: 'Sozlamalar', items: [{ key: 'settings', label: 'Tizim sozlamalari', icon: 'Settings2' }, { key: 'users', label: 'Foydalanuvchilar', icon: 'Users' }, { key: 'warehouses', label: 'Omborlar', icon: 'Warehouse' }, { key: 'categories', label: 'Kategoriyalar', icon: 'Tags' }] },
  { label: 'Yordam', items: [{ key: 'guide', label: 'Qo‘llanma', icon: 'BookOpen' }] },
]

// Mahsulot turlari: Tayyor mahsulot / Xom ashyo / Yarim tayyor mahsulot
export const productTypes: { key: string; label: string }[] = [
  { key: 'tayyor', label: 'Tayyor mahsulot' },
  { key: 'xom', label: 'Xom ashyo' },
  { key: 'yarim_tayyor', label: 'Yarim tayyor mahsulot' },
]
export const productTypeLabel: Record<string, string> = Object.fromEntries(productTypes.map((t) => [t.key, t.label]))
export const productTypeByPage: Record<string, string> = { 'ready-products': 'tayyor', 'raw-products': 'xom', 'semi-products': 'yarim_tayyor' }

// Mahsulot qo'shish oynasi ochilganda darhol ko'rinadigan tasodifiy (vaqtinchalik) shtrix kod — faqat vizual ko'rinish uchun, saqlanmaguncha bazaga yozilmaydi
export const randomBarcode = () => Array.from({ length: 12 }, () => Math.floor(Math.random() * 10)).join('')

export const money = (value: number) => new Intl.NumberFormat('uz-UZ').format(value) + ' so‘m'
export const compactMoney = (value: number) => value >= 1000000 ? (value / 1000000).toFixed(1).replace('.', ',') + ' mln' : new Intl.NumberFormat('uz-UZ').format(value)
export const iconMap: Record<string, string> = Object.fromEntries(navGroups.flatMap((g) => g.items.map((i) => [i.key, i.icon])))
export const labelMap: Record<string, string> = Object.fromEntries(navGroups.flatMap((g) => g.items.map((i) => [i.key, i.label])))
export const chartData = [{ name: 'Dush', sales: 12.4, purchases: 8.2 }, { name: 'Sesh', sales: 9.8, purchases: 11.5 }, { name: 'Chor', sales: 15.8, purchases: 9.4 }, { name: 'Pay', sales: 13.1, purchases: 12.7 }, { name: 'Jum', sales: 18.6, purchases: 10.2 }, { name: 'Shan', sales: 16.4, purchases: 7.8 }, { name: 'Yak', sales: 11.2, purchases: 5.6 }]
export const categoryData = [{ name: 'Qog‘oz', value: 38, color: 'var(--chart-blue)' }, { name: 'Bo‘yoqlar', value: 24, color: 'var(--chart-cyan)' }, { name: 'Banner', value: 21, color: 'var(--chart-violet)' }, { name: 'Boshqa', value: 17, color: 'var(--chart-slate)' }]
export const warehouses = [{ name: 'Asosiy ombor', code: 'ASO-01', products: 482, value: 184000000 }, { name: 'Print ombori', code: 'PRT-02', products: 218, value: 74600000 }, { name: 'Tayyor mahsulotlar', code: 'TAY-03', products: 86, value: 34200000 }]
export const suppliers = [{ name: 'FARGO TRADE MCHJ', phone: '+998 71 200 12 12', orders: 24, debt: 0, status: 'Faol' }, { name: 'PAPER HOUSE LLC', phone: '+998 90 123 45 67', orders: 18, debt: 1240000, status: 'Faol' }, { name: 'COLOR PRINT GROUP', phone: '+998 93 555 20 20', orders: 11, debt: 0, status: 'Faol' }, { name: 'MEDIA PLAST', phone: '+998 99 440 11 22', orders: 7, debt: 680000, status: 'Tekshirish kerak' }]
export const formatDate = () => new Date().toLocaleDateString('uz-UZ', { day: '2-digit', month: 'long', year: 'numeric' })
export const getStatusClass = (status: string) => status === 'Faol' || status === 'Yakunlangan' ? 'status-success' : status === 'Kam qoldiq' || status === 'Tekshirish kerak' ? 'status-warning' : 'status-info'
export const getTypeClass = (type: string) => type === 'Kirim' ? 'type-in' : type === 'Chiqim' ? 'type-out' : 'type-transfer'
export const getLocationBadge = (product: { type?: string; stock: number }) => product.type === 'tayyor' && product.stock > 0 ? { label: 'Sotuvda', className: 'status-success' } : { label: 'Omborda', className: 'status-muted' }
export const getIcon = (name: string) => name
export const categories = ['Qog‘oz', 'Bo‘yoqlar', 'Sarflov materiallari', 'Banner', 'Siyohlar']
export const users = [{ name: 'Javohir Karimov', role: 'Administrator', email: 'javohir@printwork.uz', active: true }, { name: 'Madina Sobirova', role: 'Ombor mudiri', email: 'madina@printwork.uz', active: true }, { name: 'Azizbek Raximov', role: 'Operator', email: 'azizbek@printwork.uz', active: false }]
export const roles = [{ name: 'Administrator', users: 1, permissions: 'To‘liq kirish' }, { name: 'Ombor mudiri', users: 1, permissions: 'Ombor va operatsiyalar' }, { name: 'Operator', users: 1, permissions: 'Kirim va chiqim' }]
export const expiry = [{ name: 'Silikon bo‘yoq — Oq', batch: 'SW-24-08', expiry: '15.09.2026', days: 35, qty: 42 }, { name: 'Rangli siyoh — Cyan', batch: 'IN-25-01', expiry: '02.10.2026', days: 52, qty: 8 }, { name: 'Laminatsiya plyonkasi A3', batch: 'LM-24-11', expiry: '24.12.2026', days: 135, qty: 26 }]
export const actionLabels: Record<string, string> = { products: 'Mahsulot qo‘shish', purchases: 'Kirim yaratish', sales: 'Chiqim yaratish', transfers: 'Ko‘chirish yaratish', writeoffs: 'Hisobdan chiqarish' }
export const detailText: Record<string, string> = { sold: 'Mijozlarga sotilgan mahsulotlar bo‘yicha chiqim hujjatlari.', suppliers: 'Yetkazib beruvchilar bilan hisob-kitob va shartnomalarni boshqaring.', analytics: 'Ombor samaradorligi, savdo dinamikasi va xarajatlarni tahlil qiling.', reports: 'Moliyaviy va operatsion hisobotlarni yuklab oling.', expiry: 'Partiyalar va yaroqlilik muddatlarini nazorat qiling.', settings: 'Tizim, bildirishnomalar va integratsiya sozlamalari.', users: 'Foydalanuvchilar va ularning tizimdagi kirishlarini boshqaring.', roles: 'Rollar va ruxsatlar matritsasini sozlang.', warehouses: 'Omborlar va ularning sig‘imini boshqaring.', categories: 'Mahsulot kategoriyalarini tartibga soling.' }
export const guideContent: { key: string; title: string; text: string }[] = [
  { key: 'dashboard', title: 'Bosh sahifa', text: 'Bosh sahifa omborning joriy holatini bir qarashda ko‘rsatadi. Inventar qiymati, kirim-chiqim, kam qoldiq va muddati yaqin partiyalar kartalaridan umumiy vaziyatni baholang. Savdo va kirim grafigi real tranzaksiyalardan, kategoriyalar diagrammasi esa mahsulot qiymatidan hisoblanadi. Tezkor amallar orqali mahsulot, kirim, chiqim yoki ko‘chirish hujjatini darhol yarating.' },
  { key: 'products', title: 'Mahsulotlar', text: 'Mahsulotlar bo‘limida katalogdagi barcha mahsulotlar saqlanadi. Mahsulot qo‘shish tugmasini bosib, nom, tur, kategoriya, ombor, birlik, narx, qoldiq va minimal qoldiq maydonlarini to‘ldiring. Shtrix kodni tekshirib, Saqlash tugmasini bosing. Qidiruv orqali nom, ID yoki shtrix kod bo‘yicha topib, mahsulotni tahrirlashingiz yoki o‘chirishingiz mumkin.' },
  { key: 'ready-products', title: 'Tayyor mahsulotlar', text: 'Tayyor mahsulotlar sotuvga tayyor mahsulotlarni alohida ko‘rsatadi. Mahsulotlar jadvalidan nom, tur, shtrix kod, ombor va qoldiqni tekshiring. Mahsulot nomiga bosib tafsilotlar oynasini oching. Zarur bo‘lsa, shu oynadan shtrix kod yorlig‘ini yuklab oling.' },
  { key: 'raw-products', title: 'Xom mahsulotlar', text: 'Xom mahsulotlar ishlab chiqarishda ishlatiladigan materiallarni boshqarish uchun kerak. Bu sahifada faqat Xom ashyo turiga berilgan yozuvlar chiqadi. Qoldiq, narx va minimal chegarani muntazam solishtiring. Kamaygan material uchun Kirim yaratish bo‘limida yangi hujjat rasmiylashtiring.' },
  { key: 'semi-products', title: 'Yarim tayyor mahsulotlar', text: 'Yarim tayyor mahsulotlar ishlab chiqarish jarayonining oraliq natijalarini saqlaydi. Mahsulot qo‘shishda tur maydonidan Yarim tayyor mahsulotni tanlang. Keyin uning kategoriya, birlik, ombor va qoldig‘ini tekshiring. Alohida sahifa oraliq zaxirani tayyor va xom mahsulotlardan ajratib nazorat qilishga yordam beradi.' },
  { key: 'inventory', title: 'Ombordagi mahsulotlar', text: 'Ombordagi mahsulotlar barcha omborlardagi mavjud qoldiqni ko‘rsatadi. Jadvaldan mahsulot nomi, ombori, miqdori, narxi va holatini solishtiring. Qidiruv selectidan nom, ID yoki shtrix kod bo‘yicha foydalaning. Kam qoldiq belgisi qayta buyurtma yoki yangi Kirim kerakligini bildiradi.' },
  { key: 'purchases', title: 'Kirim qilingan mahsulotlar', text: 'Kirim bo‘limida yetkazib beruvchidan kelgan mahsulotlar rasmiylashtiriladi. Yangi yaratish tugmasini bosib, shtrix kodni skanerlang yoki mahsulot nomini tanlang. Ombor, miqdor, birlik, narx, yetkazib beruvchi va izoh maydonlarini tekshirib Saqlash tugmasini bosing. Muvaffaqiyatli kirimdan keyin qoldiq oshadi va operatsiya tarixga yoziladi.' },
  { key: 'sales', title: 'Chiqim qilingan mahsulotlar', text: 'Chiqim bo‘limi mijozga berilgan yoki sotilgan mahsulotlarni qayd etadi. Yangi yaratish tugmasida mahsulot, ombor, miqdor, birlik va narxni kiriting. Zarur bo‘lsa shtrix kod, izoh yoki buyurtma ma’lumotini qo‘shing. Saqlangandan keyin tizim qoldiqni kamaytiradi va chiqim summasini tahlil hamda hisobotlarga qo‘shadi.' },
  { key: 'available', title: 'Sotuvda mavjud mahsulotlar', text: 'Bu bo‘lim qoldig‘i noldan katta bo‘lgan mahsulotlarni ajratib beradi. Sotuvga tayyor assortimentni qidiruv orqali nom, ID yoki shtrix kod bilan toping. Mahsulot qoldig‘i nolga tushsa, u ro‘yxatdan avtomatik chiqadi. Sotuvdan oldin ombor va birlik ma’lumotlarini mahsulot tafsilotlarida tekshiring.' },
  { key: 'sold', title: 'Sotilgan mahsulotlar', text: 'Sotilgan mahsulotlar chiqim hujjatlari asosida savdoga ketgan mahsulotlarni ko‘rsatadi. Hujjat, izoh, miqdor, summa va holat ustunlarini solishtirib buyurtmani tekshiring. Bu sahifa sotuvdan keyingi nazorat uchun ishlatiladi. Ma’lumotlar Analitika va Savdo hisoboti bo‘limlarida ham aks etadi.' },
  { key: 'transfers', title: 'Ko‘chirishlar', text: 'Ko‘chirish omborlar o‘rtasida mahsulot joyini almashtirish uchun ishlatiladi. Yangi yaratish tugmasida qaysi ombordan va qaysi omborga ko‘chirishni tanlang. Bir xil manzilni tanlab bo‘lmaydi, miqdor esa musbat bo‘lishi kerak. Saqlangandan so‘ng bir ombor qoldig‘i kamayib, ikkinchisiga qo‘shiladi.' },
  { key: 'writeoffs', title: 'Hisobdan chiqarish', text: 'Hisobdan chiqarish buzilgan, yo‘qolgan yoki foydalanib bo‘lmaydigan mahsulotlarni qayd etadi. Mahsulot, ombor, miqdor va sabab maydonlarini to‘ldiring. Sababni aniq yozish keyingi tekshiruvni osonlashtiradi. Saqlangandan so‘ng qoldiq kamayadi va operatsiya tarixda qoladi.' },
  { key: 'suppliers', title: 'Yetkazib beruvchilar', text: 'Yetkazib beruvchilar bo‘limida mahsulot olib keladigan hamkorlar saqlanadi. Yangi qo‘shish orqali hamkor nomi va mavjud aloqa ma’lumotlarini kiriting. Jadvaldagi buyurtmalar, qarzdorlik va holat ustunlarini tekshiring. Kirim yaratishda yetkazib beruvchi maydonidan shu ro‘yxatdagi hamkorni tanlash mumkin.' },
  { key: 'analytics', title: 'Analitika', text: 'Analitika mahsulot, kategoriya, ombor va operatsiyalar bo‘yicha real state ma’lumotlarini jamlaydi. Yuqori kartalarda inventar qiymati, mahsulotlar, kam qoldiq va omborlar sonini ko‘ring. Grafiklar kategoriya qiymati va kirim-chiqim summalarini ko‘rsatadi. TOP-5 jadvali eng ko‘p harakatlangan mahsulotlarni aniqlashga yordam beradi.' },
  { key: 'reports', title: 'Hisobotlar', text: 'Hisobotlar bo‘limida Ombor qoldig‘i, Kirim-chiqim, Savdo hisoboti yoki Inventarizatsiya turini tanlang. Boshlanish sanasi, tugash sanasi va ombor filtrlarini ixtiyoriy to‘ldiring. Hisobotni yaratish tugmasi avval serverdan ma’lumot oladi, server ishlamasa joriy frontend state’dan hisoblaydi. Jadval tayyor bo‘lgach CSV yuklab olish tugmasi bilan faylni saqlang.' },
  { key: 'expiry', title: 'Yaroqlilik muddati', text: 'Yaroqlilik muddati bo‘limida partiyalar va ularning tugash sanasi nazorat qilinadi. Partiya qo‘shish tugmasida mahsulot, ombor, partiya raqami, yaroqlilik sanasi va miqdorni kiriting. Qolgan kunlar ustuni muddati yaqin yozuvlarni rang bilan ajratadi. Mahsulotni vaqtida ishlatish yoki chiqarish qarorini shu ma’lumot asosida rejalashtiring.' },
  { key: 'settings', title: 'Tizim sozlamalari', text: 'Tizim sozlamalarida kompaniya nomi, tizim nomi va valyuta belgisi boshqariladi. Maydonlarni yangilang va Saqlash tugmasini bosing. Tizim sozlamalarni backendga saqlab, keyingi yuklanishda qayta o‘qiydi. O‘zgarish saqlanmasa, yuqoridagi bildirishnoma orqali xato sababini tekshiring.' },
  { key: 'users', title: 'Foydalanuvchilar', text: 'Foydalanuvchilar bo‘limi tizimga kiradigan xodimlarni boshqaradi. Administrator foydalanuvchi rolini Administrator, Ombor mudiri yoki Operator qilib tanlashi mumkin. Faol foydalanuvchini Bloklash, bloklangan foydalanuvchini Faollashtirish tugmasi bilan boshqaring. Har bir xodimga vazifasiga mos huquq berish ma’lumotlar xavfsizligini yaxshilaydi.' },
  { key: 'warehouses', title: 'Omborlar', text: 'Omborlar bo‘limida saqlash joylari va ularning kodlari boshqariladi. Ombor qo‘shish tugmasida nom va noyob kodni kiriting. Jadvalda mahsulotlar soni va umumiy qiymatni ko‘rib, tahrirlash yoki o‘chirish tugmalaridan foydalaning. Mahsulot va operatsiya kiritishda shu omborlardan biri tanlanadi.' },
  { key: 'categories', title: 'Kategoriyalar', text: 'Kategoriyalar mahsulotlarni tartibli guruhlarga ajratish uchun kerak. Kategoriya qo‘shish tugmasini bosib nomni kiriting va Saqlashni tanlang. Mahsulot qo‘shishda kategoriya maydonidan mavjud nomni tanlang yoki yangisini kiriting. Analitika va qidiruvda kategoriyalar bo‘yicha taqsimot aniqroq ko‘rinadi.' },
  { key: 'guide', title: 'Qo‘llanma', text: 'Qo‘llanma PW OMBOR bo‘limlari va kundalik ish jarayonini tushuntiradi. Yuqoridagi qidiruv maydoniga bo‘lim nomi yoki kerakli amalni yozing, natijalar sarlavha va matn bo‘yicha filtrlanadi. Sxemadagi rangli qutilar qisqa tavsif beradi va bosilganda tegishli sahifaga olib o‘tadi. Accordion bloklarini bosib, har bir bo‘limning amaliy ko‘rsatmasini oching.' },
]
export const heroStat = { inventoryValue: 293800000, sales: 97200000, purchases: 68400000, lowStock: products.filter((p) => p.status === 'Kam qoldiq').length }
export const empty = [] as never[]
export const title = 'PW OMBOR'
export const subtitle = 'Print Work uchun aqlli ombor boshqaruvi'
export const today = '11 avgust, 2026'
export const month = 'Avgust 2026'
export const appVersion = 'v2.4.0'
export const currentUser = { name: 'Javohir Karimov', initials: 'JK', role: 'Administrator' }
export const dateTime = 'Bugun, 11:48'
export const statusLabels = ['Barchasi', 'Faol', 'Kam qoldiq']
export const warehouseNames = warehouses.map((w) => w.name)
export const stockTotal = products.reduce((sum, p) => sum + p.stock, 0)
export const inventoryValue = products.reduce((sum, p) => sum + p.stock * p.price, 0)
export const lowStockProducts = products.filter((p) => p.status === 'Kam qoldiq')
export const primaryNav = navGroups[0].items
export const allNavItems = navGroups.flatMap((g) => g.items)
export const pageKeys = allNavItems.map((i) => i.key)
export const isPageKey = (key: string) => pageKeys.includes(key)
export const recentDate = '11.08.2026'
export const reportTypes = ['Ombor qoldig‘i', 'Kirim-chiqim', 'Savdo hisoboti', 'Inventarizatsiya']
export const quickActions = [{ key: 'products', label: 'Mahsulot qo‘shish', icon: 'Plus' }, { key: 'purchases', label: 'Kirim yaratish', icon: 'ArrowDownToLine' }, { key: 'sales', label: 'Chiqim yaratish', icon: 'ArrowUpFromLine' }, { key: 'transfers', label: 'Ko‘chirish', icon: 'ArrowLeftRight' }]
export const weekdays = ['Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan', 'Yak']
export const monthTotal = chartData.reduce((sum, d) => sum + d.sales, 0)
export const previousMonthTotal = 82.4
export const growth = 17.8
export const criticalCount = 2
export const healthyCount = products.length - criticalCount
export const allProducts = products
export const allTransactions = transactions
export const allSuppliers = suppliers
export const allWarehouses = warehouses
export const allUsers = users
export const allRoles = roles
export const allExpiry = expiry
export const allCategories = categories
export const defaultProduct: Product = products[0]
export const version = appVersion
export const locale = 'uz-UZ'
export const currency = 'so‘m'
export const company = 'PRINT WORK'
export const appName = title
export const appDescription = subtitle
export const defaultPage = 'dashboard'
export const navWidth = 256
export const collapsedNavWidth = 76
export const mobileBreakpoint = 1024
export const maxContentWidth = 1440
export const defaultWarehouse = warehouseNames[0]
export const lowStockMessage = 'Minimal qoldiqdan past mahsulotlar'
export const dateFormat = 'DD.MM.YYYY'
export const timeFormat = 'HH:mm'
export const primaryColor = '#175CD3'
export const sidebarColor = '#0B1F3A'
export const accentColor = '#22B8CF'
export const chartColors = ['#175CD3', '#22B8CF', '#7C5CFC', '#9AA8BA']
export const months = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr']
export const noop = () => undefined
export const allItems = [...products, ...transactions]
export const isLow = (product: Product) => product.stock < product.minStock
export const productCount = products.length
export const supplierCount = suppliers.length
export const warehouseCount = warehouses.length
export const transactionCount = transactions.length
export const emptyState = 'Ma’lumot topilmadi'
export const confirmText = 'Tasdiqlash'
export const cancelText = 'Bekor qilish'
export const saveText = 'Saqlash'
export const closeText = 'Yopish'
export const searchText = 'Qidirish'
export const filterText = 'Filtr'
export const exportText = 'Eksport'
export const addText = 'Qo‘shish'
export const viewText = 'Ko‘rish'
export const editText = 'Tahrirlash'
export const deleteText = 'O‘chirish'
export const successText = 'Muvaffaqiyatli saqlandi'
export const errorText = 'Xatolik yuz berdi'
export const requiredText = 'Majburiy maydon'
export const allText = 'Barchasi'
export const activeText = 'Faol'
export const inactiveText = 'Faol emas'
export const noResultsText = 'Natija topilmadi'
export const loadingText = 'Yuklanmoqda'
export const doneText = 'Bajarildi'
export const pendingText = 'Kutilmoqda'
export const totalText = 'Jami'
export const countText = 'Soni'
export const unitText = 'dona'
export const companyShort = 'PW'
export const defaultRole = currentUser.role
export const supportEmail = 'support@printwork.uz'
export const supportPhone = '+998 71 200 20 20'
export const footerText = 'PRINT WORK • PW OMBOR'
export const copyright = '© 2026 Print Work'
export const userInitials = currentUser.initials
export const defaultTab = 'overview'
export const demoMode = true
export const dataSource = 'Demo ma’lumotlar'
export const noBackendNotice = 'Backend integratsiyasi keyingi bosqichda ulanadi'
export const dateNow = new Date()
export const year = dateNow.getFullYear()
export const isDemo = demoMode
export const supportedLanguages = ['O‘zbekcha']
export const timezone = 'Asia/Tashkent'
export const decimalSeparator = ','
export const thousandSeparator = ' '
export const lastUpdated = dateTime
export const dashboardTitle = 'Bosh sahifa'
export const dashboardSubtitle = 'Omboringiz holati bo‘yicha qisqa ko‘rinish'
export const dashboardGreeting = 'Xayrli kun, Javohir'
export const dashboardDescription = 'Bugungi ishlaringiz va ombor ko‘rsatkichlarini bir joyda kuzating.'
export const defaultChartPeriod = 'Hafta'
export const chartPeriods = ['Hafta', 'Oy', 'Yil']
export const productColumns = ['Mahsulot', 'SKU', 'Kategoriya', 'Ombor', 'Qoldiq', 'Holat']
export const supplierColumns = ['Yetkazib beruvchi', 'Telefon', 'Buyurtmalar', 'Qarz', 'Holat']
export const transactionColumns = ['Hujjat', 'Turi', 'Izoh', 'Sana', 'Summa', 'Holat']
export const warehouseColumns = ['Ombor', 'Kod', 'Mahsulotlar', 'Qiymat']
export const userColumns = ['Foydalanuvchi', 'Rol', 'Email', 'Holat']
export const roleColumns = ['Rol', 'Foydalanuvchilar', 'Ruxsatlar']
export const expiryColumns = ['Mahsulot', 'Partiya', 'Muddati', 'Qolgan kun', 'Soni']
export const dashboardCards = [{ label: 'Inventar qiymati', value: '293,8 mln', change: '+12,4%', icon: 'Package' }, { label: 'Bu oy savdo', value: '97,2 mln', change: '+17,8%', icon: 'TrendingUp' }, { label: 'Bu oy kirim', value: '68,4 mln', change: '+8,2%', icon: 'ArrowDownToLine' }, { label: 'Kam qoldiq', value: '2 ta', change: 'Diqqat kerak', icon: 'AlertTriangle' }]
export const allPageLabels = Object.values(labelMap)
export const navigationLabel = (key: string) => labelMap[key] ?? key
export const canEdit = currentUser.role === 'Administrator'
export const canDelete = canEdit
export const canExport = true
export const canCreate = true
export const productSearchPlaceholder = 'Mahsulot nomi yoki SKU bo‘yicha qidirish...'
export const transactionSearchPlaceholder = 'Hujjat yoki hamkor bo‘yicha qidirish...'
export const tableEmpty = 'Hozircha ma’lumot yo‘q'
export const toastDuration = 3000
export const appShellClass = 'min-h-screen bg-background'
export const cardClass = 'rounded-xl border bg-card'
export const inputClass = 'h-10 rounded-lg border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10'
export const buttonClass = 'inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90'
export const smallButtonClass = 'inline-flex items-center justify-center rounded-lg border px-3 py-2 text-sm font-semibold transition hover:bg-muted'
export const tableRowClass = 'border-b last:border-0 hover:bg-muted/30'
export const pagePadding = 'p-4 md:p-6 lg:p-8'
export const gridGap = 'gap-4 md:gap-6'
export const radius = '0.75rem'
export const fontHeading = 'Geist'
export const fontBody = 'Geist'
export const appTagline = 'Omborni boshqarishning sodda yo‘li'
export const landing = false
export const seeded = true
export const mockData = true
export const routeCount = allNavItems.length
export const completed = true
export const dataVersion = '2026.08.11'
export const buildName = 'PW OMBOR WMS'
export const auditNote = 'Barcha operatsiyalar jurnalga yoziladi'
export const menuLabel = 'Menyu'
export const profileLabel = 'Profil'
export const helpLabel = 'Yordam'
export const logoutLabel = 'Chiqish'
export const onlineLabel = 'Onlayn'
export const warehouseLabel = 'Ombor'
export const searchLabel = 'Qidiruv'
export const notificationLabel = 'Bildirishnomalar'
export const collapseLabel = 'Yig‘ish'
export const expandLabel = 'Ochish'
export const mobileMenuLabel = 'Mobil menyu'
export const breadcrumbHome = 'Bosh sahifa'
export const dateLabel = 'Sana'
export const amountLabel = 'Summa'
export const statusLabel = 'Holat'
export const typeLabel = 'Turi'
export const actionLabel = 'Amal'
export const detailsLabel = 'Batafsil'
export const totalInventoryLabel = 'Jami qoldiq'
export const allWarehousesLabel = 'Barcha omborlar'
export const selectWarehouseLabel = 'Omborni tanlang'
export const filterWarehouseLabel = 'Ombor bo‘yicha filtr'
export const exportSuccess = 'Hisobot yuklab olishga tayyor'
export const createSuccess = 'Yangi hujjat yaratildi'
export const deleteSuccess = 'Ma’lumot o‘chirildi'
export const updateSuccess = 'Ma’lumot yangilandi'
export const transferSuccess = 'Mahsulot muvaffaqiyatli ko‘chirildi'
export const writeoffSuccess = 'Mahsulot hisobdan chiqarildi'
export const inventoryCheckSuccess = 'Inventarizatsiya yakunlandi'
export const shortDate = '11.08.2026'
export const longDate = '11 avgust 2026'
export const dayName = 'Seshanba'
export const allMonths = months
export const allWeekdays = weekdays
export const generatedAt = '11.08.2026 11:48'
export const apiReady = false
export const persistence = 'local state'
export const dataMode = 'mock'
export const end = true
