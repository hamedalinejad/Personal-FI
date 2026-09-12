---
id: DOC-P0-TRACKER
title: P0 missing requirements tracker
status: approved
version: 1.0
---

| # | Requirement | Status |
|---|-------------|--------|
| 1 | Schema-to-document field mapping | **CLOSED** — field-inventory STRICT |
| 2 | relatedFeature enum | OPEN — do not guess |
| 3 | Account Transaction model | OPEN |
| 4 | Tax Record ↔ Tax Event | **PARTIAL** — TAX-EVENT-LINK |
| 5 | Instrument/price identity | PARTIAL |
| 6 | Standalone hidden Core cash | PARTIAL — CashSettlementPort |
| 7 | Full command field matrix | **PARTIAL** — COMMAND-COVERAGE-MATRIX |
| 8 | Investment reversal plan | OPEN |
| 9 | Full recovery matrix | OPEN |
| 10 | Browser sql.js proof | OPEN |
| 11 | Historical valuation sequence | **CLOSED** — REPORT-DEPENDENCY-ORDER |
| 12 | Golden fixtures every family | OPEN |
| 13 | Iran business calendar full | PARTIAL — settlementPolicy |
| 14 | CA replay/idempotency | OPEN |
| 15 | Import-batch lifecycle | PARTIAL — import_batches table |
| 16 | Formal JSON schemas pack | PARTIAL — schedule snapshot, API envelope |
| 17 | Schema/dictionary CI | **CLOSED** — STRICT inventory |
| 18 | Canonical error envelope | **CLOSED** — API-CANONICAL-ENVELOPE |
| 19 | Stable cursor pagination | **CLOSED** — pagination.js |
| 20 | Cross-feature dependency graph | OPEN |

Production remains **NO-GO** until recovery/golden/edition proof complete.
