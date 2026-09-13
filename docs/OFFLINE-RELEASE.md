# OFFLINE-RELEASE (sole offline + release evidence owner)

**Status:** CURRENT

## 1. Persistence matrix
| Runtime | Implementation | Evidence status |
|---------|----------------|-----------------|
| Node SQLite | `personal-fi.sqlite` + worker | primary path |
| Browser | Persistence port; sql.js+IDB target | PROTOCOL_PROVEN_NODE_HARNESS |

## 2. Durability
- BEGIN IMMEDIATE
- draft/pending operation row
- domain + journal
- result snapshot + hash after relational truth
- COMMIT
- durable ACK / publish

## 3. Multi-tab
Single writer; `WRITER_REQUIRED` for non-writer.

## 4. Recovery matrix (must go GREEN for RELEASE_PROVEN)
| Vector | Status |
|--------|--------|
| Crash before commit | PARTIAL |
| Crash after SQL | PARTIAL |
| Backup/restore | harness tests exist |
| Same operationId replay | tests exist |
| Hash conflict | required |
| Standalone boot | PARTIAL |
| Browser airplane mode | OPEN |

## 5. Vocabulary
IMPLEMENTED ≠ GOLDEN-GREEN ≠ RECOVERY-GREEN ≠ RELEASE-PROVEN ≠ Production GO

## 6. Live dashboard
Only QUALITY-STATUS.md for live gates.

## Evidence IDs (placeholders)
| ID | Claim |
|----|-------|
| EV-BROWSER-001 | Node harness durable ACK |
| EV-RECOVERY-001 | backup restore load operation |
| EV-IDEM-001 | same operationId replay |
