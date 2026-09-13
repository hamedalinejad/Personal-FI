# OFFLINE-RELEASE (sole offline/persistence/release owner)

**Status:** CURRENT

## 1. Persistence port
Node SQLite is production path for server/desktop tooling.  
Browser sql.js + IndexedDB adapter: **OPEN** (durable-memory is not RELEASE_PROVEN).

## 2. States
* Financial operation `status`: draft | posted | voided | failed  
* Persistence durability: separate (sql_committed / persisted / …) — never confused with business status.

## 3. Recovery
Crash points around txn/commit/ack must yield no duplicate ops/journals; deterministic replay from relational SoT.  
`result_json` is diagnostic/replay envelope only.

## 4. Backup/restore
Versioned package + schema version + integrity hash required for RELEASE_PROVEN (format OPEN until implemented).

## 5. Release ladder
SPEC_LOCKED → IMPLEMENTED → INTEGRATED → GOLDEN_GREEN → RECOVERY_GREEN → STANDALONE_GREEN → REBUILD_GREEN → NO_FIELD_LOSS → CI_GREEN → **RELEASE_PROVEN**

## 6. Evidence
RELEASE_PROVEN is **computed** from evidence, not a hand-edited label.
