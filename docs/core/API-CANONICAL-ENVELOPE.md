---
id: DOC-API-ENVELOPE
title: Canonical API Response Envelope
status: approved
version: 1.0
supersedes: [API-Requirements envelope fragment, Feature-API-Contract envelope fragment]
---

# API-001 / API-002

```json
{
  "success": true,
  "data": {},
  "errors": [],
  "meta": {
    "request_id": "...",
    "operation_id": "...",
    "api_version": "1",
    "schema_version": "1"
  },
  "engine_versions": {}
}
```

- `errors[].code` only (never `errorCode` at top level of error object as primary).
- `errors[].details.featureCode` for feature-specific codes.
- `engine_versions` required on financial mutations / rebuild; optional on pure reads.

# API-003 Pagination

Stable total order (unless a query documents another):

```text
businessDate, createdAt, id
```

Cursor must encode **all** order keys (`src/core/api/pagination.js`).
