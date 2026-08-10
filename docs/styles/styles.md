# styles/ — استایل‌های سراسری

این پوشه برای استایل‌های عمومی، تم و تنظیمات پایه CSS است.

---

## ساختار پوشه

```bash
styles/
├── globals.css              # استایل‌های سراسری، reset و box-sizing
├── fonts.css                # تعریف @font-face فارسی و لاتین
├── themes.css               # CSS Variables رنگ‌ها برای تم روشن/تیره
├── financial.css            # CSS Variables و کلاس‌های مخصوص نمایش مالی
└── tailwind.css             # @tailwind base/components/utilities (نقطه ورود Tailwind)
```

---

## مسئولیت هر فایل

### `globals.css`
- Reset اولیه: `box-sizing: border-box`، `margin: 0`، `padding: 0`
- رفتار پیش‌فرض `body` (font-family, line-height, direction)
- استایل scrollbar (webkit) سازگار با تم
- `direction: rtl` به‌عنوان پیش‌فرض سند (زبان فارسی اصلی پروژه است)

### `fonts.css`
- `@font-face` برای **Vazirmatn** (فونت اصلی فارسی و اعداد لاتین)
- وزن‌های مورد نیاز: Regular (400)، Medium (500)، SemiBold (600)، Bold (700)
- Fallback chain: `'Vazirmatn', system-ui, sans-serif`
- نکته: فونت باید به‌صورت local (پکیج‌شده در اپ) سرو شود، نه از CDN خارجی — چون سیستم باید آفلاین کار کند.

### `themes.css`
تعریف CSS Variables رنگ در دو scope (`:root` برای light، `[data-theme="dark"]` برای dark):

```css
/* پالت پایه */
--color-bg-primary
--color-bg-secondary
--color-bg-tertiary
--color-text-primary
--color-text-secondary
--color-text-muted
--color-border
--color-border-strong

/* تم‌های عملکردی */
--color-accent           /* رنگ اصلی برند */
--color-accent-hover
--color-destructive      /* حذف، خطا */
--color-warning          /* هشدار */
--color-success          /* موفقیت */

/* رنگ‌های مالی (تعریف شده در themes.css، استفاده در financial.css) */
--color-financial-positive   /* سود، دریافتی — سبز */
--color-financial-negative   /* زیان، پرداختی — قرمز */
--color-financial-neutral    /* انتقال، خنثی */
--color-financial-crypto     /* ارز دیجیتال */
--color-financial-stock      /* سهام */
--color-financial-metal      /* فلزات/طلا */
--color-financial-fund       /* صندوق */
```

> **قانون رنگ مالی:** هیچ‌جای کد نباید رنگ سبز/قرمز به‌صورت مستقیم (`text-green-500`) نوشته شود؛ همیشه از `--color-financial-positive` و `--color-financial-negative` استفاده شود تا در تم تیره رنگ‌ها به درستی جایگزین شوند.

### `financial.css`
کلاس‌های utility مخصوص نمایش مالی که Tailwind ندارد:

```css
/* مقدار مثبت/منفی/خنثی */
.amount-positive   { color: var(--color-financial-positive); }
.amount-negative   { color: var(--color-financial-negative); }
.amount-neutral    { color: var(--color-financial-neutral); }

/* نمایش اعداد مالی — monospace + لاتین برای ارقام حتی در تم RTL */
.amount-display {
  font-variant-numeric: tabular-nums;
  direction: ltr;
  text-align: right;   /* راست‌چین در RTL */
}

/* badge دسته دارایی */
.badge-crypto  { ... }
.badge-stock   { ... }
.badge-metal   { ... }
.badge-fund    { ... }
```

### `tailwind.css`
- `@tailwind base;`، `@tailwind components;`، `@tailwind utilities;`
- فقط نقطه ورود Tailwind؛ هیچ استایل اضافه‌ای اینجا نباشد.

---

## قوانین

1. تا حد امکان از Utilityهای Tailwind استفاده شود؛ فقط آنچه Tailwind ندارد یا نیاز به CSS Variable/Dark Mode خاص دارد در این پوشه تعریف شود.
2. **هرگز رنگ مستقیم (hex یا Tailwind color name) برای مفاهیم مالی استفاده نشود** — فقط CSS Variables از `themes.css`.
3. فونت‌ها باید local پکیج‌شده باشند (نه CDN) — شرط آفلاین بودن.
4. `direction: rtl` پیش‌فرض است، اما داخل `.amount-display` باید `direction: ltr` بماند تا اعداد همیشه LTR نمایش داده شوند (خوانایی بیشتر).
5. هیچ business logic یا شرط if/else در CSS نباشد — فقط CSS Variables و کلاس‌های ساده.
6. Dark Mode از طریق `data-theme` attribute روی `<html>` تغییر می‌کند (نه `class="dark"`) تا با SSR و بقیه ابزارها تعارض نداشته باشد.
