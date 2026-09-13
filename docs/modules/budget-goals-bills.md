# Budget Goals Bills (module owner)

**Status:** CURRENT

Owners: FINANCIAL-CORE · DATA-MODEL · API · REPORTING · OFFLINE-RELEASE.

## 1. Purpose

Planning layer only — budgets, goals, recurring bills.

## 2. Scope

plan → forecast → optional link to actual operation.

## 3. Non-Goals

Replace journal or cash truth.

## 4. User Stories

N/A / DEFERRED — do not invent.\n

## 5. Pages / Sheets / Drawers

N/A / DEFERRED — do not invent.\n

## 6. Entities

N/A / DEFERRED — do not invent.\n

## 7. Fields

N/A / DEFERRED — do not invent.\n

## 8. Field Kinds

N/A / DEFERRED — do not invent.\n

## 9. Field Ownership

N/A / DEFERRED — do not invent.\n

## 10. Commands

budget.*, goal.*, bill.* as implemented.

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

N/A / DEFERRED — do not invent.\n

## 17. Accounting Effects

N/A / DEFERRED — do not invent.\n

## 18. Journal Effects

N/A / DEFERRED — do not invent.\n

## 19. Cash Effects

None until user posts real operation.

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

N/A / DEFERRED — do not invent.\n

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

Projection rows never post journal automatically.

## Link to actuals
Optional bg_transaction_links / bill occurrence → operationId. Link is REFERENCE only; deleting plan must not delete journal.
