# Budget Locks BU-001 … BU-007 (P0)

## BU-001 — strictMode is soft-confirm
Not a hard ledger block. Financial ops never rejected solely by budget; UI/API validation + explicit user confirm when over (P0-068). Prefer naming `strictMode` docs as advisory/soft-confirm.

## BU-002 — spentAmount / totalSpent
Treated as **snapshot/projection**; rebuild from `bg_transaction_links` (and reverse-aware links). Stored fields must match rebuild or reconcile flags drift.

## BU-003 — Expense reverse restores budget
Links keyed by `operationId`; reverse of expense releases envelope consumption for that op.

## BU-004 — closeBudget idempotent
Unique period key; idempotent close — no duplicate next budget (P0-070).

## BU-005 — Manual income override
`incomeSourceMode=manual` + amount + reason/provenance audit (P0-067).

## BU-006 — Cheque recognition
Global `budgetChequeRecognition`: `on_pending` | `on_cleared` (BATCH-3 §8).

## BU-007 — Envelope transfer
Planning-only: moves assigned amounts between envelopes; **no** cash/journal legs.

Status: **LOCKED** 2026-09-02
