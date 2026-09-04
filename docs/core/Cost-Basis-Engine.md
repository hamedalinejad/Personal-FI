# Cost Basis Engine (Core)

## هدف
مفاهیم مشترک acquisition / disposal / fee / cost basis / realized / unrealized **یک موتور** دارند.  
فیچرهای Crypto، Stocks، FIF، Metals فقط **Policy + نگاشت رویداد** می‌دهند — **نه** چهار الگوریتم کاملاً مستقل.

مسیر پیشنهادی کد: `core/domain/costBasis/` یا `core/services/costBasisEngine.ts`.


## یک Engine — چند Policy (P0)

**ممنوع:** چهار موتور جدا با رفتار ناسازگار:
```text
Crypto Cost Engine ≠ Stock Cost Engine ≠ Fund Cost Engine ≠ Metal Cost Engine
```

**الزام:**
```text
CostBasisEngine (Core)
     ↑ policy + events
Crypto | Stocks | FIF | Metals  (adapters only)
```

Feature فقط **Policy** و نگاشت رویداد می‌دهد؛ الگوریتم مشترک در Core است.

### enum `costBasisMethod` (per holding / instrument / user default)

| Method | معنی | v1 |
|--------|------|-----|
| `weighted_average` | میانگین موزون — پیش‌فرض پروژه | ✅ Must |
| `fifo` | اولین ورود، اولین خروج (lots) | Should / v1.1 |
| `specific_identification` | انتخاب lot صریح هنگام disposal | Should / v1.1+ |
| `no_cost_basis` | بدون pool هزینه (مثلاً برخی هدایا/عدالت با override) | ✅ محدود |

```text
settings.defaultCostBasisMethod = weighted_average
holding.costBasisMethod override nullable
Feature adapter: map domain tx → CostBasisEvent
Engine.apply(state, event, method)
```

**Invariant:** همان `operationId` / fee rules / transfer semantics برای همه Assetها؛ فقط method محاسبه lot/pool فرق می‌کند.

## مفاهیم مشترک

| مفهوم | معنی |
|--------|------|
| `acquisition` | افزایش quantity + افزایش cost pool |
| `disposal` | کاهش quantity + آزاد کردن cost متناسب (avg یا lot) |
| `feeIn` | کارمزد وارد cost basis (acquisition) |
| `feeOut` | کارمزد از proceeds / realized (disposal) یا fee burn quantity |
| `corporateAction` | تغییر quantity/cost بدون خرید/فروش ساده |
| `transfer` | جابه‌جایی cost بین holdingها — **realizedPL = 0** |

نسخه v1 پیش‌فرض: **Weighted Average** cost pool per holding (مبالغ cost به **costCurrency** یکسان در state).

## Interface (Multi-Currency)

```typescript
interface CostBasisEvent {
  kind: 'acquisition' | 'disposal' | 'ca_bonus' | 'ca_split' | 'ca_reverse_split'
    | 'ca_rights' | 'ca_capital' | 'transfer_out' | 'transfer_in'
    | 'fee_burn' | 'fee_reversal' | 'metadata_only';

  instrumentId: string;     // canonical = ref_instruments.id ONLY (P0-FINAL-002); not assetKey
  quantity: string;         // AssetQuantity

  /** ارز pool هزینه این holding پس از نرمال‌سازی */
  costCurrency: string;     // معمولاً baseCurrency یا quote قفل‌شده
  unitPrice?: string;       // به costCurrency (از قبل convert شده در Feature)
  grossProceeds?: string;   // به costCurrency
  feeInCost?: string;       // به costCurrency — وارد totalInvested
  feeFromProceeds?: string; // به costCurrency — از realized
  feeBurnQuantity?: string; // کارمزد از خود asset (کاهش qty بدون disposal بازاری)

  /** زمینه معامله */
  quoteCurrency?: string;
  feeCurrency?: string;
  exchangeRateToCost?: string; // نرخ استفاده‌شده برای نرمال‌سازی (audit)
  asOf?: string;

  /** C2C / گروه */
  tradeGroupId?: string;
  linkedRole?: 'c2c_sell' | 'c2c_buy' | 'transfer_pair';
  transferredCost?: string; // برای acquisition طرف B: cost آزادشده از A

  ratio?: string;
  calculationVersion: string;
}

interface CostBasisState {
  instrumentId: string;
  quantity: string;
  totalInvested: string;    // در costCurrency
  costCurrency: string;
  averageBuyPrice: string;  // totalInvested/quantity
}

interface CostBasisEngine {
  apply(state: CostBasisState, event: CostBasisEvent): CostBasisState;
  applyAll(events: CostBasisEvent[]): CostBasisState;
  realizedOnDisposal(state: CostBasisState, event: CostBasisEvent): {
    realizedPL: string; // costCurrency
    next: CostBasisState;
  };
}
```

