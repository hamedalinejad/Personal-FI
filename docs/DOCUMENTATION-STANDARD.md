# Documentation Standardization (process authority)

**Status:** LOCKED process · After consolidation complete, unique rules move to DEVELOPMENT.md and this file may ARCHIVE.

## Principle
ONE CONCEPT → ONE OWNER DOCUMENT → MACHINE PROOF → CODE

Forbidden: new public audit / bug micro-file / competing contract.

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
| Modules | modules/*.md (11 files) |
| Live status | QUALITY-STATUS.md |
| History | archive/AUDIT-HISTORY.md |

## Module set (validated 2026-09-13)
Present: accounts, income-expense, cheque, loan, crypto, stocks, funds, metals, physical-assets, budget-goals-bills, tax.

## Consolidation protocol
EXTRACT → MERGE into owner → REPOINT → VALIDATE → ARCHIVE/DELETE (only if unique rules=0 and inbound refs=0)

## Build order
Vocabulary → Identity → Financial Core → Data Model → API → Reports → Features → Offline/Release
