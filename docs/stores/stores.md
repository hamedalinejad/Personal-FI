# stores/ — مدیریت State با Zustand

این پوشه شامل **Storeهای سراسری و مشترک** است که State لازم برای UI و تنظیمات را نگه می‌دارند — نه داده مالی اصلی که همیشه در SQLite می‌ماند.

---

## ساختار پوشه

```bash
stores/
├── useAppStore.ts # تنظیمات UI اپ (تم، زبان، فرمت‌ها)
├── useCurrencyStore.ts # نرخ ارز جاری + تابع convert
├── useUiStore.ts # State رابط کاربری (سایدبار، مودال، loading)
├── usePriceSyncStore.ts # وضعیت دریافت قیمت‌ها (در حال fetch، آخرین نتیجه)
└── index.ts # re-export مرکزی
```

> **چرا `useAccountStore` در این پوشه نیست؟** 
> لیست حساب‌ها داده مالی اصلی است و باید مستقیماً از SQLite خوانده شود، نه در یک Store سراسری cached بماند. هر کامپوننتی که به لیست حساب‌ها نیاز دارد، از API لایه Domain مستقیم کوئری می‌زند. Store فقط برای State‌ای است که واقعاً بین صفحات مختلف بدون کوئری مجدد لازم است.

---

## چه چیزهایی داخل Store بروند؟

| مناسب برای Store | نامناسب برای Store |
|------------------|-------------------|
| تم، زبان، فرمت تاریخ/اعداد (UI preferences که از LocalStorage بار می‌شوند) | داده مالی: تراکنش‌ها، هولدینگ‌ها، حساب‌ها، سرمایه‌گذاری‌ها |
| State رابط کاربری سراسری: sidebar باز/بسته، modal فعال، globalLoading | ارز پایه (`baseCurrency`) — این در `cur_currency_preferences` در SQLite است، نه اینجا |
| نرخ ارز کش‌شده در حافظه برای مصرف سریع (کپی کوتاه‌مدت از دیتابیس) | لیست‌های بزرگ دیتابیس (حساب‌ها، نمادها) |
| وضعیت fetch در حال اجرا برای `19-Price-Fetching` | گزارش‌های سنگین |
| `online/offline` status کاربر (`navigator.onLine`) برای نمایش badge | منطق پیچیده کسب‌وکار |

---

## مسئولیت هر Store

### `useAppStore`
| فیلد | نوع | منبع | توضیح |
|------|-----|------|-------|
| `language` | `'fa' \| 'en'` | LocalStorage + `stg_settings` | زبان اپ |
| `theme` | `'light' \| 'dark' \| 'system'` | LocalStorage + `stg_settings` | تم |
| `dateFormat` | `'jalali' \| 'gregorian'` | LocalStorage + `stg_settings` | فرمت تاریخ |
| `numberFormat` | `'fa' \| 'en'` | LocalStorage + `stg_settings` | فرمت اعداد |
| `isOnline` | `boolean` | `navigator.onLine` + event listener | وضعیت اتصال |

> **مهم — `baseCurrency` در اینجا نیست:** ارز پایه نمایش کاربر (`baseCurrency`) در جدول `cur_currency_preferences` (SQLite) ذخیره می‌شود و توسط `useCurrencyStore` خوانده و cached می‌شود. `useAppStore` هیچ اطلاعاتی درباره ارز ندارد تا مسئولیت‌ها جدا بمانند.

### `useCurrencyStore`
| فیلد | نوع | منبع | توضیح |
|------|-----|------|-------|
| `baseCurrency` | `string` | `cur_currency_preferences` (SQLite) | ارز پایه کاربر — Read-only کپی برای سرعت |
| `rates` | `Map<string, Decimal>` | `cur_exchange_rates` (SQLite) | نرخ‌های تبدیل آخرین به‌روزرسانی |
| `lastUpdated` | `Timestamp \| null` | `cur_exchange_rates` (SQLite) | |
| `convert(amount, from, to)` | تابع | محاسبه در حافظه از `rates` | تبدیل سریع بدون کوئری DB |

> **قانون sync:** این Store هیچ‌وقت مستقیم به دیتابیس نمی‌نویسد. تغییر `baseCurrency` از طریق API فیچر `Currency-CrossRate` (که `cur_currency_preferences` را آپدیت می‌کند) انجام می‌شود و Store با یک re-load به‌روز می‌شود.

### `useUiStore`
| فیلد | نوع | توضیح |
|------|-----|-------|
| `sidebarOpen` | `boolean` | وضعیت سایدبار |
| `activeModal` | `string \| null` | نام modal فعال (یا null) |
| `globalLoading` | `boolean` | نمایش loading سراسری |
| `toasts` | `Toast[]` | صف اعلان‌های Toast |

### `usePriceSyncStore`
وضعیت عملیات دریافت قیمت (`19-Price-Fetching`) — فقط State موقت UI، نه داده دائمی.

| فیلد | نوع | توضیح |
|------|-----|-------|
| `isFetching` | `boolean` | آیا الان fetch در حال اجراست |
| `fetchProgress` | `{ done: number; total: number } \| null` | برای نوار پیشرفت Bulk Fetch |
| `lastFetchResult` | `PriceFetchResult \| null` | خلاصه آخرین fetch (succeeded/failed) — فقط برای نمایش در UI؛ داده واقعی در `price_history` است |
| `autoSyncActive` | `boolean` | آیا تایمر Auto-Sync الان در حال اجرا است |

> این Store هیچ‌وقت قیمت‌های واقعی را کش نمی‌کند — فقط وضعیت UI عملیات fetch را نگه می‌دارد. آخرین قیمت واقعی همیشه از `price_history` (SQLite) از طریق `getLatestPrice` خوانده می‌شود.

---

## قوانین

1. Store نباید جایگزین دیتابیس شود.
2. داده اصلی مالی همیشه در SQLite می‌ماند؛ Store فقط State لازم برای UI را نگه می‌دارد.
3. Storeها کوچک و مشخص باشند — نه یک Store غول‌پیکر.
4. برای تنظیمات UI (زبان، تم)، `persist` با `localStorage` فعال شود تا بعد از reload اپ تنظیمات از دست نرود؛ برای بقیه Storeها persist لازم نیست (از SQLite بار می‌شوند).
5. هیچ Store‌ای نباید مستقیماً به SQL layer بنویسد — فقط بخواند یا از API لایه Domain فراخوانی کند.
6. وقتی UI به داده‌ای نیاز دارد که فقط در یک صفحه/کامپوننت خاص لازم است، آن داده را در Store نریزید — از `useState` / local state استفاده کنید.
