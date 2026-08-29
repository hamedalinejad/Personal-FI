## ارجاع

مدل کامل حساب‌ها: `docs/core/Accounting-Core.md`.

# 03 journal sot reporting

## دفتر روزنامه یکپارچه — `fin_journal_entries`

### مشکل
جدول‌های `inc_*`, `exp_*`, `ln_*`, `inv_*`, `pa_*` و `acc_transactions` لاگ‌های دامنه‌ای جدا هستند. `acc_transactions` فقط **Cash/Bank ledger** است، نه Journal عمومی. گزارش‌ها و Reconciliation اگر فقط یکی را ببینند ناقص می‌مانند.

### قرارداد
هر `runAtomicFinancialOperation` **اجباری** است حداقل یک (معمولاً چند) ردیف در `fin_journal_entries` بنویسد — علاوه بر جداول دامنه فیچر.

| فیلد | نوع | نقش |
|------|-----|------|
| `id` | UUID | PK |
| `operationId` | UUID | همان atomic op |
| `accountClass` | enum | WHAT: `cash` \| `crypto_asset` \| `stock_asset` \| `fund_unit` \| `metal_asset` \| `loan_liability` \| `loan_receivable` \| `income` \| `expense` \| `trading_fee` \| `equity` \| `opening_equity` \| `other` |
| `lineKind` | enum | WHY: `asset` \| `cash` \| `fee` \| `fx_conversion` \| `fx_rounding` \| `fx_gain` \| `fx_loss` \| `equity` \| `income` \| `expense` \| `other` |
| `direction` | enum | `debit` \| `credit` |
| `amount` | decimal string | مبلغ به ارز رویداد |
| `currency` | string | |
| `exchangeRateToBase` | decimal string | |
| `amountInBase` | decimal string | `amount × rate` — برای گزارش یکپارچه |
| `accountId` | UUID nullable | اگر رویداد روی حساب بانکی اثر دارد |
| `relatedFeature` | RelatedFeature | |
| `relatedId` | UUID | PK جدول دامنه (مثلاً inv_crypto_transactions.id) |
| `businessDate` | date | |
| `memo` | string nullable | |
| `isVoided` | boolean | |
| `createdAt` | timestamp UTC | |

### گزارش‌گیری — فقط یک لایه (ضد 2×)

**قانون اجباری برای همه Reports / Dashboard / Net Worth cashflow:**

```text
SoT گزارش میان‌فیچری = journal lines (`accountId` + amountInBase)؛ گروه‌بندی اختیاری با accountClass مشتق
```

- `exp_transactions` / `inc_transactions` / domain ledgers → **UI detail و rebuild دامنه**، نه جمع دوباره در گزارش کلی
- ممنوع: `SUM(exp) + SUM(journal expense)` در یک متریک
- **Must برای API گزارش عمومی:** `getFinancialReport` / `vw_financial_report` **فقط** از `fin_journal_entries` می‌خواند
- Domain tables (`exp_*`, `inc_*`, …) فقط در detail screens همان فیچر یا rebuild — نه در aggregator گزارش کلی
- ESLint/architecture test پیشنهادی: ممنوع import SUM از exp+journal در یک report module
- گزارش تخصصی دامنه (مثلاً فقط P&L یک holding) از Domain ledger همان فیچر — جدا برچسب بخورد

### قوانین لایه‌ها (ضد Double-Counting)

| لایه | چیست | Source of Truth برای چه |
|------|------|-------------------------|
| **Domain Ledger** | `inv_*_transactions`, `ln_transactions`, `inc_*`, `exp_*`, … | quantity، units، cost basis، loan portions، P&L دامنه همان asset |
| **Cash Ledger** | `acc_transactions` (+ cash brokerage/platform tables) | فقط جابه‌جایی پول بانکی/نقدی حساب |
| **Accounting Journal** | `fin_journal_entries` | گزارش میان‌فیچری، جریان وجوه یکپارچه، audit دو طرفه |
| **Snapshot** | `currentBalance`, holding qty، `cashBalance`، … | **فقط Projection** — مشتق از Domain/Cash ledger؛ هرگز SoT گزارش |

**قانون طلایی گزارش:** هر رویداد اقتصادی **یک‌بار** از Journal (یا از Domain برای متریک تخصصی) شمرده می‌شود — نه Journal+Domain+acc با هم در یک مجموع.

### طبقه‌بندی حساب (Double-Entry سبک)

هر atomic op حداقل **دو** ردیف journal با `accountClass` و `direction` متوازن از نظر `amountInBase` می‌نویسد:

| فیلد اضافه | نقش |
|------------|-----|
| `accountClass` | WHAT — طبقه حساب (بالا) |
| `lineKind` | WHY — علت خط (fx_rounding ≠ fx_gain) |
| `direction` | `debit` \| `credit` |
| `amountInBase` | Σ debit = Σ credit در همان `operationId` |

مثال BUY BTC با USDT + fee USDT:
```text
Dr crypto_asset     amountInBase = cost of BTC
Cr cash             amountInBase = USDT spent (quote)
Dr trading_fee      amountInBase = fee
Cr cash             amountInBase = fee
```
(اگر cash داخلی صرافی است نه بانک، `accountId` null و `accountClass=cash` با memo exchange؛ `acc_transactions` نوشته **نمی‌شود**.)

