# Documentation Audit — 2026-09-01

## هدف

این سند نتیجه ممیزی cross-document برای Personal-FI است. در این مرحله **کدی برای بررسی وجود ندارد**؛ بنابراین باگ‌های runtime، SQL و UI را نمی‌توان اثبات کرد. این ممیزی روی قراردادهای مستند، روابط مدل، API، SoT، محاسبات و استقلال ماژول‌ها انجام شده است.

## نتیجه اجرایی

معماری فعلی از نظر جهت کلی مناسب است:

- Offline-first و local SQLite/sql.js
- Accounting Core به‌عنوان capability پشت‌صحنه
- Feature Public API و CashSettlementPort
- Journal به‌عنوان SoT نقد
- Domain ledger برای quantity/terms تخصصی
- WAC v1، FX direction و Loan Schedule به‌صورت contract
- ۹ صفحه اصلی برای تعداد بیشتری Feature

اما چند تناقض می‌توانست در implementation باعث دو ledger، محاسبه اشتباه یا شکستن editionهای تک‌فیچری شود. موارد P0 در این commit اصلاح یا supersede شده‌اند.

---

## P0 — اصلاح‌شده

### 1. Cash SoT دوگانه در مستندات

**مشکل:** Accounting Core و Canonical Cash می‌گویند `fin_accounts + fin_journal_lines` منبع حقیقت مانده نقد است، ولی Data Dictionary قدیمی `currentBalance` را قابل rebuild از `acc_transactions` معرفی می‌کرد.

**تصمیم نهایی:**

```text
Cash SoT = fin_accounts + fin_journal_lines
acc_transactions = operational/event log + UX link
currentBalance = snapshot/cache
```

**اصلاح:** `docs/core/Data-Dictionary.md`

مرجع هم‌تراز: `Canonical-Cash-Model.md` و `Source-of-Truth-Matrix.md`.

### 2. API Response Envelope ناسازگار

**مشکل:** `API-Requirements.md` از `{success,data,errors,meta}` استفاده می‌کرد، اما `API-Reference.md` از `{ok,data}`. یک implementer می‌توانست دو contract متفاوت بسازد.

**تصمیم نهایی:**

```text
success: boolean
 data: T | null
 errors: Error[]
 meta: { request_id, operation_id?, schema_version }
```

**اصلاح:** `docs/API-Reference.md` و `docs/core/API-Requirements.md`

### 3. Standalone Feature و Accounts dependency

**مشکل:** بعضی Featureها در توضیح field/link خود به `accountId` و `accountTransactionId` نزدیک به mandatory بودن نوشته شده بودند، در حالی که قرارداد استقلال می‌گوید Accounts اختیاری است.

**تصمیم نهایی:**

```text
Domain correctness
  ≠ وجود acc_accounts

Standalone → LocalSettlementAdapter
Integrated → AccountsCashAdapter
```

لینک‌های Accounts فقط در edition یکپارچه پر می‌شوند؛ `accountTransactionId` در standalone می‌تواند null باشد. `fin_accounts` به‌عنوان Accounting Core account canonical باقی می‌ماند و با UI Accounts اشتباه گرفته نمی‌شود.

**اصلاح:** `Data-Dictionary.md` + `Domain-Dependency-Matrix.md` و قراردادهای موجود `Feature-Independence-Contract.md` / `Cash-Settlement-Adapter.md`.

### 4. Account reads/writes باید از Port عبور کنند

**مشکل:** ماتریس dependency قدیمی «reads → Accounts = Y» را بدون قید interface نشان می‌داد؛ این جمله برای implementer می‌تواند direct repository dependency بسازد.

**تصمیم نهایی:** تمام تعاملات cross-feature با Accounts فقط از `CashSettlementPort` و adapterها.

**اصلاح:** `docs/core/Domain-Dependency-Matrix.md`

---

## P1 — تناقض‌ها / ریسک‌های مهمی که باید قبل از کد قفل شوند

### 5. accountType در Accounts دو enum متفاوت دارد

