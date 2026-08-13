# فیچر: Accounts & Banking

## توضیح کلی
مدیریت حساب‌های بانکی واقعی (جاری، پس‌انداز، سپرده و غیره).
صندوق نقدی، کیف پول و صرافی در فیچرهای جداگانه مدیریت می‌شوند.

---

## Business Rules

- موجودی حساب نمی‌تواند منفی شود (مگر حساب اعتباری در آینده).
- **افتتاحیه حساب (CRITICAL)**: هر حساب جدید باید با Opening Balance Transaction ایجاد شود:
  ```
  1. createAccount() → currentBalance = 0 (always)
  2. createOpeningBalanceTransaction(accountId, amount, date)
  3. Only then → currentBalance = amount
  ```
  - اگر opening balance = ۵۰۰M ریال ⟹ **باید** type='opening_balance' transaction وجود داشته باشد
  - بدون Opening Transaction ⟹ **نمی‌تواند** opening balance داشته باشد
  - **Reconciliation از روز اول کار می‌کند**: balance = SUM(transactions)
  
- انتقال وجه بین حساب‌ها باعث ایجاد دو تراکنش مستقل می‌شود (برداشت از مبدا + واریز به مقصد).
- نام حساب باید منحصر به فرد باشد.
- حذف حساب وجود ندارد — فقط آرشیو (Soft Archive).
- تراکنش‌ها پس از ثبت تغییرناپذیر هستند؛ برای اصلاح، تراکنش reversed/voided ثبت می‌شود.
- مانده حساب بعد از هر تراکنش در فیلد `balanceAfterTransaction` snapshot می‌شود (برای جلوگیری از بازپخش تراکنش‌ها و تغییر دستی).
- ارز تراکنش باید با ارز حساب مرتبط یکی باشد.

---

## Domain Entities

### ۱. Account (جدول: `acc_accounts`)

- `id` → UUID (Primary Key)
- `name` → string (نام حساب — باید منحصر به فرد باشد)
- `accountNumber` → string (nullable — شماره حساب)
- `iban` → string (nullable — شماره شبا)
- `cardNumber` → string (nullable — شماره کارت)
- `branchName` → string (nullable — نام شعبه)
- `bankName` → string (نام بانک)
- `currency` → string (ارز حساب: `IRR`, `USDT`, `USD` و ...)
- `accountType` → enum — مقادیر مجاز:
  - `checking` — جاری
  - `savings` — پس‌انداز
  - `fixed_deposit` — سپرده ثابت
  - `wallet` — کیف پول الکترونیک (مثل آپ، ایوا)
  - `cash` — صندوق نقدی
  - `other` — سایر
- `currentBalance` → decimal (مانده فعلی — با `decimal.js`)
- `isArchived` → boolean (پیش‌فرض: `false`)
- `notes` → text (nullable — یادداشت)
- `createdAt` → datetime
- `updatedAt` → datetime

### ۲. Transaction (جدول: `acc_transactions`)

- `id` → UUID (Primary Key)
- `date` → datetime (تاریخ تراکنش)
- `type` → `TransactionType` (تعریف مرکزی در `core/types/types.md` — مقادیر معتبر: `opening_balance`, `deposit-income`, `withdrawal-expense`, `transfer-in`, `transfer-out`, `deposit-loan`, `withdrawal-loan`, `withdrawal-expense-tax`, `deposit-income-tax`, `withdrawal-cheque`, `deposit-cheque`, `deposit-investment`, `withdrawal-investment`)
- `amount` → decimal (مبلغ — با `decimal.js`، Minor Unit طبق `db.md`)
- `feeAmount` → decimal (nullable — کارمزد تراکنش)
- `feeCurrency` → string (nullable — ارز کارمزد: `IRR`, `USDT` و ...)
- `exchangeRateToBase` → decimal (nullable — نرخ تبدیل نسبت به `baseCurrency` کاربر در `cur_currency_preferences`؛ مثال: اگر `baseCurrency=IRR`، مقدار = ریال به ازای ۱ واحد ارز تراکنش)
- `balanceAfterTransaction` → decimal (مانده حساب **پس از** این تراکنش — snapshot اجباری)
- `accountId` → UUID (حساب مرتبط)
- `description` → string (nullable — توضیحات)
- `relatedFeature` → `RelatedFeature` (nullable — تعریف مرکزی در `core/types/types.md`؛ مقادیر: `income`, `expense`, `cheque`, `loan`, `crypto_exchange`, `stocks_iran`, `fif`, `metals`, `physical_assets`, `budget`, `tax`, `goals`)
- `relatedId` → UUID (nullable — شناسه رکورد در فیچر مرتبط؛ همیشه با `relatedFeature` پر یا خالی می‌شود)
- `isVoided` → boolean (پیش‌فرض: `false` — تراکنش لغوشده؛ هرگز حذف یا ویرایش مستقیم نمی‌شود)
- `relatedTransactionId` → UUID (nullable — برای تراکنش‌های reversal: لینک به تراکنش اصلی که این را معکوس کرده)
- `createdAt` → datetime
- `updatedAt` → datetime

