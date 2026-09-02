# Canonical Cash Model (P0)

**قانون مطلق:** برای یک پول نقد، **دو سیستم balance مستقل ممنوع است.**

## Canonical Cash

```text
fin_accounts          ← تعریف حساب نقد (بانک، صرافی، کارگزاری، کیف، صندوق نقد)
fin_journal_lines     ← تنها منبع حقیقت مانده نقد (rebuild با Decimal Engine)
```

هر «جیب پول» یک ردیف `fin_accounts` است، مثلاً:

| code (نمونه) | name | systemRole | currency |
|--------------|------|------------|----------|
| 1000 | Bank - Mellat - IRR | `bank_cash` | IRR |
| 1100 | Bank - Saman - IRR | `bank_cash` | IRR |
| 2000 | Binance - USDT | `exchange_cash` | USDT |
| 2100 | Nobitex - IRR | `exchange_cash` | IRR |
| 2200 | Brokerage - IRR | `broker_cash` | IRR |
| 3000 | Cashbox - IRR | `cashbox` | IRR |
| 3100 | Wallet soft - USDT | `wallet_cash` | USDT |

```text
Bank Cash
Exchange Cash
Brokerage Cash
Wallet Cash
Cashbox
  └── همگی Account در fin_accounts — نه ledgerهای balance موازی
```

## مانده نقد چگونه خوانده می‌شود؟

```text
balance(accountId) =
  DecimalEngine.sum(fin_journal_lines where accountId)
  // هرگز: SELECT SUM(amount) در SQL روی TEXT
  // هرگز: خواندن inv_crypto_cash.balance یا acc_accounts.currentBalance به‌عنوان SoT
```

`currentBalance` روی هر جدول دامنه = **SNAPSHOT/cache**؛ بعد از هر atomic op از journal (یا از domain events که همان op را به journal نوشته‌اند) rebuild می‌شود.

## نقش Domain جداول نقد

| جدول | نقش مجاز | نقش ممنوع |
|------|----------|-----------|
| `acc_transactions` | Event log عملیاتی بانک (UX، فیلتر، لینک به cheque/loan) | balance مستقل جدا از journal |
| `inv_crypto_cash` | **اختیاری:** projection / metadata (exchangeId، label، لینک) | ledger مستقل با balance SoT |
| `inv_crypto_exchange_transactions` | Eventهای deposit/withdraw مرتبط با صرافی | نوشتن balance بدون journal line |
| brokerage cash table (اگر باشد) | همان: event یا projection | balance موازی |

اگر `inv_crypto_cash` نگه داشته شود:

```text
inv_crypto_cash.finAccountId  → FK اجباری به fin_accounts.id
inv_crypto_cash.balance       → DERIVED/SNAPSHOT فقط
write path: همیشه runAtomicFinancialOperation → journal lines روی همان finAccountId
```

**ترجیح v1:** اصلاً balance روی `inv_crypto_cash` ذخیره نکن؛ فقط metadata + `finAccountId`.

## Atomic write path (اجباری)

```text
User action (deposit / withdraw / buy settlement / transfer cash)
        ↓
Domain event row (اختیاری برای UX تخصصی)
        ↓
fin_journal_entries + fin_journal_lines  (الزامی — همان operationId)
        ↓
rebuild cache balances (fin_accounts snapshot / domain projection)
        ↓
persist
```

**ممنوع:**

```text
update inv_crypto_cash.balance = 1000
// بدون journal line معادل
```

**ممنوع:**

```text
update fin_accounts.currentBalance = 1000
// بدون journal lines که همان مانده را بسازند
```

## تفکیک Cash vs Asset

| مفهوم | SoT |
|--------|-----|
| نقد / settlement money (IRR, USDT به‌عنوان cash صرافی) | `fin_accounts` + `fin_journal_lines` |
| دارایی سرمایه‌گذاری (BTC qty، سهام، units صندوق، طلا mg) | Domain asset ledger (`inv_*_transactions`) |
| USDT به‌عنوان **token سرمایه‌گذاری** (holding با cost basis) | `inv_crypto_transactions` + `instrumentId` — نه exchange cash account |

نقش USDT از context تعیین می‌شود (طبق Crypto spec): settlement cash → cash account؛ asset position → instrument holding.

## Reconcile

| Drift | معنی |
|-------|------|
| domain projection ≠ journal balance همان `finAccountId` | **باگ یکپارچگی** — journal برنده برای گزارش نقد؛ projection باید rebuild شود |
| دو `fin_accounts` برای یک جیب فیزیکی بدون دلیل | مدل اشتباه — ادغام |

## ارتباط با Asset Ledgers

این قانون **فقط Cash** است. Quantity دارایی‌ها همچنان:

```text
inv_crypto_transactions / inv_stocks_* / inv_fif_* / inv_metals_*
```

ولی **پول نقد مرتبط** (پرداخت خرید، واریز، برداشت) همیشه از/به یک `fin_accounts` نقد می‌گذرد و در همان atomic op در journal ثبت می‌شود.

## اسناد مرتبط

- `Source-of-Truth-Matrix.md` — به‌روز شده با این قانون
- `Accounting-Core.md` — chart of accounts
- `Canonical-Ownership-Matrix.md`
- `Field-Level-Data-Ownership-Matrix.md`
- `db/03-journal-sot-reporting.md`


---

## P0-091 — Ownership split

| Cash kind | Owner SoT | Snapshot |
|-----------|-----------|----------|
| Bank / user cash accounts | Accounts + `fin_journal_lines` | projection only |
| Venue cash (brokerage, exchange, metals platform) | Venue feature ledger/journal for that venue account | projection only |

Both sides linked only via Financial Operation + CashSettlementPort. Two independent balance systems for the same money = forbidden.

## P1 cash ownership (24)

Feature cash tables are projections with optional `finAccountId`; SoT remains fin_accounts + journal_lines. See `P1-GLOBAL-CONTRACTS.md` §24.

