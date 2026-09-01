# Cross-Feature P0 Bugs — 2026-09

| ID | وضعیت | محل قفل |
|----|--------|---------|
| P0-001 | **CLOSED** | Canonical-Financial-Operation — Core sole reverse |
| P0-002 | **CLOSED** | Income/Expense — correction via reverseOperation + new op |
| P0-003 | **CLOSED** | operationId + reversesOperationId + reversalOperationId |
| P0-004 | **CLOSED** | Field-Write-Contract — snapshot not SoT in prose |
| P0-005 | **CLOSED** | API-Result — decimal string only |
| P0-006 | **CLOSED** | Feature-Independence — nullable account FK |
| P0-007 | **CLOSED** | db/05-constraints-polymorphic |
| P0-008 | **CLOSED** | types.md sole relatedFeature enum |
| P0-009 | **CLOSED** | date + createdAt + id order |
| P0-010 | **CLOSED** | Date-Semantics-Matrix |

در تعارض با Feature prose قدیمی، این جدول و اسناد قفل برنده است.

## Batch P0-011 … P0-020

| ID | وضعیت | قفل |
|----|--------|-----|
| P0-011 | **CLOSED** | exchangeRateToBase canonical; «نرخ تتر» فقط UI |
| P0-012 | **CLOSED** | baseCurrencyAtOperation NOT NULL + immutable rates |
| P0-013 | **CLOSED** | CanonicalFeeEvent + one economic effect |
| P0-014 | **CLOSED** | convert fee before aggregate; currency guard |
| P0-015 | **CLOSED** | domain precision/sign validation |
| P0-016 | **CLOSED** | operationId required on all financial commands |
| P0-017 | **CLOSED** | IDEMPOTENCY_CONFLICT on hash mismatch |
| P0-018 | **CLOSED** | accountKind canonical; bankProductType separate |
| P0-019 | **CLOSED** | cardLast4/token only; no PAN |
| P0-020 | **CLOSED** | available ≠ ledger; commitments once |