در `docs/features/00-Accounts-Banking/Accounts-Banking.md` دو تعریف دیده می‌شود:

```text
current | savings | term_deposit | other
```

و در بخش ایران:

```text
qarz | sep | modat | jame | other
```

این دو نباید هم‌زمان enum مستقل باشند.

**تصمیم پیشنهادی canonical:**

```text
accountType:
  current
  savings
  term_deposit
  joint
  other
```

و mapping نمایشی/legacy:

```text
qarz → current
sep → savings
modat → term_deposit
jame → joint
```

مهاجرت باید preserve + map باشد؛ داده قدیمی نباید حذف شود.

> این مورد فعلاً به‌صورت rule در API reference هماهنگ شده، ولی منطق legacy mapping باید پیش از schema code در خود Accounts spec نیز یک‌بار به‌صورت صریح تثبیت شود.

### 6. cardNumber خام در برابر cardNumberHash

Accounts هم `cardNumber` و هم `cardNumberHash` را دارد. برای privacy:

- `cardNumber` اگر به‌علت migration یا compatibility وجود دارد: **LEGACY / read-only / never log / never new write**
- `cardNumberHash`: canonical lookup identity
- در صورت نیاز UI فقط `last4` غیرحساس نمایش داده شود.

حذف فیلد قدیمی بدون migration ممنوع است.

### 7. Date UTC با business DATE نباید قاطی شود

Technical Architecture عبارت «تمام تاریخ‌ها UTC» را دارد، در حالی که `businessDate`, `settlementDate`, `dueDate`, `paymentDate`, `marketDate` در Date Semantics به‌صورت DATE و وابسته به روز تقویمی هستند.

**قاعده صحیح:**

```text
createdAt/eventAt/fetchedAt = timestamp UTC
businessDate/... = canonical DATE semantics
```

این قاعده در Data Dictionary از این commit supersede شده و باید هنگام بازنگری Technical Architecture نیز همان‌جا جایگزین شود.

### 8. `acc_transactions` دو نقش خطرناک را هم‌زمان نشان می‌دهد

این جدول باید فقط operational cash-event log باشد. مانده، Trial Balance و Net Worth نباید از آن به‌عنوان SoT مستقل محاسبه شوند.

Canonical:

```text
fin_journal_lines → accounting cash truth
acc_transactions → banking event representation / UI linkage
```

### 9. Accounting Core و Accounting UI باید جدا بمانند

هیچ route `/accounting` لازم نیست. Ledger browser/Trial Balance فقط capability اختیاری UI است. این تصمیم با ۹ صفحه اصلی سازگار است.

---

## P1 — الزامات completeness داده ایران

برای جلوگیری از کم‌شدن اطلاعات، implementation نهایی باید این‌ها را به‌صورت typed/raw fields یا tables حفظ کند:

### Banking

- IBAN/Shaba
- bank institution identity
- account number (در صورت وجود)
- card identity امن (hash/last4)
- account kind/type
- currency
- source/external reference
- reconciliation state

### Loans

- principal contractual amount
- disbursement net amount
- interest rate + period
- day-count convention + denominator
- calculation method
- frequency/custom interval
- grace mode + actual dates/periods
- fee schedule and fee components
- penalty components
- principal/interest/fee/penalty portions per payment
- unpaid residual per component
- restructuring/reversal provenance
- historical exchange rate to base
- schedule snapshot version/hash

### Crypto

- instrumentId canonical
- asset/network/contract/chain/decimals metadata
- gross/net/fee quantity
- fee currency/asset
- transaction price
- historical cost basis inputs
- exchange/wallet location
- acquisition date/lot provenance
- opening balance provenance
- transfer cost preservation

### Stocks Iran

- instrument identity independent from display ticker
- brokerage identity
- quantity and trade price
- full fee/tax breakdown while preserving total fee
- settlement date / market date
- corporate-action lineage
- historical FX/base valuation fields when applicable

### Fixed-income funds

- NAV
- transaction/subscription/redemption price separately
- reported vs calculated NAV
- reportedAt / marketDate / provider
- units
- external reported profit vs calculated profit
- issuance/redemption/ETF distinction

