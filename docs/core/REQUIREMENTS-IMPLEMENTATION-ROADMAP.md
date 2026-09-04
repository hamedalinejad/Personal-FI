# Requirements Implementation Roadmap (R-001 … R-020)

**Purpose:** single list of *still-needed* implementation work with exact doc homes, method, and acceptance.  
**Phase:** documentation is largely specified; **runtime code** is on the implementation branch (`src/` not on main).

**Authority chain:** Feature/Core LOCK → this roadmap (tracking) → CODING-GATE / GO-NO-GO.

---

## P0 — Blocking before Feature command writers

| ID | Requirement | Doc home | Current state | Implementation method | Acceptance |
|----|-------------|----------|---------------|----------------------|------------|
| **R-001** | Full `schema.sql` | `db/01-schema-tables.md`, `db/schema.sql`, OPEN-001 | **Partial** — core tables in `schema.sql` | Expand `docs/core/db/schema.sql` from full table list; generate/check with drift test vs inventory; first migration = apply schema | Every table in 01-schema-tables present with types, FK, CHECK, indexes; OPEN-001 CLOSED |
| **R-002** | `runAtomicFinancialOperation` | `Canonical-Financial-Operation.md`, `Calculation-Engines.md` OperationEngine | Spec only | Core module: validate → domain apply → journal balanced → projections → **single persist boundary** with `operationId` + `commandHash` idempotency | Retry same commandHash → one op; crash mid-way → recovery, no double post |
| **R-003** | Write-to-temp-then-swap | `Technical-Architecture.md`, `Persistence-State-Machine.md` | Spec only | Persistence queue + Worker: write temp → COMMIT sqlite → await IDB/filesystem swap → then UI success | Kill process mid-write → no corrupt primary; UI success only after durable swap |
| **R-004** | Financial invariants runtime | `CANONICAL-FINANCIAL-REQUIREMENTS.md`, `Financial-Invariants.md` | Spec + unit intent | Enforce decimal strings, immutability post-post, rebuild APIs, reconcile≠repair in Core services + tests | Invariant tests green; no float money in public API |
| **R-005** | Cost-Basis Engine code | `Cost-Basis-Engine.md` | Spec + GOLDEN crypto helpers partial | `core/domain/costBasis` implement apply() for acquisition/disposal/fee/CA/transfer; wire fee roles | GOLDEN cost/fee/C2C fixtures green |
| **R-006** | Loan Schedule Engine code | `Loan-Schedule-Engine.md`, Debt-Loan feature | Spec + GOLDEN-LOAN-* docs | Product templates: declining, flat, qarz, bullet, Iran step; day count; schedule versions | GOLDEN-LOAN-QARZ/FLAT/DECLINING/VARIABLE-MID green |
| **R-007** | Cash Settlement Adapter | `Cash-Settlement-Adapter.md`, `Canonical-Cash-Model.md` | Spec | Port: settle(operation) → journal lines only; T+2 routes for stocks; acc_transactions event-only | Single cash SoT; broker T+2 payable then cash |
| **R-008** | Instrument Identity runtime | `Instrument-Identity.md`, `ref_instruments` in schema | Partial schema | Registry service; resolve symbol≠id; network_identifier; holding uniques | Two USDT networks ≠ one instrument; no assetKey PK |

**P0 exit:** OPEN-001/003/004 + R-002…R-008 harness green for scoped families → Gate allows Feature commands.

---

## P1 — Required for v1 product scope

| ID | Requirement | Doc home | Method | Acceptance |
|----|-------------|----------|--------|------------|
| **R-009** | Feature Independence | `Feature-Independence-Contract.md`, `Feature-Package-Architecture.md` | Each feature package: public API + ports only; no cross-feature repo imports; ESLint boundaries (B-007) when `src/features` exists | Standalone loan/crypto tests without Accounts UI |
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
