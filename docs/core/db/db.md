ساختار دیتابیس پروژه (Core Level)

## Overview

لایه دیتابیس اصلی پروژه بر اساس **IndexedDB** با کتابخانه‌های **Dexie** یا **RxDB** پیاده‌سازی می‌شود.

## تفکیک لایه‌ها

| لایه | توضیح |
|------|------|
| **Core DB (IndexedDB)** | ذخیره‌سازی اصلی داده‌های مالی با قابلیت Offline-First |
| **LocalStorage** | ذخیره داده‌های غیرحساس و کم‌حجم (پیکربندی UI، تم، تنظیمات فیلتر) |
| **Session Storage** | داده‌های موقت فقط برای سشن فعلی |

## دستورالعمل استفاده

### LocalStorage
- فقط برای داده‌های غیرحساس و کم‌حجم استفاده شود.
- مثال‌ها: تنظیمات UI، وضعیت منوها، تم فعال، فیلترهای ذخیره‌شده.
- داده‌های مالی **هرگز** در LocalStorage ذخیره نشوند.

### IndexedDB (Dexie/RxDB)
- ذخیره‌سازی اصلی داده‌های مالی (همه تراکنش‌ها، حساب‌ها، سرمایه‌گذاری‌ها و ...)
- قابلیت Offline-First
- پشتیبانی از قید کردن و روابط بین جداول

## قوانین نام‌گذاری جداول

همه جداول باید از **snake_case** با پیشوند کوتاه فیچر استفاده کنند:

| پیشوند | فیچر |
|--------|------|
| `acc_` | Accounts & Banking |
| `inc_` | Income |
| `exp_` | Expense |
| `chk_` | Cheque Management |
| `ln_` | Debt & Loan |
| `inv_` | Investment (همه زیر‌فیچرها) |
| `pa_` | Physical Assets |
| `bg_` | Budget Management |
| `fg_` | Financial Goals |
| `br_` | Bills & Recurring |
| `notif_` | Notification & Reminder |
| `rep_` | Reports & Analytics |
| `dash_` | Dashboard |
| `tax_` | Tax Management |
| `docs_` | Document Management |
| `cur_` | Currency & Multi-Currency |
| `stg_` | Settings & Tools |
| `cat_` | Common Categories |

## لیست مرکزی همه‌ی جدول‌ها

