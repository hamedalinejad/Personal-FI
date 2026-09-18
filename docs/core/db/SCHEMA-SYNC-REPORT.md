# Schema Sync Report

Generated: 2026-09-18T08:01:23.568Z

| Check | Result |
|-------|--------|
| Tables | 86 |
| Columns | 874 |
| Inventory rows | 875 |
| Manifest hash | `dd4c567a82dcc89e` |
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
