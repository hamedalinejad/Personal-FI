# Module: Income & Expense

**Owner:** this file · **Cash SoT:** FINANCIAL-CORE (journal)

## 1. Purpose
Record personal income and expense with categories; optional tax/fee links.

## 2. Scope
Create/edit/list income & expense; recurring metadata; category taxonomy.

## 3. Non-goals
Separate cash ledger · payroll · multi-entity.

## 4. Commands (target)
`income.create` · `expense.create` · reversals via Core reverse path.

## 5. Journal
Income: Dr cash / Cr income. Expense: Dr expense / Cr cash (or payable). Amounts decimal strings.

## 6. Validation
Positive amount; currency; businessDate required; category optional but if set must exist.

## 7. Deferred
Full recurring engine automation · installment expense products.

## 8. Acceptance
Posted op + balanced journal + reversible · no ghost cash table.
