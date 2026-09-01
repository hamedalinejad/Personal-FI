# Integrity Engine (P0/P1)

موتور مستقل تشخیص drift — نه silent fix.

## Severity

`PASS` · `WARNING` · `ERROR` · `CRITICAL`

## Checks (نمونه)

- domain ≠ journal projection
- journal unbalanced
- missing FK / orphan link
- negative holding (unless short enabled)
- duplicate operationId misuse
- missing reversal link
- snapshot drift vs ledger
- same operationId + different commandHash → **INTEGRITY ERROR**

## API

```text
verifySnapshotsAgainstSoT()
runIntegrityScan()
```

Repair فقط صریح + audit.

مرجع: Reconciliation-Foundation · Rebuild-API-Contract · Canonical-Financial-Operation
