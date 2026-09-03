# P0-FINAL-AUD-001 … 004

## AUD-001 Fixture harness

| Status | |
|--------|--|
| Spec | `fixtures/HARNESS.md`, `GOLDEN-GATE.md` |
| Executable start | `fixtures/*.json` + `src/core/fixtures/harness.ts` + `pnpm test:fixtures` |
| Scoped full suite | **not** all families green yet — only **critical pure math** vectors executable |
| Gate C | Partially unblocked for critical vectors; full Gate C still needs remaining goldens wired to operations |

## AUD-002 Runtime tree

Bootstrap present:

```text
package.json
tsconfig.json
vitest.config.ts
src/core/...
src/architecture/...
.github/workflows/ci.yml
```

Full application UI/domain still not present — coding-ready **for Core math only**.

## AUD-003 Schema freeze

Still contractual until `schema.sql` + migrations + schema-drift-test.  
Checklist: `db/SCHEMA-FREEZE-REQUIREMENTS.md`.  
**Gate D remains blocked** until SQL exists.

## AUD-004 Single implementation path

Only:

```text
transferCost()
bridgeCost()
applyEconomicSwap()
```

in `src/core/costBasis/`. Crypto Feature = adapter only.
