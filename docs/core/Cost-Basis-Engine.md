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
| `feeOut` | کارمزد از proceeds / realized (disposal) |
| `corporateAction` | تغییر quantity/cost بدون خرید/فروش ساده (split, bonus, …) |
| `transfer` | جابه‌جایی cost بین holdingها |

نسخه v1 پیش‌فرض: **Weighted Average** cost pool per holding.  
Lot/FIFO: Should Have با همان interface.

## Interface

```typescript
interface CostBasisEvent {
  kind: 'acquisition' | 'disposal' | 'ca_bonus' | 'ca_split' | 'ca_reverse_split'
    | 'ca_rights' | 'ca_capital' | 'transfer_out' | 'transfer_in' | 'metadata_only';
  quantity: string;       // AssetQuantity decimal string
  unitPrice?: string;     // for acquisition
  grossProceeds?: string; // disposal
  feeInCost?: string;     // money in trade currency added to cost
  feeFromProceeds?: string;
  ratio?: string;         // split/bonus
  calculationVersion: string;
}

interface CostBasisState {
  quantity: string;
  totalInvested: string;
  averageBuyPrice: string; // totalInvested/quantity or 0
}

interface CostBasisEngine {
  apply(state: CostBasisState, event: CostBasisEvent): CostBasisState;
  applyAll(events: CostBasisEvent[]): CostBasisState; // from empty
  realizedOnDisposal(state: CostBasisState, event: CostBasisEvent): { realizedPL: string; next: CostBasisState };
}
```

## نگاشت فیچر → Event

| فیچر | خرید | فروش | خاص |
|------|------|------|-----|
| Crypto | acquisition + feePresence | disposal + fee | C2C: disposal A + acquisition B با cost منتقل‌شده |
| Stocks | acquisition | disposal | CA → ca_* events |
| FIF | acquisition at transactionPrice | disposal at redemption | reinvest = acquisition؛ NAV ≠ price |
| Metals | acquisition per mg+purity | disposal | delivery = disposal از پلتفرم |

Feature **نباید** `totalInvested += qty*price` را مستقیم در UI کپی کند؛ فقط `engine.apply`.

## calculationVersion
هر تغییر فرمول → bump version + rebuild snapshots (طبق Rounding-Policy / db).
