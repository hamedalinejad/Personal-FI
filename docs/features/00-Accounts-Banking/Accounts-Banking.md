# فیچر: Accounts & Banking

## توضیح کلی
مدیریت حساب‌های بانکی واقعی (جاری، پس‌انداز، سپرده و غیره).  
صندوق نقدی پلتفرم‌های سرمایه‌گذاری، کیف پول رمزارز و صرافی در فیچرهای Investment مدیریت می‌شوند — **نه** در این فیچر.

## Business Rules

1. موجودی حساب نمی‌تواند منفی شود (حساب اعتباری خارج از نسخه ۱).
2. ارز حساب (`currency`) ثابت است؛ انتقال فقط بین حساب‌های **هم‌ارز** مجاز است مگر مسیر تبدیل صریح (نسخه ۱: هم‌ارز اجباری).
3. انتقال وجه = دو ردیف `acc_transactions` (transfer-out + transfer-in) در یک `runAtomicFinancialOperation`.
4. نام حساب یکتا است (`UNIQUE(name)` در میان حساب‌های غیرآرشیو).
5. حذف فیزیکی حساب ممنوع — فقط `isArchived = true`؛ آرشیو فقط اگر `currentBalance` (ledger) صفر باشد.
6. ردیف‌های `acc_transactions` پس از ثبت از نظر مبلغ/حساب/نوع immutable هستند؛ اصلاح فقط با void + reversal.
7. `currentBalance` و `balanceAfterTransaction` **snapshot مشتق**اند. منبع حقیقت = مجموع اثر ledger غیرvoid.
8. هر عملیات مالی این فیچر باید:
   - `BEGIN` … `COMMIT` داخل SQLite
   - حداقل یک ردیف `fin_journal_entries` (طبق `core/db/db.md`)
   - سپس `await persist` (Write-to-temp-then-swap) قبل از UI «ثبت شد»
9. `relatedFeature` + `relatedId` قبل از COMMIT validate می‌شوند (وجود هدف).

## Domain Entities

### ۱. Account — `acc_accounts`

| فیلد | نوع | توضیح |
|------|-----|--------|
| `id` | UUID | PK |
| `name` | string | یکتا بین غیرآرشیوها |
| `accountNumber` | string nullable | |
| `iban` | string nullable | |
| `cardNumber` | string nullable | |
| `branchName` | string nullable | |
| `bankName` | string nullable | |
| `currency` | string | کد ارز حساب |
| `accountType` | enum | `current` \| `savings` \| `term_deposit` \| `other` |
| `currentBalance` | decimal string | snapshot |
| `isArchived` | boolean | |
| `notes` | text nullable | |
| `createdAt` / `updatedAt` | datetime UTC | |

### ۲. Transaction — `acc_transactions`

| فیلد | نوع | توضیح |
|------|-----|--------|
| `id` | UUID | PK |
| `date` | datetime | زمان رویداد |
| `businessDate` | date nullable | روز کسب‌وکار در صورت نیاز گزارش |
| `type` | `TransactionType` | فقط از `core/types/types.md` |
| `amount` | decimal string | همیشه > 0؛ جهت از `type` |
| `feeAmount` | decimal string nullable | >= 0 |
| `feeCurrency` | string nullable | |
| `exchangeRateToBase` | decimal string | ارز حساب → baseCurrency در لحظه ثبت |
| `balanceAfterTransaction` | decimal string | snapshot مشتق؛ authoritative نیست |
| `accountId` | UUID | FK RESTRICT |
| `description` | string nullable | |
| `relatedFeature` | `RelatedFeature` nullable | |
| `relatedId` | UUID nullable | |
| `isVoided` | boolean | |
| `relatedTransactionId` | UUID nullable | reversal → اصل |
| `operationId` | UUID | مشترک در یک atomic op |
| `source` | enum | `ui` \| `import` \| `system` \| `migration` |
| `createdAt` / `updatedAt` | datetime UTC | |

**اثر روی مانده (ساده):**
- انواع `deposit-*` / `transfer-in` → +amount (− fee در صورت کسر از حساب)
- انواع `withdrawal-*` / `transfer-out` → −amount (− fee)