### قانون نرمال‌سازی
Feature **قبل از** `engine.apply` همه مبالغ پولی را با `convert(..., asOf)` به `costCurrency` می‌برد. Engine روی float خام چندارزی کار نمی‌کند.


## Multi-Quote Cost Basis (P0 Crypto / همه Assetها)

**مشکل:** خرید اول BTC به IRR و خرید دوم به USDT — یک فیلد تنها `averageBuyPrice` بدون ارز pool خراب می‌شود.

**قانون:**

```text
Cost Pool داخلی Engine = همیشه به Base Currency کاربر (یا costCurrency قفل‌شده holding)

totalCostBase
quantity
averageCostBase = totalCostBase / quantity
```

همزمان روی **هر transaction** (RAW — Preserve):

```text
originalAmount
originalCurrency
quoteCurrency
exchangeRateToBase   (at post time)
```

هرگز برای «زیبایی» حذف نشوند.

نمایش اختیاری (DERIVED، نه SoT دوم):

```text
Average Cost in Base
Average Cost in USDT   (via rates / only if all legs convertible consistently)
Average Cost in IRR
```

```text
Feature:
  leg (quote) → convert to base with exchangeRateToBase on that tx
  → CostBasisEngine.apply با مبالغ base
  → state.totalInvested / averageBuyPrice در costCurrency=base

Raw quote fields روی tx برای audit و گزارش چندارزی می‌مانند.
```

**ممنوع:** میانگین‌گیری مستقیم `100_000_000 IRR` با `1000 USDT` بدون تبدیل به base.

## C2C / economicKind (canonical — P0-COST-BASIS-PNL-001-005)

**Authority:** `docs/core/Cost-Basis-Engine.md`

Command sets `economicKind`: `internal_transfer` | `same_owner_bridge` | `economic_trade_or_swap`.

### `economic_trade_or_swap` (true C2C)
```text
operationId = G
1) disposal source: realized from trade consideration − cost released − sale fees
2) acquisition dest: cost = destinationConsiderationBase + capitalized fees
   — NOT source carrying cost; transferredCost NOT used as dest book cost
```

### `internal_transfer` / `same_owner_bridge`
```text
realized = 0
destinationCost = carrying cost moved (see transfer single-release graph)
```

Acceptance: BTC cost 100m, swap consideration 140m → realized 40m, ETH cost 140m — not 100m.

## Transfer و Fee (مدل واحد)

| رویداد | quantity | totalInvested | realizedPL |
|--------|----------|---------------|------------|
| transfer_out | **−grossQuantity** (همیشه) | −cost متناسب با gross از pool | **0** |
| transfer_in | **+netQuantity** (همیشه) | +cost منتقل‌شده (از out، پس از fee) | **0** |
| fee_burn | **−feeQuantity** | معمولاً 0 روی cost pool (هزینه = از دست رفتن asset) یا policy صریح | **0** |
| fee_reversal | **+feeQuantity** | restore | **0** |

```text
Canonical transfer با fee از asset (ONE cost release — P0-002):
  quantity: out −gross, in +net, fee qty −fee; assert gross = net + fee
  cost: release avg*gross ONCE → split to dest (avg*net) + feeCarrying (avg*fee)
  fee_burn must NOT independently releaseCost again
  Engine returns TransferCostResult { releasedCostTotal, transferredCostToDestination, feeCarryingCost }
```

`fee_external` / `fee_in_quote`: fee_burn quantity روی base asset صفر؛ فقط money fee.
`fee_from_received` در مقصد: net دریافتی کمتر — out همچنان −gross از مبدأ اگر مدل «ارسال gross» باشد.


**ممنوع:** transfer را به‌صورت disposal با `unitPrice = market` ثبت کردن.

## نگاشت فیچر → Event

| فیچر | خرید | فروش | خاص |
|------|------|------|-----|
| Crypto | acquisition | disposal | C2C pair؛ transfer+fee_burn؛ identity=`instrumentId` |
| Stocks | acquisition | disposal | CA events |
| FIF | acquisition @ transactionPrice | disposal @ redemption | |
| Metals | acquisition | disposal | |

## calculationVersion
هر تغییر فرمول → bump + rebuild snapshots.

## Domain-neutral
Interface شامل instrumentId، costCurrency، fee، rate، tradeGroupId، transfer، CA kinds است.  
Feature فقط mapping event می‌سازد — بدون fork فرمول هسته.

## External و Bridge

