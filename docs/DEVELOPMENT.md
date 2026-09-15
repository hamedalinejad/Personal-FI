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

## Coding sequence (LOCKED — single plan only)
```
0  Documentation normalization (owners, dead refs, field matrix, command schemas)
1  Numeric core (Decimal, precision, rounding, units, FX)
2  Accounting kernel (accounts, ops, journal, invariants, reversal, posted-only reports)
3  Persistence / recovery (SQLite atomicity, idempotency, crash, backup, single writer)
4  Loan reference vertical
5  Investments (Crypto, Stocks, Funds, Metals)
6  Remaining modules (Income/Expense, Cheque, Tax, Physical Assets, Budget/Goals/Bills)
7  Browser offline (sql.js + IndexedDB + single-writer)
8  Standalone proof packs
9  Licensing (capability only; never delete history)
10 Semantic freeze (FREEZE_PROVEN=true only when gates green)
11 UI (six routes only; sheets/drawers)
```
Do not start UI before step 10. Do not invent parallel phase lists.

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
See **Developer checklist (28 questions)** above; same list is the DoD gate.


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

## Implementation order
See **Coding sequence (LOCKED)** above — one list only.  
Baseline tag remains `personal-fi-pre-semantic-freeze-2026-09-14` (history; not a second plan).

## “Developer must not invent economics” (LOCKED)
A command is not ready if the implementer still has to decide any of:
```
which dates matter · book base · FX · fee owner/treatment · cost-basis effect
journal legs · what is stored/returned · reversal · exact error · rounding
missing provider · crash · standalone behavior
```
Those answers live in: FINANCIAL-CORE + module owner + command-catalog card + schema + fixture.

## Forbidden next actions
```
another FINAL-AUDIT / P0 register / BUG register / Markdown command matrix
another architecture or accounting “master” document
page-per-feature · second cash ledger · per-edition accounting kernel
restoring deleted archive authority docs into active tree
```

## Philosophy (LOCKED)
Complexity in Financial Core + proof · simplicity in UI · precision in accounting ·
flexibility in features · independence in standalone · history in Git.

## Building one standalone edition
1. Implement Core paths used by the feature (operation, journal, fee, FX, persistence).
2. Implement `src/features/<feature>/public-api` only surface.
3. Wire local settlement (`CashSettlementPort`) — no Accounts UI dependency.
4. Add statement/query needed for that edition.
5. Golden + recovery + standalone tests green before STANDALONE_GREEN.
6. Do not copy Core formulas into the feature package.

## Project phase vocabulary (LOCKED)
| Term | Meaning |
|------|---------|
| **Specification authority** | Owner Markdown + machine registries/schema |
| **Reference implementation scaffold** | Existing `src/**`, fixtures, tests, gates — intentional, incomplete |
| **Not documentation-only** | Do not treat the repo as prose-only or delete working engines to “start coding” |
| **Production coding** | Harden scaffold toward RELEASE_PROVEN — not greenfield rewrite |
| **FREEZE_PROVEN** | Semantic contracts closed + goldens/recovery/standalone (and browser if shipping) |
| **RELEASE_PROVEN / GO** | Full evidence matrix green |

Forbidden: describing HEAD as “no code yet” while `src/` engines exist.

## Command economics (LOCKED)
`docs/core/registry/command-catalog.json` is the machine SoT for each public mutation card
(validation, errors, fixtures, recovery, journal/fee/FX notes).  
Do **not** invent economics from source when the card is SPEC_LOCKED or richer.
Human module files own feature narrative; they do not replace the catalog card.

## Historical P0/BUG regressions (LOCKED process)
Issues already fixed (fee vocabulary, feeQuantity, silent fee default, hash/canonicalization,
book base, NAV≠tx price, capitalized fee GL legs, posted-only reports, stock sell fees,
holding uniqueness, settle schema probing, metals purity/delivery, command aliases, etc.)
must **not** be re-opened as new Markdown bug documents.

On regression:
1. failing test / new golden
2. code fix
3. owner-doc update **only if** the contract changed
4. QUALITY-STATUS line if useful

Git retains history. No `BUG-*.md` / `P0-*.md` restoration.

## Implementation phases (LOCKED order)
| Phase | Focus |
|-------|--------|
| 0 | Documentation normalization (inventory, no dead refs, command cards, no duplicate authority) |
| 1 | Numeric core proof (Decimal, units, IRR/Toman, FX) |
| 2 | Accounting kernel (CoA, operation, journal, posted, reversal, opening, settlement) |
| 3 | Persistence/recovery (atomic SQLite, idempotency, backup/restore, rebuild, single-writer) |
| 4 | Loan reference vertical |
| 5 | Investments (Crypto, Stocks, Funds, Metals) |
| 6 | Income/Expense, Cheque, Tax, Physical Assets, Budget |
| 7 | Browser sql.js + IndexedDB RELEASE_PROVEN |
| 8 | Standalone editions one-by-one (full STANDALONE_GREEN path) |
| 9 | Licensing (capability only; no data deletion) |
| 10 | Semantic freeze |
| 11 | UI — six routes only; sheets/drawers for the rest |

## Safe deletion protocol
1 filesystem inventory → 2 classify → 3–6 reference search (source, package, registry, tests) → 7 knowledge in owner → 8 no unique proof → 9 migration safe → 10 delete → 11 regenerate inventory/manifest → 12 gates.  
Never delete by filename alone. Keep: schema, manifests, field matrices, fixtures, durableMemoryAdapter until browser proven.

## Developer handoff contract (LOCKED)
Implement any command using **only**:
```
Product scope → Module spec → Command card → Field-preservation matrix
→ Schema → Fixture → Tests
```
The developer must **not** invent: which dates matter, book base, FX requirement, fee treatment, cost-basis effect, journal legs, which fields are stored, reversal, error codes, rounding, historical provider behavior, backup behavior, or standalone behavior.  
If any of those remain implicit, the command is **not documentation-complete**.

## Per-command checklist (LOCKED)
Every mutation card + matrix must cover:

**Identity** — command ID · feature · entity · operationId · economic hash inputs  

**Inputs** — every field · required/optional · type · unit · currency · precision · range · null semantics  

**Normalization** — decimal · dates · identifiers · aliases · enums  

**Validation** — business · accounting · cross-field · identity  

**Financial** — book base · tx currency · FX · rate as-of · fees · treatment · cost basis · P&L · tax · rounding  

**Journal** — debit/credit · line kinds · amountInBase · accounts · balance proof  

**Persistence** — tables/columns · relationships · transaction boundary  

**Reliability** — idempotency · conflict · retry · crash  

**Reversal** — inverse · originalOperationId · rebuild  

**Read side** — result · list/detail · statement · reports · asOf  

**Product** — standalone · license · UI sheet placement  

**Proof** — fixture · golden · recovery · field-preservation test  
