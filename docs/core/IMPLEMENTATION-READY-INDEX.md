# Implementation-Ready Index — Preflight

**If this checklist is green, documentation is sufficient to implement without inventing contracts.**

## A. Authority (read first)

| # | Doc | Purpose |
|---|-----|---------|
| 1 | ARCHITECTURE-LOCKED.md | constitution |
| 2 | GO-NO-GO.md | gates |
| 3 | CODING-GATE.md | what you may code now |
| 4 | SCHEMA-FREEZE-PROOF.md | schema baseline |
| 5 | This index | navigation |

## B. Implementer packs (normative)

| Pack | Covers |
|------|--------|
| IMPLEMENTATION-READY-LOAN-SLICE.md | Loan E2E 100% |
| IMPLEMENTATION-READY-FEATURES.md | Crypto/Stocks/Funds/Metals/Cheque/Cashflow |
| IMPLEMENTATION-READY-REPORTS.md | TB/GL/BS/P&L/CF |
| IMPLEMENTATION-READY-IRAN.md | IRR/Toman, templates, calendar, import |

## C. Engine contracts

| Engine | Doc | Code (exists) |
|--------|-----|----------------|
| Atomic op | Canonical-Financial-Operation.md | src/core/domain/operation/ |
| Cash | Cash-Settlement-Adapter.md | (wire adapters in feature) |
| Decimal | Money-Decimal-Policy / canonicalDecimal | src/core/money/ |
| Cost basis | Cost-Basis-Engine.md | src/core/domain/costBasis/ |
| Loan schedule | Loan-Schedule-Engine.md | src/core/domain/loan/ |
| Instrument | Instrument-Identity.md | src/core registry helpers |
| Invariants | Financial-Invariants.md | src/core/domain/invariants/ |

## D. Data plane

| Artifact | Role |
|----------|------|
| db/schema.sql | frozen CREATE tables |
| field-inventory.checklist.tsv | column coverage |
| RELATIONSHIP-MATRIX.md | FKs + semantics |
| scripts/schema-drift-test.js | CI |
| scripts/field-inventory-verify.js | CI |

## E. Preflight commands

```bash
npm test
node scripts/schema-drift-test.js
node scripts/field-inventory-verify.js
```

All three must PASS before claiming environment ready.

## F. Gaps that are NOT doc blockers

These are **implementation work**, not missing design:

- Writing `src/features/loan/**` files
- Wiring LocalSettlementAdapter class
- Golden CI job YAML per family
- Full day-count engines beyond period_based
- Encryption at rest module

## G. Definition: docs 100% ready

| Criterion | Met |
|-----------|-----|
| One cash SoT | yes |
| One atomic path | yes |
| Status/durability vocabulary | yes |
| Schema inventoriable + drift CI | yes |
| Loan commands + journal templates + errors + bootstrap | yes |
| Other features command shapes | yes |
| Reports query list + acceptance | yes |
| Iran rules + acceptance | yes |
| Standalone port pattern | yes |
| Forbidden cross-feature imports | yes |

**Verdict: documentation is implementation-complete for scoped Feature coding.**  
Remaining risk is **execution quality**, not missing contracts.
