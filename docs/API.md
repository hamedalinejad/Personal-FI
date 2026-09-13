# API (sole API owner)

**Status:** CURRENT

Absorbs API-Reference, API-Requirements, API-Result-and-Errors, API-CANONICAL-ENVELOPE micro-docs.

## 1. Envelope (locked)
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
- `errors[].code` only (not `errorCode` as primary).
- `engine_versions` on financial mutations / rebuild.

## 2. Idempotency
- Client sends stable `operationId`.
- Server computes **canonical command hash** over economic identity (payload, journal, dates, rates, settlement/event/provenance).
- Caller-supplied hash must match or `OP_COMMAND_HASH_MISMATCH`.
- Replay same id + same hash → idempotent success; different hash → conflict.

## 3. Operation status vs durability
| Field | Values |
|-------|--------|
| status | draft \| posted \| voided \| failed |
| durability_state | pending \| sql_committed \| persisted \| persist_failed |

Never use `pending` as business status. Journal writes require **explicit** status.

## 4. Pagination
Stable order default: `businessDate, createdAt, id`. Cursor encodes all order keys.

## 5. Capabilities
Each feature `capabilities()` lists commands/queries and edition flags.

## 6. Minimum feature surface
`capabilities` · `getById` · `list` · `reconcile` (when applicable) · `rebuild` (when applicable)

## 7. Query purity
Query/list/report endpoints must not post journal lines.

## 8. Validation order (writes)
canonicalize → account identity/currency → FX/base amounts → journal balance → domain constraints → commit.

## 9. Implementation
`src/core/api/responseEnvelope.js`, `pagination.js`, `operationEngine.js`.

## 10. Supersedes
API-Reference.md · docs/core/API-*.md as authority.
