# Module: Cheque

**Owner:** this file · Template: ../MODULE-TEMPLATE.md

## 1. Purpose
Manage issued and received cheques with journal-linked lifecycle.

## 2. Scope
Issue, receive, deposit, clear, bounce, cancel, return; due dates; available-balance policy hooks.

## 3. Non-Goals
Bank feed as authority · cheque as cash SoT.

## 4. User Stories
As a user I record issued/received cheques and track clearance/bounce.

## 5. Pages / Sheets
Under `/money` or `/transactions` filters; forms as sheets.

## 6. Entities
Cheque · ChequeTransition (via operation)

## 16. State Machine
`issued|received → deposited → cleared|bounced` · also `cancelled|returned` from allowable states.

## 17–19. Accounting / Journal / Cash
Each transition = CanonicalFinancialOperation + journal; cash impact only via journal.

## 25. Reversal
Core reverse operation; original posted rows immutable.

## 32. Errors
CHEQUE_INVALID_TRANSITION · CHEQUE_NOT_FOUND · …

## 34. Acceptance
Every transition has operationId; no orphan cash movement.
