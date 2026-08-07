React Hooks مشترکی که در چندین فیچر استفاده می‌شوند.

## ساختار پیشنهادی

```bash
hooks/
├── useLocalStorage.ts
├── useDebounce.ts
├── useMediaQuery.ts
├── useClickOutside.ts
├── useOnlineStatus.ts
├── useCurrency.ts
├── useJalaliDate.ts
├── useEventBus.ts
└── index.ts
```

## توضیح هر Hook

| Hook | کاربرد |
|------|--------|
| `useLocalStorage` | همگام‌سازی State با LocalStorage |
| `useDebounce` | تأخیر در اجرای تابع (جستجو، فیلتر و ...) |
| `useMediaQuery` | تشخیص اندازه صفحه (موبایل / تبلت / دسکتاپ) |
| `useClickOutside` | تشخیص کلیک بیرون از المان (بستن منو و مودال) |
| `useOnlineStatus` | تشخیص وضعیت آنلاین/آفلاین (برای Offline-First) |
| `useCurrency` | دسترسی آسان به نرخ ارز و تبدیل مبلغ |
| `useJalaliDate` | کار راحت با تاریخ شمسی در کامپوننت‌ها |
| `useEventBus` | گوش دادن و ارسال رویداد بین فیچرها |

## قوانین

- فقط Hookهایی که در بیش از یک فیچر استفاده می‌شوند اینجا قرار می‌گیرند.
- Hookهای مخصوص یک فیچر باید داخل همان فیچر نوشته شوند.