| Event | quantity | cost | realizedPL |
|-------|----------|------|------------|
| external_out disposal | −qty | −cost portion | per economicKind (gift/expense/sale) |
| external_in acquisition | +qty | +user cost or FMV or 0 | — |
| bridge_out | −gross on asset A | −released cost | 0 |
| bridge_in | +net on asset B | +transferredCost | 0 |

```text
CostBasisEvent.linkedRole?: 'bridge' | 'external_in' | 'external_out' | 'c2c_sell' | …
```

### Bridge cost split
```text
costPerUnit = totalInvested / qty
transferredCost = costPerUnit * netQuantity
feeBurnCost = costPerUnit * feeQuantity
```

## costBasisMethod (Settings)

```text
costBasisMethod: 'weighted_average' | 'fifo'   // v1 default weighted_average
```

FIFO: نیاز به **lots** با `acquiredAt` (UTC) + `businessDate` + `createdAt` برای tie-break همان روز.
```text
ORDER BY businessDate ASC, createdAt ASC, id ASC
```
فقط `ORDER BY businessDate` برای FIFO **کافی نیست**.
Rebuild باید lots را از ledger بازسازی کند نه فقط average.

## Source of Funds / economicKind

موتور مشترک: basis از **نوع acquisition** می‌آید (opening, gift, buy, reward, transfer carry)، نه از symbol==USDT.
جزئیات جدول kind: `Opening-Balance.md`.

---

## CostBasisMethod (تنظیم سیستم / Portfolio)

| v1 | |
|----|--|
| پیش‌فرض | `weighted_average` |
| پشتیبانی | `fifo` (lots با createdAt tie-break) |
| آینده | `specific_lot` / `specific_identification` |

**ممنوع:** الگوریتم جدا hard-code داخل Crypto/Stock feature بدون فراخوانی Engine.

## Cost Pool Key

Basis per:

```text
(instrumentId, holdingId, costCurrency, costBasisMethod)
```

مثال: BTC در Wallet A و Exchange B = **دو pool** جدا (holdingId متفاوت) حتی اگر instrument یکسان باشد.

Holding = مرز pool؛ instrument = هویت دارایی.

**قفل روی تاریخچه:** `fin_operations.engineVersions.costBasis` + setting در زمان op ذخیره می‌شود. تغییر method بعداً فقط ops جدید یا rebuild صریح با version — نه silent rewrite.

---

## Policy-driven (نه الگوریتم per-Feature)

```text
Cost Basis Engine  ←  Crypto / Stocks / FIF / Metals adapters
```

Policy: `weighted_average` | `fifo` | `specific_lot`  
v1 می‌تواند همه را WA کند؛ **مدل data** باید policy را نگه دارد نه hard-code ابدی یک روش.

## Lifetime Fee Metric ≠ Cost Basis

`totalFeesPaidBase` (و مشابه) فقط **metric انباشته** است.

**ممنوع:** استفاده از آن برای remaining cost یا averageBuyPrice.

---

## calculationContext (هم‌تراز Operation)

علاوه بر `calculationVersion` و `costBasisMethod` روی holding/op، هر financial operation باید context کامل را در `fin_operations` قفل کند (costBasisMethod, calculationVersion, roundingPolicyVersion, currencyConversionPolicyVersion, …).

جزئیات فیلدها: `Canonical-Financial-Operation.md` § calculationContext.

---

## گسترش event / method (کریپتو و عمومی)

### lot_method (v1+)

`FIFO` · `LIFO` · `WAC` (weighted_average) · `HIFO` · `SpecificID`  
v1 پیش‌فرض: WAC؛ بقیه طبق edition/policy.

### event_type

`buy` · `sell` · `airdrop` (income) · `fork` · `staking_reward` (income) · `transfer_in` · `transfer_out` (non-taxable جابه‌جایی) · `fee`

### روی trade کریپتو (حفظ داده)

`baseAsset` · `quoteAsset` · `feeAsset` · `feeAmount` · `networkFee` · `txHash` · `network` (ERC20/TRC20/BEP20/…)

**بدون `txHash`:** دیتا پاک نمی‌شود؛ `txHash` nullable ولی برای import/on-chain provenance توصیه قوی / Should برای sync.

transfer_out بین ولت‌های خود کاربر نباید realized gain بسازد مگر policy صریح.

---

## Lot Tracking (P1)

- **v1:** Weighted Average per `holdingId` (cost pool) کافی و اجباری است.
- **FIFO / lots:** وقتی method=fifo، lots از ledger **rebuild** می‌شوند (`acquiredAt`, businessDate, createdAt tie-break)؛ ذخیره lot بدون قابلیت rebuild از events ممنوع به‌عنوان تنها SoT.
- Specific lot identification: v1.1+ با انتخاب صریح هنگام disposal.
- بدون lot/pool صحیح، Realized P&L در فروش‌های جزئی اشتباه می‌شود — fixture الزامی.

