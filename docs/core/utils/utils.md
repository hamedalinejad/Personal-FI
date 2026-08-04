توابع خالص (Pure Functions) که به React وابسته نیستند و در هر جایی از پروژه قابل استفاده هستند.
ساختار پیشنهادی
Bashutils/
├── date/
│   ├── jalali.ts
│   ├── formatDate.ts
│   └── relativeTime.ts
├── number/
│   ├── formatNumber.ts
│   ├── toPersianDigits.ts
│   ├── toEnglishDigits.ts
│   └── round.ts
├── money/
│   ├── formatMoney.ts
│   ├── convertCurrency.ts
│   ├── calculateWeightedAverage.ts
│   └── rialToToman.ts
├── validation/
│   ├── iban.ts
│   ├── cardNumber.ts
│   ├── nationalCode.ts
│   └── phone.ts
├── string/
│   ├── slugify.ts
│   ├── truncate.ts
│   └── capitalize.ts
├── id/
│   └── generateId.ts
└── index.ts
مسئولیت‌ها


 



دستهمسئولیتdateتبدیل و فرمت تاریخ شمسی/میلادی، محاسبه اختلاف زمانیnumberفرمت اعداد، تبدیل ارقام فارسی ↔ انگلیسیmoneyفرمت پول، تبدیل ارز، محاسبه میانگین وزنی خریدvalidationاعتبارسنجی شبا، کارت بانکی، کد ملی، موبایلstringعملیات رشته‌ای عمومیidتولید UUID و شناسه‌های یکتا
قوانین

تمام توابع باید Pure باشند (بدون Side Effect).
نباید به State یا React وابسته باشند.
باید به راحتی قابل Unit Test باشند.