# Accounts (module owner)
**Status:** CURRENT
Owner document for this feature domain. Financial math → FINANCIAL-CORE.md; fields → DATA-MODEL.md; API envelope → API.md.

## 1. Purpose
Operational cash/bank/card/wallet accounts linked to Core fin_accounts.

## 2. Scope
CRUD accounts, deposit/withdraw/transfer projections, archive rules, bank metadata.

## 3. Non-Goals
Not the accounting chart of accounts UI; not investment holding ledgers.

## 4. User Stories
TBD — fill from feature package + FINANCIAL-CORE; DEFERRED only if command OPEN.

## 5. Pages / Sheets / Drawers
TBD — fill from feature package + FINANCIAL-CORE; DEFERRED only if command OPEN.

## 6. Entities
acc_accounts, acc_transactions, acc_transaction_links, fin_accounts (class).

## 7. Fields
TBD — fill from feature package + FINANCIAL-CORE; DEFERRED only if command OPEN.

## 8. Field Kinds
See DATA-MODEL.md. Operational account_kind ≠ accounting account_kind (class).

## 9. Field Ownership
TBD — fill from feature package + FINANCIAL-CORE; DEFERRED only if command OPEN.

## 10. Commands
createAccount, updateAccount, archiveAccount, deposit, withdraw, transfer (via operations).

## 11. Queries
TBD — fill from feature package + FINANCIAL-CORE; DEFERRED only if command OPEN.

## 12. API Input
TBD — fill from feature package + FINANCIAL-CORE; DEFERRED only if command OPEN.

## 13. API Output
TBD — fill from feature package + FINANCIAL-CORE; DEFERRED only if command OPEN.

## 14. Normalization
TBD — fill from feature package + FINANCIAL-CORE; DEFERRED only if command OPEN.

## 15. Validation
TBD — fill from feature package + FINANCIAL-CORE; DEFERRED only if command OPEN.

## 16. State Machine
active → inactive/closed; archive only if journal balance zero.

## 17. Accounting Effects
TBD — fill from feature package + FINANCIAL-CORE; DEFERRED only if command OPEN.

## 18. Journal Effects
TBD — fill from feature package + FINANCIAL-CORE; DEFERRED only if command OPEN.

## 19. Cash Effects
Only through CashSettlementPort → journal.

## 20. Fee Effects
TBD — fill from feature package + FINANCIAL-CORE; DEFERRED only if command OPEN.

## 21. Tax Effects
TBD — fill from feature package + FINANCIAL-CORE; DEFERRED only if command OPEN.

## 22. FX Effects
TBD — fill from feature package + FINANCIAL-CORE; DEFERRED only if command OPEN.

## 23. Date Semantics
TBD — fill from feature package + FINANCIAL-CORE; DEFERRED only if command OPEN.

## 24. Identity
acc_accounts.id; fin_account_id link required for posted cash.

## 25. Reversal / Correction
TBD — fill from feature package + FINANCIAL-CORE; DEFERRED only if command OPEN.

## 26. Rebuild
TBD — fill from feature package + FINANCIAL-CORE; DEFERRED only if command OPEN.

## 27. Reports
TBD — fill from feature package + FINANCIAL-CORE; DEFERRED only if command OPEN.

## 28. Offline Behavior
TBD — fill from feature package + FINANCIAL-CORE; DEFERRED only if command OPEN.

## 29. Standalone Edition
TBD — fill from feature package + FINANCIAL-CORE; DEFERRED only if command OPEN.

## 30. Licensing / Capabilities
TBD — fill from feature package + FINANCIAL-CORE; DEFERRED only if command OPEN.

## 31. Edge Cases
TBD — fill from feature package + FINANCIAL-CORE; DEFERRED only if command OPEN.

## 32. Errors
TBD — fill from feature package + FINANCIAL-CORE; DEFERRED only if command OPEN.

## 33. Golden / Recovery Fixtures
TBD — fill from feature package + FINANCIAL-CORE; DEFERRED only if command OPEN.

## 34. Acceptance Criteria
Archive rejects nonzero balance; currency match account vs tx.
