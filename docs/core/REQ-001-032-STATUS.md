# REQ-001…032 + P0-SCHEMA Status (mechanical + honesty)

**Rule:** SPECIFIED/LOCKED ≠ RELEASE-PROVEN. Production needs the proof bundle.

## P0 Schema

| ID | Status | Evidence |
|----|--------|----------|
| P0-SCHEMA-001 | **GREEN** | `schema:sync` = schema → manifest → inventory (86 tables / 855 cols) |
| P0-SCHEMA-002 | **PARTIAL** | no-field-loss Gate H + inventory; migration fixtures per feature still expanding |
| P1-SCHEMA-003 | **PARTIAL** | `schema:field-diff` / feature-field-diff.js; complete DOC↔SQL tables ongoing |

## Requirements

| ID | Status | Notes |
|----|--------|-------|
| REQ-001 Command coverage | **PARTIAL** | COMMAND matrix + status gen; missing cmds must be DEFERRED not implied complete |
| REQ-002 Reversal plan | **PARTIAL** | REVERSAL-SPECS + loan/core; full investment CA/reinvest family open |
| REQ-003 Gate H whole schema | **PARTIAL** | inventory strict + Gate H tests; not every RAW field has survival vector yet |
| REQ-004 Golden depth | **PARTIAL** | fixture:empty rejects empty expected; deep sections still incomplete on many fixtures |
| REQ-005 Recovery matrix | **PARTIAL** | recovery tests exist; not every persistence boundary fault-injected |
| REQ-006 Browser sql.js+IDB | **OPEN** | PROTOCOL_PROVEN_NODE; production adapter not RELEASE-PROVEN |
| REQ-007 Multi-tab writer | **PARTIAL** | contract + tabWriter; full two-tab suite open |
| REQ-008 Accounting reports | **PARTIAL** | report modules + some tests; full BS/IS/CF goldens open |
| REQ-009 Investment reports | **PARTIAL** | portfolio/valuation scaffolds; unified attribution open |
| REQ-010 Iran policy tables | **PARTIAL** | iran/* engines; machine policy tables incomplete |
| REQ-011 Tax lineage | **LOCKED/GREEN** | TAX-RECORD-EVENT-SOT; payTax path |
| REQ-012 Provenance runtime | **PARTIAL** | source_* on ops; import lineage strictness expanding |
| REQ-013 Rebuild all projections | **PARTIAL** | rebuild API; registry of every projection incomplete |
| REQ-014 Corporate actions | **PARTIAL** | engine + some fixtures; full CA catalog open |
| REQ-015 Fund distribution | **PARTIAL** | commands + NAV≠tx fixtures |
| REQ-016 Stock T+n lifecycle | **PARTIAL** | settle command + tests; failed settlement matrix open |
| REQ-017 Crypto transfer/swap | **PARTIAL** | economic_kind + fixtures; bridge suite expanding |
| REQ-018 Multi-currency E2E | **PARTIAL** | journal base balance; 3-currency fee path needs golden |
| REQ-019 Price as-of/stale | **PARTIAL** | PRICE-HISTORY-CONTRACT; selection context persist open |
| REQ-020 Report calc context | **LOCKED** | asOf/priceAsOf/fxAsOf/engineVersions required for historical |
| REQ-021 Dictionary vs SQL | **GREEN** | schema:sync + inventory |
| REQ-022 Migration only path | **PARTIAL** | migration.js + checksum; full chain proof open |
| REQ-023 Feature independence | **PARTIAL** | lint-boundaries + dep:graph in gates |
| REQ-024 Standalone editions | **PARTIAL** | STANDALONE fixtures + some tests |
| REQ-025 Licensing data safety | **LOCKED** | capability only; history immutable |
| REQ-026 Precision in tests/API | **GREEN** | lint:money-number + canonicalDecimal |
| REQ-027 Audit/repair approval | **PARTIAL** | reconcile vs repair docs; RepairProposal runtime open |
| REQ-028 Query purity | **PARTIAL** | contract; mechanical write-guard incomplete |
| REQ-029 Atomic boundaries | **PARTIAL** | Loan path improved; audit all features ongoing |
| REQ-030 Authority hierarchy | **LOCKED** | DOC-AUTHORITY-CHAIN |
| REQ-031 File lifecycle | **LOCKED** | FILE-LIFECYCLE; no mass delete |
| REQ-032 Release evidence bundle | **PARTIAL** | gates script; single release-manifest generator below |

## Coding start policy

- **Allowed now:** Loan-only vertical under CODING-GATE with existing goldens.
- **Not allowed as RELEASE-PROVEN:** Browser production adapter, full report suite, complete CA catalog until evidence green.
- **Never claim:** empty fixture expected = golden pass.
