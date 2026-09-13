# API (sole API contract owner)

**Status:** CURRENT · Normative for envelope, errors, idempotency, pagination, capabilities.

## 1. Success envelope
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

## 2. Errors
* `errors[].code` — central taxonomy only.
* Feature-specific codes under `errors[].details.featureCode` only.
* No competing `errorCode` field name.

## 3. Mutation requirements
* `operationId` (UUID) required.
* Canonical command hash / idempotency: same id + same hash → replay; same id + different hash → conflict.
* Money fields are decimal strings.

## 4. Pagination
Stable order keys (default): `businessDate`, `createdAt`, `id`.  
Cursor encodes all order keys.

## 5. Capabilities
`capabilities()` per feature public-api; license gates availability without data destruction.

## 6. Queries
Never mutate financial state. Optional `asOf` for historical reads.

## 7. Absorbs
API-Requirements, API-Result-and-Errors, Feature-API-Contract prose (conflict → this file).
