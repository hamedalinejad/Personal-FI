# styles/ — استایل‌های سراسری

این پوشه برای استایل‌های عمومی، تم و تنظیمات پایه CSS است.

---

## ساختار پوشه

```bash
styles/
├── globals.css # استایل‌های سراسری، reset و box-sizing
├── fonts.css # تعریف @font-face فارسی و لاتین
├── themes.css # CSS Variables رنگ‌ها برای تم روشن/تیره
├── financial.css # CSS Variables و کلاس‌های مخصوص نمایش مالی
└── tailwind.css # نقطه ورود Tailwind؛ syntax باید با major نسخه نصب‌شده یکسان باشد
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
--color-accent /* رنگ اصلی برند */
--color-accent-hover
--color-destructive /* حذف، خطا */
--color-warning /* هشدار */
--color-success /* موفقیت */

/* رنگ‌های مالی */
--color-financial-positive
--color-financial-negative
--color-financial-neutral
--color-financial-crypto
--color-financial-stock
--color-financial-metal
--color-financial-fund
```

> **قانون رنگ مالی:** هیچ‌جای کد نباید رنگ سبز/قرمز به‌صورت مستقیم (`text-green-500`) نوشته شود؛ همیشه از CSS Variables استفاده شود تا تم روشن/تیره رفتار یکنواخت داشته باشد.

### `financial.css`
کلاس‌های utility مخصوص نمایش مالی که Tailwind ندارد:

```css
.amount-positive { color: var(--color-financial-positive); }
.amount-negative { color: var(--color-financial-negative); }
.amount-neutral { color: var(--color-financial-neutral); }

.amount-display {
  font-variant-numeric: tabular-nums;
  text-align: end;
}
```

**قانون P0 برای اعداد:** عدد مالی و واحد/ارز تا حد امکان دو بخش ارائه شوند؛ کنترل جهت و bidi را روی ظرف/توکن عددی انجام دهید و با `direction:ltr` کل رشته‌ای که شامل علامت/واحد فارسی است را کورکورانه برعکس نکنید.

برای نمونه مفهومی:

```html
<span class="money">
  <bdi class="amount-display">-123456.78</bdi>
  <span class="currency-label">USDT</span>
</span>
```

CSS نباید منطق تبدیل رقم، گرد کردن، محاسبه سود یا تشخیص positive/negative را انجام دهد؛ فقط presentation را کنترل کند.

### `tailwind.css`
- فقط نقطه ورود Tailwind است.
- **Version-sensitive:** از syntax مربوط به major نسخه‌ای که در `package.json` و lockfile نصب شده استفاده شود.
- اگر Tailwind v3 انتخاب شد، directives کلاسیک (`@tailwind base/components/utilities`) مجاز است.
- اگر Tailwind v4 انتخاب شد، syntax و import model همان نسخه باید استفاده شود؛ v3 و v4 در یک پروژه مخلوط نشوند.
- هیچ design-token یا component style اختصاصی بدون دلیل در این فایل قرار نگیرد.

---

## قوانین

1. تا حد امکان از Utilityهای Tailwind استفاده شود؛ فقط آنچه Tailwind ندارد یا نیاز به CSS Variable/Dark Mode خاص دارد در این پوشه تعریف شود.
2. **هرگز رنگ مستقیم (hex یا Tailwind color name) برای مفاهیم مالی استفاده نشود** — فقط CSS Variables از `themes.css`.
3. فونت‌ها باید local پکیج‌شده باشند (نه CDN) — شرط آفلاین بودن.
4. `direction: rtl` پیش‌فرض سند باقی بماند، اما اعداد مالی نباید صرفاً با `direction:ltr` روی کل رشته‌ای که علامت/واحد/متن دارد دستکاری شوند؛ برای bidi از `bdi`/توکن‌های جدا استفاده شود.
5. هیچ business logic یا شرط if/else در CSS نباشد — فقط CSS Variables و کلاس‌های ساده.
6. Dark Mode از طریق `data-theme` attribute روی `<html>` تغییر می‌کند (نه `class="dark"`) تا با قرارداد UI پروژه یکسان بماند.
7. هیچ CDN، remote stylesheet یا remote font برای rendering الزامی نیست؛ App shell باید با assets محلی کامل کار کند.
8. accessibility حداقل برای contrast، focus-visible و reduced-motion باید با tokenهای theme در سطح مشترک قابل اعمال باشد.

---

## Design Token Contract (P0)

حداقل tokenها باید برای هر دو theme مقدار معتبر داشته باشند و نام آن‌ها در کل پروژه ثابت بماند:

```text
surface: primary / secondary / tertiary
text: primary / secondary / muted / inverse
border: default / strong
state: accent / success / warning / destructive
financial: positive / negative / neutral
asset: crypto / stock / fund / metal
focus: ring
```

Featureها حق ندارند token جدیدی با همان معنا و نام متفاوت بسازند. رنگ feature-specific فقط از tokenهای canonical مصرف شود.

## Financial Presentation Contract (P0)

- positive/negative فقط presentation است؛ **source of truth** از API/domain می‌آید.
- رنگ به‌تنهایی نباید معنی مالی را منتقل کند؛ در کنار آن sign، label یا icon مناسب وجود داشته باشد.
- ارقام باید بدون تغییر مقدار یا rounding در لایه CSS نمایش داده شوند.
- نمایش IRR/Toman، درصد، quantity و rate باید formatter مشترک داشته باشد؛ CSS فقط layout/presentation است.
- واحد پول/دارایی نباید با number قاطی شود اگر bidi باعث خوانایی بد می‌شود.

## یافته‌های ممیزی این بخش

- `.amount-display { direction:ltr }` بیش از حد گسترده بود و برای رشته‌های دارای علامت/واحد RTL می‌توانست bidi نامطلوب بسازد؛ اصلاح شد و `bdi`/توکن عدد پیشنهاد شد.
- `tailwind.css` syntax قبلی بدون تعیین major نسخه تعریف شده بود؛ قرارداد version-sensitive اضافه شد تا v3/v4 مخلوط نشوند.
- دسترسی‌پذیری رنگی و focus token در قرارداد قبلی explicit نبود؛ tokenهای مشترک و الزام عدم اتکا به رنگ به‌تنهایی اضافه شد.
- «آفلاین» فقط برای فونت مطرح شده بود؛ اکنون هر remote stylesheet/font وابسته برای rendering ممنوع است.
