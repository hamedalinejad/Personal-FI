# Pages & Information Architecture

> **اصل محصول:** `20 Features ≠ 20 Navigation Items`  
> **Feature = مرز Domain · Page = مرز UX · Accounting Core = بدون صفحه `/accounting`**  
> ماشین‌خوان: `feature-id-map.json`

---

## استراتژی ناوبری: Sheet-based (قفل UX)

### مشکل ممنوع

```text
❌ هر عملیات = یک Route صفحه کامل
❌ 40+ صفحه در stack ناوبری
❌ Crypto/Stocks/Funds/Tax/Cheque به‌عنوان آیتم ناوبار جدا
```

### قانون

1. **حداکثر ۶ مقصد در Bottom/Side Navigation** (ترجیح محصول: ۵–۶).
2. همهٔ فرم‌های ثبت/ویرایش/جزئیات = **Sheet / Drawer / Dialog** روی همان صفحهٔ والد.
3. Tab داخلی فقط برای تفکیک Domain در همان صفحه (مثلاً Investments → Crypto | Stocks | Funds | Metals).
4. Sub-route عمیق فقط برای deep-link/share اختیاری است؛ **نباید** آیتم ناوبار بسازد.
5. توسعه‌دهنده هر Sheet را می‌تواند ماژولار پیاده کند؛ UI shell مشترک است.

---

## ناوبری اصلی (≤۶)

| # | صفحه | Route | محتوا |
|---|------|-------|--------|
| 1 | **خانه** | `/` | Dashboard + خلاصه ثروت + هشدارها + فعالیت اخیر |
| 2 | **پول** | `/money` | حساب‌ها، موجودی، انتقال، چک (تب/فیلتر)، نقطه ورود reconcile |
| 3 | **تراکنش‌ها** | `/transactions` | All / Income / Expense / Transfer / Cheque / Adjustment — **فیلتر + Sheet ثبت** |
| 4 | **سرمایه‌گذاری** | `/investments` | Overview + تب Crypto / Stocks / Funds / Metals — buy/sell/… فقط Sheet |
| 5 | **وام** | `/loans` | لیست وام، schedule، پرداخت — فرم‌ها Sheet |
| 6 | **بیشتر** | `/more` | برنامه‌ریزی (بودجه/هدف/دارایی فیزیکی)، گزارش‌ها، اسناد/ورود، تنظیمات، لایسنس |

> اگر محصول بخواهد ناوبار ۵تایی: «وام» زیر «پول» یا «بیشتر» ادغام می‌شود؛ Domain وام مستقل می‌ماند.

---

## نگاشت Feature → صفحه (نه → صفحهٔ جدا)

| Feature domain | صفحه UX | الگوی UI |
|----------------|---------|----------|
| Dashboard / Portfolio snapshot | خانه | ویجت |
| Accounts, Cheque | پول | تب / لیست + Sheet |
| Income, Expense, Bills, Transfer | تراکنش‌ها | فیلتر + Sheet |
| Crypto, Stocks, FIF, Metals, Price fetch entry | سرمایه‌گذاری | تب + Sheet عملیات |
| Loans | وام | لیست + Sheet |
| Budget, Goals, Physical assets | بیشتر → برنامه‌ریزی | تب |
| Reports, Tax views, Wealth reports | بیشتر → گزارش‌ها | لیست گزارش + Sheet جزئیات |
| Documents, Import | بیشتر → اسناد | — |
| Settings, Currency, Security, Backup, License, Price sources | بیشتر → تنظیمات | — |
| Accounting Core / Journal | — | **بدون ناوبار**؛ پشت‌صحنه |

---

## الگوی Sheet (الزامی برای عملیات)

```text
[ صفحه لیست ]
    → کاربر «خرید» / «قسط» / «هزینه جدید»
    → Sheet تمام‌صفحه یا نیم‌صفحه
    → submit → Feature API → runAtomicFinancialOperation
    → بستن Sheet → refresh لیست
```

نمونه‌های **ممنوع به‌عنوان صفحهٔ ناوبار:**

```text
/investments/crypto/:id/buy
/investments/stocks/.../sell
/loans/:id/pay
/transactions/income/new
```

این‌ها فقط `?sheet=buy&id=` یا state مودال روی همان route والد هستند (پیاده‌سازی آزاد است؛ قرارداد محصول: یک مقصد ناوبار).

---

## Deep link (اختیاری)

Deep link می‌تواند Sheet را باز کند؛ پس از بستن، کاربر روی همان صفحهٔ اصلی می‌ماند.  
Stack با ۴۰ route مستقل **ممنوع** است.

---

## سازگاری با ARCHITECTURE-LOCKED

`ARCHITECTURE-LOCKED.md` نه حوزهٔ محصول را فهرست کرده بود. این سند آن را به **≤۶ مقصد ناوبار + Sheet** فشرده می‌کند. در صورت تعارض ناوبری، **این سند (Pages-IA) برای UX** و ARCHITECTURE-LOCKED برای pipeline مالی مرجع است.

---

## Acceptance UX

| چک | Pass |
|----|------|
| شمارش آیتم Bottom Nav ≤ 6 | بله |
| ثبت هزینه بدون ترک `/transactions` | Sheet |
| خرید کریپتو بدون route ناوبار جدید | Sheet روی `/investments` |
| Tax / Bills / Cheque آیتم ناوبار جدا ندارند | بله |
