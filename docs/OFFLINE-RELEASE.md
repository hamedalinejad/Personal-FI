# OFFLINE-RELEASE (sole offline + release owner)

**Status:** CURRENT

Absorbs: Offline-Requirements, Offline-Modes, PERSISTENCE-DURABILITY, Persistence-State-Machine, Multi-Tab-Writer, Storage-Abstraction, RECOVERY-MATRIX, License-Offline, release gate prose.

## Persistence
Node SQLite primary. Browser: persistence port → sql.js+IDB (PROTOCOL_PROVEN harness; E2E OPEN).

## Durability pipeline
BEGIN IMMEDIATE → draft op → domain → validate currency/FX/balance → journal → result snapshot/hash → COMMIT → durable ACK.

## Multi-tab
Single writer; WRITER_REQUIRED otherwise.

## Recovery vectors
crash before/after commit · backup/restore · idempotent replay · hash conflict · offline reopen · standalone — PARTIAL until RELEASE_PROVEN.

## License offline
Gates capability/UI only; never deletes history.

## Vocabulary
IMPLEMENTED ≠ GOLDEN-GREEN ≠ RECOVERY-GREEN ≠ RELEASE-PROVEN. Production NO-GO until RELEASE_PROVEN.

## Live status
QUALITY-STATUS.md only.


## Operation durability_state (canonical)
```
pending → sql_committed → persisted
                 ↘ persist_failed
```
Business `status` is separate: draft | posted | voided | failed.

Replay of existing operations is allowed only for `sql_committed` or `persisted`.
Legacy values `swapped` / `durable` are **not** schema states (transport markers only).


## Recovery matrix (required before RELEASE_PROVEN)

| Scenario | Expected |
|----------|----------|
| Crash before commit | no posted operation |
| Crash after SQL commit | operation recoverable |
| Repeat same operation | idempotent replay |
| Same ID, changed economics | conflict |
| Offline reopen | data intact |
| Backup | complete package |
| Restore | exact recoverable state |
| Corrupt backup | safe rejection |
| Browser reload | durable state retained |
| Multi-tab write | single-writer protection |
| Rebuild | deterministic result |
| Reversal | inverse accounting + linkage |

Browser sql.js+IndexedDB must be RELEASE-PROVEN before shipping browser production; durable-memory protocol alone is insufficient.


## Backup package (machine)
formatVersion · schemaVersion · database payload · metadata · checksums · createdAt · engineVersions · restore validation · atomic replace · corrupt → reject

## Import lineage
```
import_batch → raw_record → dedupe_key → normalized → operation → journal → provenance
```
Unknown provider fields survive unless user chooses destructive transform.

## Offline security (minimum contract)
- File-at-rest protection and export protection are product requirements for shared/licensed builds.
- License gates **capability only** — never deletes financial history.
- Wallet addresses / bank identifiers are sensitive fields; do not log in plain telemetry.
- Detailed key-management is a DEFERRED product package; schema may hold encryption metadata without implying a full KMS.

## 20. Offline architecture — final rules

### 20.1 Node
```
Node → SQLite
```
Primary production path for desktop.

### 20.2 Browser (release requirement)
```
sql.js + IndexedDB + single-writer coordination
```
Durable-memory scaffold is **not** RELEASE-PROVEN for browser production.

### 20.3 Two state machines (never mixed)
**Durability (transport):**
```
pending → sql_committed → persisted
pending → persist_failed
```
**Business status:**
```
draft | posted | voided | failed
```
`swapped` / `durable` are **not** public durability or business states (legacy transport markers only).

### 20.4 Recovery matrix (must be golden before release)
crash before commit · crash after SQL · same operationId replay · same ID + changed economics · offline reopen · backup · restore · corrupt backup · browser reload · multi-tab write · rebuild · reversal

## result_json vs relational truth (LOCKED)

| Field | SoT | Replay source | In economic hash | Mismatch action |
|-------|-----|---------------|------------------|-----------------|
| operationId | fin_operations.id | row | yes | fatal if missing |
| commandHash | fin_operations.command_hash | row | yes | conflict / reject |
| status / durability | fin_operations columns | row | no | row wins |
| businessDate / baseCurrency | fin_operations | row | yes | row wins |
| journal lines | fin_journal_lines | relational SELECT | yes | always rebuild from rows |
| domain feature rows | inv_*/ln_*/… | feature tables | module rule | tables win |
| result_json | cache / transport snapshot | recomputed optional | no | never accounting SoT |
| result_hash | control-plane on fin_operations | SHA of snapshot without result_hash | no | see below |

### resultHashMismatch classification
| Class | Meaning | Action |
|-------|---------|--------|
| stale_snapshot | relational truth newer than snapshot | soft flag `_resultHashMismatch`; load rows |
| transport_difference | key order / omit null noise | soft flag; prefer rows |
| corruption | unreadable JSON or impossible shape | fail load of snapshot; still prefer rows if present |
| fatal_identity | operationId/commandHash row missing | reject |

`loadOperation` must always overlay `journalLines` from relational tables when present.

## Restore pipeline (LOCKED)
```
validate package (formatVersion, schemaVersion, checksums)
  → stage to temp location
  → integrity-check (schema + journal invariants scan)
  → atomic replace of working DB
  → re-open
  → verify (sample ops + TB balance)
```
Never overwrite a working database before validation passes.
Corrupt backup → reject; leave live DB untouched.

## Executable recovery proof
Each recovery-matrix row must have a **fixture or automated test result**, not prose alone, before `RECOVERY_GREEN`.

| Scenario | Proof target |
|----------|----------------|
| crash before commit | acceptance/recovery test |
| crash after SQL commit | acceptance/recovery test |
| replay same operation | idempotency test |
| same ID + changed economics | conflict test |
| offline reopen | reopen test |
| backup / restore | backup.test.js family |
| corrupt backup | reject test |
| browser reload | browser adapter proof |
| multi-tab write | WRITER_REQUIRED test |
| rebuild | rebuild determinism |
| reversal | inverse journal test |

## Browser target vs protocol
| Layer | Role |
|-------|------|
| `sql.js + IndexedDB + single-writer` | **release target** |
| `durableMemoryAdapter` | protocol/harness only — **not** browser RELEASE_PROVEN |

Keep durable-memory until sql.js+IDB is proven; do not delete for file-count reduction.

## Backup package fields (machine contract — no separate BACKUP-SPEC.md)
```
formatVersion · schemaVersion · database payload · metadata
checksums · createdAt · engineVersions
restore validation · atomic replace · integrity result
```
Flow: validate → stage temp → integrity scan → atomic replace → reopen → verify.  
Corrupt backup must leave live DB untouched.

## Recovery proof checklist
crash before commit · after SQL commit · same-op replay · ID+changed economics · offline reopen · backup · restore · corrupt backup · browser reload · multi-tab write · rebuild · reversal.

## Browser adapters
`durableMemoryAdapter` = protocol harness until `sql.js + IndexedDB + single-writer` is RELEASE_PROVEN. **Do not delete** for file-count reduction.

