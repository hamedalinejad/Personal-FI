# Deletion Policy Matrix (P0)

| Entity | CanDelete | CanArchive | CanVoid | CanReverse | CanCorrect | HardDelete |
|--------|-----------|------------|---------|------------|------------|------------|
| Financial operation (posted) | NO | — | YES | YES | YES | **NO** |
| Category (unused) | YES | YES | — | — | — | optional |
| Category (used) | NO | YES | — | — | — | NO |
| Account | NO if has txs | YES | — | — | — | NO |
| Instrument | NO if has holdings | YES | — | — | — | NO |
| Document | soft | YES | — | — | — | policy |
| Import batch | NO after commit | YES | — | — | — | NO |

**Feature disable ≠ data delete.** غیرفعال کردن Investments داده crypto را پاک نمی‌کند.


---

## Authority (CROSS-CUTTING §4)

All Features follow this matrix only. No feature-local hard-delete policy for posted financial data. Cancel vs void/reverse distinguished as above.

## Vocabulary

Use voided / reversed / cancelled / archived as defined in `NAMING-GLOSSARY.md`.


## P0-FINAL-015

Posted financial operations: reverse only — never soft-delete via deletedAt. Master/reference soft-delete OK. Drafts: draft policy.
