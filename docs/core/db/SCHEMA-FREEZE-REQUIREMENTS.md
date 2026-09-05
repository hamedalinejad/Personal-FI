# Schema Freeze Requirements

Before schema implementation is frozen, **every table** must document:

| Item | |
|------|--|
| table name | |
| column name | |
| type | financial amounts = **TEXT** decimal string |
| nullable | |
| default | |
| unit | |
| precision | via PrecisionPolicy / instrument |
| currency semantics | |
| SoT | RAW/DERIVED/… |
| owner | |
| immutable? | |
| FK | |
| ON DELETE | financial history ≈ RESTRICT |
| ON UPDATE | |
| unique indexes | |
| partial unique indexes | |
| structural CHECK | length/enum/NOT NULL — **not** sole numeric correctness |
| application/domain validation | Decimal rules |
| indexes | |
| migration introduced version | |
| delete/archive/void policy | |

**P0:** numeric financial fields are TEXT; SQLite CHECKs are not the only correctness layer.

## P0-FINAL-AUD-003

Freeze is **not** real until:

```text
schema.sql
migrations/0001_...
schema-drift-test (docs tables vs SQL = 0 diff)
```

exist and CI runs the drift check.

## P0-FIX-016 — Real freeze checklist (per table)

For every table before Feature coding:

```text
table | column | sql type | nullable | FK | unique | index
structural CHECK only
field kind | owner | SoT | precision | migration version
```

**Especially required columns documented:**

- instrumentId · operationId · accountId · accountTransactionId
- relatedCorporateActionId · finAccountId
- sourceType / sourceReference
- fee fields · date fields · provenance fields

**Done:** `schema-drift-test` compares docs ↔ `schema.sql` / migrations = **0** diff.

---

## Requirements Lock (MR-275 … MR-290) — 100% complete 2026-09-05

| # | Requirement | Status | Implementation |
|---|-------------|--------|----------------|
| MR-275 | Primary key per table | ✅ LOCKED | Every table has explicit TEXT PK (UUID) |
| MR-276 | Exact SQL type | ✅ LOCKED | Money/qty/rate = TEXT; flags = INTEGER 0/1; dates = TEXT ISO/DATE |
| MR-277 | Nullable rule | ✅ LOCKED | Documented per column in schema + 01-schema-tables; financial required fields NOT NULL |
| MR-278 | Default values | ✅ LOCKED | Explicit DEFAULT only for safe flags/status; never for money |
| MR-279 | Foreign keys | ✅ LOCKED | All cross-table refs have FK; financial history RESTRICT |
| MR-280 | On-delete semantics | ✅ LOCKED | RESTRICT for ledger/history; SET NULL only for optional non-financial links |
| MR-281 | Unique constraints | ✅ LOCKED | command_hash, provider_tx_id, instrument natural keys where required |
| MR-282 | Partial unique constraints | ✅ LOCKED | e.g. crypto holding venue/wallet partial indexes |
| MR-283 | Index requirements | ✅ LOCKED | date, operation_id, instrument_id, batch_id, status indexes present |
| MR-284 | CHECK constraints | ✅ LOCKED | status enums, is_* flags 0/1, side debit/credit, etc. expanded |
| MR-285 | Generated/derived status | ✅ LOCKED | field-inventory + SCHEMA-FREEZE-COVERAGE mark DERIVED vs RAW |
| MR-286 | Field kind | ✅ LOCKED | RAW / DERIVED / SNAPSHOT / EXTERNAL_REPORTED / LABEL / SYSTEM_INDEX |
| MR-287 | Owner per field | ✅ LOCKED | Field-Level / Concept-Ownership-Matrix + feature ownership |
| MR-288 | SoT per field | ✅ LOCKED | journal = cash SoT; domain tables = specialized; snapshots never SoT |
| MR-289 | Precision per field | ✅ LOCKED | Rounding-Policy + instrument/currency scale; decimal string storage |
| MR-290 | Migration strategy | ✅ LOCKED | Migration-Data-Preservation: checksums, backup, rollback, additive-first |

Schema freeze gate requires zero drift between schema.sql, 01-schema-tables, and field inventory.
