# Canonical Financial Operation Model

## الگو (همه Featureها)

```text
User/Command
  → Public Feature API
  → runAtomicFinancialOperation(operationId)
       1. validate
       2. Domain ledger rows (feature tables)  [SoT دامنه]
       3. fin_journal_entries (double-entry)   [SoT حسابداری]
       4. acc_transactions (if bank cash)      [SoT نقد بانکی]
       5. derive snapshots from (2)/(4) only
       6. COMMIT sql.js
  → persist IndexedDB (state machine)
  → fin_audit_log (if required)
  → DomainEventBus.emit (persisted phase only)
```

**ممنوع:** هر Feature مسیر موازی (مثلاً فقط snapshot بدون journal، یا cash بدون domain).

## operationId

| فیلد | نقش |
|------|-----|
| `operationId` | **canonical** گروه همه ردیف‌های یک عمل اقتصادی |
| `tradeGroupId` / `transferGroupId` | metadata دامنه؛ همیشه به همان operationId یا زیرمجموعه |
| `accountTransactionId` | FK به یک ردیف cash؛ نه جایگزین operationId |
| `relatedId` | polymorphic link؛ نه شناسه عمل |

هر BUY، C2C، reinvest، transfer، payLoan، void/reversal یک `operationId` جدید (یا برای reversal: operation جدید با `reversesOperationId`).

## Journal Schema canonical

```text
fin_operations (header, one per atomic op):
  id (= operationId)
  baseCurrencyAtOperation   // **قفل** — مثلاً IRR حتی اگر بعداً preference عوض شود
  businessDate
  sourceFeature
  reversesOperationId?
  conversionPath?           // JSON legs [{from,to,rate,asOf,rateId?}] — Must اگر >1 hop
  createdAt

fin_journal_entries:
  id, operationId, lineNo
  accountClass, direction (debit|credit)
  amount, currency
  exchangeRateToBase        // نسبت به baseCurrencyAtOperation همان operation
  amountInBase              // semantic = به واحد baseCurrencyAtOperation
  accountId? (bank)
  relatedFeature?, relatedId?
  businessDate, memo
  isVoided, reversesEntryId?
  createdAt
```

Σ amountInBase debit = credit per operationId **در همان baseCurrencyAtOperation**.

**Invariant:** با تغییر `cur_currency_preferences.baseCurrency`، journal تاریخی بازنویسی نمی‌شود؛ گزارش cross-base با تبدیل از base قفل‌شده + rates تاریخی.


اختیاری آینده: `fin_accounts` chart of accounts؛ v1 از `accountClass` enum کافی است.

## Core Reversal

```ts
reverseOperation(operationId: UUID, reason?: string): Promise<newOperationId>
```

1. Load all domain + journal + acc rows for operationId (isVoided=false)
2. Feature adapter `buildReversalPlan(op)` → domain inverse rows
3. Void or inverse journal lines; void linked acc or reverse cash
4. Rebuild affected snapshots
5. audit + emit

Feature-specific reversal docs فقط **plan adapter** هستند؛ موتور `core/reversal` است.

## Core Reconciliation

قبلاً در `db.md` — همه `reconcile*` از `ReconcileAdapter` + نتیجه استاندارد + repair audited.

## Snapshot Policy مرکزی

همهٔ `currentBalance`, holding qty, `cashBalance`, `remainingBalance`, `port_snapshots`:
**derived/cache**. Rebuild از ledger. هیچ گزارش SoT از snapshot تنها.

## Tax

Domain tx می‌تواند `linkedTaxEventId` داشته باشد.  
فیلدهای تکراری taxable metadata → ترجیحاً ردیف `tax_events` مرکزی (Tax feature SoT) + reference؛ duplicate full tax schema در هر investment table ممنوع در schema جدید.
