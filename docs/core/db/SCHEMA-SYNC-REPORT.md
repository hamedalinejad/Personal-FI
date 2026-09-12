# Schema Sync Report

Generated: 2026-09-12T15:07:21.414Z

| Check | Result |
|-------|--------|
| Tables | 86 |
| Columns | 837 |
| Inventory rows | 838 |
| Manifest hash | `18b7bd98abe36985` |
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
