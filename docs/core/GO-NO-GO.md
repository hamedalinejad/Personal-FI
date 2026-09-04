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

## Engineering board (live) — R-001…R-015 / BUG-001…015

| # | Title | Status | Note |
|---|--------|--------|------|
| 1 | schema.sql incomplete | Advanced Partial | ~690 lines; drift test still open |
| 2 | runAtomicFinancialOperation | Stub only | `notImplemented` |
| 3 | Write-to-temp-then-swap | Stub only | no real worker |
| 4 | Financial invariants runtime | Partial | only canonicalDecimal tested (+ BUG-CODE helpers) |
| 5 | Cost-Basis Engine | Stub only | no full apply() for all types |
| 6 | Loan Schedule Engine | Stub only | no templates |
| 7 | Cash Settlement Adapter | Stub only | no settle() |
| 8 | Instrument Identity runtime | Partial | schema OK; registry stub |
| 9 | Golden Fixture Gate | Partial | most families no engine assert |
| 10 | Feature Independence | Stub only | no package + ESLint |
| 11 | Price Fetching | Spec only | no PriceProvider code |
| 12 | Currency Cross-Rate | Spec only | no ValuationContext code |
| 13 | Corporate Action Engine | Spec only | no CA transform code |
| 14 | Fixed Income Funds | Spec only | no fund engine |
| 15 | Migration strategy | Spec only | no migration runner |

**Gate:** Feature command coding **NO-GO** until rows 2–7 implement and row 9 scoped families green.