### قوانین
1. جداول فیچر = جزئیات دامنه (units، NAV، portions، …).
2. `fin_journal_entries` = SoT گزارش میان‌فیچری و Net movement یکپارچه.
3. `acc_transactions` = Cash/Bank ledger؛ فقط وقتی پول **حساب بانکی** جابه‌جا می‌شود.
4. Snapshot = Projection؛ rebuild از Domain/Cash ledger.
5. بدون journal متوازن، atomic op fail.
6. گزارش Expense بانکی از `acc`/`exp` یا journal `accountClass=expense` — **نه** جمع همزمان هر دو.

```text
Domain row(s)
 + fin_journal_entries (متوازن، الزامی)
 + acc_transactions (فقط bank cash)
 + snapshots (projection)
→ COMMIT → persist
```

### ماتریس SoT محاسبات

| متریک | Source of Truth |
|--------|-----------------|
| Cash balance حساب بانکی | `acc_transactions` (rebuild) |
| Brokerage/platform cash | ledger نقدی همان فیچر |
| Holding qty / cost basis / avg | Domain `inv_*_transactions` (+ CA) |
| Realized P&L دارایی | Domain ledger همان asset |
| Net Worth | Portfolio API: assets از holdings×price + bank cash − loans؛ **نه** جمع خام journal+domain |
| Expense/Income کاربر | `exp_*` / `inc_*` (isVoided=false) |
| Tax paid | `tax_*` + acc tax types |
| Cross-feature cashflow report | `fin_journal_entries` با فیلتر accountClass |

---

## سلسله‌مراتب قطعی نوشتن (ضد drift)

در **یک** `runAtomicFinancialOperation`:

```text
1. Domain feature rows (SoT جزئیات: qty, loan portion, …)
2. fin_journal_entries متوازن (SoT میان‌فیچری)
3. acc_transactions فقط اگر bank cash جابه‌جا شود (SoT cash بانکی)
4. Snapshots = تابع خالص از (1) یا (3) — همان عدد محاسبه‌شده یک‌بار
```

| سؤال | جواب |
|------|------|
| qty holding از کجا؟ | Domain ledger → snapshot کپی نتیجه rebuild/apply |
| موجودی بانک؟ | Σ acc_transactions → currentBalance |
| گزارش Expense؟ | exp_* یا journal expense — نه هر دو |
| Net Worth؟ | Portfolio از live inputs |

**ممنوع:** سه منبع را «authoritative موازی» خواندن در یک گزارش.

### Snapshot derivation
```text
newBalance = f(previousCanonical, txEffect)
balanceAfterTransaction = newBalance  // همان مقدار
currentBalance = newBalance           // همان مقدار
```
نه دو فرمول جدا برای `balanceAfter` و `currentBalance`.

### Fee روی acc_transactions

| فیلد | معنی |
|------|------|
| `amount` | **اصل حرکت** بدون fee (مثلاً برداشت ۱۰۰؛ amount=100) |
| `feeAmount` | کارمزد جدا (مثلاً ۵) |
| اثر روی موجودی | برای withdrawal: `−amount − feeAmount` (اگر fee از همین حساب) |

Journal:
```text
Cr cash  amount
Cr cash  feeAmount   (یا یک خط مجموع با split در journal lines)
Dr expense/fee  feeAmount
```

**Invariant:** `amount` هرگز «شامل fee» و همزمان `feeAmount` پر نیست — در آن صورت double deduction. Validate: اگر fee از حساب کم می‌شود، `cashDelta = −(amount+fee)` یک‌بار.

### Transfer — دروازه اجرا
قانون accounting-neutral در مستند است؛ **تا fixture `bank_transfer_neutral` در CI سبز نشود**، feature transfer «تأییدشده» اعلام نمی‌شود (همان مرز docs vs runtime).

---

## مدل مرکزی SoT (یکجا — بر همه feature docs مقدم است)

| داده | نقش | mutable؟ | چگونه به‌روز می‌شود |
|------|-----|----------|---------------------|
| Domain ledger (`inv_*_transactions`, `ln_transactions`, `inc_*`, `exp_*`, …) | **SoT جزئیات دامنه** | فقط append + void/reversal | atomic op |
| Cash ledger (`acc_transactions`) | **SoT پول بانکی** | همان | فقط وقتی bank cash جابه‌جا شود |
| Journal (`fin_journal_entries`) | **SoT میان‌فیچری / audit دوطرفه** | append + void | هر atomic op |
| Snapshot (holding qty, currentBalance, remainingBalance, …) | **Projection** | بله | **فقط** از خروجی یک محاسبه از ledger در همان op یا rebuild — نه «حقیقت موازی» |
| port_snapshots | cache تاریخی UI | بله | derived |

**قانون:** در یک گزارش، برای یک متریک فقط **یک** ستون SoT خوانده می‌شود. Snapshot هرگز expected در reconcile نیست.

جریان نوشتن (تکرار الزامی):
```text
validate → domain rows → journal → acc (if cash) → derive snapshots from same numbers → COMMIT → persist → emit
```

### Polymorphic — enforceable application contract

```text
registry: RelatedFeature → { table, idColumn }
before COMMIT:
  assert relatedFeature ∈ RelatedFeature enum
  assert EXISTS (SELECT 1 FROM registry[relatedFeature].table WHERE id = relatedId)
  else reject op
reconcileOrphans() scheduled + on demand
```

بدون این validate، نوشتن related* ممنوع است. FK SQL روی polymorphic ممکن نیست — این جایگزین اجباری است.

---

