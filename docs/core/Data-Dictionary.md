# Data Dictionary

هدف: جلوگیری از اختلاف مستندات و گم‌شدن فیلد. هر فیلد مالی مهم باید اینجا (یا ضمیمه feature) با این ستون‌ها تعریف شود.

**Template columns:**  
`Field | Type | Nullable | Default | Unit | Precision | Currency | SoT | Derived? | Immutable? | FK | Unique? | Index? | Allowed | Since | Deprecated? | Migration | UsedBy | Notes`

---

## Core / Operation

| Field | Type | Null | Default | Unit | Prec | CCY | SoT | Der | Imm | FK | Notes |
|-------|------|------|---------|------|------|-----|-----|-----|-----|-----|-------|
| operationId | UUID TEXT | N | — | — | — | — | fin_operations | N | Y | — | idempotency key |
| commandHash | TEXT | N | — | — | — | — | fin_operations | N | Y | — | conflict detect |
| baseCurrencyAtOperation | TEXT | N | — | currency | — | base | op | N | Y | — | lock historical base |
| exchangeRateToBase (= basePerTransactionUnit) | TEXT decimal | Y | — | rate | Rate | — | op/tx/line | N | Y | 1 txCurrency in baseCurrency |
| amountInBase | TEXT decimal | N | — | money | Money | base@op | journal line | N | Y | **= amount × exchangeRateToBase** (basePerTxUnit); immutable after post |
| sourceType | ENUM TEXT | N | manual | — | — | — | domain row | N | Y* | — | *immutable after post |
| sourceReference | TEXT | Y | null | — | — | — | domain | N | Y* | — | file/batch ref |
| importBatchId | UUID | Y | null | — | — | — | import | N | Y | fin_import_batches | |
| sourceDocumentId | UUID | Y | null | — | — | — | docs | N | N | docs_documents | |

\* پس از post/commit مالی.

## Money / Quantity

| Field | Type | Null | Default | Unit | Prec | CCY | SoT | Der | Imm | Notes |
|-------|------|------|---------|------|------|-----|-----|-----|-----|-------|
| amount | TEXT decimal | N | — | money | CurrencyRecord | tx | domain/operation line | N | Y | positive magnitude; direction is separate |
| quantity | TEXT decimal | N | — | asset qty | instrument | — | domain | N | Y | |
| grossQuantity | TEXT decimal | Y | — | asset qty | instrument | — | domain | N | Y | crypto |
| netQuantity | TEXT decimal | Y | — | asset qty | instrument | — | domain | N | Y | after fee |
| feeQuantity | TEXT decimal | Y | 0 | asset qty | instrument | — | domain | N | Y | |
| price | TEXT decimal | Y | — | price | Price | quote | domain | N | Y | unit price |
| feeAmount | TEXT decimal | Y | 0 | money | Money | feeCCY | domain | N | Y | **preserved** even if breakdown exists |
| feeBrokerCommission | TEXT decimal | Y | 0 | money | | | domain | N | Y | stocks breakdown |
| feeExchange | TEXT decimal | Y | 0 | money | | | domain | N | Y | |
| feeTax | TEXT decimal | Y | 0 | money | | | domain | N | Y | transaction cost tax ≠ tax_events |
| feeOther | TEXT decimal | Y | 0 | money | | | domain | N | Y | |

## Derived / Snapshot (never report as SoT alone)

| Field | Type | Der | Imm | Rebuild from | Notes |
|-------|------|-----|-----|--------------|-------|
| averageBuyPrice | TEXT decimal | Y | N | ledger + cost engine | |
| totalInvested | TEXT decimal | Y | N | ledger | |
| currentBalance | TEXT decimal | Y | N | **fin_journal_lines on fin_accounts** | `acc_transactions` is an operational/event log, not the balance SoT |
| balanceAfterTransaction | TEXT decimal | Y | N | running calc from journal/domain ledger | snapshot only |
| remainingBalance | TEXT decimal | Y | N | ln_transactions | principal/portfolio policy |
| realizedPL / unrealizedPL | TEXT decimal | Y | N | cost engine + prices | |
| portfolioValue | TEXT decimal | Y | N | holdings+price+FX+cash journal−liabilities | |

## Identity / Accounts

| Field | Type | Null | SoT | FK | Notes |
|-------|------|------|-----|-----|-------|
| instrumentId | UUID | N | ref_instruments | ref_instruments.id | not symbol |
| accountId (journal) | UUID | N | fin_accounts | fin_accounts.id | canonical accounting account |
| partyId | UUID | Y | ref_parties | ref_parties.id | |
| symbol | TEXT | Y | display | — | mutable label |
| assetKey | TEXT | Y | derived/label | — | crypto convenience |

## Dates (see Date-Semantics-Matrix)

| Field | Type | Semantics |
|-------|------|-----------|
| createdAt | ISO UTC | system write time |
| eventAt | ISO UTC | when economic event occurred if known |
| businessDate | DATE | books / reporting day; **not** an ISO timestamp |
| settlementDate | DATE | cash settle (e.g. T+2); market/business calendar date |
| marketDate | DATE | market session date of price/trade |
| dueDate | DATE | obligation due |
| paymentDate | DATE | actual payment |
| fetchedAt | ISO UTC | price fetch wall clock |
| priceAsOf / rateDate | DATE/TS | valuation/FX as-of |

## Journal

| Field | Type | SoT | Notes |
|-------|------|-----|-------|
| journalEntryId | UUID | fin_journal_entries | header |
| line direction | debit\|credit | line | |
| lineKind | enum | line | WHY |
| accountClass | enum | denorm | not SoT |

---

**قانون:** فیلد مالی جدید بدون ردیف Dictionary + Migration Rule وارد schema نمی‌شود.

**Cash SoT rule (P0):** مانده هر حساب نقد از `fin_journal_lines` روی `fin_accounts` بازسازی می‌شود. `acc_transactions`, `inv_crypto_cash.balance` و سایر currentBalanceها فقط event/projection/snapshot هستند و هرگز SoT مستقل نیستند.

**Date rule (P0):** timestampها در UTC ذخیره می‌شوند؛ فیلدهای تقویمی `DATE` مانند `businessDate`, `settlementDate`, `dueDate`, `paymentDate`, `marketDate` معنای روزانه دارند و نباید به timestamp UTC تبدیلِ معنایی شوند.

**Standalone rule (P0):** `accountId`های حسابداری canonical به `fin_accounts` اشاره می‌کنند؛ لینک‌های integration مانند `accountTransactionId → acc_transactions` در editionهای بدون Accounts می‌توانند nullable باشند و شرط صحت domain نیستند.

Field-level owner/raw/derived: `docs/core/Field-Level-SoT.md`.

## Parties & external refs (CROSS-CUTTING §7–§8)

- Party identity: `ref_parties.id` only; payee/payer text = display snapshot.
- External IDs: namespaced `(sourceKind, providerId, namespace?, externalId)` — not a single global externalId.
