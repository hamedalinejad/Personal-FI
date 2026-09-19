# PLATFORM ARCHITECTURE (multi-host target)

**Status:** CURRENT · **Class:** TARGET (not RELEASE-PROVEN)  
**Owner for host strategy:** this file  
**Owner for economics:** `docs/FINANCIAL-CORE.md` + `docs/ARCHITECTURE.md`  
**Owner for IA/routes:** `docs/PRODUCT.md` (wins on nav conflicts)  
**Owner for offline proof:** `docs/OFFLINE-RELEASE.md`

## 0. One-sentence rule

```
One economy · one Financial Core · one schema contract · many hosts.
```

UI, storage adapters, and native capabilities may differ. **Economic results must not.**

## 1. Target layer stack

```
Product UI (React + TypeScript)
        │
 Public Feature API / application use-cases
        │
 Financial Core (Decimal, FX, Fee, Journal, Cost Basis, Reversal, Invariants)
        │
 Persistence Port
        │
 ┌──────┴──────┬──────────────┬─────────────┐
 Web           Native Mobile  Windows
 sql.js+IDB    SQLite adapter SQLite adapter
 └─────────────┴──────────────┴─────────────┘
        │
 Backup / Export package
        │
 Optional Sync Service (post-MVP)
```

This extends — does not replace — the locked stack in `docs/ARCHITECTURE.md`.

## 2. Web-first strategy

Web is the **first shippable product surface**, not a browser-only architecture.

| Allowed | Forbidden |
|---------|-----------|
| UI → feature `public-api` / queries / application services | UI → SQL |
| UI → sheets/drawers on locked routes | UI → journal writer |
| Persistence via Persistence Port only | UI → feature internal repository |

**Web stack target:** React · TypeScript · Vite · PWA shell · IndexedDB · sql.js adapter · shared domain packages.

Browser production remains **NO-GO** until `docs/OFFLINE-RELEASE.md` RELEASE E2E (sql.js + IndexedDB + single-writer + reload/crash) is green. Durable-memory harness ≠ release proof.

## 3. Shared vs platform packages

**Shared (host-agnostic):**

```
src/core/**
src/features/**
src/application/**     (target; introduce when UI lands)
src/contracts/**       (target; API envelopes / error codes)
src/reporting/**       (reports already partially under core/accounting/reports)
```

**Platform adapters only:**

```
platform/web
platform/android
platform/ios
platform/windows
```

Each platform supplies Persistence Port implementation + OS capabilities (share, keychain, filesystem). **No platform may redefine fee, FX, journal, or cost-basis rules.**

## 4. Native packaging decision (v1 discipline)

Do **not** ship two native wrappers in parallel in v1.

Sequence:

1. Complete Persistence Port + shared Core/Features (current work).
2. Small POC: **Capacitor vs Tauri** against the same public-api surface.
3. Choose **one** official wrapper for Android/iOS (and desktop if Tauri wins).

Until POC is decided, treat native shells as **UNSPECIFIED implementation**, not blockers for Core correctness.

## 5. Persistence architecture

| Host | Storage path |
|------|----------------|
| Web | IndexedDB holds SQLite binary/state → sql.js |
| Native mobile / Windows | Native SQLite → Persistence Port |

Rules (aligned with OFFLINE-RELEASE):

- Explicit transactions for atomic financial operations.
- If WAL is used, backup/export must include **all** files required for a consistent snapshot (DB + WAL/SHM as applicable).
- Foreign keys **enabled and verified** on every connection.
- Relational journal remains SoT; `result_json` is cache only.

## 6. Source of truth (host-invariant)

| Domain | SoT |
|--------|-----|
| Accounting | `fin_accounts`, `fin_journal_entries`, `fin_journal_lines` |
| Feature ledgers | Projection / reconstruction; never parallel cash truth |
| Planning (budget/goal/bill) | Planning store only — **never** journal |
| Reports | Read models derived from journal + feature ledgers + valuation context |

## 7. Local-first identity

Each install has:

```
deviceId
bookId
local database
operation log
backup metadata
schema_version
engine_semantic_version
```

v1 must work **fully offline** with no online account required.

## 8. Future sync (schema-ready, not MVP)