---

## Global engine — Feature فقط adapter (P0)

```text
CostBasisEngine (Foundation)
  policies: weighted_average | FIFO | specific_lot | …
       ↑
  Crypto / Stocks / Funds / Metals adapters
```

Feature روش جدا و متناقض implement نمی‌کند؛ فقط eventها را به engine می‌دهد.

---

## Fee-in-asset default (v1) — قفل

```text
qty decreases by fee_qty
cost pool total unchanged → average cost per unit increases
realized P&L not recognized on fee burn alone (fee may post as expense separately per Fee matrix)
```

Transfer custody: cost **moves with** qty — never reset to 0.

---

## Asset P&L vs FX P&L (base ≠ quote)

وقتی `costCurrency` / base کاربر با quote بازار فرق دارد (نمونه ایران: base=IRR، quote=USDT):

```text
totalUnrealizedBase = valueBase(asOf) − costBase
valueBase = qty × price_quote(asOf) × fx_quote_to_base(asOf)
```

گزارش حرفه‌ای **مؤلفه دارایی (quote)** و **مؤلفه FX** را جدا می‌کند تا حالت «قیمت دلاری پایین / ریال بالا / سود ریالی» گم نشود.

جزئیات و fixture: `Investment-Crypto.md` بخش «P&L چندارزی ایران».

---
## P0-009 — Deterministic rebuild order (all features)

```text
ORDER BY effectiveOrBusinessDate ASC, createdAt ASC, id ASC
```
Date alone is **forbidden** as sole sort for rebuild/FIFO/schedule application.

---
## P0-043/044 — C2C and transfer fee burn

Transfer/C2C with fee in asset: split quantity into **moved** and **burned**; allocate cost pool proportionally unless policy says otherwise.
Dest basis uses moved cost only; burn follows Fee matrix (expense or cost write-off) without inflating dest average incorrectly.


---

## Method versioning (CROSS-CUTTING BATCH-2 §9)

- Default cost basis method is **per asset class** (settings) with optional per-holding override.
- Operations store `engineVersions.costBasis` (and rounding policy version). Replay uses the version on the operation, not the current default only.

## P0-FINAL-011…014

CA numeric vectors, C2C vs bridge, economic kinds, opening cost: `Financial-Invariants.md`.

## P0-FINAL-021…023

costCurrency immutable per pool; CostBasisFeeAllocation v1; transfer fee source/dest split — `Financial-Invariants.md`.

## costCurrency (P0-009)

Pool `costCurrency` immutable; default `baseCurrencyAtFirstCostBearingEvent`. Report valuation may convert to user base; pool currency does not rewrite.

---

## economicFeeRole (canonical)

Set **before** any cost-pool mutation:

| Role | Effect |
|------|--------|
| `acquisition_fee_from_received` | holding += net; cost over net qty; no second burn release |
| `post_acquisition_network_burn` | after acquisition; proportional carrying burn |
| `sale_fee_from_proceeds` | reduces net proceeds |
| `standalone_asset_burn` | explicit burn only |

One CanonicalFeeEvent → one economic allocation.

## BUG-D01 — حقوق تقدم → سهم (بورس ایران) — Cost Basis

وقتی حق تقدم به سهم تبدیل/تخصیص می‌شود (پرداخت ارزش اسمی + کارمزد):

```text
New_Avg_Cost = (Rights_Cost + Nominal_Value_Paid + Capitalized_Fees) / Total_Shares_After

where:
  Rights_Cost           = carrying cost of rights lot(s) being converted (CostBasisEngine release)
  Nominal_Value_Paid    = cash paid at exercise (e.g. 1000 IRR par per new share) in costCurrency
  Capitalized_Fees      = fees with treatment capitalize_into_cost
  Total_Shares_After    = shares received from this conversion (or post-holding qty when merging into common pool)

Event shape (conceptual):
  ca_rights_exercise:
    disposal/close rights qty (release Rights_Cost)
    acquisition common shares with costBasisAdded = Rights_Cost + Nominal_Value_Paid + Capitalized_Fees
Realized P&L on pure conversion = 0 (economic reclass), except fee expense treatments.
```

Cash leg for Nominal_Value_Paid is separate journal (Cr cash / bank); cost pool of **shares** absorbs it.  
Fixture target: `CA-RIGHTS-EXERCISE-COST` (see Corporate-Actions-Spec + STOCKS locks).

## BUG-D02 — staking_reward

`staking_reward` = acquisition with **income recognition at FMV** + cost basis = FMV.  
Do not fold staking income into capital gain on later sale beyond post-receipt price move.
