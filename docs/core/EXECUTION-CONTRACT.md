# Execution Contract

**Status:** PARTIAL — foundation path exists; full product execution incomplete.

## Required path for every financial mutation

```text
Command (decimal strings only)
  → validate + capability
  → runAtomicFinancialOperation(operationId, commandHash)
  → prepare domain (pure)
  → CashSettlementPort (optional)
  → balanced journal lines
  → SQLite transaction (fin_operations + journal)
  → durability sql_committed
```

## Guarantees (must hold)

| # | Rule |
|---|------|
| 1 | No money as JS number at public boundary |
| 2 | One cash SoT = fin_accounts + fin_journal_lines |
| 3 | Feature must not import another feature internal |
| 4 | Core must not import features |
| 5 | Idempotent: same operationId+hash → replay; different hash → conflict |
| 6 | Unbalanced journal rejected before persist |

## Proof commands

```bash
npm test
node scripts/dependency-graph-check.js
node scripts/docs-validator.js
node scripts/schema-drift-test.js
node scripts/field-inventory-verify.js
node scripts/bench-smoke.js
```

## Not yet guaranteed

- Full void/reverse/correct/fiscal
- Golden family CI per domain
- Offline crash matrix
- Production release
