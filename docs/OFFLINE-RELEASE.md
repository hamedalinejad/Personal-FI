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
