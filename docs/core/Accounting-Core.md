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
