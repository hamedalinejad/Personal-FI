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


## P0-001…030 progress (2026-09-05)

| Band | Status |
|------|--------|
| P0-001 CI | FIXED — npm test + schema smoke; src required |
| P0-002…005,026 Decimal | FIXED — decimal.js, no Number money path |
| P0-006/007 operationId + durable idempotency file | FIXED v1 |
| P0-009 duplicate CREATE | FIXED |
| P0-013 Income/Expense cash path lock | FIXED prose |
| P0-014 ARCHITECTURE-LOCKED live status | FIXED |
| P0-017 reconcile | FIXED v1 detect/approve plan |
| P0-018 loan residual last period | IMPROVED |
| Remaining P0-008/010–012/019–025/027–030 | OPEN — SQLite ledger, full fixtures, feature packages |

Deleted: IMPLEMENTATION-BRANCH-CODE-BUGS.md (superseded by BUG-CODE-REGRESSION-INVARIANTS.md)

## 2026-09-05 Schema audit remediation (Grok pass)

| Area | Action | Status |
|------|--------|--------|
| Income | Added `inc_transactions` + `inc_recurring` to schema.sql with operation_id, void/reversal, provenance | CLOSED |
| Expense | Added `exp_transactions` + `exp_recurring` symmetric | CLOSED |
| Loans | Added `ln_loan_fee_tiers` with effective range, ordering, calculation semantics | CLOSED |
| Crypto/Stocks/Metals cash | Confirmed projection-only (inv_crypto_cash) + Core journal SoT; no ghost tables | CLOSED |
| Budget | bg_transfers resolved as journal-linked via existing bg_transaction_links; no table | CLOSED |
| Notifications | Canonical `not_notifications`; docs notif_* → not_ | CLOSED |
| Reports | Canonical `rpt_snapshots`; docs rep_* → rpt_ | CLOSED |
| Tax | `tax_events` event ledger + new `tax_categories` config | CLOSED |
| Duplicate CREATE | Verified single CREATE for import_raw_records and fin_reconcile_runs; additive notes only | CLOSED |
| Field no-loss | All new tables carry operation_id, source_*, import_*, FX, reversal, decimal TEXT | LOCKED |

OPEN-001 residual reduced: priority domain tables now present.

## 2026-09-05 File lifecycle + Requirements residual

| Action | Result |
|--------|--------|
| Delete pointer files | Naming-Glossary.md, root Rounding-Policy.md, DOCUMENTATION-STYLE-P2.md **DELETED** after zero-ref |
| Feature *-LOCKS.md | Kept (optional; still referenced from feature main docs) |
| R-001 | Advanced (domain tables present); residual = full CHECKs + drift test |
| R-002…R-015 + Iran + reports | Still incomplete — tracked in REQUIREMENTS-IMPLEMENTATION-ROADMAP.md |
| Explicit v1 exclusions | NFT/DeFi/webhooks/cloud sync/multi-entity remain out |

Authority for residual work order remains the roadmap + GO-NO-GO.

## 2026-09-05 Reports + file lifecycle pass

| Item | Result |
|------|--------|
| MR-297…309 Reports | All ✅ LOCKED in Essential-Reports.md |
| ARCHITECTURE-LOCKED.md | Converted to pointer → ARCHITECTURE-LOCKED.md |
| Canonical-Ownership-Matrix.md | Converted to pointer → Canonical-Ownership-Matrix.md |
| fixtures/ (golden scenarios) | Converted to pointer → fixtures/ |
| Feature-Independence-Contract.md | Converted to pointer → Feature-Independence-Contract.md |
| Already-deleted list (4.1) | Confirmed — do not recreate |
| Remaining 4.2 candidates | Kept for unique-content verification in next pass |
| Authority files (4.3) | Untouched |

## 2026-09-05 Schema freeze completion pass

