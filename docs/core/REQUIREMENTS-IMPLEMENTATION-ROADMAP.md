# Requirements Implementation Roadmap (R-001 … R-060)

**Purpose:** single list of *still-needed* implementation work with exact doc homes, method, and acceptance.  
**Phase:** documentation is largely specified; **runtime code** is on the implementation branch (`src/` not on main).

**Authority chain:** Feature/Core LOCK → this roadmap (tracking) → CODING-GATE / GO-NO-GO.

---

## P0 — Blocking before Feature command writers

| ID | Requirement | Doc home | Current state | Implementation method | Acceptance |
|----|-------------|----------|---------------|----------------------|------------|
| **R-001** | Full `schema.sql` | `db/01-schema-tables.md`, `db/schema.sql`, OPEN-001 | **Advanced** (Income/Expense/ln_loan_fee_tiers/tax_categories added 2026-09-05; namespaces locked; no duplicate CREATE) | Finish remaining CHECKs/indexes; drift test docs↔schema = 0; full column inventory | OPEN-001 residual reduced |
| **R-002** | `runAtomicFinancialOperation` | `Canonical-Financial-Operation.md` + `src/core/domain/operation/operationEngine.js` | **Implemented v1** (atomic op helpers; durability path partial) |
| **R-003** | Write-to-temp-then-swap | `Persistence-State-Machine.md` + `src/core/persistence/worker.js` | **Implemented v1** (SQLite path design; worker P0-008 open) |
| **R-004** | Financial invariants runtime | `CANONICAL-FINANCIAL-REQUIREMENTS.md` + `src/core/domain/invariants/` + `money/canonicalDecimal.js` | **Partial** (decimal boundary tested; other validators stub) | Wire all invariants into OperationEngine before persist | Invariant tests green |
| **R-005** | Cost-Basis Engine code | `Cost-Basis-Engine.md` + `src/core/domain/costBasis/engine.js` | **Implemented v1** (cost basis helpers; full asset classes + fixtures OPEN-004) |
| **R-006** | Loan Schedule Engine code | `Loan-Schedule-Engine.md` + `src/core/domain/loan/scheduleEngine.js` | **Implemented v1** (loan schedule engine docs + helpers) |
| **R-007** | Cash Settlement Adapter | `Cash-Settlement-Adapter.md` + `src/core/domain/cash/settlementAdapter.js` | **Implemented v1** (CashSettlementPort contract; adapters) |
| **R-008** | Instrument Identity runtime | `Instrument-Identity.md` + schema + `src/core/domain/instrument/registry.js` | **Implemented v1** (instrument registry design; mem registry) |

**P0 exit:** OPEN-001/003/004 + R-002…R-008 harness green for scoped families → Gate allows Feature commands.

---

## P1 — Required for v1 product scope

| ID | Requirement | Doc home | Method | Acceptance |
|----|-------------|----------|--------|------------|
| **R-009** | Feature Independence | `Feature-Independence-Contract.md`, `Feature-Independence-Contract.md` | Each feature package: public API + ports only; no cross-feature repo imports; ESLint boundaries (B-007) when `src/features` exists | Standalone loan/crypto tests without Accounts UI |
| **R-010** | Price Fetching | `features/.../Price-Fetching.md` + 19-* | `PriceProvider`: Manual \| Cached \| Online; offline = Manual+Cached; selection policy P0-FINAL-007 | Airplane mode sell with last_known + reconciliationNeeded |
| **R-011** | Currency Cross-Rate | `Currency-CrossRate.md`, FX locks P0-FINAL-006/008 | ValuationContext + path composition + source priority | EUR→USD→IRR deterministic with same snapshot |
| **R-012** | Corporate Action Engine | `Corporate-Action-Engine.md`, Stocks CA locks | CA transforms only via engine; rights cost BUG-D01; bonus/split fixtures | STOCK-CORPORATE-ACTION fixture green |
| **R-013** | Fixed Income Funds | `Fixed-Income-Funds.md`, FI locks | NAV≠tx price; valuationMode; reinvest one op two legs | FUND-NAV-VS-TX-PRICE + reinvest fixtures green |
| **R-014** | Migration strategy | `db/06-migration-backup-audit.md`, schemaVersion | Ordered migrations `(id, from, to, checksum, success)`; backup before migrate; rollback doc per version | Migrate vN→vN+1 on sample DB success + audit row |
| **R-015** | Fixtures / CI Gate | `db/07-fixtures-release-gate.md`, `fixtures/GOLDEN-*`, CODING-GATE | Harness loads JSON/MD expected; CI job per family; financial release blocked if red | Gate C: family green before Feature writers |

