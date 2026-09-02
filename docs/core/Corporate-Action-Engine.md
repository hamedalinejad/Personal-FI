# CorporateActionEngine (Core — نه فقط Stocks)

رویدادهای ساختاری روی **identity / quantity / cost** که فقط به سهام ایران محدود نیستند.

## انواع مفهومی

| خانواده | مثال |
|---------|------|
| Stock (Iran) | stock_split, reverse_split, bonus_share, capital_increase, rights, cash_dividend, symbol_change, isin_change, merger, spin_off, delisting |
| Crypto | token redenomination, token swap/migrate, forced conversion |
| Fund | fund merge, unit conversion |
| Metal | استانداردسازی واحد (نادر) |

## قرارداد

```text
CorporateActionEngine.apply(action, adapter)
  → validate
  → build Domain legs (qty/cost transforms)
  → Journal lines (معمولاً PL=0 مگر cash leg)
  → snapshots rebuild targets
  → one operationId
```

Feature فقط **adapter** می‌دهد (قواعد ratio، cash leg، instrument mapping).  
Rebuild/reconcile **باید** همه actionهای ledger را بشناسد — نه فقط buy/sell.

جداول: metadata در `inv_*_corporate_actions` یا معادل؛ quantity در domain tx.

## Core vs Adapter

**Core Engine** = عمومی (quantity/cost transform hooks).  
**Stocks adapter** = معنی `bonus_share`, `rights_issue`, … برای بازار ایران.

Core نباید پر از منطق فقط-بورس شود.


## مدل داده از روز اول (حتی بدون UI MVP)

```text
inv_stocks_iran_corporate_actions   (Must در schema v1)
  id, instrumentId (UUID FK → ref_instruments), actionType,
  announcementDate, recordDate, exDate, effectiveDate, settlementDate, paymentDate,
  ratio?, cashAmount?, cashCurrency?,
  sourceInstrumentIds, targetInstrumentIds,
  costBasisPolicy, fractionalPolicy, operationId, notes, createdAt
```
(P0-055 lifecycle dates + P0-056 fractionalPolicy اجباری)

Quantity/cost اثر روی `inv_stocks_iran_transactions` (legs) ثبت می‌شود؛ این جدول metadata + audit + لینک operation است.

**ممنوع:** اعمال CA فقط با دست‌کاری snapshot holding بدون event immutable.

اقدام‌های لازم برای تاریخچه صحیح:
- Stock Split / Reverse Split
- Bonus
- Capital Increase
- Rights
- Dividend (cash leg + optional tax)
- Symbol Change / ISIN Change
- Merger / Spin-off
- Delisting

UI می‌تواند بعداً بیاید؛ **حذف از مدل اولیه = اجبار به دست‌کاری موجودی تاریخی بعداً**.


---

## Fractional rounding (CROSS-CUTTING BATCH-2 §10)

Entitlement rounding uses: ratio → **instrument quantity precision** → `fractionalPolicy` → optional cash-in-lieu. Market-rule adapter (e.g. Iran) supplies lot/tick constraints. See also Corporate-Actions-Spec / P0-056.
