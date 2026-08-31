# CorporateActionEngine (Core — نه فقط Stocks)

رویدادهای ساختاری روی **identity / quantity / cost** که فقط به سهام ایران محدود نیستند.

## انواع مفهومی

| خانواده | مثال |
|---------|------|
| Stock | bonus, split, reverse_split, rights, capital_increase, merger, spin-off, symbol/ISIN change |
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
