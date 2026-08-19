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

---

## FinancialOperationAdapter (قرارداد اجباری هر Feature)

موتور `runAtomicFinancialOperation` فقط این interface را صدا می‌زند — Feature حق ندارد SQL موازی بیرون از adapter بنویسد.

```typescript
interface FinancialOperationContext {
  operationId: string;
  baseCurrencyAtOperation: string;
  businessDate: string;
  command: unknown; // typed per feature command
}

interface FinancialOperationPlan {
  domainEntries: Array<{ table: string; row: Record<string, unknown> }>;
  journalEntries: Array<{
    accountClass: string;
    direction: 'debit' | 'credit';
    amount: string;
    currency: string;
    exchangeRateToBase: string;
    amountInBase: string;
    accountId?: string;
    relatedFeature?: string;
    relatedId?: string;
    memo?: string;
  }>;
  cashEntries: Array<Record<string, unknown>>; // acc_transactions rows or empty
  snapshotTargets: Array<{ kind: string; id: string }>; // holdings/accounts to rebuild after write
  conversionPath?: Array<{ from: string; to: string; rate: string; asOf?: string; rateId?: string }>;
}

interface FinancialOperationAdapter {
  readonly featureKey: string; // e.g. 'crypto' | 'loan' | 'fif'

  validate(ctx: FinancialOperationContext): Promise<void>; // throw = abort

  buildPlan(ctx: FinancialOperationContext): Promise<FinancialOperationPlan>;

  /** پس از insert plan — یا engine از snapshotTargets + rebuild* استفاده می‌کند */
  applySnapshotHints?(ctx: FinancialOperationContext, plan: FinancialOperationPlan): Promise<void>;

  buildReversalPlan(ctx: FinancialOperationContext & { originalOperationId: string }): Promise<FinancialOperationPlan>;
}
```

جریان موتور:
```text
status = pending
adapter.validate → adapter.buildPlan
write domain + journal + cash (engine)
derive snapshots
SQL COMMIT → status = committed
persist IDB → status = persisted (یا failed)
emit only if persisted
```

## Operation Status (سراسری)

| status | معنی | UI |
|--------|------|-----|
| `pending` | قبل از SQL COMMIT | در حال ثبت… |
| `committed` | sql.js RAM OK، هنوز durable نیست | **نه** «ثبت قطعی» |
| `persisted` | IndexedDB swap COMPLETED | «ثبت شد» |
| `failed` | validate/write/persist خطا | خطا + retry |
| `recovered` | پس از recovery state machine | optional banner |

ذخیره اختیاری: `fin_operations.status`.  
**Invariant:** UI و DomainEvent فقط روی `persisted` قطعی‌اند.

---

## Multi-Currency Journal

Balance **همیشه** روی `amountInBase` (همان `baseCurrencyAtOperation`).

علاوه بر آن، برای هر currency واقعی که در op جابه‌جا می‌شود، خطوط journal با `currency` + `amount` نوشته می‌شوند. اگر دو currency درگیرند، **legs صریح FX / rounding** لازم است:

| lineKind (memo یا accountClass) | نقش |
|----------------------------------|------|
| `asset` / `cash` / … | حرکت دارایی/نقد |
| `fx_conversion` | تفاوت تبدیل بین دو ارز (balancing در base) |
| `fx_rounding` | باقیمانده گرد کردن تا Σ debit=credit در base |
| `valuation_adj` | فقط گزارش mark-to-market — **نه** داخل cost basis trade مگر صریح |

### مثال: خرید BTC با USD (base=IRR)
```text
Dr crypto_asset   amount=qty BTC   currency=BTC  amountInBase=X
Cr cash           amount=USD paid  currency=USD  amountInBase=Y
Dr/Cr fx_rounding amountInBase = X-Y residual if any
```
ETH→BTC (C2C): Dr BTC asset, Cr ETH asset، هر دو amountInBase از transferred cost + fees؛ residual → fx_rounding/fee lines.

### same-currency
فقط خطوط asset/cash؛ بدون fx_conversion مگر rate قفل‌شده برای گزارش base.

