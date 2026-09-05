# Go / No-Go

**Live authority** for coding readiness. Historical narrative: `FINAL-THINK-TANK-AUDIT-2026-09-03.md`.  
**Constitution:** `ARCHITECTURE-LOCKED.md`.

| Gate | Status | Notes |
|------|--------|-------|
| Continued documentation | **GO** | concept homes only |
| A — Authority | **MOSTLY GO** | DOC-CLN residual tracked in OPEN register |
| B — Schema freeze | **NO** | OPEN-001 |
| C — Numeric fixtures | **NO** | OPEN-004 partial |
| D — Financial path code | **NO** | Core helpers only |
| E — Standalone | **NO** | fixtures structural |
| F — Offline recovery | **NO** | contract only |
| G — Rebuild determinism | **NO** | needs engines |
| H — No-field-loss proof | **NO** | inventory started OPEN-003 |
| Limited Core + unit tests | **GO** | money/costBasis/harness |
| Feature production code | **NO** | until B+C green for that family |
| Production release | **NO** | |

## One-liner

> Do not add another P0 file. Freeze schema + field graph, green golden fixtures, implement one vertical Feature through API → Operation → Journal → Cash → Persist → Report.

## Edition commercial lock

License/capability flags **must not** delete or rewrite accounting history.

**Phase:** documentation-only on `main` (`src/` absent). Implementation branch will restore runtime + CI tests.

## Requirements R-001…R-020

See `REQUIREMENTS-IMPLEMENTATION-ROADMAP.md`.  
**NO-GO** for Feature command implementation until P0 row (R-001…R-008) acceptance criteria met for the scoped release.



## 2026-09-04 live gates

| Gate | Status |
|------|--------|
| B — Schema freeze | **NO** |
| C — Numeric fixtures | **NO** |
| D — Financial path code | **NO** (no src on main) |
| E — Standalone | **NO** |
| F — Offline recovery | **NO** |
| G — Rebuild determinism | **NO** |
| H — No-field-loss proof | **NO** |

**Feature command coding: NO-GO** until P0 roadmap R-001…R-008 and gates B/C progress.


## Scope discipline

R-021…R-051 may be planned in parallel **docs**, but **implementation order** remains Core R-002…R-008 before Iran extras and full report suite.  
R-036/037/056–058 = P3 non-goals for v1.

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

## Coding gates (live 2026-09-05 evening)

| Gate | Status | Note |
|------|--------|------|
| A — Authority | MOSTLY GO | residual DOC-CLN tracked |
| B — Schema freeze | **NO** | drift test + full CHECK still open |
| C — Numeric fixtures | **NO** | full GOLDEN families not e2e green |
| D — Financial path code | **PARTIAL GO** | OperationEngine, worker, invariants, cost/loan/cash v1 implemented + unit tests |
| E — Standalone packages | **NO** | Feature packages + ESLint boundaries missing |
| F — Offline recovery | **PARTIAL** | fs temp-swap v1; not full SQLite+IDB crash matrix |
| G — Rebuild determinism | **PARTIAL** | engines exist; not all asset rebuild paths |
| H — No-field-loss proof | **NO** | inventory incomplete |
| Limited Core + unit tests | **GO** | `npm test` 35+ passing |
| Feature production code | **NO** | until B+C for family |
| Production release | **NO** | |

P2 hygiene: BUG-029–032,034–035,037–039,046 closed/by-design; 033 optional; 036/040–050 migration track.
