# Metals (module owner)

**Status:** CURRENT

Owners: FINANCIAL-CORE · DATA-MODEL · API · REPORTING · OFFLINE-RELEASE.

## 1. Purpose

Bullion and coin metals with purity snapshot and physical delivery.

## 2. Scope

buy, sell, delivery; premium and trade fee vs delivery fee.

## 3. Non-Goals

Derive coin valuation from fine-weight unless analytical mode explicit.

## 4. User Stories

N/A / DEFERRED — do not invent.\n

## 5. Pages / Sheets / Drawers

N/A / DEFERRED — do not invent.\n

## 6. Entities

N/A / DEFERRED — do not invent.\n

## 7. Fields

quantityMg RAW, purityRatio RAW, fineWeightMg DERIVED, premium, fees.

## 8. Field Kinds

N/A / DEFERRED — do not invent.\n

## 9. Field Ownership

N/A / DEFERRED — do not invent.\n

## 10. Commands

metals.buy, sell, delivery.

## 11. Queries

N/A / DEFERRED — do not invent.\n

## 12. API Input

N/A / DEFERRED — do not invent.\n

## 13. API Output

N/A / DEFERRED — do not invent.\n

## 14. Normalization

N/A / DEFERRED — do not invent.\n

## 15. Validation

Missing purity reject unless instrument fixed_1 pure policy.

## 16. State Machine

N/A / DEFERRED — do not invent.\n

## 17. Accounting Effects

N/A / DEFERRED — do not invent.\n

## 18. Journal Effects

Inventory asset vs cash; delivery moves carrying to physical asset.

## 19. Cash Effects

CashSettlementPort; platform cashBalance projection only.

## 20. Fee Effects

Trade fee ≠ delivery fee; delivery fee capitalization only if policy says.

## 21. Tax Effects

N/A / DEFERRED — do not invent.\n

## 22. FX Effects

N/A / DEFERRED — do not invent.\n

## 23. Date Semantics

N/A / DEFERRED — do not invent.\n

## 24. Identity

instrumentId + platform/account; gold_coin ≠ bullion class.

## 25. Reversal / Correction

N/A / DEFERRED — do not invent.\n

## 26. Rebuild

Holdings from metals transactions.

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

METAL-003 fee separation; purity not silent 1.
