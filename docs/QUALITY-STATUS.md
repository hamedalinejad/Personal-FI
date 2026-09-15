# QUALITY-STATUS

**Live status only.** History lives in Git. Do not add audit/BUG Markdown files.

## Production
| Gate | Value |
|------|-------|
| FREEZE_PROVEN | **false** |
| RELEASE_PROVEN | **false** |
| PRODUCTION | **NO-GO** |
| UI | **WAIT** |
| Coding allowed | **Core + Loan scaffold hardening** (see DEVELOPMENT) |

## Architecture (locked)
| Item | Status |
|------|--------|
| Owner docs (11 global + 11 modules) | GREEN — do not expand |
| Six routes / Feature ≠ Page | GREEN |
| Journal = cash/accounting SoT | GREEN |
| Decimal strings + no float money | GREEN |
| Book base ≠ transaction currency | GREEN |
| Fee treatment required + single enum | GREEN |
| Loan schedule exact conservation | GREEN |
| Stocks date/policy columns | GREEN |
| Crypto economic_kind canonical | GREEN |
| Import/loan FKs | GREEN |

## Open before FREEZE_PROVEN
| Area | Status |
|------|--------|
| Field-preservation full matrix | PARTIAL |
| Full golden families | PARTIAL |
| Recovery matrix complete | PARTIAL |
| Standalone full path packs | PARTIAL |
| Iran official policy data (not SAMPLE) | OPEN |
| FX multi-hop production goldens | PARTIAL |
| Browser sql.js + IndexedDB E2E | OPEN |
| TWR/MWR formulas | DEFERRED |
| Command cards every mutation complete | PARTIAL |

## Evidence locations
```
docs/FINANCIAL-CORE.md · docs/modules/*.md
docs/core/db/schema.sql · docs/core/registry/*
fixtures/* · src/**/*.test.js
npm test · npm run gates
```
