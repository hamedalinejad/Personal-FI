# OPEN Issues Register (live)

**Updated after:** OPEN-001…012 remediation pass  
**Authority:** this file + `GO-NO-GO.md` (not stale audit HEAD strings)

| ID | Topic | Status after pass | Residual |
|----|-------|-------------------|----------|
| OPEN-001 | Schema Freeze real coverage | **IN PROGRESS** — checklist + priority tables | need schema.sql + full column rows |
| OPEN-002 | Relationship matrix | **IMPROVED** — expanded FK table | fill remaining CA/fee/import edges at freeze |
| OPEN-003 | Field preservation proof | **IN PROGRESS** — TSV inventory started | expand to 0 undocumented |
| OPEN-004 | Golden fixture gate | **PARTIAL** — gap matrix documented | full engine pipeline |
| OPEN-005 | CI coverage | **CLOSED** — `npm run test:unit` in CI | — |
| OPEN-006 | Lint real | **DEFERRED** — explicit until Feature packages | ESLint when src/features exists |
| OPEN-007 | Authority refs | **CLOSED** — README/CODING-GATE → Think-Tank + GO-NO-GO | — |
| OPEN-008 | Audit HEAD metadata | **CLOSED** — marked historical + live pointers | — |
| OPEN-009 | Operation status vocab | **CLOSED** — posted + durabilityState only | grep residual “status=committed” |
| OPEN-010 | Date contract | **CLOSED** — Technical-Architecture aligned | — |
| OPEN-011 | Fund identity schema | **CLOSED** in matrix + freeze coverage | enforce in schema.sql |
| OPEN-012 | Crypto holding identity | **CLOSED** — residual assetKey rebuild prose fixed | — |

## Coding policy

Allowed now: Core money/costBasis/fixture harness tests.  
Blocked: Feature command writers until OPEN-001/003/004 reach Gate D/C green.

## DOC-CLN (architecture lock pass)

| ID | Status |
|----|--------|
| DOC-CLN-001 README broken ARCHIVE ref | **CLOSED** (prior) |
| DOC-CLN-002 CODING-GATE blocking source | **CLOSED** (prior + GO-NO-GO) |
| DOC-CLN-003 Audit HEAD metadata | **CLOSED** (historical marker) |
| DOC-CLN-004 status=committed vs posted | **CLOSED** (CFO) |
| DOC-CLN-005 UTC vs DATE-only | **CLOSED** (Technical-Architecture) |
| DOC-CLN-006 CI test:unit | **CLOSED**; ESLint deferred OPEN-006 |
| DOC-CLN-007 Relationship matrix 100% | **OPEN** (expanded, not complete) |
| DOC-CLN-008 Dictionary completeness | **OPEN** (= OPEN-003) |

Constitution document: `ARCHITECTURE-LOCKED.md` (sections pipeline, SoT, editions, UX-9, gates A–H, fixture list, execution order).


## 2026-09-04

- `src/` removed from main (docs-only). Restore on implementation branch.
- P0 lock files consolidated into concept homes.
- Added: Standalone license mode, IRR/Toman policy, Gate H, crash recovery, ER-from-matrix roadmap.


## B-001…B-006 tracking (2026-09-04)

| ID | Maps to | Status | Evidence / residual |
|----|---------|--------|---------------------|
| B-001 | OPEN-001 Schema Freeze | **IN PROGRESS** | `docs/core/db/schema.sql` core tables+FK added; expand stocks/funds/metals/PA columns to CLOSE |
| B-002 | OPEN-003 Field preservation | **IN PROGRESS** | `field-inventory.checklist.tsv` seeded for core/crypto/loan/cheque; target 0 undocumented |
| B-003 | OPEN-004 Golden fixture gate | **PARTIAL** | Many GOLDEN-* files exist; full engine pipeline still partial — see OPEN-004-FIXTURE-GAP.md |
| B-004 | OPEN-002 Relationship matrix | **IMPROVED** | `docs/core/db/RELATIONSHIP-MATRIX.md` + schema.sql FKs; residual CA/metals/budget edges |
| B-005 | Doc authority contradiction | **LOCKED policy** | DOC-CONSOLIDATION-POLICY § B-005 — LOCK > prose |
| B-006 | Mandatory fixtures | **DEFINED** | 07-fixtures-release-gate § B-006 families; CI green per family still residual of B-003 |

**Coding:** still blocked for Feature command writers until OPEN-001/003/004 Gate green per CODING-GATE.


## B-007…B-013 (docs hygiene 2026-09-04)

| ID | Status | Action |
|----|--------|--------|
| B-007 OPEN-006 ESLint | **DEFERRED explicit** | Add ESLint + architecture boundaries when `src/features/*` packages exist on implementation branch; docs-only `package.json` has no Feature packages yet |
| B-008 Dictionary completeness | **IN PROGRESS** | Same residual as OPEN-003 / field-inventory.checklist.tsv |
| B-009 Field-Level-SoT review | **ALIGNED note** | Cross-links to CANONICAL-FINANCIAL-REQUIREMENTS |
| B-010 Calculation-Engines | **LOCKED roles** | Engines body vs Scenario catalog vs fixtures |
| B-011 NAMING-GLOSSARY | **CLOSED** | `NAMING-GLOSSARY.md` body; `Naming-Glossary.md` pointer |
| B-012 Rounding-Policy | **CLOSED** | `rounding/Rounding-Policy.md` body; root pointer |
| B-013 CROSS-CUTTING headers | **IN PROGRESS** | Historical labels; content remains under concept homes; optional rename without deleting rules |

