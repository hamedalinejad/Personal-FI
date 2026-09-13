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
