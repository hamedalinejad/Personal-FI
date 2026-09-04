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

## Engineering board (live) — 2026-09-05

### P0 (none fully closed)

| # | Title | Location | Status | Note |
|---|--------|----------|--------|------|
| BUG-001 | schema.sql incomplete | docs/core/db/schema.sql | Advanced Partial (~690) | drift test open; CHECKs incomplete; migration notes v1 |
| BUG-002 | runAtomicFinancialOperation | operationEngine.js | Stub only | notImplemented |
| BUG-003 | Write-to-temp-then-swap | persistence/worker.js | Stub only | no worker body |
| BUG-004 | Financial invariants runtime | domain/invariants + money | Partial | canonicalDecimal + BUG-CODE helpers; other validators stub |
| BUG-005 | Cost-Basis Engine | domain/costBasis/engine.js | Stub only | full apply() missing (helpers exist under costBasis/) |
| BUG-006 | Loan Schedule Engine | loan/scheduleEngine.js | Stub only | no templates |
| BUG-007 | Cash Settlement Adapter | cash/settlementAdapter.js | Stub only | no settle() |
| BUG-008 | Instrument Identity runtime | instrument/registry.js | Partial | schema OK; registry stub |
| BUG-009 | Golden Fixture Gate | fixtures/OPEN-004 | Partial | ~3–4 families assert; ~11 NO engine |
| BUG-010 | Feature Independence | Feature-Independence-Contract | Stub only | no packages/ESLint |
| BUG-011 | Price Fetching | 19-Price-Fetching | Spec only | no PriceProvider |
| BUG-012 | Currency Cross-Rate | 17-Currency-CrossRate | Spec only | no ValuationContext code |
| BUG-013 | Corporate Action Engine | Corporate-Action-Engine.md | Spec only | no CA transform code |
| BUG-014 | Fixed Income Funds | Fixed-Income-Funds | Spec only | no fund engine |
| BUG-015 | Migration strategy | 06-migration-backup-audit | Spec only | no migration runner |

### P1

| # | Title | Status | Note |
|---|--------|--------|------|
| BUG-016 | Relationship Matrix | Improved | REL contracts written; edges not fully enforced |
| BUG-017 | Field inventory | In progress | core/crypto/loan/cheque seeded; not zero gap |
| BUG-018 | Stocks schema | Added | tables in schema; no engine |
| BUG-019 | Metals schema | Added | tables; no engine |
| BUG-020 | Budget/Goals schema | Added | tables; no engine |
| BUG-021 | Tax schema | Added | tables; no engine |
| BUG-022 | Reports schema | Added | rpt_snapshots; no engine |
| BUG-023 | Settings schema | Added | usr_settings |
| BUG-024 | Security schema | Missing | no encryption/security tables |
| BUG-025 | Portfolio/Physical schema | Added | pa_* tables (physical assets lineage) |
| BUG-026 | Multi-Tab Writer | Stub only | contract only |
| BUG-027 | Reconciliation | Stub only | contract only |
| BUG-028 | Integrity Engine | Stub only | contract only |

**Feature command coding: NO-GO** until P0 BUG-002…007 implement and BUG-009 scoped families green.
