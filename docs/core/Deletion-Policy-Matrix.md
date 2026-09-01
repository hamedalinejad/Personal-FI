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