| جدول | فیچر | توضیح |
|------|------|------|
| `acc_accounts` | Accounts & Banking | حساب‌های بانکی |
| `acc_transactions` | Accounts & Banking | تراکنش‌های بانکی |
| `inc_transactions` | Income | تراکنش‌های درآمد |
| `inc_recurring` | Income | درآمدهای تکرارشونده |
| `exp_transactions` | Expense | تراکنش‌های هزینه |
| `exp_recurring` | Expense | هزینه‌های تکرارشونده |
| `chk_cheques` | Cheque Management | چک‌ها |
| `ln_loans` | Debt & Loan | وام‌ها |
| `ln_transactions` | Debt & Loan | تراکنش‌های وام |
| `inv_crypto_exchanges` | Investment Crypto | صرافی‌ها و والت‌ها |
| `inv_crypto_holdings` | Investment Crypto | دارایی‌های رمزارز |
| `inv_crypto_transactions` | Investment Crypto | تراکنش‌های رمزارز |
| `inv_crypto_exchange_transactions` | Investment Crypto | تراکنش‌های نقدی صرافی |
| `inv_stocks_iran_brokerages` | Investment Stocks Iran | کارگزاری‌ها |
| `inv_stocks_iran_holdings` | Investment Stocks Iran | دارایی‌های سهام |
| `inv_stocks_iran_transactions` | Investment Stocks Iran | تراکنش‌های سهام |
| `inv_stocks_iran_brokerage_transactions` | Investment Stocks Iran | تراکنش‌های نقدی کارگزاری |
| `inv_fif_funds` | Investment Fixed Income Funds | صندوق‌های درآمد ثابت |
| `inv_fif_holdings` | Investment Fixed Income Funds | دارایی‌های صندوق |
| `inv_fif_transactions` | Investment Fixed Income Funds | تراکنش‌های صندوق |
| `inv_metals_platforms` | Investment Metals | پلتفرم‌های فلزات |
| `inv_metals_holdings` | Investment Metals | دارایی‌های فلزات |
| `inv_metals_transactions` | Investment Metals | تراکنش‌های فلزات |
| `inv_metals_platform_transactions` | Investment Metals | تراکنش‌های نقدی پلتفرم |
| `inv_metals_physical_deliveries` | Investment Metals | تحویل فیزیکی فلزات |
| `pa_assets` | Physical Assets | دارایی‌های فیزیکی |
| `pa_valuations` | Physical Assets | ارزش‌گذاری‌های دارایی |
| `pa_transactions` | Physical Assets | تراکنش‌های دارایی |
| `bg_budgets` | Budget Management | بودجه‌ها |
| `bg_envelopes` | Budget Management | پاکت‌های بودجه |
| `bg_transaction_links` | Budget Management | لینک هزینه به پاکت |
| `bg_transfers` | Budget Management | انتقال بین پاکت‌ها |
| `fg_goals` | Financial Goals | اهداف مالی |
| `fg_contributions` | Financial Goals | کمک‌های اهداف |
| `br_items` | Bills & Recurring | آیتم‌های تکرارشونده |
| `br_occurrences` | Bills & Recurring | رخدادهای تکرارشونده |
| `notif_notifications` | Notification & Reminder | اعلان‌ها |
| `notif_settings` | Notification & Reminder | تنظیمات اعلان |
| `notif_custom_reminders` | Notification & Reminder | یادآوری‌های سفارشی |
| `rep_presets` | Reports & Analytics | پیش‌تنظیم گزارش |
| `rep_net_worth_snapshots` | Reports & Analytics | نمونه‌گیری Net Worth |
| `rep_portfolio_snapshots` | Reports & Portfolio | نمونه‌گیری پرتفوی |
| `rep_portfolio_settings` | Reports & Portfolio | تنظیمات پرتفوی |
| `dash_layouts` | Dashboard | چیدمان داشبورد |
| `dash_widget_configs` | Dashboard | تنظیمات ویجت‌ها |
| `tax_records` | Tax Management | رکوردهای مالیاتی |
| `tax_categories` | Tax Management | دسته‌بندی‌های مالیاتی |
| `docs_documents` | Document Management | اسناد |
| `docs_links` | Document Management | پیوندهای اسناد |
| `stg_settings` | Settings & Tools | تنظیمات برنامه |
| `stg_backup_logs` | Settings & Tools | لاگ‌های پشتیبان‌گیری |
| `cur_currencies` | Currency & Multi-Currency | ارزها |
| `cur_exchange_rates` | Currency & Multi-Currency | نرخ‌های تبدیل |
| `cur_currency_preferences` | Currency & Multi-Currency | تنظیمات ارز کاربر |
| `cat_categories` | Common Categories | دسته‌بندی‌های مشترک |

## فراهم کردن دسترسی یکپارچه به داده‌ها

این فایل (`db.md`) نقش **فهرست مرکزی همه‌ی جدول‌ها** را دارد:
- همه جداول تمام فیچرها در اینجا لیست شده‌اند
- هر جدول با نام یکپارچه و پیشوند معین آمده
- برای جزئیات فیلدها، به فایل فیچر مربوطه مراجعه شود

---

## نمونه مفهومی Schema (ساده)

```typescript
// db/models.ts
export interface AccAccount {
  id: string;
  name: string;
  accountNumber: string;
  iban: string;
  currency: string;
  currentBalance: number;
  isArchived: boolean;
}

export interface AccTransaction {
  id: string;
  date: string;
  type: string;
  amount: number;
  feeAmount?: number;
  feeCurrency?: string;
  exchangeRateToUSDT?: number;
  balanceAfterTransaction: number;
  accountId: string;
  isVoided: boolean;
}
```

## مسیر فایل‌های دیتابیس

```bash
core/db/
├── db.ts              # تعریف دیتابیس و اوبجکت استورها
├── models.ts          # TypeScript types برای هر جدول
├── migrations.ts      # مدیریت مایگRATION‌ها
└── index.ts           # Export اصلی
```

## قوانین

- تمام تراکنش‌های مالی در IndexedDB ذخیره می‌شوند.
- LocalStorage فقط برای تنظیمات UI و داده‌های غیرحساس استفاده شود.
- داده‌های حساس (مثلاً API keys) هرگز ذخیره نشوند.