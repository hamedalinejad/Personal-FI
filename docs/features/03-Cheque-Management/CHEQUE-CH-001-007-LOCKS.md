# Cheque Locks CH-001 … CH-007 (P0)

## CH-001 — clear → bounce = one reverse
Bounce after clear reverses the **clear operation** once via Core (`reverseOperation`). Must not create two independent full reversals of the same economic clear.

## CH-002 — dueDate ≠ cash date
Cash recognition uses `clearedDate` / `effectiveCashDate` / paymentDate — not `dueDate` alone.

## CH-003 — Bounced receivable state
On bounce: domain cheque state + cash reversal as applicable; receivable/payable residual state explicit on cheque domain (not only missing cash).

## CH-004 — Bounce/return fee
Separate fee event/operation from the bounce reverse itself.

## CH-005 — Sayadi + number uniqueness
Field validation for Sayadi/id formats; scoped uniqueness (e.g. per user + bank + number/Sayadi) via partial unique indexes where nullable.

## CH-006 — Pending payable vs Net Worth
Pending outgoing cheques not in core Net Worth; optional committed metric only (BATCH-4 §1).

## CH-007 — Partial clearing
**v1:** partial clear unsupported → `VALIDATION_ERROR` / reject. No silent partial apply.

Status: **LOCKED** 2026-09-02
