## ارجاع الزامی

قبل از پیاده‌سازی هر Feature: `docs/core/Financial-Invariants.md`.

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

## operationId = Idempotency Key

| فیلد | نقش |
|------|-----|
| `operationId` | **canonical** گروه رکوردها **و** کلید idempotency کلاینت |
| `commandHash` | hash پایدار از command نرمال‌شده (بدون random) |
| `tradeGroupId` / `transferGroupId` | metadata دامنه |
| `accountTransactionId` | FK cash |
| `relatedId` | polymorphic |

```sql
UNIQUE(fin_operations.id)  -- id = operationId
```

### رفتار double-submit
```text
Client generates operationId (UUID) before first click
retry / double click → همان operationId + همان command

runAtomicFinancialOperation(operationId, command):
  if exists fin_operations where id = operationId:
    if stored.commandHash == hash(command):
      return previous result (success or recorded failure)  // idempotent
    else:
      reject IDEMPOTENCY_CONFLICT
  else:
      insert new operation…
```

**ممنوع:** تولید `operationId` جدید برای هر کلیک retry روی همان intent کاربر.  
Reversal = **operationId جدید** با `reversesOperationId` به اصل.

## Journal Schema canonical

```text
fin_operations (header, one per atomic op) — **Must in SQLite schema**:
  id (= operationId)
  baseCurrencyAtOperation   // **قفل**
  businessDate
  sourceFeature
  reversesOperationId?
  conversionPath?           // Must اگر >1 hop
  status                    // pending | posted | voided | failed — business only
  failurePhase?             // validation | domain_write | sql_commit | null when ok
  failureCode?              // machine code
  commandHash               // idempotency fingerprint — **Must**
  engineVersions            // JSON: { costBasis, rounding, fx, loanFormula, journal } calculationVersionها
  // durability counters NOT in SQLite — see db_meta
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
interface FinancialOperationContext<TCommand extends FeatureCommand = FeatureCommand> {
  operationId: string;
  baseCurrencyAtOperation: string;
  businessDate: string;
  command: TCommand;
}

// Adapter: FinancialOperationAdapter<TCommand>
// buildPlan(ctx: FinancialOperationContext<TCommand>)


type FeatureCommand =
  | { feature: 'crypto'; cmd: CryptoCommand }
  | { feature: 'stocks'; cmd: StockCommand }
  | { feature: 'fif'; cmd: FifCommand }
  | { feature: 'metals'; cmd: MetalCommand }
  | { feature: 'loan'; cmd: LoanCommand }
  | { feature: 'accounts'; cmd: AccountsCommand }
  | { feature: 'income'; cmd: IncomeCommand }
  | { feature: 'expense'; cmd: ExpenseCommand }
  | { feature: 'cheque'; cmd: ChequeCommand }
  | { feature: 'physical_assets'; cmd: PhysicalAssetCommand }
  | { feature: 'opening'; cmd: OpeningCommand };


interface JournalLine {
  accountClass: AccountClass; // enum مرکزی types
  direction: 'debit' | 'credit';
  amount: string;
  currency: string;
  exchangeRateToBase: string;
  amountInBase: string;
  accountId?: string;
  relatedFeature?: RelatedFeature;
  relatedId?: string;
  memo?: string;
  lineKind?: 'asset' | 'cash' | 'fee' | 'fx_conversion' | 'fx_rounding' | 'fx_gain' | 'fx_loss' | 'equity' | 'income' | 'expense' | 'other';
}

// accountClass = WHAT (طبقه حساب) | lineKind = WHY (علت تولید خط)
// مثال: accountClass=expense + lineKind=fee ؛ accountClass=crypto_asset + lineKind=asset


/** Feature-specific payload — engine به Repository همان feature می‌سپارد، نه SQL خام سراسری */
type DomainWrite =
  | { feature: 'crypto'; action: 'insert_tx' | 'void_tx' | 'insert_opening'; payload: CryptoTxWrite }
  | { feature: 'stocks'; action: 'insert_tx' | 'void_tx' | 'insert_opening'; payload: StockTxWrite }
  | { feature: 'fif'; action: 'insert_tx' | 'void_tx' | 'insert_opening'; payload: FifTxWrite }
  | { feature: 'metals'; action: 'insert_tx' | 'void_tx' | 'insert_opening'; payload: MetalTxWrite }
  | { feature: 'loan'; action: 'insert_tx' | 'void_tx' | 'update_loan' | 'insert_opening'; payload: LoanTxWrite }
  | { feature: 'accounts'; action: 'insert_tx' | 'void_tx'; payload: AccTxWrite }
  | { feature: 'income'; action: 'insert_tx' | 'void_tx'; payload: IncomeTxWrite }
  | { feature: 'expense'; action: 'insert_tx' | 'void_tx'; payload: ExpenseTxWrite }
  | { feature: 'cheque'; action: 'insert' | 'status_change' | 'void'; payload: ChequeWrite }
  | { feature: 'physical_assets'; action: 'insert_tx' | 'void_tx' | 'insert_opening'; payload: PhysicalAssetWrite };

interface CashWrite {
  accountId: string;
  type: TransactionType; // فقط enum مرکزی acc
  amount: string;
  feeAmount?: string;
  currency: string;
  exchangeRateToBase: string;
  relatedFeature?: RelatedFeature;
  relatedId?: string;
  description?: string;
}

type SnapshotTarget =
  | { kind: 'account'; id: string }
  | { kind: 'crypto_holding'; id: string } // holdingId؛ اگر هنوز نیست create در domain write
  | { kind: 'stock_holding'; id: string }
  | { kind: 'fif_holding'; id: string }
  | { kind: 'metal_holding'; id: string }
  | { kind: 'loan'; id: string }
  | { kind: 'brokerage_cash'; brokerageId: string }
  | { kind: 'portfolio'; scope: 'all' | 'crypto' | 'stocks' | 'fif' | 'metals' | 'physical'; valuationAsOf?: string };

interface FinancialOperationPlan {
  domainWrites: DomainWrite[];
  journalLines: JournalLine[];
  cashWrites: CashWrite[];
  snapshotTargets: SnapshotTarget[];
  feeEvents?: CanonicalFeeEvent[];
  conversionPath?: Array<{ from: string; to: string; rate: string; asOf?: string; rateId?: string }>;
}

// Engine: for (w of domainWrites) featureRepos[w.feature].apply(w)
// نه INSERT INTO w.table از string آزاد

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
| لایه Business (`fin_operations`) | لایه Durability (`db_meta` فقط) | UI |
|----------------------------------|--------------------------------|-----|
| `pending` | — | در حال ثبت |
| `posted` | `persisting` / هنوز durable نیست | ثبت موقت — همگام‌سازی… |
| `posted` | `durable` | **ثبت شد** |
| `posted` | `persist_failed` | هشدار + retry (بدون SQL rewrite status) |
| `failed` / `voided` | — | خطا |

**Invariant:** DomainEvent و «ثبت قطعی» فقط وقتی durability=`durable`. `persisted` داخل SQLite **وجود ندارد**.


---

## Multi-Currency Journal

Balance **همیشه** روی `amountInBase` (همان `baseCurrencyAtOperation`).

علاوه بر آن، برای هر currency واقعی که در op جابه‌جا می‌شود، خطوط journal با `currency` + `amount` نوشته می‌شوند. اگر دو currency درگیرند، **legs صریح FX / rounding** لازم است:

| lineKind (memo یا accountClass) | نقش |
|----------------------------------|------|
| `asset` / `cash` / … | حرکت دارایی/نقد |
| `fx_rounding` | فقط residual گرد کردن تا Σ amountInBase متعادل شود — **نه** سود/زیان اقتصادی |
| `fx_conversion` | technical balancing وقتی دو ارز در یک op هستند و مبالغ base از قبل از rates قفل‌شده آمده‌اند — **نه** automatically FX gain |
| `fx_gain` / `fx_loss` | فقط وقتی economic event صریح است (تسویه ارز، بستن position ارزی، revaluation policy کاربر) |
| `valuation_adj` | mark-to-market گزارش — خارج از cost basis trade مگر صریح |

**قانون:** اختلاف base ناشی از round → فقط `fx_rounding`. اختلاف ناشی از دو rate مختلف در یک op بدون event اقتصادی → بررسی bug plan؛ نه ثبت خودکار fx_gain.

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
  assetCategory: 'crypto' | 'stock' | 'fif' | 'metal' | 'physical' | 'cash' | 'loan';
  locationId: string; // exchangeId | brokerageId | accountId | loanId scope
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
  - offset journal طبق جدول policy زیر (deterministic — Feature تفسیر آزاد ندارد)
  - bank opening: `Dr cash` / `Cr opening_equity`
  - loan outstanding borrowed: `Dr opening_equity` / `Cr loan_liability` (یا معکوس برای lent)
- **ممنوع:** بدون journal offset (asset بدون equity/income)
- `operationId` + status lifecycle عادی

API: `recordOpeningPosition(adapter, command)` از Core.

---

## Fee Event مرکزی (mapping از Domain)

```typescript
export type FeeCategory =
  | 'network'
  | 'broker_commission'
  | 'crypto_exchange_trading'
  | 'crypto_withdrawal'
  | 'market_fee'
  | 'tax_as_transaction_cost'
  | 'loan_origination'
  | 'loan_early_payment'
  | 'loan_monthly_service'
  | 'loan_penalty'
  | 'subscription'
  | 'redemption'
  | 'management'
  | 'other';