> **قانون `relatedFeature` + `relatedId`**: این دو فیلد همیشه با هم پر یا با هم `null` هستند. اگر `relatedFeature` پر شود، `relatedId` اجباری است و برعکس.

> **مقادیر `relatedFeature` به تفکیک نوع تراکنش**:
>
> | `type` | `relatedFeature` | `relatedId` | `relatedTransactionId` |
> |--------|-----------------|-------------|------------------------|
> | `deposit-income` | `income` | `inc_transactions.id` | `null` |
> | `withdrawal-expense` | `expense` | `exp_transactions.id` | `null` |
> | `deposit-cheque` / `withdrawal-cheque` | `cheque` | `chk_cheques.id` | `null` |
> | `deposit-loan` / `withdrawal-loan` | `loan` | `ln_transactions.id` | `null` |
> | `deposit-investment` / `withdrawal-investment` (صرافی کریپتو) | `crypto_exchange` | `inv_crypto_exchange_transactions.id` | `null` |
> | `deposit-investment` / `withdrawal-investment` (کارگزاری سهام / ETF) | `stocks_iran` | `inv_stocks_iran_brokerage_transactions.id` | `null` |
> | `deposit-investment` / `withdrawal-investment` (صندوق issuance_redemption) | `fif` | `inv_fif_transactions.id` | `null` |
> | `deposit-investment` / `withdrawal-investment` (پلتفرم فلزات) | `metals` | `inv_metals_platform_transactions.id` | `null` |
> | `transfer-in` / `transfer-out` | `null` | `null` | **`acc_transactions.id` تراکنش طرف مقابل** (لینک دوطرفه — اجباری) |
> | `withdrawal-expense-tax` / `deposit-income-tax` | `tax` | `tax_records.id` | `null` |
> | تراکنش reversal (هر نوع) | (همان نوع اصل) | (همان relatedId اصل) | **`acc_transactions.id` تراکنش اصلی که معکوس شده** |
>
> **توجه**: `relatedTransactionId` دو کاربرد دارد و هیچ‌گاه با `relatedFeature`/`relatedId` تداخل ندارد:
> 1. **Transfer**: لینک دوطرفه بین `transfer-out` و `transfer-in` همان انتقال — اجباری، هر دو طرف باید پر شوند
> 2. **Reversal**: لینک تراکنش معکوس به تراکنش اصلی که `isVoided = true` شده — اجباری در `voidTransaction()`

---

## APIهای داخلی

### Account APIs
- `createAccount(data)` → ایجاد حساب جدید **با currentBalance = 0**
  ```typescript
  interface CreateAccountInput {
    name: string
    accountNumber: string
    iban: string
    currency: string
    accountType: AccountType
    bankName: string
    branchName: string
    cardNumber?: string
    notes?: string
    // ❌ currentBalance پارامتر نیست — فقط از طریق Opening Transaction
  }
  ```
  
  **قاعده مهم**: حساب جدید **باید** دارای Opening Balance Transaction باشد (یا ۰ شروع کند)
  - اگر `currentBalance ≠ 0` ⟹ **باید** `createOpeningBalanceTransaction()` فراخوانی شود
  - بدون Opening Transaction ⟹ balance همیشه ۰ است و reconcilable است

- `createOpeningBalanceTransaction(accountId, amount, date, source, relatedDocument?)` → ثبت تراکنش Opening Balance (جدید)
  ```typescript
  interface OpeningBalanceTransaction {
    type: 'opening_balance'  // enum خاص، فقط یکی در دوره عمر حساب
    accountId: UUID
    amount: Decimal  // مانده افتتاحیه (۵۰۰٬۰۰۰٬۰۰۰ IRR)
    date: datetime   // تاریخ افتتاح واقعی (مثلاً ۱۴۰۰-۰۱-۰۱)
    description: string  // "Opening Balance as of [date]"
    source: 'manual' | 'bank_statement'  // منبع تأیید
    relatedDocument?: UUID  // صورت‌حساب بانکی اولیه (اگر موجود)
    createdAt: datetime
  }
  ```
  
  **فرآیند**:
  ```
  1. INSERT acc_accounts with currentBalance = 0
  2. User enters opening balance via createOpeningBalanceTransaction()
  3. INSERT acc_transactions with type='opening_balance'
  4. UPDATE acc_accounts.currentBalance = amount
  5. Now: balance = 500M, SUM(transactions) = 500M ✓ Reconcilable
  ```

