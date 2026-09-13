# OFFLINE-RELEASE (sole offline + release evidence owner)

**Status:** CURRENT

## 1. Persistence
| Runtime | Store | Status |
|---------|-------|--------|
| Node | SQLite `personal-fi.sqlite` | primary |
| Browser | Persistence port → sql.js + IndexedDB | PROTOCOL_PROVEN harness; browser E2E OPEN |

## 2. Durability
ACK only after publish. Atomic temp → rename/publish pattern. `result_json` after relational journal commit.

## 3. Multi-tab
Single writer; non-writer → `WRITER_REQUIRED` (`tabWriter`).

## 4. Recovery vectors (required for RELEASE_PROVEN)
crash before/after commit · backup/restore · same operationId replay · conflict on hash mismatch · offline reopen · standalone boot.

## 5. Migration
Forward schema migrations; backup before migrate; no silent destructive drop of financial history.

## 6. Release vocabulary
| Token | Meaning |
|-------|---------|
| IMPLEMENTED | code path exists |
| PARTIAL | subset |
| GOLDEN-GREEN | golden fixtures pass |
| RECOVERY-GREEN | recovery matrix pass |
| RELEASE-PROVEN | golden+recovery+standalone+CI for claimed edition |
| Production | NO-GO until RELEASE-PROVEN |

**IMPLEMENTED ≠ RELEASE-PROVEN.**

## 7. Live status
QUALITY-STATUS.md is the only live dashboard — do not duplicate competing status matrices.
