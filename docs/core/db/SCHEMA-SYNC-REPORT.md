# Schema Sync Report

Generated: 2026-09-12T21:06:36.957Z

| Check | Result |
|-------|--------|
| Tables | 86 |
| Columns | 855 |
| Inventory rows | 856 |
| Manifest hash | `77b4095f611d6caf` |
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
