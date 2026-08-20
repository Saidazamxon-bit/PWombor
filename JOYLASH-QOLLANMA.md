# PW OMBOR — to‘liq joylashtirish qo‘llanmasi

Loyiha ikki qismdan iborat:
1. **Backend (PHP + MySQL)** — sizning hostingingizga yuklanadi (`backend-php/` papkasi)
2. **Frontend (Next.js)** — GitHub orqali Vercel’ga joylanadi (`frontend/` papkasi)

---

## 1-QADAM — MySQL bazani tayyorlash (phpMyAdmin)

1. Hosting boshqaruv panelidan **phpMyAdmin**ni oching.
2. Chap tomondan bazangizni tanlang: `6a70174330709_ombor`
3. Yuqoridagi **Import** bo‘limiga o‘ting.
4. `backend-php/schema.sql` faylini tanlab, **Go / Yuborish** tugmasini bosing.
5. Muvaffaqiyatli import bo‘lgach, chap tarafda quyidagi jadvallar paydo bo‘lishi kerak:
   `users, auth_tokens, categories, warehouses, suppliers, products, product_stock, batches, transactions, transaction_items, settings`

> Diqqat: alohida admin foydalanuvchi oldindan yaratilmagan. Saytga birinchi bo‘lib **"Ro‘yxatdan o‘tish"** orqali kirgan foydalanuvchi avtomatik ravishda administrator huquqini oladi.

---

## 2-QADAM — PHP fayllarni hostingga yuklash (Fayl menejeri)

1. Hosting fayl menejerini oching.
2. Sayt manzilingiz `https://6a70174330801.xvest4.ru/PWombor` ekan — demak fayllar `public_html/PWombor/` (yoki shunga mos) papkaga yuklanadi.
3. `backend-php/api/` papkasining **ichidagi barcha fayllarni** `PWombor/api/` papkasiga yuklang (yoki `api` papkasini o‘zi bilan ko‘chiring):

```
PWombor/
  api/
    config.php
    auth.php
    products.php
    categories.php
    warehouses.php
    suppliers.php
    transactions.php
    expiry.php
    users.php
    dashboard.php
    reports.php
    settings.php
    check.php
```

4. `config.php` ichida baza ma’lumotlari allaqachon sizning berganingizga mos qilib yozilgan:
   - Baza nomi: `6a70174330709_ombor`
   - Login: `6a70174330709_ombor`
   - Parol: sizning bergan parolingiz

   Agar login boshqacha bo‘lsa (ba’zi hostinglarda foydalanuvchi nomi baza nomidan farq qiladi), `config.php` faylidagi `DB_USER` qatorini to‘g‘rilang.

5. Brauzerda oching: **`https://6a70174330801.xvest4.ru/PWombor/api/check.php`**
   Agar hammasi to‘g‘ri bo‘lsa, `"db_connection": "OK"` va barcha jadvallar qarshisida `"OK (0 qator)"` ko‘rinadi.

---

## 3-QADAM — Frontendni sozlash

1. `frontend/.env.local.example` faylini `.env.local` deb nomlang (lokal test uchun) va ichidagi manzil to‘g‘ri ekanini tekshiring:
   ```
   NEXT_PUBLIC_API_URL=https://6a70174330801.xvest4.ru/PWombor/api
   ```
2. Lokal tekshirish uchun (ixtiyoriy, agar kompyuteringizda Node.js bo‘lsa):
   ```
   npm install
   npm run dev
   ```
   `http://localhost:3000` da ochiladi.

---

## 4-QADAM — GitHub va Vercel orqali joylash