---

## P2 — Later versions

| ID | Requirement | Doc home | Method | When |
|----|-------------|----------|--------|------|
| **R-016** | Portfolio Analytics | Portfolio-Wealth-Overview / Reports | After R-005/007/011; Attribution v1 + Period Return v1 | Post core engines |
| **R-017** | Tax Engine | Tax-Management, TX locks | linkedTaxEventId; payTax one op | After trades + realized |
| **R-018** | Reports & Dashboard | Reports-Analytics, Dashboard | Snapshot + watermark; no multi-feature SQL from UI | After data plane stable |
| **R-019** | License Offline | License-Offline.md | License outside financial DB; one SQLite per user | Parallel to v1 shell |
| **R-020** | Iran-specific | `docs/core/iran/*`, Iran-Market-Rules, Toman display | IRR storage; Toman display; T+2; Sayadi; qarz templates | Integrated in P0/P1 engines above |

---

## Suggested implementation order

```text
1. R-001 schema expand + drift test
2. R-003 persistence swap + R-002 atomic operation shell
3. R-004 invariants + R-008 identity + R-007 cash port
4. R-005 cost basis + R-015 fixture harness (crypto family)
5. R-006 loan engine + loan fixtures
6. R-010/R-011 price + FX
7. R-012/R-013 stocks CA + funds
8. R-009 package boundaries + R-014 migrations
9. R-016…R-020 as scoped releases
```

---

## Tracking

| Residual OPEN | Related R-ids |
|---------------|---------------|
| OPEN-001 | R-001 |
| OPEN-003 | field inventory (feeds R-001/R-004) |
| OPEN-004 | R-015 |
| OPEN-006 | R-009 (ESLint when src exists) |

Update this file when a requirement moves to **IMPLEMENTED** (link commit + fixture green).

---

## Extended requirements R-021 … R-060 (think-tank 2026-09-04)

Authority for prioritization: `THINK-TANK-R021-060-AND-FILE-LIFECYCLE.md`.

### P1 — Iran & books (integrate into existing engines)

| ID | Requirement | Home | Method |
|----|-------------|------|--------|
| R-021 | Bank deposit interest (Iran) | Accounts-Banking | Interest accrual event; day/month count policy |
| R-022 | Broker fee schedules | Stocks Iran | Fee table → CanonicalFeeEvent |
| R-024 | ETF vs fixed income | Fixed-Income-Funds | valuationMode NAV vs market |
| R-027 | Opening entry | Canonical-Financial-Operation | opening op all classes (P0-FINAL-014) |
| R-029 | AR/AP beyond cheque | Cheque + Parties | receivable/payable ops |
| R-031 | Iran loan templates | Loan | mehr/housing/qarz product templates |
| R-032 | Late payment penalty | Loan | penalty component + schedule |
| R-033 | Jalali holidays due dates | Loan + calendar | business calendar adapter |
| R-038 | Balance sheet | Reports | projection from journal |
| R-039 | P&L statement | Reports | projection |
| R-040 | Cash flow statement | Reports | projection |
| R-041 | Journal book | Reports | fin_journal_* listing |
| R-042 | General ledger | Reports | by fin_account |
| R-043 | Subsidiary ledger | Reports | sub-account filter |
| R-044 | Account activity | Reports | account history |
| R-047 | Jalali/Gregorian | Settings | calendar display + businessDate |
| R-048 | FA/EN i18n | Settings | message catalogs |
| R-049 | Scheduled backup | Settings | export job |
| R-050 | Excel/CSV import | Settings + Import | mapping + unknownFields envelope |
| R-051 | DB encryption | Security | SQLCipher-class at rest |

