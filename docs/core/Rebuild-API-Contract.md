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

---

## API کامل‌تر

```text
rebuildAllSnapshots()
rebuildAccountBalances()
rebuildHoldings()
rebuildLoanBalances()
rebuildPortfolio()
rebuildReportsCache()
verifySnapshotsAgainstSoT()
```

Reports از Journal/Domain ledger + calculation — نه Snapshot به‌عنوان SoT.

## Snapshot watermark (Policy (ex-batch-4) §2–§3)

Snapshots must store `sourceWatermark` (`lastOperationId`, optional journal sequence, `rebuiltAt`, `schemaVersion`). Rebuild is **deterministic and offline** — no live provider/network; uses stored prices/FX only.

## Ordering (X-015)

Rebuild order: business/effective date → createdAt → stable id. Same-day events are deterministic.

