# Reports / Portfolio / Dashboard Locks RP-001 … RP-009 (P0)

Shared across Reports-Analytics, Portfolio-Wealth-Overview, Dashboard.

## RP-001 — Decimal strings
All money/price/rate fields in Portfolio/Reports/Dashboard APIs and JSON examples are **decimal strings** (P0-078, X-005). No financial `number` in contracts.

## RP-002 — Historical net worth = ValuationContext
```text
ValuationContext {
  asOf
  priceAsOf policy / per-instrument prices
  fxAsOf / conversionPath
  cashSettlementCutoff
  liabilityScope
  cashScope
}
```
Historical NW reconstructs under one context — not “latest prices + old cash”.

## RP-003 — cashScope canonical
One `calculateWealthView` + explicit `cashScope` (P0-081). Portfolio vs Reports must not invent divergent includeCash semantics without declaring scope.

## RP-004 — wealthDelta ≠ P&L
Change in net wealth over a period is **not** identical to investment P&L. Report wealth movement attribution separately from realized/unrealized P&L (flows, contributions, withdrawals, FX on cash, etc.).

## RP-005 — Pending cheques
`committedAdjustedNetWorth` (or equivalent) separate from core netWealth (CH-006, BATCH-4 §1).

## RP-006 — Investment period return
Period return uses opening / flows / income / realized / closing bridge (FI-010, BATCH-2 §8). Document TWR vs MWR if both exposed; cash flows must not silently corrupt return math.

## RP-007 — Dashboard asOf
Shared `asOf`/`businessDate` context for all widgets; per-widget watermark/stale (P0-087/088).

## RP-008 — Snapshot watermark
Financial snapshots require `sourceWatermark` / lastOperationId (BATCH-4 §2).

## RP-009 — Export preflight
Export detects stale snapshot → rebuild or fail/warn with explicit stale (BATCH-5 §3).

Status: **LOCKED** 2026-09-02
