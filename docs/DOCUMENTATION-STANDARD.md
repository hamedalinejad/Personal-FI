# Documentation Standardization Master (LOCKED)

Status: **LOCKED** as process authority for consolidation.
This file is not a financial authority; it defines documentation system architecture only.

## Validation of the master (2026-09-13)

| Claim in master | Verdict | Note |
|-----------------|---------|------|
| ONE CONCEPT → ONE OWNER | CORRECT | Matches project risk (competing authorities) |
| 8 global + 11 modules + archive | CORRECT target | income-expense.md, cheque.md still missing on disk |
| Machine files stay SQL/JSON/TSV | CORRECT | schema.sql, fixtures, registries |
| DELETE only if unique rule=0 AND refs=0 | CORRECT | do not mass-delete |
| Bug/Audit files → QUALITY-STATUS or archive | CORRECT | stop micro BUG-*-STATUS |
| SPEC_LOCKED ≠ FREEZE_PROVEN ≠ RELEASE_PROVEN | CORRECT | already in registry |
| Ghost cash forbidden | CORRECT | journal is SoT |
| Module doc = implementation-ready sections 1–34 | CORRECT | current modules are stubs; expand required |
| End endless audit loop | CORRECT | code-first after consolidation |

## Gaps in current repo vs master

* Missing module files: `income-expense.md`, `cheque.md`
* Global owners exist but are thin; unique rules still in `docs/core/**` micro files
* Competing product maps: Product-Map-*, Project-Blueprint, Technical-Architecture

## Build order (from master §41)

1 Vocabulary → 2 Identity → 3 Financial Core → 4 Data Model → 5 API → 6 Reports → 7 Features → 8 Offline/Release

## Cycle protocol

ONE discrete work unit → ONE commit → push → next cycle.
