# Accounts (module owner)

**Status:** CURRENT

Owners: FINANCIAL-CORE · DATA-MODEL · API · REPORTING · OFFLINE-RELEASE.

## 1. Purpose

Operational money accounts (cash, bank, card, wallet) linked to Core fin_accounts for journal truth.

## 2. Scope

Create/update/archive accounts; deposit, withdraw, transfer as operations; bank metadata; multi-currency display with IRR ledger storage.

## 3. Non-Goals

Chart-of-accounts designer UI; investment holding ledgers; parallel cash SoT tables.

## 4. User Stories

Add bank IRR account; transfer between cash and bank; archive empty account.

## 5. Pages / Sheets / Drawers

/money; account detail sheet; transfer sheet.

## 6. Entities

acc_accounts, acc_transactions (projection), acc_transaction_links, fin_accounts (class asset/liability/…).

## 7. Fields

name, account_kind (operational), currency, fin_account_id, iban/external ids, status active|archived.

## 8. Field Kinds

Balances DERIVED from journal; name/kind RAW; fin_account_id REFERENCE.

## 9. Field Ownership

Feature owns operational rows; Core owns fin_* and journal.

## 10. Commands

accounts.create, update, archive, deposit, withdraw, transfer.

## 11. Queries

listAccounts, getAccount, listActivity.

## 12. API Input

operationId for money moves; decimal-string amounts; currency explicit.

## 13. API Output

Envelope + accountId + operationId.

## 14. Normalization

currency uppercase; amounts decimal strings; scopedAccountId for system roles.

## 15. Validation

archive only if journal balance zero; currency match on legs.

## 16. State Machine

active → archived (zero balance only).

## 17. Accounting Effects

Maps operational moves to fin account classes.

## 18. Journal Effects

All money moves via operation engine balanced journal.

## 19. Cash Effects

CashSettlementPort; never store authoritative cashBalance outside journal.

## 20. Fee Effects

Transfer fees via Fee Engine when policy says so.

## 21. Tax Effects

N/A unless tax payment uses settlement account.

## 22. FX Effects

Cross-currency transfer requires locked rates on post.

## 23. Date Semantics

businessDate required on operations.

## 24. Identity

acc_accounts.id; fin_accounts.id; uniqueness policy on code if used.

## 25. Reversal / Correction

Reverse operation; no overwrite of posted amounts.

## 26. Rebuild

Activity projections rebuildable from journal + links.

## 27. Reports

Account statement via REPORTING.

## 28. Offline Behavior

Full offline.

## 29. Standalone Edition

Hidden settlement accounts when Accounts UI off.

## 30. Licensing / Capabilities

Always available as Core dependency for other editions.

## 31. Edge Cases

Zero-amount reject; same-account transfer reject.

## 32. Errors

ACCOUNT_ARCHIVE_NONZERO, CURRENCY_MISMATCH.

## 33. Golden / Recovery Fixtures

CORE transfer fixtures.

## 34. Acceptance Criteria

Archive gate; journal SoT; operational kind ≠ accounting class.

### Extra edge
Reject archive with open linked operations in draft; multi-currency display must not create TOM ledger currency.

## Code uniqueness
If fin_accounts.code used: UNIQUE per dataset where code IS NOT NULL (single-user local book).
