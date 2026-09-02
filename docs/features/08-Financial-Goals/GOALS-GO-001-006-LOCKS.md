# Financial Goals Locks GO-001 … GO-006 (P0)

## GO-001 — Goal currency
Goal has fixed `currency`. Multi-currency contributions convert **as-of contribution** into goal currency (`exchangeRateToBase` / rate to goal currency locked on contribution).

## GO-002 — currentAmount
Snapshot only; SoT = `fg_contributions` ledger + rebuild (P0-071).

## GO-003 — Manual contribution & cash
Cash movement only when `fundingMode=segregated_cash` (or explicit transfer mode). Default earmark: no bank cash move (BATCH-3 §9, P0-072).

## GO-004 — Withdrawal FIFO lineage
Withdrawal allocation records per contribution class/line (earmark vs real-cash pools) (P0-073).

## GO-005 — State machine
Explicit transitions: e.g. `active` → `completed` → optional `reopened`; withdrawal rules per state documented; no undefined completed+withdraw.

## GO-006 — targetDate edge cases
Past `targetDate` and zero/negative months remaining: validation or explicit “immediate / overdue target” recommendation behavior (no divide-by-zero); monthCountPolicy from BATCH-2 §4.

Status: **LOCKED** 2026-09-02