export type FeeTreatment =
  | 'expense'
  | 'cost_basis_in'
  | 'proceeds_reduction' // **canonical** — reduction_of_proceeds حذف شد (alias ممنوع)
  | 'fee_burn'
  | 'capitalized';

// FeeCategory: 'exchange' حذف شد — به‌جای آن:
// 'crypto_exchange_trading' | 'crypto_withdrawal' | 'broker_commission' | 'market_fee' | 'network' | …

interface CanonicalFeeEvent {
  operationId: string;
  amount: string;
  currency: string;
  category: FeeCategory;
  treatment: FeeTreatment;
  ownerFeature: RelatedFeature; // فقط enum — نه string
  relatedDomainTxId?: string;
}

Registry: `core/fees/FeeCategory.ts` — mapper فیچر synonym → enum.


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

### Opening economicKind policy (canonical)

| economicKind | cost basis | Journal credit | Tax event |
|--------------|------------|----------------|-----------|
| `opening_balance` / `migration_import` | user-entered | `opening_equity` | معمولاً نه |
| `gift` | طبق `giftCostBasisMode` | طبق `giftIncomeRecognitionMode` | optional |
| `airdrop` | 0 یا FMV (`airdropIncomeMode`) | **`income`** اگر FMV به‌عنوان درآمد؛ وگرنه equity | taxable event اگر income |
| `unknown` | **الزامی user cost** | `opening_equity` | نه تا classify |