1. `frontend/` papkasi ichidagi barcha fayllarni yangi GitHub repositoriyangizga yuklang (push qiling).
2. [vercel.com](https://vercel.com) da **New Project** → GitHub repongizni tanlang → Import.
3. **Environment Variables** bo‘limida quyidagini qo‘shing:
   - Key: `NEXT_PUBLIC_API_URL`
   - Value: `https://6a70174330801.xvest4.ru/PWombor/api`
4. **Deploy** tugmasini bosing. Bir necha daqiqada sayt tayyor bo‘ladi.

---

## 5-QADAM — Birinchi marta kirish

1. Vercel bergan manzilni oching (masalan `https://pwombor.vercel.app`).
2. **"Ro‘yxatdan o‘tish"** bo‘limidan o‘zingiz uchun username, telefon raqam va parol kiritib ro‘yxatdan o‘ting — bu foydalanuvchi avtomatik **Administrator** bo‘ladi.
3. Keyingi xodimlar ham xuddi shu tarzda ro‘yxatdan o‘tishi mumkin (ular oddiy "Operator" bo‘lib qo‘shiladi, keyin siz "Foydalanuvchilar" bo‘limidan ularning rolini o‘zgartira olasiz).

---

## Tizim qanday ishlaydi (qisqacha)

- **Kirim** yaratganda: mahsulot nomi va turini (kategoriya) kiritasiz — agar mahsulot yoki turi ro‘yxatda bo‘lmasa, avtomatik yaratiladi. Miqdor kiritilgach, tanlangan ombordagi qoldiq avtomatik oshadi.
- **Chiqim / Hisobdan chiqarish**: qoldiq yetarli bo‘lmasa, tizim xatolik beradi va amalni bajarmaydi.
- **Ko‘chirish**: bir ombordan ikkinchisiga miqdorni o‘tkazadi (manba ombordan ayiradi, manzil omborga qo‘shadi).
- **Bosh sahifa**: bugun / hafta / oy bo‘yicha kirim-chiqim summasi, jami inventar qiymati, kam qoldiq va muddati yaqinlashgan partiyalar sonini ko‘rsatadi — barchasi bazadan real vaqtda hisoblanadi.
- **Yaroqlilik muddati**: har bir partiya uchun mahsulot, ombor, partiya raqami va tugash sanasini kiritasiz; tizim qolgan kunlarni avtomatik hisoblaydi.
- **Har bir hujjat** (`K-...`, `S-...`, `T-...`, `H-...`) `transactions` jadvalida saqlanadi — to‘liq tarix va hisobot uchun asos bo‘ladi.

---

---

## YANGI: Shtrix kod tizimi

Endi har bir mahsulotga shtrix kod biriktiriladi:

- **Mahsulot qo'shishda**: shtrix kod maydonini bo'sh qoldirsangiz, tizim avtomatik 5 xonali tasodifiy kod beradi (masalan `51387`). Xohlasangiz o'zingiz raqam kiritishingiz ham mumkin (masalan mavjud shtrix kodli yorliqlaringiz bo'lsa).
- **Mahsulot tafsilotlari** oynasida shtrix kodning bosib chiqarilishi mumkin bo'lgan tasviri (Code128) ko'rsatiladi — uni skrinshot qilib yoki chop etib, mahsulotga yopishtirish mumkin.
- **Kirim / Chiqim / Ko'chirish / Hisobdan chiqarish** oynalarida endi "Shtrix kod" maydoni bor:
  - **Kamera** tugmasini bosib, telefon yoki kompyuter kamerasi bilan kodni skanerlasangiz, mahsulot avtomatik topiladi va barcha maydonlar (nomi, turi, narxi) to'ldiriladi.
  - Kamera ishlamasa yoki qo'lda kiritish qulayroq bo'lsa, kodni shu maydonga oddiy raqam sifatida yozish ham mumkin — natija bir xil.
  - Agar kod topilmasa, tizim ogohlantiradi va siz mahsulot nomini pastdagi maydonga qo'lda kiritishingiz mumkin.

### Agar siz `schema.sql`'ni ILGARI import qilgan bo'lsangiz (baza allaqachon mavjud)

Yangi `barcode` ustunini qo'shish uchun `backend-php/migration_barcode.sql` faylini ham phpMyAdmin > Import orqali ishga tushiring. Agar hozirgina birinchi marta o'rnatayotgan bo'lsangiz, bunga hojat yo'q — yangilangan `schema.sql`'ning o'zida bu ustun allaqachon bor.

Yangi backend fayllarni ham qayta yuklang (eskisi ustidan yozilishi mumkin): `products.php`, `transactions.php`, va yangi qo'shilgan `barcode.php`.

### Kamera nima uchun ishlamasligi mumkin

- Sayt **HTTPS** orqali ochilishi kerak (Vercel avtomatik HTTPS beradi — muammo bo'lmaydi).
- Birinchi marta brauzer kameraga ruxsat so'raydi — "Ruxsat berish" tugmasini bosing.
- Agar kompyuterda kamera bo'lmasa yoki ruxsat berilmasa, kodni qo'lda kiritish ham xuddi shunday ishlaydi.

## Xavfsizlik bo‘yicha eslatmalar- `config.php` ichida baza paroli ochiq matnda turibdi — bu odatiy holat (chunki fayl faqat serverda ishlaydi, brauzerga hech qachon yuborilmaydi), lekin fayl huquqlarini (permissions) hosting panelidan tekshirib qo‘ying.
- Parollar bazada **bcrypt** bilan shifrlangan holda saqlanadi (`password_hash`), hech qachon ochiq matnda emas.
- Har bir kirish tizimga token beradi (`Authorization: Bearer ...`), u 30 kundan keyin eskiradi — foydalanuvchi qayta kirishi kerak bo‘ladi.
- Agar kelajakda xodimlar ko‘payib, huquqlarni yanada aniqroq cheklash kerak bo‘lsa (masalan, faqat administrator narxlarni ko‘rishi mumkin bo‘lsin kabi), buni keyingi bosqichda qo‘shish mumkin — hozirgi tizimda 3 ta rol bor: Administrator, Ombor mudiri, Operator.
