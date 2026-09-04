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
