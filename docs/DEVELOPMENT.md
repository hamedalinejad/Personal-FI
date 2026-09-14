# DEVELOPMENT

**Owner:** engineering process · **Status:** LOCKED structure

## Coding workflow
1. Read `DOCUMENTATION-STANDARD.md` → relevant owner → `modules/<feature>.md` → `schema.sql`
2. Implement behind public API / ports only
3. Add or update fixture + test
4. Run `npm test` (and relevant gates)
5. Update `QUALITY-STATUS.md` only if a **live status** changes

## Test workflow
- Domain money: Decimal only; no `Number()` on money in domain tests
- Acceptance tests named by **capability**, not ticket IDs
- Golden/recovery fixtures under `fixtures/` (machine proof)

## Definition of done (implementation unit)
- Spec in one owner or one module
- Schema/field ownership clear if persisted
- Command/query path tested
- No silent defaults on financial fields
- Idempotent mutations where required
- Release remains NO_GO until RELEASE_PROVEN

## Status vocabulary
| Layer | Values |
|-------|--------|
| Implementation | SPEC_ONLY · SCAFFOLD · IMPLEMENTED · INTEGRATED |
| Proof | UNPROVEN · GOLDEN_GREEN · RECOVERY_GREEN · STANDALONE_GREEN · RELEASE_PROVEN |
| Release | NO_GO · CONDITIONALLY_GO · GO |

Do not use READY/DONE/GREEN as synonyms across layers.

## Commit policy
- `docs:` structure only — no silent financial rule change
- `fix:` code + test
- `feat:` capability with tests
- No new BUG/AUDIT/MATRIX specification files

## Documentation lifecycle
```
NO NEW DOC · NO NEW BUG DOC · NO NEW AUDIT DOC · NO NEW MATRIX
```
unless updating an existing **owner** listed in DOCUMENTATION-STANDARD.

## Forbidden documentation behavior
- Second owner for one concept
- Ticket IDs as domain vocabulary in normative text
- Ghost cash tables
- Treating QUALITY-STATUS as a requirements catalog

## Module template (mandatory headings)
```
1. Purpose
2. Scope
3. Supported v1 behavior
4. Unsupported / Deferred behavior
5. Actors / roles
6. UI pages
7. Sheets / drawers
8. Entities
9. Field ownership
10. Identity
11. Commands
12. Queries
13. API contract
14. State machine
15. Validation
16. Money / quantity semantics
17. FX behavior
18. Fee behavior
19. Tax behavior
20. Accounting / journal mapping
21. Cost basis / valuation
22. Persistence impact
23. Transaction boundary
24. Idempotency
25. Reversal / correction
26. Historical / asOf behavior
27. Reports
28. Standalone edition behavior
29. Licensing / capabilities
30. Edge cases
31. Error codes
32. Fixtures
33. Tests / proof
34. Machine-file references
```
Module files hold **feature-specific** behavior only. Global rules stay in global owners.


## Universal command contract (required fields)
command ID · purpose · request fields · required/optional · types · units · currency · precision · normalization · defaults · identity · validation · journal mapping · fees · FX · cost basis · DB writes · transaction boundary · idempotency · reversal · result · errors · queries · reports · standalone · fixture · invariants · recovery  
Detail per command lives in the owning `modules/<feature>.md` + API schemas when present.

## Coding sequence (do not start UI first)
```
Phase 0  semantic freeze prep (owners, dead refs, field matrix, command schemas)
Phase 1  numeric core (Decimal, precision, rounding, units, FX)
Phase 2  accounting kernel (accounts, ops, journal, invariants, reversal, posted-only reports)
Phase 3  persistence/recovery (SQLite atomicity, idempotency, crash, backup, single writer)
Phase 4  reference vertical — Loan
Phase 5  investment verticals — Crypto, Stocks, Funds, Metals
Phase 6  remaining — Income/Expense, Cheque, Tax, Physical Assets, Budget/Goals/Bills
Phase 7  browser/offline
Phase 8  licensing/standalone proof
Phase 9  UI
```

## Developer checklist (28 questions)
Before coding a feature, answer from owner + module + schema + fixture only:
owner · field kinds · identity · operationId · book base · tx currency · unit · precision · rounding · formula · FX asOf · fee roles · cost basis · P&L fees · journal legs · tables · transaction boundary · idempotency · reversal · asOf · standalone · license · errors · fixture · invariant · recovery · report impact · export survival.

If any answer is missing → documentation not ready.

## Scripts policy
- `npm run gates` = release path
- `schema:smoke` / `status:gen` = optional developer convenience; **not** normative authority

## Forbidden document families
Never create normative:
```
BUG-*.md · P0-*.md · GAP-*.md · AUDIT-*.md · VERDICT-*.md · MATRIX-*.md · FIX-*.md
```
History → Git · proof → tests/fixtures · contract → Owner · status → QUALITY/registry.

