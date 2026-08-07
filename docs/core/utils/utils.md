توابع خالص (Pure Functions) که به React وابسته نیستند و در هر جایی از پروژه قابل استفاده هستند.

## ساختار پیشنهادی

```bash
utils/
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
```

## مسئولیت‌ها

| دسته | مسئولیت |
|------|---------|
| `date` | تبدیل و فرمت تاریخ شمسی/میلادی، محاسبه اختلاف زمانی |
| `number` | فرمت اعداد، تبدیل ارقام فارسی ↔ انگلیسی |
| `money` | فرمت پول، تبدیل ارز، محاسبه میانگین وزنی خرید |
| `validation` | اعتبارسنجی شبا، کارت بانکی، کد ملی، موبایل |
| `string` | عملیات رشته‌ای عمومی |
| `id` | تولید UUID و شناسه‌های یکتا |

## قوانین

- تمام توابع باید Pure باشند (بدون Side Effect).
- نباید به State یا React وابسته باشند.
- باید به راحتی قابل Unit Test باشند.