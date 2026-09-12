---
id: DOC-AUTH-OP-STATUS
title: Operation status vs durability vocabulary
status: approved
version: 1.0
---

# P0-OP-006

| Field | Allowed values | Meaning |
|-------|----------------|---------|
| `fin_operations.status` | `draft` \| `posted` \| `voided` \| `failed` | Business/financial state |
| `fin_operations.durability_state` | `pending` \| `sql_committed` \| `persisted` \| `persist_failed` | Persistence transport |

**Never** use `pending` as `status`.  
Canonical-Financial-Operation prose that says “pending” means **durability_state**, not business status.

# P0-OP-008

Insert path: row starts `status=draft` + `durability_state=pending` while domain/journal write; on success promote to intended `status` + `sql_committed` and only then write `result_json`.