تنظیمات جدا:
```text
giftCostBasisMode: 'zero' | 'fmv'
giftIncomeRecognitionMode: 'none' | 'fmv_as_income'  // مستقل از cost basis
airdropIncomeMode: 'income_fmv' | 'zero_basis'
```
Journal credit = income فقط اگر recognition mode بگوید؛ cost جداگانه.


## Tax Event + Reversal

```text
reverseOperation(op)
  → TaxAdapter.onDomainReversal(op):
       if tax_events linked:
         voidTaxEvent(id) OR insert reverseTaxEvent + link reversesTaxEventId
         status active → voided
  → reports exclude voided
```

API: `voidTaxEvent`, `reverseTaxEvent`, `recalculateTaxEvent` (فقط با operation جدید audited).  
Tax event active روی reversed source operation **نمی‌ماند**.

---

## دو لایه Status (ضد حلقه persist)

| لایه | کجا | مقادیر | کی نوشته می‌شود |
|------|-----|--------|------------------|
| **Business** | `fin_operations.status` در SQLite | `pending` → `posted` (بعد از SQL COMMIT موفق در RAM) → `voided` / `failed` | داخل همان SQL tx یا بلافاصله قبل از COMMIT — **یک‌بار** |
| **Durability** | **فقط** `db_meta` در IndexedDB | `dirty` / `persisting` / `durable` / `persist_failed` / `recovered` | بعد از serialize/swap — **بدون** SQL write اضافی |

