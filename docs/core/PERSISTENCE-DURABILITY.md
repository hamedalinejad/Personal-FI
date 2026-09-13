> **SUPERSEDED as independent authority** — use docs/PRODUCT.md, ARCHITECTURE.md, FINANCIAL-CORE.md, DATA-MODEL.md, API.md, REPORTING.md, OFFLINE-RELEASE.md, DEVELOPMENT.md, modules/*.

# Persistence Durability vs Business Status (FINAL)

## Split (non-negotiable)

| Concern | Owner | Values |
|---------|-------|--------|
| **Business status** | `fin_operations.status` | `draft` \| `posted` \| `voided` \| `failed` |
| **Transport durability** | `db_meta` keys | `pending` \| `sql_committed` \| `persisted` \| `persist_failed` |

`persisted` is **not** a business status.

## db_meta keys

```text
durability.last              → last writer durability outcome
durability.operation.<opId>  → per-operation durability (preferred read)
```

## Legacy column

`fin_operations.durability_state` remains for **compatibility** only.

1. Writers dual-write: column + `db_meta`
2. New code **reads** prefer `db_meta`
3. Drop column only in a **versioned** future migration after consumers migrate

## Product target vs Node adapter

```text
Domain/Core → Persistence Port
  → Node SQLite (tests/dev)
  → sql.js + IndexedDB (PWA product)
```

No business logic imports a concrete adapter.
