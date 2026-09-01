# Rebuild & Reconciliation API (P0)

Snapshot / balance / holding / avg cost / remainingBalance / portfolio value = **DERIVED**.

SoT = Operation + Domain events + Journal.

## Rebuild APIs (قرارداد)

```text
rebuildAccount(accountId?)
rebuildLoan(loanId?)
rebuildHolding(holdingId?)
rebuildPortfolio()
rebuildBalances()
rebuildAllDerivedState()
```

## System Reconciliation

```text
Ledger = X
Snapshot = Y
Difference = Z
```

**بدون** اصلاح خودکار Z. Repair فقط صریح + تأیید + audit.

مرجع: `db/04-reconciliation-integrity.md` · `Financial-Invariants.md` · `Raw-vs-Derived-Data.md`