### Metals

- gross weight
- purity
- purity at acquisition snapshot
- fine weight
- unit price basis
- fees and delivery/physical redemption state

---

## Calculation locks that should not be weakened

### FX

```text
1 fromCurrency = rate toCurrency
amountTo = amountFrom × rate
amountFrom = amountTo / rate
amountInBase = amount × exchangeRateToBase
```

Historical posted `amountInBase` is immutable.

### Journal

```text
Σ debit(amountInBase) = Σ credit(amountInBase)
```

per posted operation and its locked base currency.

### WAC

```text
avg = cost / qty
costOut = avg × qtyOut
realized = netProceeds - costOut
```

Asset-paid fee reduces quantity; it does not silently erase the cost pool.

### Loans

```text
remainingPrincipal -= principalPortion
```

Interest/fee/penalty remain separate components.

### Funds

```text
NAV ≠ transactionPrice ≠ liquidationValue
```

### Metals

```text
fineWeight = grossWeight × purityRatio
```

### Reversal

Posted financial rows are never edited to «new truth»; a new inverse operation is written and linked.

---

## P2 — مواردی که بعداً باید با کد/fixture اثبات شوند

این‌ها با مستندات قابل تضمین کامل نیستند و قبل از اولین release مالی باید fixture/test داشته باشند:

1. FX multi-hop and rounding order.
2. WAC edge cases: zero qty, partial sell, fee in base/quote/asset, transfer after multiple acquisitions.
3. Loan irregular first period, grace, leap-year/day-count, custom interval, final residual.
4. Loan restructure and refinance preserving historical schedule/provenance.
5. Cheque clear → bounce exact reversal.
6. Stock corporate actions and T+settlement.
7. Fund distribution handling without double-counting NAV returns.
8. Metal purity changes and physical delivery.
9. Multi-tab/single-writer concurrency for sql.js + IndexedDB.
10. Backup/restore integrity and migration verification.
11. Reconciliation drift detection and safe repair.
12. Import idempotency and source lineage.

---

## Architecture acceptance criteria قبل از coding

- [ ] یک SoT روشن برای Cash
- [ ] یک envelope واحد برای همه APIها
- [ ] هیچ Feature به repository/table داخلی Feature دیگر import نکند
- [ ] هر Feature Public API مستقل داشته باشد
- [ ] Loan/Crypto/Fund/Metal/Stocks در حالت standalone بدون Accounts UI کار کنند
- [ ] هیچ صفحه اصلی جدید صرفاً به‌خاطر یک Feature ساخته نشود
- [ ] همه مالیات/کارمزدها از transaction cost و tax event تفکیک شوند
- [ ] همه RAW مالی preserve شوند
- [ ] همه derived/snapshotها rebuild contract داشته باشند
- [ ] تاریخ‌ها timestamp-vs-date semantics روشن داشته باشند
- [ ] numeric fields به‌صورت decimal string و بدون JS Number برای محاسبه مالی باشند
- [ ] golden fixtures قبل از هر financial release سبز باشند

## فایل‌های اصلاح‌شده در این audit

- `docs/core/Data-Dictionary.md`
- `docs/core/Domain-Dependency-Matrix.md`
- `docs/core/API-Requirements.md`
- `docs/API-Reference.md`

## فایل‌های مرجع مهم

- `docs/core/Accounting-Core.md`
- `docs/core/Accounting-Calculation-Invariants.md`
- `docs/core/Canonical-Cash-Model.md`
- `docs/core/Source-of-Truth-Matrix.md`
- `docs/core/Data-Preservation-Contract.md`
- `docs/core/Field-Level-Data-Ownership-Matrix.md`
- `docs/core/Feature-Independence-Contract.md`
- `docs/core/Cash-Settlement-Adapter.md`
- `docs/00-Product/Pages-IA.md`
- `docs/Product-Map-FA.md`

**Status:** Specification audit complete for the currently exposed documentation surface. No application/runtime code was changed because the repository is currently documentation-only.