**Invariant:** Σ amountInBase debits = credits. Conservation هر currency در domain ledger جدا (qty BTC و غیره) — journal ارز را با amount خام هم audit می‌کند.

---

## تغییر Base Currency و گزارش تاریخی

| نوع گزارش | قرارداد |
|-----------|---------|
| **Historical as-booked** | همیشه با `baseCurrencyAtOperation` + `amountInBase` قفل‌شده؛ **هرگز** rebuild با base جدید |
| **Restated to current base** | optional: تبدیل `amountInBase` از base قفل‌شده → base فعلی با FX **as-of تاریخ گزارش**؛ برچسب UI: «تبدیل‌شده» |
| Net Worth امروز | holdings×price + FX **فعلی** |
| Total invested تاریخی | sum amountInBase as-booked (مقارنة فقط در همان base یا با restatement صریح) |

`amountInBase` روی journal/domain **immutable** پس از persist. تغییر Rounding Policy بعدی فقط txهای جدید؛ historical بدون migration version بازسازی نمی‌شود.

روی `fin_operations` / conversionPath نگه دارید:
```text
rate, source, asOf, rateId?,
roundingModeSnapshot, precisionSnapshot (از CurrencyRecord در لحظه)
```

---

## opening_position (مهاجرت / موجودی اولیه)

Command مشترک همه Investmentها:

```typescript
{
  kind: 'opening_position';
  instrumentId: string;
  assetCategory: 'crypto' | 'stock' | 'fif' | 'metal';
  locationId: string; // exchangeId | brokerageId | fund holding scope
  quantity: string;
  costBasis: string;
  costCurrency: string;
  asOf: string; // businessDate
  economicKind?: 'migration_import' | 'opening_balance' | 'gift' | 'airdrop' | 'unknown';
  notes?: string;
}
```

اثر:
- Domain: یک ردیف `type=opening_position` (یا acquisition با flag) — **نه** BUY جعلی با طرف مقابل خیالی
- CostBasisEngine: `acquisition` با cost = costBasis تبدیل‌شده به costCurrency pool
- Journal **اجباری**:
  - asset/holding: `Dr asset` amountInBase = cost in base
  - offset: `Cr opening_equity` (migration/opening_balance) **یا** `Cr income` (gift/airdrop/income) طبق economicKind
  - bank opening: `Dr cash` / `Cr opening_equity`
  - loan outstanding borrowed: `Dr opening_equity` / `Cr loan_liability` (یا معکوس برای lent)
- **ممنوع:** بدون journal offset (asset بدون equity/income)
- `operationId` + status lifecycle عادی

API: `recordOpeningPosition(adapter, command)` از Core.

---

## Fee Event مرکزی (mapping از Domain)

```typescript
interface CanonicalFeeEvent {
  operationId: string;
  amount: string;
  currency: string;
  category: string; // network | broker | exchange | tax_as_cost | loan_origination | …
  treatment: 'expense' | 'cost_basis_in' | 'proceeds_reduction' | 'fee_burn' | 'capitalized';
  ownerFeature: string;
  relatedDomainTxId?: string;
}
```
Feature breakdown (feeBrokerCommission، feePresence، …) فقط **map** به یک یا چند CanonicalFeeEvent می‌شود.  
Journal از treatment ساخته می‌شود؛ CostBasis از cost_basis_in / proceeds_reduction / fee_burn.

### fee_burn accounting
```text
CostBasis: fee_burn (PL=0)
Journal: Dr trading_fee / network_fee expense (amountInBase)
         Cr crypto_asset (same amountInBase)
```
هر دو با یک operationId.

---

## Hierarchy سخت (تکرار)
```text
Financial Operation → Domain Ledger → Journal → acc_transactions (cash projection از plan) → Snapshots
```
`acc_transactions` SoT برای **query cash بانکی** است اما **فقط** از همان atomic plan نوشته می‌شود — نه مسیر مستقل موازی با journal.

---

## Corporate Action multi-target
```text
caOperation: { sources: instrumentId[], targets: instrumentId[], ratios, cashLegs[] }
one-to-one | one-to-many | many-to-one
atomic under one operationId
```