## Naming
- Source: `features/<x>/commands/<verb>.js`
- Tests: capability names (`field-preservation`, `fee-capitalization`) — not gateH/P0/BUG IDs
- Fixtures: business capability (`LOAN-FLAT.json`, `FUND-NAV-VS-TX-PRICE.json`)

## Definition of Done — 28 questions per command
owner · field kinds · identity · operationId · book base · tx currency · unit · precision · rounding · formula · FX asOf · fee role · cost basis · P&L fees · journal legs · tables · txn boundary · idempotency · reversal · asOf · standalone · license · errors · fixture · invariant · recovery · report impact · export survival  
If any undefined → **DOCUMENTATION NOT READY**.

## Change workflow
```
Feature/Bug → Owner check → Code → Test → Fixture → QUALITY-STATUS → Commit
```

## Definition of Freeze
`FREEZE_PROVEN = true` only when all hold:
```
NO DEAD REFERENCES
NO OWNER CONFLICT
NO VOCABULARY CONFLICT
NO FIELD LOSS
NO CANONICAL HASH AMBIGUITY
NO MONEY FLOAT
GOLDEN GREEN
RECOVERY GREEN
STANDALONE GREEN
COMMAND CONTRACT GREEN
```
Until then: `FREEZE_PROVEN = false` · `PRODUCTION = NO-GO`.

## Release-Proven
```
Golden Green + Recovery Green + Standalone Green
+ Browser Green (if shipping browser) + CI Green
```

## Next stage (do not start UI yet)
```
A Fix remaining semantic gaps
B Keep inventory/registry regenerated
C Complete command contracts (command-catalog + schemas)
D Complete financial goldens
E Complete recovery/standalone proof
F Freeze docs
G Accounting kernel hardening
H Loan vertical reference
I UI last
```

## Operating model
```
STANDARDIZE → CANONICALIZE → PROVE → FREEZE → CODE
```
Not: more features → more docs → more BUG/FIX files.

Golden principle: complexity in Core + Proof; simplicity in UI; precision in Accounting; flexibility in Feature; independence in Standalone; history in Git.

## Command card template (LOCKED)
Each **mutation** must be machine-described in `docs/core/registry/command-catalog.json` under `commands.<id>.card` (not a separate Markdown file per command).

Required card keys:
```
purpose, requestFields, validation, journalMapping, feeMapping, fx,
costBasis, dbWrites, transactionBoundary, idempotency, reversal,
result, errors, fixtureRefs, invariants
```
Human module file remains **one file per module**; cards live in the catalog.

## Freeze blockers A–H (live checklist — not a second requirements system)

| Blocker | Theme | Status (2026-09-14) |
|---------|--------|---------------------|
| **A** Machine contracts | command naming, full catalog, dead refs, owners, verify refs | **Mostly green** — catalog 42+cards; dead refs cleaned; keep guarding |
| **B** Core financial math | FX equation, posted journal, fee treatment, account currency, rounding | **Mostly green** — continue golden coverage |
| **C** Data integrity | holding uniqueness, rate resolver, post_state cache rules | **Mostly green** — integrity-audit + indexes |
| **D** No-field-loss | every supported command field map | **PARTIAL** — stocks/metals/crypto improved; full matrix open |
| **E** Module contract depth | command-level detail in module files | **PARTIAL** — investment locks added; baseline modules thinner |
| **F** Proof packs | non-empty golden fixtures | **PARTIAL** |
| **G** Recovery executable | matrix → tests | **PARTIAL** |
| **H** Standalone packs | one proof pack per edition | **PARTIAL** |

`FREEZE_PROVEN` requires A–H green. Do not start UI until freeze policy says so.

## Files that must not be deleted
Owner docs (`PRODUCT`…`QUALITY-STATUS`), all `docs/modules/*`, machine proof under `docs/core/**`, fixtures/tests.  
Do not recreate removed consolidation files (old command-coverage MD, core micro-docs); recover unique rules via Git → absorb into owners.

## Delete policy
- `scripts/generate-command-status-md.js` — **removed** (Markdown matrix forbidden; machine JSON only).
- `durableMemoryAdapter` — **keep** until sql.js+IDB RELEASE_PROVEN.
- `archivedZeroBalance` — **keep** (integrity tests depend on it).
- `registry.index.json` — optional; keep if `scripts/registry-index.js` consumers exist.

## Registry roles (no job overlap)
| Registry | Answers |
|----------|---------|
| `status.registry.json` | implemented / proven / deferred / release / owners |
| `command-catalog.json` | public commands, cards, capability, fixtures/tests |
| `requirements-matrix.json` | requirement id, owner define path, status, evidence |