| Area | Result |
|------|--------|
| PARTIAL tables | CHECKs + missing columns added (durability_state, line_number/line_kind, reconciled_by, is_active, start/maturity, bounced_reason, tx_type/ca_type/status checks, recurring FKs, pa_asset_id FK, …) |
| Missing CREATE (real) | docs_*, not_settings, not_custom_reminders, rpt_presets, rpt_net_worth_snapshots, port_*, dash_*, tax_records, stg_*, sec_settings/session_logs, price_sync_settings, ref_integrity_queue |
| Intentional omissions | crypto/stocks/metals platform cash tx tables + bg_transfers — no ghost cash ledgers |
| Naming | not_ / rpt_ / stg_ / docs_ locked; notif_/rep_ legacy only |
| Schema freeze residual | drift test + full field-inventory still needed for Gate H GREEN |

## Definition of Done — updated 2026-09-05 (evening)

| Item | Status |
|------|--------|
| cash SoT | ✅ |
| instrument identity | ✅ |
| field-kind enum | ✅ RAW\|DERIVED\|SNAPSHOT\|EXTERNAL_REPORTED\|LABEL\|SYSTEM_INDEX |
| fee / C2C / transfer / period-return / settlement / date / FX / price / reversal / idempotency | ✅ |
| provenance | ✅ |
| schema freeze | 🔶 residual: automated drift test + full TSV inventory |
| golden / standalone fixtures | 🔶 implementation branch |
| relationship matrix | 🔶 advanced (residual edges only) |
| no undocumented financial field | 🔶 Gate H until inventory TSV complete |

## Cleanup
- All feature `*-LOCKS.md` pointer files **deleted** (locks live in feature main docs)
- P0-DOC-CLOSED-PREVENTION, BUG-CODE-REGRESSION-INVARIANTS, P1-GLOBAL-CONTRACTS, AUDIT-HISTORY **kept**

## Final cleanup pass 2026-09-05 (late)

Deleted pure pointer files (content already in canonical homes):
- Architecture-Final.md
- Concept-Ownership-Matrix.md
- Financial-Scenario-Catalog.md
- Feature-Package-Architecture.md
- Audit-vs-Financial-Event.md

No feature *-LOCKS.md remain.
No root Naming-Glossary / DOCUMENTATION-STYLE-P2 / root Rounding-Policy.

Residual DoD (require implementation evidence, not more doc files):
- schema drift test + field-inventory TSV
- golden/standalone fixtures green on implementation branch
- relationship residual edges
- Gate H zero undocumented fields

## BUG-001…050 residual close-out 2026-09-05 (late)

| ID | Result |
|----|--------|
| BUG-011 stocks id===instrument_id | FIXED — CHECK (id = instrument_id) |
| BUG-012 crypto_cash DEFAULT '0' | FIXED — DEFAULT removed; balance required from rebuild |
| BUG-013 pa_assets source_feature CHECK | FIXED |
| BUG-018 tax_events status CHECK | FIXED |
| BUG-025 fin_accounts status enum | FIXED — active\|inactive\|closed |
| BUG-026 acc_accounts status enum | FIXED |
| BUG-032 metals tx_type CHECK | FIXED |
| BUG-015 fg_goals funding_mode | FIXED — values aligned incl. earmark\|segregated_cash |
| BUG-044 price_history quote_type CHECK | FIXED |
| BUG-008 reconciled_by | CONFIRMED present |

Still open by nature (not schema column bugs):
- BUG-001 schema drift test vs 01-schema-tables (OPEN-001)
- P1-DOC-015 relationship residual edges
- P1-DOC-016 field inventory TSV
- P0-CODE-001…008 regression locks (implementation branch)

## BUG-D01…D20 close-out 2026-09-05

| ID | Result |
|----|--------|
| D01–D04 ghost cash tables | RESOLVED (intentional omission) |
| D05 notif_→not_ | FIXED in 01-schema-tables.md |
| D06 rep_→rpt_ | FIXED in 01-schema-tables.md |
| D07–D14 missing tables | FIXED earlier |
| D15 base_currency FK | FIXED → cur_currencies(code) |
| D16 crypto_cash standalone | FIXED comment + nullable semantics |
| D17 loan fees paid+waived≤due | Domain invariant documented (SQLite TEXT decimal) |
| D18 snapshot_json schema | Documented required keys in schema comment |
| D19 CA ownership | CLOSED |
| D20 standalone mode | Documented in schema footer + Feature-Independence-Contract |

## NEW-001…020 schema hardening 2026-09-05