## R-001…R-020 requirements roadmap

Full table (doc home, method, acceptance): `REQUIREMENTS-IMPLEMENTATION-ROADMAP.md`.

P0 blockers for coding Feature writers: R-001…R-008 + OPEN-001/003/004.



## P0-DOC-001…005 / P1-DOC-006…007 (2026-09-04)

| ID | Status |
|----|--------|
| P0-DOC-001 CashSettlementPort second SoT | **LOCKED** — routing only; fin_accounts+journal |
| P0-DOC-002 acc_transactions cash ledger wording | **LOCKED** — event log/projection only |
| P0-DOC-003 Crypto rebuild identity | **LOCKED** — instrumentId only |
| P0-DOC-004 Crypto qty gross/net/fee | **LOCKED** — semantic table |
| P0-DOC-005 Crypto fee double-count | **LOCKED** — one CanonicalFeeEvent |
| P1-DOC-006 Relationship matrix | **IMPROVED** — CA/fee/import/metals/budget edges |
| P1-DOC-007 Field inventory | **IN PROGRESS** — expanded TSV; not yet 0 gap |


## BUG-01 / BUG-02 / BUG-03 (2026-09-04 evening)

| ID | Status |
|----|--------|
| BUG-01 P0-DOC-003 residual assetKey in Reversal section | **CLOSED** — instrumentId in Core reverse adapter samples |
| BUG-02 LOCKS consolidation | **CLOSED** — 15 `*-LOCKS.md` are pointers; full text in Feature main docs |
| BUG-03 FINAL-THINK-TANK-AUDIT corruption | **CLEANED** — deduped paths; live status = this register |

Prior claim «P0 lock files consolidated» was premature until BUG-02 pointer conversion.


## P0-DOC-001…014 status (content pass 2026-09-04)

| ID | Status |
|----|--------|
| P0-DOC-001 | CLOSED |
| P0-DOC-002 | CLOSED |
| P0-DOC-003 | CLOSED (Reversal samples use instrumentId — BUG-01) |
| P0-DOC-004 | CLOSED (feePresence table) |
| P0-DOC-005 | CLOSED (fee discriminator / CanonicalFeeEvent) |
| P0-DOC-006 | CLOSED (C2C dest cost = consideration, not mark) |
| P0-DOC-007 | CLOSED (totalFeesPaidBase derived) |
| P0-DOC-008 | CLOSED (legacy period return superseded) |
| P0-DOC-009 | CLOSED (accountId nullable standalone) |
| P0-DOC-010 | CLOSED (fund → instrumentId) |
| P0-DOC-011 | CLOSED (no hard-coded USDT stock model) |
| P0-DOC-012 | CLOSED (broker cash projection + port) |
| P0-DOC-013 | CLOSED (accountId validation by mode) |
| P0-DOC-014 | CLOSED (CA vs market vs feature ownership) |
| P1-DOC-015 | IN PROGRESS (RELATIONSHIP-MATRIX) |
| P1-DOC-016 | IN PROGRESS (field-inventory) |
| P1-DOC-017 | CLOSED for feature LOCKS→pointer (BUG-02); Core P0-FINAL files remain concept homes |

Code bugs: `IMPLEMENTATION-BRANCH-CODE-BUGS.md` — not verified on main.


## Verification pass 2026-09-04 (second)

| ID | Result |
|----|--------|
| BUG-01 / P0-DOC-003 Reversal samples | **CLOSED on main** — instrumentId (re-verified) |
| BUG-02 / P0-DOC-007 totalFeesPaidBase += examples | **CLOSED** — examples marked DERIVED/rebuild only |
| BUG-03 Period Return file refs | **CLOSED** — point to Essential-Reports.md |
| BUG-04 / P1-DOC-017 LOCKS files | **CLOSED** — all 15 are 7-line pointers |
| BUG-05 audit spam | **CLEANED** further |
| P1-DOC-015 / 016 | still IN PROGRESS |


## BUG-001…050 engineering batch (2026-09-04)

| Band | Status on main |
|------|----------------|
| BUG-001 schema expansion | advanced — feature tables in schema.sql |
| BUG-002…015 engines | bootstrapped stubs in src/core + canonicalDecimal tests |
| BUG-016…017 | still IN PROGRESS |
| BUG-018…025 feature schema | ADDED |
| BUG-026…028 | stubs |
| BUG-029…033 docs hygiene | cleanup |
| BUG-035…050 columns | schema-migration-notes-v1.md |

Feature UI commands still NO-GO until Gate C (GOLDEN fixtures green).


## R-021…R-060

