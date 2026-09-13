# Funds (module owner)

**Status:** CURRENT

Owners: FINANCIAL-CORE · DATA-MODEL · API · REPORTING · OFFLINE-RELEASE.

## 1. Purpose

Fund units subscribe/redeem/distribution with NAV vs transaction price.

## 2. Scope

subscribe, redeem, distribution; account-scoped holdings.

## 3. Non-Goals

Infer liquidationPrice from NAV.

## 4. User Stories

N/A / DEFERRED — do not invent.\n

## 5. Pages / Sheets / Drawers

N/A / DEFERRED — do not invent.\n

## 6. Entities

N/A / DEFERRED — do not invent.\n

## 7. Fields

NAV, transactionPrice, liquidationPrice (optional explicit), units, amount.

## 8. Field Kinds

N/A / DEFERRED — do not invent.\n

## 9. Field Ownership

N/A / DEFERRED — do not invent.\n

## 10. Commands

fund.subscribe, redeem, distribution.

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

Inventory vs cash/settlement.

## 19. Cash Effects

CashSettlementPort; ETF cash same port as stocks — no second cash ledger.

## 20. Fee Effects

Via Fee Engine when status claims integration.

## 21. Tax Effects

N/A / DEFERRED — do not invent.\n

## 22. FX Effects

N/A / DEFERRED — do not invent.\n

## 23. Date Semantics

N/A / DEFERRED — do not invent.\n

## 24. Identity

instrumentId + account/portfolio scope.

## 25. Reversal / Correction

N/A / DEFERRED — do not invent.\n

## 26. Rebuild

Holdings from transactions.

## 27. Reports

N/A / DEFERRED — do not invent.\n

## 28. Offline Behavior

N/A / DEFERRED — do not invent.\n

## 29. Standalone Edition

Funds-only + Core.

## 30. Licensing / Capabilities

N/A / DEFERRED — do not invent.\n

## 31. Edge Cases

N/A / DEFERRED — do not invent.\n

## 32. Errors

N/A / DEFERRED — do not invent.\n

## 33. Golden / Recovery Fixtures

FUND-* marked DEFERRED if empty expected.

## 34. Acceptance Criteria

NAV ≠ transactionPrice enforced; amount consistency checks.

### Extra edge
Reject subscribe when amount and units×transactionPrice inconsistent beyond tolerance 0.

## Price fields matrix
| Field | Use in subscribe | Use in valuation |
|-------|------------------|------------------|
| transactionPrice | YES execution | NO |
| NAV | optional check | YES |
| liquidationPrice | only if explicit | optional explicit |

## Redeem
Units out; cash in via CashSettlementPort; transactionPrice for execution; NAV optional audit field.
