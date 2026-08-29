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
fin_accounts          chart of accounts (ساده)
fin_operations        همان atomic op فعلی
fin_journal_entries   header هر سند (اختیاری یک ردیف per op یا همان operation)
fin_journal_lines     خطوط بدهکار/بستانکار با accountId
```

v1 می‌تواند `fin_journal_entries` فعلی را به‌عنوان **خط** نگه دارد و فیلد `accountId` اضافه کند؛ یا rename مفهومی به lines. مهم: **هر خط به یک fin_accounts.id وصل است.**

### `fin_accounts`

| فیلد | نقش |
|------|-----|
| `id` | UUID |
| `code` | کد اختیاری (مثلاً 1101) |
| `name` | «بانک ملت»، «هزینه خوراک» |
| `type` | `asset` \| `liability` \| `equity` \| `income` \| `expense` |
| `parentId` | nullable — گروه ساده |
| `currency` | ارز حساب (یا multi با rate روی line) |
| `isActive` | |
| `systemRole` | نقش سیستمی: `bank_link` \| `broker_cash` \| `crypto_holding` \| `loan_liability` \| `opening_equity` \| `user` \| … |
| `linkedEntityType` / `linkedEntityId` | اختیاری: پیوند به `acc_accounts.id`، holding، loan |

**Seed:** هنگام ساخت حساب بانکی / دسته هزینه / وام، سیستم **خودکار** `fin_accounts` می‌سازد. کاربر عادی فقط «بانک ملت» و «خوراک» را می‌بیند — نه ERP.

### `fin_journal_lines` (یا همان entries با accountId)

| فیلد | نقش |
|------|-----|
| `id` | |
| `operationId` | FK به fin_operations |
| `accountId` | **FK به fin_accounts — اجباری** |
| `direction` | debit \| credit |
| `amount`, `currency`, `exchangeRateToBase`, `amountInBase` | |
| `lineKind` | WHY: fee, fx_rounding, asset, … |
| `accountClass` | **مشتق/کش** از `fin_accounts.type` + systemRole برای فیلتر سریع — نه جایگزین accountId |
| `relatedFeature`, `relatedId` | |
| `memo` | |

```text
Σ amountInBase debit = credit per operationId
```

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
