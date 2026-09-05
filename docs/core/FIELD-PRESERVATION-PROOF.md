# Field Preservation Proof (OPEN-003)

## Rule

No **persisted financial field** may exist in schema or Feature docs without:

1. Data-Dictionary row (or Feature appendix section following the same columns)
2. fieldKind ∈ {RAW, DERIVED, SNAPSHOT, EXTERNAL_REPORTED, LABEL, SYSTEM_INDEX}
3. Owner + SoT
4. Migration disposition (preserve | rebuild | map | deprecated)
5. Fixture or rebuild path that exercises the field when RAW

## Machine-readable checklist format

File: `docs/core/field-inventory.checklist.tsv` (TSV, one row per field)

```text
table	column	fieldKind	owner	sot	nullable	inDictionary	inSchemaFreeze	migration
fin_journal_lines	amount	RAW	Accounting Core	journal	NO	YES	REQUIRED	preserve
inv_crypto_holdings	quantity	DERIVED	Crypto	inv_crypto_transactions	NO	YES	REQUIRED	rebuild
```

## Acceptance

```text
undocumented financial fields = 0
DERIVED without rebuild source = 0
RAW without preserve migration = 0
```

Until inventory is complete, Gate D remains **BLOCKED**. Core money helpers may still land; Feature command code must not.

---

## Requirements Lock (MR-291 … MR-296) — 100% complete 2026-09-05

| # | Requirement | Status | Implementation |
|---|-------------|--------|----------------|
| MR-291 | Feature field → Data Dictionary | ✅ LOCKED | Every financial field listed in Data-Dictionary / field-inventory.checklist.tsv |
| MR-292 | Feature field → Schema freeze row | ✅ LOCKED | SCHEMA-FREEZE-COVERAGE.md row per table/column |
| MR-293 | Feature field → API request/response | ✅ LOCKED | API-Reference + per-feature command/query schemas echo the same fields |
| MR-294 | Feature field → Migration disposition | ✅ LOCKED | preserve / rebuild / map / deprecated recorded in migration notes |
| MR-295 | Feature field → Fixture or rebuild path | ✅ LOCKED | Golden fixtures (or explicit rebuild rule) per feature family |
| MR-296 | Undocumented financial fields = 0 | ✅ LOCKED | Gate H: CI / audit fails if any financial field lacks dictionary + schema + ownership |

**No-Field-Loss Gate H rule:**  
A financial field may not ship unless it has: (1) dictionary entry, (2) schema column, (3) ownership/SoT, (4) API surface or explicit internal-only mark, (5) migration disposition, (6) fixture or rebuild path.

Original amount, currency, gross/net/fee, instrumentId, FX path, operationId, reversal chain, source lineage, engine versions remain mandatory and never dropped.

## Field-kind enum (canonical) — DoD closed 2026-09-05

```text
RAW | DERIVED | SNAPSHOT | EXTERNAL_REPORTED | LABEL | SYSTEM_INDEX
```

Every financial column in schema freeze / field-inventory must carry exactly one kind.  
Gate H fails if any financial field lacks kind + owner + SoT.
