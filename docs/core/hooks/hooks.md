# core/hooks/ — React Hooks مشترک

React Hooks مشترکی که در **بیش از یک فیچر** استفاده می‌شوند. Hookهای اختصاصی یک فیچر داخل خود فیچر نوشته می‌شوند، نه اینجا.

---

## ساختار پوشه

```bash
hooks/
├── useLocalStorage.ts      # همگام‌سازی State با LocalStorage (از طریق localStorageService)
├── useDebounce.ts          # تأخیر در اجرای تابع
├── useMediaQuery.ts        # تشخیص اندازه صفحه
├── useClickOutside.ts      # تشخیص کلیک بیرون از المان
├── useOnlineStatus.ts      # وضعیت آنلاین/آفلاین
├── useCurrency.ts          # دسترسی به نرخ ارز و تبدیل مبلغ
├── useJalaliDate.ts        # کار با تاریخ شمسی در کامپوننت‌ها
├── useEventBus.ts          # گوش دادن و ارسال رویداد بین فیچرها
└── index.ts
```

---

## توضیح هر Hook

| Hook | کاربرد | نکته |
|------|---------|------|
| `useLocalStorage` | همگام‌سازی یک مقدار State با LocalStorage | **از `localStorageService` (در `core/services/storage/`) استفاده کند**، نه مستقیم از `window.localStorage` — تا type-safety و مدیریت خطا یکجا باشد |
| `useDebounce` | تأخیر در اجرای تابع (جستجو، ذخیره draft فرم) | مقدار delay به‌عنوان پارامتر دریافت شود، پیش‌فرض پیشنهادی ۳۰۰ms |
| `useMediaQuery` | تشخیص اندازه صفحه (موبایل / تبلت / دسکتاپ) | از breakpointهای ثابت در `lib/constants.ts` استفاده کند |
| `useClickOutside` | تشخیص کلیک بیرون از المان (بستن منو و مودال) | ref-based، با cleanup مناسب |
| `useOnlineStatus` | وضعیت آنلاین/آفلاین | مقدار را در `useAppStore.isOnline` هم sync کند (یا مستقیم از Store بخواند تا دو منبع حقیقت نباشد) |
| `useCurrency` | دسترسی آسان به `useCurrencyStore` و `convert()` | یک لایه نازک روی Store؛ نباید منطق تبدیل را خودش پیاده کند |
| `useJalaliDate` | کار راحت با تاریخ شمسی در کامپوننت‌ها | از instance پیکربندی‌شده `dayjs` در `lib/dayjs.ts` استفاده کند |
| `useEventBus` | گوش دادن و ارسال رویداد بین فیچرها | Subscribe در mount، unsubscribe در unmount |

---

## قوانین

1. فقط Hookهایی که در **بیش از یک فیچر** استفاده می‌شوند اینجا قرار می‌گیرند.
2. هیچ Hook ای نباید مستقیماً به لایه دیتابیس (sql.js) دسترسی داشته باشد — فقط از Storeها یا API لایه Domain استفاده کند.
3. هیچ Hook ای نباید مستقیماً `window.localStorage` یا `window.sessionStorage` صدا بزند — همیشه از `localStorageService` / `sessionStorageService` استفاده شود.
4. هر Hook که با شبکه کار می‌کند باید ابتدا `useOnlineStatus` را چک کند و طبق «سیاست دسترسی به شبکه» در `Technical-Architecture.md` رفتار کند.
5. تمام Hookها باید cleanup (unsubscribe، removeEventListener) مناسب داشته باشند.
