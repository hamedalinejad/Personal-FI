# Think-tank — P1-FIX-001…009

**Members:** Data architect · API engineer · Banking ops · Backup/reliability · Feature independence · Schema steward

| Fix | Consensus |
|-----|-----------|
| 001 | One Data Dictionary row per persisted field; checklist/script = zero gaps |
| 002 | Single Field Kind enum (no INDEX synonym) |
| 003 | One API envelope + central error taxonomy |
| 004 | One list/query contract; queries read-only |
| 005 | Provenance on financial domain rows |
| 006 | Banking ID normalization before unique/store |
| 007 | Backup manifest + verify-before-swap |
| 008 | Standalone fixtures without Accounts UI |
| 009 | Relationship matrix with real FK metadata |

---

## P1-FIX-001 — Data Dictionary completeness

Every persisted field in every Feature has **exactly one** dictionary record:

```text
Kind | Owner | Currency semantics | Precision | SoT | Editable | Migration | FK | Index/Unique
```

**Acceptance:** checklist or script proves **zero** undocumented persisted financial fields before Feature coding freeze.

## P1-FIX-002 — Field Kind enum (sole)

```text
RAW | DERIVED | SNAPSHOT | EXTERNAL_REPORTED | LABEL | SYSTEM_INDEX
```

**Forbidden synonym:** `INDEX` (use `SYSTEM_INDEX` only).

## P1-FIX-003 — API envelope (sole)

```text
{
  apiVersion: string
  schemaVersion: string
  data: T
  operationId?: string
  engineVersions?: Record<string, string>
}
```

Financial errors → centralized taxonomy (`VALIDATION_ERROR`, `CONFLICT`, `IDEMPOTENCY_CONFLICT`, …).

## P1-FIX-004 — List/query contract (sole)

```text
cursor | offset | limit | sort | filters | asOf
```

**Queries never write** the database.

## P1-FIX-005 — Provenance

Financial domain rows preserve when applicable:

```text
sourceType
sourceReference
sourceDocumentId?
importBatchId?
sourceTransactionId?
```

Imported facts remain traceable through export/rebuild.

## P1-FIX-006 — Banking identifier normalization

Before uniqueness check / store:

1. Persian/Arabic digits → ASCII  
2. Strip spaces, hyphens, zero-width chars  
3. IBAN: uppercase, no spaces  
4. Preserve meaningful leading zeros (account numbers)

## P1-FIX-007 — Backup integrity

Manifest **must** include:

```text
checksum
schemaVersion
databaseId
engineVersions
attachment checksums
```

Restore: verify → temp load → integrity → swap. Never swap first.

## P1-FIX-008 — Standalone fixtures

Minimum green families (Accounts UI **off**):

```text
STANDALONE-CRYPTO
STANDALONE-LOAN
STANDALONE-FUND
STANDALONE-STOCKS
STANDALONE-METALS
```

Each exercises CashSettlementPort LocalSettlementAdapter path.

## P1-FIX-009 — Relationship matrix complete

For every cross-table relationship document:

```text
FK | cardinality | nullable | owner | write path
```

Not only conceptual clusters — **actual** edges used in schema.
