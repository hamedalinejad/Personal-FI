> **SUPERSEDED as independent authority** — use docs/PRODUCT.md, ARCHITECTURE.md, FINANCIAL-CORE.md, DATA-MODEL.md, API.md, REPORTING.md, OFFLINE-RELEASE.md, DEVELOPMENT.md, modules/*.

# Missing Requirements Register (FINAL pre-coding)

**Purpose:** Map every audit “missing requirement” to **CLOSED (contract)** or **OPEN (implementation/evidence)**.  
**Rule:** CLOSED ≠ RELEASE-PROVEN. Coding may start on Loan vertical; production remains NO-GO until evidence gates pass.

---

## P0 — Status

| # | Requirement | Status | Authority / Evidence |
|---|-------------|--------|----------------------|
| 1 | Schema↔doc field mapping | **CLOSED-contract** | field-inventory.checklist.tsv + Gate H scripts; expand continuously |
| 2 | relatedFeature enum | **CLOSED** | schema CHECK + P0-SCHEMA-VOCABULARY-LOCK |
| 3 | Account transaction model | **CLOSED** | acc_transactions = projection; type on fin_operations |
| 4 | Tax record ↔ event | **CLOSED** | P0-011-015-LOCK + tax tables |
| 5 | Instrument/price identity | **CLOSED** | instrument_price_mappings + ref_instruments |
| 6 | Standalone hidden Core cash | **CLOSED-contract** | Cash-Settlement-Adapter + Canonical-Cash-Model |
| 7 | Full command field matrix | **PARTIAL** | registry/COMMAND-COVERAGE-MATRIX.md — fill remaining commands |
| 8 | Investment reversal plan | **PARTIAL** | operation reverses_*; feature reverse commands OPEN beyond loan |
| 9 | Full recovery matrix | **PARTIAL** | recovery tests exist; complete matrix OPEN |
| 10 | Browser sql.js adapter proof | **PARTIAL** | PROTOCOL_PROVEN_NODE_HARNESS; real browser RELEASE OPEN |
| 11 | Historical valuation sequence | **CLOSED** | REPORT-003 order in REPORT-TAX-DATA-DOC-LOCK |
| 12 | Golden fixtures all families | **PARTIAL** | Loan/core vectors; expand per family |
| 13 | Iran business calendar | **PARTIAL** | contract locked; holiday fixtures OPEN for RELEASE |
| 14 | CA replay/idempotency | **CLOSED-contract** | DOMAIN lock STOCK-003; runtime CA each OPEN |
| 15 | Import-batch lifecycle | **CLOSED-contract** | import_batches table + Import-Lineage |
| 16 | Formal JSON schemas | **PARTIAL** | schedule snapshot formal; report/import JSON Schema files OPEN |
| 17 | Machine schema/dictionary gate | **CLOSED-contract** | field-inventory-verify + schema-drift scripts |
| 18 | Canonical error envelope | **CLOSED** | API-CANONICAL-ENVELOPE |
| 19 | Stable cursor pagination | **CLOSED** | API-003 |
| 20 | Cross-feature dependency graph | **PARTIAL** | Domain-Dependency-Matrix + lint-boundaries; complete graph OPEN |

**P0 coding gate:** items marked CLOSED/CLOSED-contract are sufficient to implement Loan-first without redesign. PARTIAL items must not be assumed RELEASE-PROVEN.

---

## P1 — Status

| # | Requirement | Status |
|---|-------------|--------|
| 1 | Full investment reports (TWR/IRR policy…) | **OPEN-spec** — high-level in Reports docs |
| 2 | Fund distribution/reinvest details | **CLOSED-contract** FUND-002 |
| 3 | External reported-profit model | **DEFERRED v2** |
| 4 | Physical asset depreciation/disposal | **OPEN-spec** |
| 5 | Budget/goal accounting linkage | **CLOSED-contract** (advisory ≠ ledger) |
| 6 | Cheque reservation / available balance | **OPEN-spec** |
| 7 | Security/export encryption details | **PARTIAL** |
| 8 | License capability / downgrade | **CLOSED-contract** License-Offline |
| 9 | Price source priority algorithm | **PARTIAL** |
| 10 | Multi-hop FX path persistence | **PARTIAL** |
| 11 | Reconciliation result schema + repair UX | **PARTIAL** |
| 12 | Multi-tab conflict UX | **PARTIAL** |
| 13 | Backup package + attachment manifest | **OPEN-spec** |
| 14 | Migration rollback strategy | **PARTIAL** Migration-Data-Preservation |

---

## P2 — Status

| # | Requirement | Status |
|---|-------------|--------|
| 1–8 | i18n, a11y, UI states, perf budgets, audit retention, log redaction, diagnostics, fixture authoring | **OPEN** — not blocking Loan vertical |

---

## Documentation audit residual (stale prose)

| Issue | Action |
|-------|--------|
| Ghost cash table narrative inside Crypto body | **FIXED** this commit (aligned to Port/journal) |
| systemRole vocabulary | **FIXED** residual docs → `role` |
| `rep_*` table names | **FIXED** → `rpt_*` |
| Schema freeze wording | content locked ≠ evidence proven |

---

## Honest readiness

| Layer | Status |
|-------|--------|
| Product + architecture contracts | GREEN |
| Schema content + vocabulary locks | GREEN / advanced |
| Documentation coverage | DOCUMENTATION-COVERAGE-COMPLETE |
| Canonical reconciliation of P0 conflicts | **CLOSED** (this audit series) |
| Runtime / golden / recovery / browser | PARTIAL → Production **NO-GO** |
| Coding start (Loan vertical) | **ALLOWED** under CODING-GATE |

```
Coding AI entry:
  docs/README.md
  → CODING-GATE.md
  → GO-NO-GO.md
  → EXECUTION-HANDOFF.md
  → IMPLEMENTATION-READY-LOAN-SLICE.md
  → this register (do not invent CLOSED as RELEASE-PROVEN)
```
