React Hooks مشترکی که در چندین فیچر استفاده می‌شوند.
ساختار پیشنهادی
Bashhooks/
├── useLocalStorage.ts
├── useDebounce.ts
├── useMediaQuery.ts
├── useClickOutside.ts
├── useOnlineStatus.ts
├── useCurrency.ts
├── useJalaliDate.ts
├── useEventBus.ts
└── index.ts
توضیح هر Hook


 

HookکاربردuseLocalStorageهمگام‌سازی State با LocalStorageuseDebounceتأخیر در اجرای تابع (جستجو، فیلتر و ...)useMediaQueryتشخیص اندازه صفحه (موبایل / تبلت / دسکتاپ)useClickOutsideتشخیص کلیک بیرون از المان (بستن منو و مودال)useOnlineStatusتشخیص وضعیت آنلاین/آفلاین (برای Offline-First)useCurrencyدسترسی آسان به نرخ ارز و تبدیل مبلغuseJalaliDateکار راحت با تاریخ شمسی در کامپوننت‌هاuseEventBusگوش دادن و ارسال رویداد بین فیچرها
قوانین

فقط Hookهایی که در بیش از یک فیچر استفاده می‌شوند اینجا قرار می‌گیرند.
Hookهای مخصوص یک فیچر باید داخل همان فیچر نوشته شوند.