| ID | Result |
|----|--------|
| NEW-001 metals tx_type CHECK | already present / confirmed |
| NEW-002 tax status CHECK | already present / confirmed |
| NEW-003 tax operation_id | CHECK (operation_id IS NOT NULL OR is_manual_adjustment = 1) |
| NEW-004 line_number NOT NULL | DEFAULT 1 NOT NULL |
| NEW-005/006 account_kind CHECK | fin + acc |
| NEW-007 economic_kind CHECK | crypto |
| NEW-008 fif distribution not dividend | CHECK fixed |
| NEW-009 trade_date = market_date | documented |
| NEW-010 CA operation_id NOT NULL | fixed |
| NEW-011 crypto_cash no DEFAULT | already fixed |
| NEW-012 FX currency FKs | fixed |
| NEW-013 base_currency FK | already fixed |
| NEW-014…020 DERIVED snapshots | comments + rebuild-only contract |

## NEW-021…034 close-out 2026-09-05

| ID | Result |
|----|--------|
| NEW-021 loan draft status | kept + documented (pre-activation) |
| NEW-022 snapshot_json schema | documented in schema + Loan-Schedule-Engine.md |
| NEW-023 report payload_json | documented in Essential-Reports.md |
| NEW-024 engine_versions JSON | schema comment on fin_operations |
| NEW-025 id=instrument_id | already CHECK |
| NEW-026 fund_kind CHECK | fixed |
| NEW-027 asset_class CHECK | fixed |
| NEW-028 cost_currency_default FK | fixed |
| NEW-029 symbol label not unique | documented |
| NEW-030 name optional | documented |
| NEW-031…033 venue names | duplicates allowed + documented |
| NEW-034 related_feature CHECK | fixed |

## NEW-035…200 batch 2026-09-06

Applied in schema.sql:
- CHECKs: audit action/source/entity_type, party_kind, category kind, priority>=0, interval_kind, fee tier base/day_count, br status, integrity check_kind, metals delivery status, report_kind, encryption scheme, docs entity_type, notification category
- fin_operations: command_hash required when posted; failed_at/voided_at
- voided_at on inc/exp; journal reference_number; reconcile base_currency/context
- UNIQUE partial: dash default layout; import external_ref
- 33 performance indexes (journal account, ops date/type/status/reverses, domain tx operation_id, etc.)
- DOMAIN DECIMAL VALIDATORS block (amounts/fees/rates enforced in engine)
- ARCHITECTURE-LOCKED phase line clarified (docs-first main; src on implementation branch)

Already OK / previously fixed: NEW-001…034, 053–056, 059–065, 132, 171, 196–199
Domain-only (decimal.js): positive amounts, fee consistency, reverse targets, RRULE, Sayadi, etc.

## NEW-121…150 residual close 2026-09-06

| ID | Result |
|----|--------|
| 121 failed_at/voided_at | already present |
| 122 reverses index | already present |
| 123 reference_number | already present |
| 124 fiscal_period_id | ADDED (nullable; fiscal_periods table future) |
| 125 journal status | documented via operation_id comment |
| 126 line reference | ADDED |
| 127–128 reconcile | schema comment + base_currency already |
| 129–130 quote_type/kind | CHECK + NULL=legacy doc |
| 131,133-135,138 | domain validators |
| 136-137,139,141,146-147,150 | already CHECK |
| 142-143 watermark/hash | format comments |
| 148 session detail | no PII documented |


## MR residual close 2026-09-06 (late)

| ID | Result |
|----|--------|
| MR-004/019 account_kind CHECK | already present |
| MR-010 journal line source_type/reference | ADDED |
| MR-013 corrects_operation_id | ADDED |
| MR-025/026/027 role, reconciliation_status, external_ref_json | ADDED |
| MR-028…033 reconciliation docs | Reconciliation-Policy.md |
| MR-036…041 correction rules | same |
| MR-048 Persian digits | documented (engine) |
| MR-055 payment_date | ADDED on ln_transactions |
| MR-058 Iran calendar | documented |
| MR-137/189 depreciation_policy | already present |
| MR-216 priority >= 0 | already present |
| MR-219 missing rate | documented |
| MR-291…296 Gate H / inventory | remains OPEN (implementation + TSV) |
| MR-290 migration scripts | remains OPEN (implementation branch) |
