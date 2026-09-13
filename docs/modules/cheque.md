# Cheque (module owner)

**Status:** CURRENT

Owners: FINANCIAL-CORE · DATA-MODEL · API · REPORTING · OFFLINE-RELEASE.

## 1. Purpose

Cheque instruments with lifecycle and cash impact only on defined transitions.

## 2. Scope

Issue, receive, deposit, clear, bounce, cancel, return.

## 3. Non-Goals

Central bank cheque clearing network integration.

## 4. User Stories

N/A / DEFERRED — do not invent.\n

## 5. Pages / Sheets / Drawers

N/A / DEFERRED — do not invent.\n

## 6. Entities

cheque rows + operation_id links.

## 7. Fields

N/A / DEFERRED — do not invent.\n

## 8. Field Kinds

N/A / DEFERRED — do not invent.\n

## 9. Field Ownership

N/A / DEFERRED — do not invent.\n

## 10. Commands

cheque.issue, receive, deposit, clear, bounce, cancel, return.

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

issued|received → deposited → cleared | bounced; cancel/return branches.

## 17. Accounting Effects

Receivable/payable or cash per transition matrix.

## 18. Journal Effects

Only through operation engine.

## 19. Cash Effects

Journal impact on clear (and bounce rules); not on mere issue if policy holds.

## 20. Fee Effects

N/A / DEFERRED — do not invent.\n

## 21. Tax Effects

N/A / DEFERRED — do not invent.\n

## 22. FX Effects

N/A / DEFERRED — do not invent.\n

## 23. Date Semantics

issueDate, dueDate, clearDate distinct.

## 24. Identity

cheque id + account/party references.

## 25. Reversal / Correction

Reverse clear via operation reversal.

## 26. Rebuild

N/A / DEFERRED — do not invent.\n

## 27. Reports

N/A / DEFERRED — do not invent.\n

## 28. Offline Behavior

Offline lifecycle updates.

## 29. Standalone Edition

With Accounts/Core.

## 30. Licensing / Capabilities

N/A / DEFERRED — do not invent.\n

## 31. Edge Cases

N/A / DEFERRED — do not invent.\n

## 32. Errors

N/A / DEFERRED — do not invent.\n

## 33. Golden / Recovery Fixtures

DEFERRED until filled.

## 34. Acceptance Criteria

Illegal transition rejected; clear posts balanced journal.

### Extra edge
Bounce after clear requires reversal path not silent status overwrite.

## Transition matrix (normative)

| From | To | Journal? |
|------|-----|----------|
| (new) | issued | policy-dependent |
| (new) | received | policy-dependent |
| issued/received | deposited | optional hold |
| deposited | cleared | YES cash/settlement |
| deposited | bounced | YES reverse hold / expense policy |
| * | cancelled | if uncleared, no cash or reverse |
| * | returned | documented path |

Illegal transitions → CHEQUE_INVALID_TRANSITION.

## Clear operation
Atomic: status→cleared + journal legs + operationId. Failure rolls back both.

## Bounce
If prior clear posted, bounce requires reversal operation first or combined reversing entry — no silent OHLC-style overwrite of cash.