> سرمایه‌گذاری: `deposit-investment` / `withdrawal-investment` با `relatedFeature` یکی از `crypto_exchange` | `stocks_iran` | `fif` | `metals` و `relatedId` به جدول دامنه همان فیچر.

## APIهای داخلی

### Account
- `createAccount(data)`
- `updateAccount(id, data)` — فقط metadata (نه دستکاری مستقیم balance)
- `getAllAccounts(includeArchived?)`
- `getAccountById(id)`
- `archiveAccount(id)` — فقط اگر ledger balance = 0
- `getCurrentBalance(accountId, mode: 'cached' | 'ledger' = 'cached')`
- `getAvailableBalance(accountId)` = ledger/cached balance − Σ چک‌های پرداختی pending روی حساب (هشدار UI؛ قید سخت نیست)
- `rebuildAccountFromLedger(accountId)` — snapshot را از ledger بازسازی می‌کند
- `reconcileAccount(accountId)` → `ReconcileResult`

### Transaction
- `createTransaction(data)` — معمولاً از فیچرهای دیگر صدا زده می‌شود نه مستقیم از UI عمومی
- `updateTransactionMetadata(id, data)` — فقط description و فیلدهای غیرمالی
- `voidTransaction(id, reason)` — void + در صورت نیاز reversal طبق caller
- `getTransactionsByAccount(accountId, filters)`
- `getTransactionById(id)`

### Transfer
- `transferBetweenAccounts({ sourceAccountId, targetAccountId, amount, description?, date? })`
  1. validate هم‌ارز بودن currency و موجودی کافی (mode ledger)
  2. یک `operationId`
  3. INSERT transfer-out + transfer-in + journal entries + به‌روز snapshotها
  4. persist

## روابط
- **Income / Expense / Cheque / Loan / Tax / Investment**: ایجاد `acc_transactions` با type و related مناسب
- **Currency**: `exchangeRateToBase` از نرخ لحظه یا ورودی کاربر
- **Reports / Dashboard**: خواندن ledger و snapshot

## نکات پیاده‌سازی
- همه مبالغ `string` decimal در مرز TypeScript
- `PRAGMA foreign_keys = ON`
- تست: transfer atomic؛ void؛ archive با balance غیرصفر باید fail شود

---

## انتقال بین حساب‌ها — Accounting-neutral

`Bank A → Bank B` فقط **تغییر محل دارایی** است.

| مجاز | ممنوع |
|------|--------|
| دو ردیف cash ledger (transfer-out / transfer-in) | `inc_transactions` / `exp_transactions` |
| journal: Dr destination bank account / Cr source bank account (`lineKind` transfer/cash) | ثبت به‌عنوان Income یا Expense |
| fee جدا → journal line `lineKind=fee` روی expense fee account | شمردن اصل مبلغ انتقال در گزارش درآمد/هزینه |
| Σ amountInBase debit=credit روی cash | Realized P&L / profit از انتقال |

```text
Dr cash (B)   amount
Cr cash (A)   amount
// optional fee:
Dr trading_fee or bank_fee   fee
Cr cash (A or B)             fee
```

گزارش‌های `getTotalIncome` / `getTotalExpense` **هرگز** typeهای transfer را جمع نمی‌کنند.

### Invariant fee
`amount` = اصل؛ `feeAmount` جدا؛ `cashDelta = ±amount ± fee` طبق type — یک‌بار. جزئیات در `db.md`.

---

## نقش `acc_transactions`

**فقط Cash Ledger** (اثر روی بانک/نقد واقعی کاربر).

- Universal financial truth = **`fin_operations`** (+ journal)
- Income/Expense/Loan/Investment/Cheque به cash وصل می‌شوند از طریق operation + links — نه با تبدیل `acc_transactions` به جدول همه‌چیز

**Uniqueness:** روی `id` / IBAN / accountNumber / externalId — **نه** name (دو «بانک ملت» مجاز).

## فیلدهای ایران (Must برای banking)

| Field | |
|-------|--|
| `shaba` / IBAN | |
| `cardNumberHash` | نه شماره خام |
| `bankNameIr` | ملت، سپه، … |
| `accountType` | qarz \| sep \| modat \| jame \| other |
