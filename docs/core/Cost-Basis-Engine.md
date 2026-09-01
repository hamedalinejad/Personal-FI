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

  instrumentId: string;     // هویت دارایی (assetKey / ISIN / …)
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

## C2C

```text
operationId = G
1) disposal ETH: kind=disposal, tradeGroupId=G, linkedRole=c2c_sell
   → releasedCost = sold portion of totalInvested
2) fee events on legs as feeInCost / feeBurnQuantity / feeFromProceeds
3) acquisition BTC: kind=acquisition, tradeGroupId=G, linkedRole=c2c_buy,
   transferredCost = releasedCost + fees allocated to cost of B
   unitPrice optional; totalInvested_B += transferredCost
```
Engine می‌تواند `applyC2cPair(sellEvent, buyEvent)` helper داشته باشد تا divergence با Crypto implementation کم شود.

## Transfer و Fee (مدل واحد)

| رویداد | quantity | totalInvested | realizedPL |
|--------|----------|---------------|------------|
| transfer_out | **−grossQuantity** (همیشه) | −cost متناسب با gross از pool | **0** |
| transfer_in | **+netQuantity** (همیشه) | +cost منتقل‌شده (از out، پس از fee) | **0** |
| fee_burn | **−feeQuantity** | معمولاً 0 روی cost pool (هزینه = از دست رفتن asset) یا policy صریح | **0** |
| fee_reversal | **+feeQuantity** | restore | **0** |

```text
Canonical transfer با fee از asset:
  transfer_out.quantityEffect = -grossQuantity
  fee_burn.quantityEffect     = -feeQuantity   // همان مقدار سوخته
  transfer_in.quantityEffect  = +netQuantity   // net = gross - fee
  assert gross = net + fee
```

`fee_external` / `fee_in_quote`: fee_burn quantity روی base asset صفر؛ فقط money fee.
`fee_from_received` در مقصد: net دریافتی کمتر — out همچنان −gross از مبدأ اگر مدل «ارسال gross» باشد.


**ممنوع:** transfer را به‌صورت disposal با `unitPrice = market` ثبت کردن.

## نگاشت فیچر → Event

| فیچر | خرید | فروش | خاص |
|------|------|------|-----|
| Crypto | acquisition | disposal | C2C pair؛ transfer+fee_burn؛ identity=`assetKey` |
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