### P2

R-023 Codal · R-025 bonds · R-026 housing/car · R-028 closing · R-030 depreciation · R-034 staking · R-035 airdrop · R-045 period compare · R-046 XLSX/PDF · R-052 biometric · R-053 auto-lock · R-054/055 dashboard · R-059 sub-accounts · R-060 report FX translation

### P3 (out of v1)

R-036 NFT · R-037 DeFi · R-056 webhooks · R-057 cloud sync · R-058 multi-entity

### Status snapshot

| R-001…R-008 | Bootstrap src stubs + schema expansion; not production-complete |
| R-009…R-020 | Spec / later |
| R-021…R-060 | Prioritized above; implement only after Core money path green |


## File deletion decisions (listed only — think-tank)

| Item | Decision |
|------|----------|
| Trackers OPEN / GO-NO-GO / REQUIREMENTS roadmap | **DELETED** until all items CLOSED |
| FINAL-THINK-TANK-AUDIT | **DELETED historical** until unique rules fully in concept homes |
| AUDIT-HISTORY-NOTE | **DELETED thin HISTORICAL** |
| Naming-Glossary.md / Rounding-Policy.md / DOCUMENTATION-STYLE-P2.md | **DELETED** (pointers removed 2026-09-05 after zero-ref) |
| DOCUMENTATION-STYLE-P2 | **Pointer** to DOC-CONSOLIDATION (done) |
| FEATURE-README-TEMPLATE | **Moved** to `.github/` (done) |
| 15× feature `*-LOCKS.md` | **DELETED** as ~7-line pointers |
| GOLDEN skeletons / HARNESS | **DELETED** until expected values filled |
| `src/` | **DELETED bootstrap** (not delete) |
| feature-id-map.json | **DELETED** |

Do not delete files outside this table without a new explicit decision.

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

---

## 2026-09-05 status note (Grok audit)

**Schema (R-001):** domain tables for Income, Expense, Loan fee tiers, tax_categories added. Cash SoT remains Core-only. Namespaces locked (`not_`, `rpt_`). Duplicate CREATE defect verified absent.

**File lifecycle:** pure pointer files (`Naming-Glossary.md`, root `Rounding-Policy.md`, `DOCUMENTATION-STYLE-P2.md`) deleted after zero-reference update. Feature `*-LOCKS.md` pointers retained (still referenced from feature main docs; optional delete after full lock text migration).

**Still incomplete (priority order for next implementation branch):**
1. R-001 residual — full column CHECKs + drift test
2. R-002 / R-003 — atomic op + durable WAL/temp-swap
3. R-004 / R-005 / R-006 / R-007 — invariants, cost-basis, loan schedule (Iran templates), cash settlement
4. R-008 / R-010 / R-011 — instrument registry, price, FX multi-hop
5. R-012 / R-013 / R-021–033 — CA, funds, Iran bank interest/broker fees/loans
6. R-038–044 — classic accounting reports (BS/P&L/CF/Journal/GL)
7. R-014 / R-015 / R-047–051 — migrations, fixtures/CI, shell/security/Jalali/i18n/encryption
8. Explicit v1 exclusions (R-036/037/056/057/058) remain out of scope

No code on main; all above are docs-tracked for the implementation branch.

## R-009…R-019 acceptance lock (2026-09-07)