Operations may carry:

```
operationId
originDeviceId
createdAt
businessDate
commandHash
engineVersion
syncState
```

Conflict rules (same as Core idempotency):

```
same operationId + same commandHash  → idempotent duplicate
same operationId + different hash    → hard conflict
```

Sync **must not** merge posted journals by overwrite. Server must not invent business semantics outside Financial Core.

## 9. Security model (target)

| Layer | Requirement |
|-------|-------------|
| Local | App lock; OS keychain/keystore for native secrets; encrypted backup/export |
| Web | No secret API keys in frontend source; sensitive exports use independent encryption (browser storage ≠ native OS security) |
| Sync (future) | Device auth, key rotation, encrypted payload, replay protection, conflict logs |

## 10. Import / export / attachments

Canonical backup package (target name):

```
.personalfi
  manifest.json
  schema metadata
  engine versions
  book settings
  SQLite payload
  checksum
  optional encrypted payload
  optional attachment manifest
```

CSV/JSON export = **projection only**, not a second database.

Attachments: content-addressed files; DB stores metadata only (`attachmentId`, `contentHash`, mime, size, createdAt, operation/reference).

## 11. Versioning

Three independent axes:

```
api_version
schema_version
engine_semantic_version
```

Migration changes schema; engine version describes economics. Historical reports must be deterministic given ledger + engine/context recorded at post time.

## 12. Error envelope (public API)

UI must not surface raw SQLite errors. Canonical failure shape remains the project API envelope (`success` / `errors[].code` / `meta`) owned by `docs/API.md`.

## 13. Offline command policy

Every financial command runs offline unless it **inherently** depends on an external provider.

Provider-dependent observations:

```
missing ≠ zero
→ explicit missing | stale | unavailable
```

## 14. Performance targets

- Fast startup
- Atomic journal writes
- Indexes on businessDate / operationId / accountId / instrument scope
- Keyset pagination
- Incremental rebuild; large reports must not force full-history UI recompute every open

## 15. UI routes

**Authority:** `docs/PRODUCT.md` (six routes LOCKED):

```
/  /money  /transactions  /investments  /loans  /more
```

This document does **not** replace Product IA. Feature packages must not invent top-level routes (`/crypto`, `/accounting`, …). Create/edit = sheets/drawers.

## 16. Native capability boundaries (non-economic)

| Platform | Allowed native extras |
|----------|------------------------|
| Android | Biometric unlock, share/export, local files, later background backup |
| iOS | Keychain, Files, share sheet; respect background limits |
| Windows | Native filesystem backup, local auto-backup; tray only post-MVP |

None may change journal, fee, FX, or cost-basis semantics.

## 17. Architectural success criterion

The same canonical financial input, run on four hosts, must yield the same economic result:

```
Web == Android == iOS == Windows
```

Allowed differences: UI chrome, storage adapter, native capability metadata only.

## 18. Implementation status (honest)

| Item | Status |
|------|--------|
| Shared Financial Core + features on Node SQLite | Implemented (see phase pack) |
| Persistence Port abstraction | Present; browser path protocol harness |
| sql.js + IndexedDB RELEASE E2E | **OPEN** (`R-M24`) |
| React/PWA UI shell | **NOT IMPLEMENTED** (out of Core phase scope) |
| Capacitor/Tauri choice | **UNSPECIFIED** until POC |
| Sync service | **OUT OF MVP** |
| FREEZE_PROVEN / RELEASE_PROVEN | **false** |
| PRODUCTION | **NO-GO** |

## 19. Supersession

Host-strategy prose belongs here. Economic rules stay in FINANCIAL-CORE / ARCHITECTURE. Offline proof gates stay in OFFLINE-RELEASE. Route lock stays in PRODUCT.

## 20. Phase 12–18 host & release track
See `src/platform/adapter/mobilePlatformAdapter.js` (POC Capacitor vs Tauri),
`src/platform/{android,ios,windows}/matrix.js`, `src/platform/sync/syncProtocol.js`,
`src/core/license/capabilityGate.js`, `docs/core/registry/release-proof-checklist.json`.
**RELEASE_PROVEN remains false** until per-edition evidence is complete.
