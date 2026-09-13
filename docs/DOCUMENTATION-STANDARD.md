# Documentation Standardization (process authority)

**Status:** LOCKED process · Unique workflow rules also mirrored in DEVELOPMENT.md · This file may ARCHIVE when DEVELOPMENT fully absorbs process text.

## Principle
ONE CONCEPT → ONE OWNER DOCUMENT → MACHINE PROOF → CODE

**Forbidden:** new public audit file · new competing contract · new BUG/GAP micro-doc as authority.

## Owner map (CURRENT)
| Area | Owner |
|------|--------|
| Product | PRODUCT.md |
| Architecture | ARCHITECTURE.md |
| Finance | FINANCIAL-CORE.md |
| Data | DATA-MODEL.md |
| API | API.md |
| Reports | REPORTING.md |
| Offline/Release | OFFLINE-RELEASE.md |
| Workflow | DEVELOPMENT.md |
| Modules | modules/*.md (**11 files — all present**) |
| Live status | QUALITY-STATUS.md |
| History | archive/ (non-normative) |

## Module set (validated)
accounts · income-expense · cheque · loan · crypto · stocks · funds · metals · physical-assets · budget-goals-bills · tax

## Consolidation protocol
EXTRACT → MERGE into owner → REPOINT → VALIDATE → ARCHIVE/DELETE  
(Delete only if unique rules = 0 and inbound refs = 0)

## Build order
Vocabulary → Identity → Financial Core → Data Model → API → Reports → Features → Offline/Release

## Classification
See FILE-CLASSIFICATION.md: CURRENT | MERGE | ARCHIVE | GENERATED | DELETE

## Progress
See CONSOLIDATION-LOG.md and QUALITY-STATUS.md. Target: single CURRENT generation.
