# Bills / Recurring Locks BR-001 … BR-007 (P0)

## BR-001 — No duplicate occurrences
```text
UNIQUE(brItemId, scheduledOccurrenceKey)
```
Plus operation idempotency on pay/generate.

## BR-002 — Day-31 monthly drift
`anchorDay` + month clamp policy (`last_day` etc.); after clamp, no permanent silent drift to 30 unless sticky policy (existing P0-029 style).

## BR-003 — Missed periods
`catchUpPolicy`: `single_latest` | `all_missed` | `skip_missed` (BATCH-2 §5).

## BR-004 — autoCreateTransaction modes
Explicit mode enum, e.g. `manual_confirm` | `auto_create` | `auto_create_with_notify` — each with confirmation semantics documented; no ambiguous single boolean.

## BR-005 — Scheduled vs paid amount
`scheduledAmount` (occurrence) vs `paidAmount` / amendment (P0-074); originals preserved.

## BR-006 — Payment vs due date
Payment operation uses `paymentDate`; due remains `dueDate`. Cash/as-of use payment/effective cash dates.

## BR-007 — Standalone
Bills can run with optional CashSettlementPort when Accounts not integrated; document dependency (IE-007 pattern).

Status: **LOCKED** 2026-09-02
