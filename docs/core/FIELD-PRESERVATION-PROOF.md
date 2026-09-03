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
