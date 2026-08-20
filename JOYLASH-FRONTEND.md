# Frontend fayllarni qayerga qo'yish kerak

Bu zip **frontend (foydalanuvchi ko'radigan) qismga** tegishli barcha fayllarni
o'z ichiga oladi. Ularni backend zip fayldagi fayllar bilan **bitta papkada**
birlashtiring — Next.js'da frontend va backend ajratilmagan, bitta loyiha bo'lib ishlaydi.

## Hostingdagi ildiz papka

```
www/6a70174330801.xvest4.ru/PWombor/
```

## Bu zipdagi fayllar qayerga tushishi kerak

```
PWombor/
├── package.json          ← (backend bilan bir xil, agar so'ralsa ustidan yozing)
├── next.config.mjs
├── postcss.config.mjs
├── tsconfig.json
├── components.json
├── .gitignore
├── app/
│   ├── page.tsx
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── wms-app.tsx        ← butun interfeys shu yerda
│   └── ui/
│       └── button.tsx
├── lib/
│   ├── utils.ts
│   └── wms-data.ts        ← boshlang'ich holat, ranglar, navigatsiya ro'yxati
└── public/
    └── ... (logotip/ikonkalar)
```

## Muhim

Bu qism o'zi ishlamaydi — `app/api/...` route'lari (backend zip'dan) va
MySQL bazasi (schema.sql orqali yaratilgan) kerak. Uchalasi bitta `PWombor/`
papkasida birlashgandan keyingina loyiha to'liq ishlaydi.
