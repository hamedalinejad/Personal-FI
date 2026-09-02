# Physical Assets Locks PA-001 … PA-009 (P0)

---

## PA-001 — Write-off vs market

```text
loss = releasedCarryingCost − residualProceeds
```

Not `loss = currentValue` alone. `currentValue→0` is snapshot after op (P0-064).

## PA-002 — Cost SoT

Header `purchasePrice` = legacy/snapshot. **SoT cost pool** = `pa_transactions` rebuild (P0-065).

## PA-003 — Maintenance once

Maintenance is one economic operation (linked expense or PA maintenance leg with shared operationId) — not both full expense and independent PA amount (P0-066).

## PA-004 — Capex vs maintenance

| Kind | Treatment |
|------|-----------|
| maintenance / repair (keep) | expense (or policy) |
| capital improvement | increases carrying cost / capitalized |

Must be distinct event types or flags.

## PA-005 — Sale fees/taxes

Disposal fees and transaction taxes = separate fee/tax events on sale op — not silently netted only into a single sale price without breakdown when material.

## PA-006 — Theft / insurance

Lifecycle: write-off (or impairment) + optional **recovery** event (insurance proceeds) linked to original asset/operation — not only deleting the asset.

## PA-007 — Revaluation

Valuation/mark event updates `currentValue` / unrealized only. Does **not** create realized P&L by default (BATCH-3 §3).

## PA-008 — Lineage from Metals

Physical gold/coin from metals delivery must store `sourceFeature`, `sourceOperationId`, and/or source transaction ids (ME-009).

## PA-009 — FX on buy & valuation

Purchase and historical valuations retain `currency` + `exchangeRateToBase` (and asOf). Reports do not revalue historical cost with today’s FX only.

---

## Status: PA-001…PA-009 **LOCKED** 2026-09-02