| ID | Acceptance (must be demonstrable) | Depends |
|----|-----------------------------------|---------|
| **R-009** | Loan-only (and crypto-only) package runs CRUD + schedule/report without Accounts UI; no import of another feature's `internal/` | ESLint when `src/features` exists (OPEN-006) |
| **R-015** | Each GOLDEN family job green; schema-drift PASS; financial release blocked if red | OPEN-004 harness |
| **R-016** | Attribution v1 + Period Return v1 on Portfolio-Wealth-Overview; numbers match golden | R-005 cost basis, R-007 cash, R-011 FX/price |
| **R-017** | Tax event links `operation_id`; `payTax` is one `fin_operations`; report period_key | Realized P&L path |
| **R-018** | Reports/Dashboard read snapshots + watermark only; no ad-hoc multi-feature SQL from UI | Stable data-plane + R-015 |
| **R-019** | License blob outside financial SQLite; one DB file per user; expiry cannot wipe history | Shell v1 parallel |

Docs authority already present: Feature-Independence-Contract, GOLDEN-GATE, Portfolio-Wealth-Overview, Tax-Management, Reports-Analytics, Dashboard, License-Offline.

## R-021…R-051 Iran / Reports / Settings (spec lock 2026-09-07)

### P1 scope

| ID | Requirement | Home | Spec note |
|----|-------------|------|-----------|
| R-021 | Bank deposit interest (Iran) | Accounts-Banking | Accrual event; day/month count policy (Jalali-aware) |
| R-022 | Brokerage fee schedule | Stocks-Iran | Fee table → CanonicalFeeEvent on trade |
| R-024 | ETF vs fixed-income | Fixed-Income-Funds | valuationMode: NAV \| market |
| R-027 | Opening constraint | Canonical-Financial-Operation | opening op for all asset classes |
| R-029 | AR/AP beyond cheque | Cheque + Parties | receivable/payable operations |
| R-031 | Iranian loan templates | Debt-Loan | mehr / housing / qarz templates |
| R-032 | Loan late penalty | Debt-Loan | penalty component + schedule |
| R-033 | Jalali holidays & due dates | Loan + iran calendar | business calendar adapter |
| R-038…044 | Seven financial statements | Reports-Analytics | projections from journal only |
| R-047 | Jalali/Gregorian display | Settings-Tools | calendar mode + businessDate |
| R-048 | i18n FA/EN | Settings-Tools | message catalogs |
| R-049 | Scheduled backup | Settings-Tools | export job |
| R-050 | Import Excel/CSV | Settings + Import | mapping + unknownFields envelope |
| R-051 | DB encryption at rest | Security-Privacy | SQLCipher-class |

### P2 (later versions — think-tank)

R-023 Codal · R-025 bonds · R-026 housing/auto assets · R-028 period close UI · R-030 depreciation engine · R-034 staking · R-035 airdrop polish · R-045 period compare · R-046 XLSX/PDF export · R-052 biometric · R-053 auto-lock · R-054/055 dashboard widgets · R-059 sub-accounts · R-060 report FX translation

### File lifecycle (confirmed)

**Deleted — do not recreate:** feature `*-LOCKS.md` pointers, root Naming-Glossary/Rounding-Policy/DOCUMENTATION-STYLE-P2, Architecture-Final, Concept-Ownership-Matrix, Financial-Scenario-Catalog, Feature-Package-Architecture, Audit-vs-Financial-Event, IMPLEMENTATION-BRANCH-CODE-BUGS, CROSS-CUTTING/CROSS-FEATURE batch audits, Documentation-Audit-*, FEATURE-BUG-RESOLUTIONS.

**Keep:** `fixtures/HARNESS.md` (live refs from GOLDEN-* fixtures).