- `updateAccount(id, data)` → ویرایش فقط فیلدهای توصیفی: `name`, `bankName`, `branchName`, `accountNumber`, `iban`, `cardNumber`, `notes` — هرگز `currentBalance` یا `currency` مستقیم ویرایش نمی‌شود
- `getAllAccounts(includeArchived = false)`
- `getAccountById(id)`
- `archiveAccount(id)` → `isArchived = true`؛ حساب آرشیوشده تراکنش جدید نمی‌پذیرد
- `getCurrentBalance(accountId)` → برگرداندن `currentBalance` از جدول (نه جمع تراکنش‌ها) — یا Mode B: calculate from journal

### Transaction APIs
- `createTransaction(data)` → ثبت تراکنش + آپدیت `currentBalance` + ثبت `balanceAfterTransaction`؛ اگر موجودی کافی نباشد، خطا برمی‌گرداند
- `updateTransactionMetadata(id, data)` → ویرایش فقط فیلدهای غیرمالی: `description`؛ هیچ فیلد مالی (`amount`, `date`, `type`, `accountId`) مستقیم ویرایش نمی‌شود
- `voidTransaction(id, reason)`:
  1. تراکنش اصلی: `isVoided = true`
  2. یک تراکنش معکوس جدید با همان `amount` ولی جهت مخالف ایجاد می‌شود
  3. `relatedTransactionId` در تراکنش معکوس → `id` تراکنش اصلی
  4. `currentBalance` حساب آپدیت می‌شود
  5. `balanceAfterTransaction` در تراکنش معکوس snapshot می‌شود
- `getTransactionsByAccount(accountId, filters)` → فیلتر: `dateRange`, `type`, `isVoided`
- `getTransactionById(id)`

### Transfer APIs
- `transferBetweenAccounts(sourceAccountId, targetAccountId, amount, feeAmount?, description?)`:
  1. تراکنش `transfer-out` در حساب مبدا ایجاد می‌شود (شامل `feeAmount` اگر وجود داشته باشد)
  2. تراکنش `transfer-in` در حساب مقصد ایجاد می‌شود
  3. `relatedTransactionId` در هر تراکنش → `id` تراکنش دیگر (لینک دوطرفه)
  4. `relatedFeature` و `relatedId` هر دو `null` هستند (انتقال داخلی)
  5. هر دو `balanceAfterTransaction` مستقل محاسبه و ثبت می‌شوند
  6. عملیات atomic است — اگر یکی شکست بخورد، هیچ‌کدام ثبت نمی‌شود

---

## روابط با سایر فیچرها

- **Income / Expense / Cheque / Loan**: هر تراکنش مالی واقعی یک رکورد در `acc_transactions` ایجاد می‌کند
- **Investment (Crypto / Stocks / FIF / Metals)**: واریز و برداشت از پلتفرم‌های سرمایه‌گذاری از طریق `acc_transactions` ثبت می‌شود
- **Budget**: لینک هزینه‌ها به پاکت‌های بودجه از طریق `bg_transaction_links`
- **Currency**: `exchangeRateToBase` در لحظه هر تراکنش از `cur_exchange_rates` خوانده و قفل می‌شود
- **Reports / Dashboard / Portfolio**: منبع اصلی داده برای گزارش‌ها

---

## نکات طراحی

- `currentBalance` در `acc_accounts` همیشه snapshot است و باید با جمع تراکنش‌ها برابر باشد — هرگز مستقیم ویرایش نمی‌شود.
- `balanceAfterTransaction` در هر رکورد `acc_transactions` ثبت می‌شود تا بتوان تاریخچه موجودی را بدون بازپخش همه تراکنش‌ها بازسازی کرد.
- تمام محاسبات مالی با `decimal.js` انجام می‌شود (هرگز `Number` یا `float`).
- مبالغ در دیتابیس با Minor Unit ذخیره می‌شوند (طبق `db.md`).
