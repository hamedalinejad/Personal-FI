# Cost Basis Engine (Core)

## هدف
مفاهیم مشترک acquisition / disposal / fee / cost basis / realized / unrealized **یک موتور** دارند.  
فیچرهای Crypto، Stocks، FIF، Metals فقط **قوانین و نگاشت رویداد** را می‌دهند — نه چهار الگوریتم کاملاً مستقل.

مسیر پیشنهادی کد: `core/domain/costBasis/` یا `core/services/costBasisEngine.ts`.

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
| transfer_out | −gross یا −net طبق مدل | −cost متناسب | **0** |
| transfer_in | +net | +همان cost | **0** |
| fee_burn | −feeQty | 0 یا کاهش cost متناسب policy | **0** (هزینه = از دست رفتن asset، نه فروش بازار) |
| fee_reversal | +feeQty | restore | **0** |

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
