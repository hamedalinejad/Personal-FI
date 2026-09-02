# Tax Locks TX-001 … TX-006 (P0)

## TX-001 — Canonical tax entity
One canonical liability/event entity (prefer `tax_events` or unified name in schema). `tax_records` is compatibility view/alias if both names exist — not two competing SoTs.

## TX-002 — Tax payment = one operation
`payTax` → one Financial Operation with one primary cash leg (`withdrawal-expense-tax` / equivalent) (P0-085).

## TX-003 — Tax refund
Explicit **tax refund** operation type — not generic income.

## TX-004 — Liability source vs payment source
- `sourceOperationId` / origin fields = what created the liability  
- payment `accountId` / settlement = how it was paid  
Separate fields; payment must not overwrite liability provenance.

## TX-005 — Rules versioned
```text
ruleId + version + effectiveFrom/effectiveTo (or tax period bounds)
```
Computed liabilities reference rule version used.

## TX-006 — Legacy investment tax fields
New writes only `linkedTaxEventId` (canonical). Legacy columns read-only migration (P0-086).

Status: **LOCKED** 2026-09-02