Prioritized backlog: `REQUIREMENTS-IMPLEMENTATION-ROADMAP.md` + `THINK-TANK-R021-060-AND-FILE-LIFECYCLE.md`.  
P3 items are explicit non-goals for v1.


## REL-001…005 (relationship residuals)

Contracts locked in `db/RELATIONSHIP-MATRIX.md`.  
Runtime/schema freeze still open until engines + drift test green.

P0-DOC-001…014 reintroduction prevention: `P0-DOC-CLOSED-PREVENTION.md`.

## Engineering board (live) — 2026-09-05 post-implement

### P0

| # | Title | Status | Note |
|---|--------|--------|------|
| BUG-001 | schema.sql | Advanced Partial | + sec_* tables; drift test still open |
| BUG-002 | runAtomicFinancialOperation | **Implemented (v1)** | idempotency + journal gate + persist |
| BUG-003 | Write-to-temp-then-swap | **Implemented (v1 fs)** | temp→commit→rename swap |
| BUG-004 | Financial invariants | **Implemented (v1)** | money string, journal balance, rate |
| BUG-005 | Cost-Basis Engine | **Implemented (v1 WA)** | acq/disposal/fee/transfer/C2C helpers wired |
| BUG-006 | Loan Schedule Engine | **Implemented (v1)** | declining, flat, qarz, bullet |
| BUG-007 | Cash Settlement Adapter | **Implemented (v1)** | settle → journal lines only |
| BUG-008 | Instrument Identity | **Implemented (v1 mem)** | network-distinct registry |
| BUG-009 | Golden Fixture Gate | Partial | helpers green; full family CI still open |
| BUG-010 | Feature Independence | Stub | packages/ESLint still open |
| BUG-011 | Price Fetching | **Implemented (v1)** | manual/cached/online selection |
| BUG-012 | Currency Cross-Rate | **Implemented (v1)** | direct + pivot path |
| BUG-013 | Corporate Action Engine | **Implemented (v1)** | bonus/split/reverse_split |
| BUG-014 | Fixed Income Funds | **Implemented (v1)** | subscribe nav≠tx; reinvest 2 legs |
| BUG-015 | Migration strategy | **Implemented (v1)** | ordered runner + schemaVersion file |

**Tests:** `npm test` — 35 passing (2026-09-05).  
**Still open for production freeze:** drift test schema, full GOLDEN families, Feature packages, decimal.js precision, SQLite worker.


## P2 BUG-029…050 (2026-09-05)

| Band | Status |
|------|--------|
| 029–032 docs pointers | CLOSED / KEEP |
| 033 CROSS-CUTTING headers | IN PROGRESS optional |
| 034,037,038,046 | BY DESIGN |
| 035,039 | FIXED in schema |
| 036,040–045,047–050 | migration notes / additive apply track |

Gates: see GO-NO-GO — D is PARTIAL GO after engine implementation; B/C still NO.

## R-001…R-008 status (live 2026-09-05)

| ID | Requirement | Status | Progress |
|----|-------------|--------|----------|
| R-001 | Full schema.sql | Advanced Partial (~690+) | Feature tables added; **drift test still open** |
| R-002 | runAtomicFinancialOperation | **Implemented v1** | `operationEngine.js` + tests (idempotency, balance gate, persist) |
| R-003 | Write-to-temp-then-swap | **Implemented v1 (fs)** | `persistence/worker.js` temp→commit→rename |
| R-004 | Financial invariants runtime | **Implemented v1** | journal balance, money string, rates + decimal tests |
| R-005 | Cost-Basis Engine | **Implemented v1 (WA)** | acq/disposal/fee/transfer/C2C in `domain/costBasis/engine.js` |
| R-006 | Loan Schedule Engine | **Implemented v1** | declining/flat/qarz/bullet |
| R-007 | Cash Settlement Adapter | **Implemented v1** | settle → journal lines only |
| R-008 | Instrument Identity runtime | **Implemented v1 (memory)** | registry network-distinct; schema OK |

**P0 exit still needs:** R-001 drift test green + OPEN-001/003/004 + production SQLite/decimal.js hardening — not “all stubs”.

## OPEN issues (live 2026-09-05)

| ID | Topic | Status | Residual |
|----|-------|--------|----------|
| OPEN-001 | Schema Freeze | IN PROGRESS | drift test + full column parity |
| OPEN-002 | Relationship matrix | IMPROVED | enforce remaining edges at freeze |
| OPEN-003 | Field preservation | IN PROGRESS | expand inventory → 0 undocumented |
| OPEN-004 | Golden fixture gate | PARTIAL | full family e2e pipeline |
| OPEN-005 | CI coverage | CLOSED | npm test in CI path |
| OPEN-006 | Lint real | DEFERRED | ESLint when src/features exists |
| OPEN-007 | Authority refs | CLOSED | — |
| OPEN-008 | Audit HEAD metadata | CLOSED | — |
| OPEN-009 | Operation status vocab | CLOSED | — |
| OPEN-010 | Date contract | CLOSED | — |
| OPEN-011 | Fund identity schema | CLOSED | schema enforce done |
| OPEN-012 | Crypto holding identity | CLOSED | — |