**Protected canonical (delete forbidden):** Data-Dictionary, Field-Level-SoT, Ownership-Matrix, Source-of-Truth-Matrix, Domain-Dependency-Matrix, Feature-API-Contract, Feature-Independence-Contract, Cash-Settlement-Adapter, Canonical-Cash-Model, Instrument-Identity, CANONICAL-FINANCIAL-REQUIREMENTS, CODING-GATE, fixtures/**, features/**


## R-002…R-008 status sync 2026-09-08

| ID | Live status | Evidence |
|----|-------------|----------|
| R-002 Atomic operation | Implemented v1 | Core helpers + durability states in schema |
| R-003 Durable persistence | Implemented v1 (design) | WAL/temp→swap contract; SQLite worker = P0-008 open |
| R-004 Exact decimal | Implemented v1 | canonicalDecimal + P0-CODE-001 regression |
| R-005 Cost basis | Implemented v1 helpers | Cost-Basis-Engine + P0-CODE-002…005; full families OPEN-004 |
| R-006 Loan schedules | Implemented v1 (docs+engine design) | Loan-Schedule-Engine.md |
| R-007 Cash settlement | Implemented v1 (contract) | Cash-Settlement-Adapter; one SoT |
| R-008 Instrument registry | Implemented v1 (design/mem) | Instrument-Identity; schema ref_instruments |

Do **not** re-list these as Stub on main. Residual = full CI families + feature packages.

---

## Product path to professional v1 (2026-09-08)

**Thesis:** design coverage is wide; gap is **proof + runtime execution**, not more parallel P0 docs.

### P0 — must be green before any Feature production release

| ID | Need | Home | Proof |
|----|------|------|-------|
| R-001 | Schema freeze | schema.sql + 01-schema-tables + inventory | drift test PASS + Gate H undocumented=0 |
| R-002 | Atomic financial operation | Canonical-Financial-Operation + operationEngine | same commandHash → one op; full path test |
| R-003 | Crash-safe persistence | Persistence-State-Machine + worker | crash matrix + restore |
| R-004 | Runtime financial invariants | Financial-Invariants + money | negative + property tests |
| R-005 | Cost basis complete | Cost-Basis-Engine | crypto golden family green |
| R-006 | Loan schedule complete | Loan-Schedule-Engine | loan golden family green |
| R-007 | Cash settlement one SoT | Cash-Settlement-Adapter | standalone + integrated |
| R-008 | Instrument identity | Instrument-Identity | USDT-TRC20 ≠ USDT-ERC20 |

**Docs/contracts for R-002…R-008 = Implemented v1.** Remaining = executable proof (OPEN-001…004, worker, full fixtures).

### P1 — product completeness (after P0 families)

| ID | Need |
|----|------|
| R-009 | Feature independence tooling (ESLint boundaries) |
| R-010 | Price fetching (manual/cache/online, as-of, stale) |
| R-011 | FX cross-rate deterministic multi-hop |
| R-012 | Corporate actions one owner |
| R-013 | Fixed-income funds NAV≠tx, reinvest |
| R-014 | Migration runner checksum + backup |
| R-015 | Golden/CI gate per family |
| R-020 | Iran cross-cutting (IRR/Toman, Jalali, T+2, Sayadi) |
| R-021 | Bank deposit interest |
| R-022 | Broker fee schedules |
| R-024 | ETF vs fixed-income valuationMode |
| R-027 | Opening entries all classes |
| R-029 | AR/AP beyond cheque |
| R-031…033 | Iran loan templates, penalty, Jalali calendar |
| R-038…044 | Classic reports from journal only |
| R-047…051 | Locale, backup, import, encryption |

### P2 — after data-plane stable

R-016 Portfolio analytics · R-017 Tax · R-018 Reports/Dashboard shell · R-019 Offline license

### P3 — explicit non-goals for v1 (do not sneak in)

**R-036 NFT · R-037 DeFi · R-056 Webhooks · R-057 Cloud sync · R-058 Multi-entity**

Keep out of v1 architecture and schema scope.

### Engineering order (recommended)

1. R-001 drift + Gate H evidence  
2. R-015 family CI (crypto + loan first)  
3. R-002…R-008 runtime proof on existing helpers  
4. R-003 worker + crash matrix  
5. One vertical Feature (Loan or Crypto) end-to-end  
6. R-009 boundaries · R-014 migrations · Iran P1 (R-020…033)  
7. R-016…R-019  
