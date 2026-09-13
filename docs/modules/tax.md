# Tax (module owner)

**Status:** CURRENT

Owners: FINANCIAL-CORE · DATA-MODEL · API · REPORTING · OFFLINE-RELEASE.

## 1. Purpose

Tax obligations and events without parallel cash truth.

## 2. Scope

N/A / DEFERRED — do not invent.\n

## 3. Non-Goals

Full government e-filing product.

## 4. User Stories

N/A / DEFERRED — do not invent.\n

## 5. Pages / Sheets / Drawers

N/A / DEFERRED — do not invent.\n

## 6. Entities

tax_records (obligation), tax_events (assessment/adjustment).

## 7. Fields

N/A / DEFERRED — do not invent.\n

## 8. Field Kinds

N/A / DEFERRED — do not invent.\n

## 9. Field Ownership

Core tax tables; payment is financial operation.

## 10. Commands

tax.recordEvent, payTax; changeStatus excluding paid.

## 11. Queries

N/A / DEFERRED — do not invent.\n

## 12. API Input

N/A / DEFERRED — do not invent.\n

## 13. API Output

N/A / DEFERRED — do not invent.\n

## 14. Normalization

N/A / DEFERRED — do not invent.\n

## 15. Validation

N/A / DEFERRED — do not invent.\n

## 16. State Machine

draft/assessed → paid only after payTax operation.

## 17. Accounting Effects

N/A / DEFERRED — do not invent.\n

## 18. Journal Effects

N/A / DEFERRED — do not invent.\n

## 19. Cash Effects

payTax uses CashSettlementPort + journal.

## 20. Fee Effects

N/A / DEFERRED — do not invent.\n

## 21. Tax Effects

N/A / DEFERRED — do not invent.\n

## 22. FX Effects

N/A / DEFERRED — do not invent.\n

## 23. Date Semantics

N/A / DEFERRED — do not invent.\n

## 24. Identity

N/A / DEFERRED — do not invent.\n

## 25. Reversal / Correction

Amend via new event/operation; void prior.

## 26. Rebuild

N/A / DEFERRED — do not invent.\n

## 27. Reports

N/A / DEFERRED — do not invent.\n

## 28. Offline Behavior

N/A / DEFERRED — do not invent.\n

## 29. Standalone Edition

N/A / DEFERRED — do not invent.\n

## 30. Licensing / Capabilities

N/A / DEFERRED — do not invent.\n

## 31. Edge Cases

N/A / DEFERRED — do not invent.\n

## 32. Errors

N/A / DEFERRED — do not invent.\n

## 33. Golden / Recovery Fixtures

N/A / DEFERRED — do not invent.\n

## 34. Acceptance Criteria

changeStatus(paid) throws TAX_PAID_REQUIRES_PAYTAX_OPERATION.