```text
validate → write domain/journal (status=pending in plan)
SQL COMMIT  → fin_operations.status = posted   // در همان commit، نه بعد از IDB
db_meta.persistence = persisting + pendingCommit{operationIds[], checksum, token}
IDB swap OK → db_meta.persistence = durable; clear pendingCommit
IDB fail    → db_meta.persistence = persist_failed; **SQLite را دوباره برای فقط status ننویس**
```

**UI «ثبت شد»** فقط وقتی `db_meta.persistence === durable` برای آن batch.

**ممنوع:** بعد از IDB موفق، UPDATE `fin_operations.status = persisted` که دوباره serialize می‌خواهد → حلقه بی‌پایان.

### persistAttemptCount semantics (`db_meta` only)
```text
persistAttemptCount = total attempts ever for this pending batch (never reset to 0)
on durable success: lastPersistErrorCode = null; count keeps historical total
on new dirty cycle after durable: new pendingCommit may start count at 0 for that cycle
  OR global meta.totalPersistAttempts++ (implementation choice; document in code)
```

### failurePhase (business vs durability)
| phase | کجا | retry؟ |
|-------|-----|--------|
| `validation` | before SQL | خیر — اصلاح ورودی |
| `domain_write` / `sql_commit` | SQLite | نادر؛ معمولاً failed |
| `persist` | IDB only | **بله** retry swap |
| `recovery` | boot | بله/دستی |

`fin_operations.status=failed` + `failurePhase` برای خطاهای **business/SQL**.  
خطای IDB: `db_meta.persistence=persist_failed` در حالی که `fin_operations.status` می‌تواند `posted` بماند.

Boot: اگر `pendingCommit` هست → retry swap یا UI recovered.

---

## Checklist قراردادهای Core (حل‌شده در مشخصات)

| # | مورد | وضعیت در spec |
|---|------|----------------|
| 1 | Durability فقط در `db_meta` — نه status=persisted در SQLite | ✅ |
| 2 | pendingCommit / persist stats در IDB | ✅ |
| 3 | `lineKind` شامل fx_gain/fx_loss | ✅ |
| 4 | فقط `proceeds_reduction` | ✅ |
| 5 | `ownerFeature: RelatedFeature` | ✅ |
| 6 | DomainWrite typed برای accounts/income/expense/cheque | ✅ |
| 7 | Opening loan/physical/cash | ✅ |
| 8 | `FinancialOperationContext<TCommand>` | ✅ |
| 9 | SnapshotTarget discriminated | ✅ |
| 10 | giftCostBasis vs giftIncomeRecognition | ✅ |
| 11 | accountClass=WHAT / lineKind=WHY | ✅ |
| 12 | FeeCategory taxonomy دقیق | ✅ |

Runtime: تا fixture CI سبز نشود این‌ها «اثبات‌شده در کد» نیستند.

### engineVersions روی Operation
```text
fin_operations.engineVersions = {
  costBasis: "1.x",
  rounding: "1.x",
  fx: "1.x",
  loanFormula: "1.x",
  journal: "1.x"
}
```
Rebuild تاریخی با **همان** versionهای قفل‌شده روی op؛ تغییر فرمول فقط ops جدید یا migration صریح با bump version.
