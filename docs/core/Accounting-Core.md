> **SUPERSEDED as independent authority** — use docs/PRODUCT.md, ARCHITECTURE.md, FINANCIAL-CORE.md, DATA-MODEL.md, API.md, REPORTING.md, OFFLINE-RELEASE.md, DEVELOPMENT.md, modules/*.

> **P0-VOCABULARY LOCK:** Field names = `docs/core/db/schema.sql` + `P0-SCHEMA-VOCABULARY-LOCK.md` only.  
> Obsolete: `role`, `type` (as account column), `isVoided`, `operation_id` on journal lines, ghost `inv_*_*_transactions` cash tables.

> **P0:** `Accounting Core ≠ Accounting UI`. Journal پشت‌صحنه برای صحت مالی؛ UI دفترکل/تراز آزمایشی اختیاری است. ببین `Feature-Independence-Contract.md` · `Module-Architecture.md`.

# Accounting Core — قلب واقعی سیستم (نه ERP)

> **P0 Cash:** تنها SoT مانده نقد = `fin_accounts` + `fin_journal_lines`.  
> Bank / Exchange / Broker / Wallet / Cashbox همگی Account هستند.  
> `inv_crypto_cash` و cacheهای دامنه projection‌اند نه ledger موازی.  
> جزئیات: `Canonical-Cash-Model.md`.


## اصل معماری

Featureها **زیرسیستم مالی موازی** نیستند. هر Feature فقط Domain تخصصی + adapter است؛ حقیقت مالی میان‌فیچری از **Accounting Core** می‌گذرد.

```text
        Feature (Crypto / Stocks / Loan / Expense / …)
                         ↓
              Financial Operation (atomic)
                         ↓
                   Accounting Core
              fin_accounts · journal entry/lines
                         ↓
            Domain Projection / Snapshot (cache)
```

**ممنوع:** Crypto/Stocks/Loan/Expense هر کدام «سیستم مالی کامل» جدا بدون journal متوازن و بدون `operationId` مشترک.

# Accounting Core — ساده ولی کامل (نه ERP)

## چرا فقط `accountClass` کافی نیست؟

`accountClass = cash` می‌گوید «پول نقد/بانک»؛ نمی‌گوید **کدام** حساب:

```text
Dr cash / Cr income     ← کلاس کلی
Dr بانک ملت / Cr حقوق   ← حساب واقعی
```

بدون حساب مشخص: Trial Balance، دفتر معین، مانده بانک ملت در برابر ملی، اشخاص، T-account، و closing/opening دقیق ضعیف می‌شود.

## مدل هدف (کوچک)

```text
fin_accounts          حساب واقعی (chart of accounts)
fin_operations        عملیات کاربر (Command atomic)
fin_journal_entries   سند حسابداری (header) — 1 per operation معمول
fin_journal_lines     خطوط Dr/Cr با accountId
```

**Canonical — بدون مدل موازی:**  
`fin_journal_entries` ≠ خط.  
`fin_journal_lines` ≠ سند.  
هر خط **باید** `accountId → fin_accounts` داشته باشد.

### `fin_accounts` — **Must Have از v1 (نه Future)**

حداقل ستون‌ها: `id, code, name, account_kind, currency, parent_id, is_archived, status, role, reconciliation_status, external_ref_json, created_at, updated_at`

Seed خودکار: «بانک ملت» → `1101 بانک ملت`؛ خرید BTC → account دارایی مربوط. کاربر UI دوطرفه نمی‌بیند — complexity در Engine.

### `fin_accounts`

| فیلد | نقش |
|------|-----|
| `id` | UUID |
| `code` | کد اختیاری (مثلاً 1101) |
| `name` | «بانک ملت»، «هزینه خوراک» |
| `account_kind` | `asset` \| `liability` \| `equity` \| `income` \| `expense` |
| `currency` | ارز حساب (یا multi با rate روی line) |
| `parent_id` | nullable — گروه ساده |
| `is_archived` | boolean |
| `status` | `active` \| `inactive` \| `closed` |
| `role` | نقش سیستمی: `checking` \| `savings` \| `brokerage` \| `credit_card` \| `wallet` \| `cash_box` \| … |
| `reconciliation_status` | `unreconciled` \| `matched` \| `partial` \| `stale` \| null |
| `external_ref_json` | JSON برای ارجاع خارجی |

**Seed:** هنگام ساخت حساب بانکی / دسته هزینه / وام، سیستم **خودکار** `fin_accounts` می‌سازد. کاربر عادی فقط «بانک ملت» و «خوراک» را می‌بیند — نه ERP.

### `fin_journal_entries` (سند)

| فیلد | نقش |
|------|-----|
| `id` | UUID سند |
| `operation_id` | FK → fin_operations |
| `business_date` | |
| `memo` | |
| `post_state` | `draft` \| `posted` \| `void` (mirrors operation status) |
| `reference_number` | اختیاری |
| `fiscal_period_id` | اختیاری |
| `created_at` | |

معمولاً **یک entry per operation**؛ reversal = operation + entry جدید.

### `fin_journal_lines` (خطوط)

| فیلد | نقش |
|------|-----|
| `id` | |
| `entry_id` | **FK به fin_journal_entries — اجباری** |
| `account_id` | **FK به fin_accounts — اجباری** |
| `side` | `debit` \| `credit` |
| `amount` | مبلغ |
| `currency` | ارز خط |
| `amount_in_base` | مبلغ به ارز پایه |
| `exchange_rate_to_base` | نرخ تبدیل |
| `conversion_path` | JSON وقتی چندین مسیر تبدیل وجود دارد |
| `line_number` | شماره خط (1-based) |
| `line_kind` | WHY: `fee` \| `tax` \| `principal` \| `interest` \| `fx` \| `fx_gain` \| `fx_loss` \| `adjustment` \| `other` |
| `memo` | توضیحات |
| `reference` | ارجاع |
| `source_type` | `ui` \| `api` \| `import` \| `migration` \| `system` \| `reconciliation` |
| `source_reference` | ارجاع منبع |

```text
Σ amount_in_base debit = credit per operation_id
```

> **نکته مهم:** `operation_id` روی `fin_journal_lines` **وجود ندارد**. این فیلد از طریق `entry_id → fin_journal_entries.operation_id` مشتق می‌شود. تکرار `operation_id` در هر خط فقط وقتی می‌تواند معتبر باشد که تیم آن را به صورت عمداً denormalize کرده و محدودیت‌های سازگاری تعریف کرده باشد.

### مثال UI ساده

«۵۰۰٬۰۰۰ تومان مواد غذایی از بانک ملت»

```text
Dr  هزینه خوراک (expense account)
Cr  بانک ملت (asset account)
```

کاربر دو فیلد انتخاب می‌کند؛ journal را سیستم می‌نویسد.

## سلسله‌مراتب (بدون دور ریختن معماری فعلی)

```text
Financial Operation (fin_operations + commandHash)
        ↓
Domain Ledger (inv_*, ln_*, exp_*, …)
        ↓
Accounting Journal (lines → fin_accounts)
        ↓
Cash / Investment / Loan projections (acc_transactions, snapshots)
        ↓
Persist
```

- Domain ledger جزئیات تخصصی (units، NAV، portions) را نگه می‌دارد  
- Journal **حساب به حساب** را نگه می‌دارد  
- `accountClass` برای گزارش سریع/گروه‌بندی؛ **SoT خط = accountId**

## گزارش‌هایی که ممکن می‌شود

- Trial Balance / مانده هر `fin_accounts`
- دفتر معین یک بانک یا یک شخص
- انتقال دارایی ↔ دارایی بدون قاطی شدن با income/expense
- Opening: Dr asset account / Cr opening_equity account

## فاز پیاده‌سازی

| فاز | |
|-----|--|
| مستند/Schema | همین سند — Must برای طراحی |
| MVP v1.0 | حداقل: هر bank account و expense/income category و loan → یک fin_accounts؛ journal lines با accountId |
| بعد | سلسله‌مراتب parentId، اشخاص، گزارش T-account غنی |

**ممنوع:** بازگشت به journal فقط با enum کلاس بدون accountId برای ops جدید پس از این قرارداد.
---

## SoT حسابداری (این فایل + ارجاعات)

این سند **نقطه ورود حسابداری** است. جزئیات تخصصی در فایل‌های زیر (پراکنده خواندن بدون این فهرست ممنوع برای implementer جدید):

| حوزه | سند |
|------|-----|
| Chart of Accounts + journal lines | **همین فایل** |
| Financial Operation / Reversal / adapter | `Canonical-Financial-Operation.md` |
| Forbidden + release invariants | `Financial-Invariants.md` |
| Opening balance | `Opening-Balance.md` |
| Account layers (bank vs COA vs party) | `Account-Layers.md` |
| Parties | `Parties.md` |
| FX / currency | Feature Currency + CFO |
| Reconciliation / repair | `db/04-reconciliation-integrity.md` |
| Audit | `db/06-migration-backup-audit.md` |
| Cost basis | `Cost-Basis-Engine.md` |
| Schema tables | `db/01-schema-tables.md` |

### معماری ماژولار (حفظ)

```text
UI → Feature Public API → Domain → Core Financial Operation → DB
```

Feature A جدول Feature B را مستقیم نمی‌نویسد.

### Amount Storage (تکرار SoT)

DB: `amount` / `quantity` / `rate` / `price` = **TEXT decimal string**.  
Minor unit فقط conversion در مرز UI/Bank import.

---

## جایگاه در محصول

```text
                 PERSONAL-FI
                      │
       ┌──────────────┴──────────────┐
Financial Accounting          Investment Management
 (Accounts, Income, Expense…)  (Crypto, Stocks, FIF, Metals)
       └──────────────┬──────────────┘
                      │
              Accounting Core
           Journal / fin_accounts
```

Accounting Core = حقیقت مالی میان‌فیچری؛ Investment = specialized subledger + همان Operation/Journal.

---

## بدون صفحه Navigation جدا

`Accounting Core` = backend/domain capability.

کاربر آن را در **Transactions، Accounts، Reports** تجربه می‌کند — نه مسیر `/accounting`.

**تأکید:** `accountClass` فقط classification است؛ Journal خط همیشه **`accountId` → fin_accounts** (مثلاً ۱۰۰۱ بانک ملت).

---

## Journal soft lifecycle

| Field | |
|-------|--|
| `post_state` / void via reversal | حذف سخت DELETE ممنوع |
| `reconciledAt` | nullable — پس از reconcile موفق |
| `idempotencyKey` / operationId | روی fin_operations |

لایه‌ها: `fin_operations` → `fin_journal_entries` → `fin_journal_lines` → domain `*_transactions` فقط **ارجاع operationId** · snapshots مشتق.
**ممنوع:** آپدیت مستقیم snapshot بدون journal.

---

## سه مفهوم جدا از یک Financial Operation

| مفهوم | معنی | مثال |
|--------|------|------|
| **Economic Event** | رویداد اقتصادی دامنه | خرید سهم، شناسایی سود |
| **Cash Movement** | حرکت نقد | Cash ↓ |
| **Accounting Entry** | خطوط journal | Dr Asset / Cr Cash |

- کارمزد: Expense + Cash (هر دو)
- Unrealized P&L: اقتصادی/ارزشیابی — **بدون** حرکت نقد الزامی
- همه از یک `operationId` وقتی ثبت می‌شوند

---

فرمول‌های قفل‌شده: **`Accounting-Calculation-Invariants.md`** (FX، WAC، وام، journal).
