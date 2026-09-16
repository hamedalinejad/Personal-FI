# Schema Sync Report

Generated: 2026-09-16T20:17:55.242Z

| Check | Result |
|-------|--------|
| Tables | 86 |
| Columns | 867 |
| Inventory rows | 868 |
| Manifest hash | `02ad2b21fee2f829` |
| Missing inventory | 0 |
| Extra inventory | 1 |

## Missing
None

## Extra (not in schema)
- inv_crypto_exchanges.venue_kind

## Pipeline

```
schema.sql → schema-manifest.js → schema.manifest.json
schema.sql → field-inventory-verify → checklist.tsv coverage
```

Release blocks if missing inventory > 0 or manifest check fails.
