> **SUPERSEDED as authority** — use top-level owner docs.

# Source Vocabulary (BUG-FINAL-040 — sole owner)

| Field | Meaning | Allowed values (v1) |
|-------|---------|---------------------|
| **source_channel** | Interface / write path | `ui` \| `api` \| `import` \| `migration` \| `system` \| `reconciliation` |
| **source_type** | Business provenance | free-ish controlled set: `manual`, `bank_statement`, `broker_statement`, `exchange_api`, `opening`, `correction`, `csv`, `json`, `recurring`, … |
| **source_reference** | External id / file / batch label | opaque string |

**Forbidden:** using `source_type` for interface values (`ui`/`api`/…) on operations or journal lines.

Journal lines inherit the same split as `fin_operations`.
