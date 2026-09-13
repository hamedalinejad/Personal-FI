# Module: Cheque

**Owner:** this file · **Cash SoT:** journal only

## 1. Purpose
Issued/received cheques: due, deposit, clear, bounce, cancel.

## 2. Scope
Lifecycle states linked to operations/journal; reservation vs available balance is policy-documented.

## 3. Non-goals
Bank integration feed as authority · cheque as alternate cash SoT.

## 4. States (target)
issue → deposit → clear | bounce | cancel | return

## 5. Journal
Each transition posts via CanonicalFinancialOperation; bounced/cleared effects explicit.

## 6. Deferred
Full reservation matrix vs available balance UI.

## 7. Acceptance
Every state change has operationId; no orphan cash movement.
