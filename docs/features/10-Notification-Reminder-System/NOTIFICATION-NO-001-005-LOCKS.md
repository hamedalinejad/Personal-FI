# Notification Locks NO-001 … NO-005 (P0)

## NO-001 — Dedupe independent of read
`dedupeKey` uniqueness is **independent of isRead** (P0-076). Read notifications must not allow duplicate create for same event occurrence.

## NO-002 — Scheduler not exact wall-clock
Background timing is best-effort. On **app activation / foreground**, run due reconciliation: generate missing due notifications per policy (with dedupe).

## NO-003 — read / dismiss / snooze
v1 explicit model:
- `isRead` — user saw it
- `dismissedAt` — removed from inbox (optional separate from read)
- `snoozeUntil` — suppress until time

If v1 collapses dismiss into read, document that; snooze remains distinct when supported.

## NO-004 — category ≠ relatedFeature equality
Use explicit mapping table (P0-077 / BATCH-1). No `category === relatedFeature` contract.

## NO-005 — Custom repeating reminders
Each occurrence needs deterministic `scheduledOccurrenceKey` / recurrence key in `dedupeKey` payload so repeats do not collide or regenerate infinitely.

Status: **LOCKED** 2026-09-02
