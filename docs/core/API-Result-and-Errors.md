# API Result و خطاهای Typed (P0)

## ApiResult\<T\>

```text
success
data
error?
warnings?
operationId?
traceId / request_id
schemaVersion
```

Warning ≠ Error:

- Stale price 8 days → **warning** (عملیات می‌تواند ادامه یابد)
- Journal unbalanced → **error** (fail)

## خطاهای مالی Typed (نمونه)

`INSUFFICIENT_BALANCE` · `INVALID_DECIMAL` · `NEGATIVE_QUANTITY` · `INVALID_RATE` · `UNBALANCED_JOURNAL` · `DUPLICATE_OPERATION` · `STALE_PRICE` · `MISSING_INSTRUMENT` · `INVALID_DATE` · `FEATURE_NOT_ENABLED` · `LICENSE_REQUIRED` · `POSTED_DOCUMENT_IMMUTABLE` · `IDEMPOTENCY_CONFLICT` · `INTEGRITY_ERROR`

ممنوع: `throw new Error("bad")` بدون code در مرز API.

## مرز UI

API Domain **فیلد UI-specific ندارد** (`selectedTab`, `isExpanded`, …).

UI State (Zustand و مشابه) ≠ Financial SoT. Balance در store فقط cache است.

---
## P0-005 — Public API primitives only

Response/request JSON:

- Money/qty/rate: **string** decimal (`"1234.56"`)
- Dates: ISO string
- Enums: string unions

**Forbidden in Public API samples:** `Decimal` class instances, `number` for money.

## Canonical error codes (historical batch-4 §8; see host LOCK)

Shared codes include at least: `VALIDATION_ERROR`, `CONFLICT`, `IDEMPOTENCY_CONFLICT`, `INSUFFICIENT_BALANCE`, `STALE_DATA`, `NOT_FOUND`, `PERMISSION_DENIED`, `RECOVERY_REQUIRED` / `INTERNAL`. Features extend; they do not replace these meanings.


---

## Requirements Lock (MR-258 … MR-274) — 100% complete 2026-09-05

### Envelope (canonical response shape)

```json
{
  "apiVersion": "1.0",
  "schemaVersion": "personal-fi-v1",
  "success": true,
  "data": {},
  "error": null,
  "warnings": [],
  "operationId": "uuid-or-null",
  "commandHash": "hash-or-null",
  "engineVersions": { "costBasis": "1.2", "loanSchedule": "1.0", "rounding": "1.0" },
  "correlationId": "client-or-server-trace-id",
  "meta": {
    "asOf": "2026-09-05",
    "pagination": { "cursor": "opaque", "limit": 50, "hasMore": false },
    "sort": ["business_date:desc"],
    "filtersApplied": {}
  }
}
```

| # | Requirement | Status | Implementation |
|---|-------------|--------|----------------|
| MR-258 | Request shape | ✅ LOCKED | API-Reference.md + per-feature command schemas |
| MR-259 | Response envelope | ✅ LOCKED | shape above; always present keys |
| MR-260 | apiVersion | ✅ LOCKED | top-level `apiVersion` string (semver) |
| MR-261 | schemaVersion | ✅ LOCKED | top-level `schemaVersion` (matches db_meta.schemaId) |
| MR-262 | operationId | ✅ LOCKED | `fin_operations.id` echoed when financial write |
| MR-263 | commandHash | ✅ LOCKED | `fin_operations.command_hash` for idempotency |
| MR-264 | engineVersions | ✅ LOCKED | object of engine → version used for the op |
| MR-265 | correlationId | ✅ LOCKED | client-supplied or server-generated tracing ID |
| MR-266 | Pagination | ✅ LOCKED | cursor **or** offset+limit; default limit documented per endpoint |
| MR-267 | Cursor semantics | ✅ LOCKED | opaque cursor; server-stable ordering; never client-decoded |
| MR-268 | Sorting | ✅ LOCKED | `sort` query/body: `field:asc|desc` multi-key allowed |
| MR-269 | Filtering | ✅ LOCKED | `filter` object; only documented fields; unknown keys rejected |
| MR-270 | asOf | ✅ LOCKED | historical query parameter; required for valuation/report endpoints |
| MR-271 | Deterministic error codes | ✅ LOCKED | closed set of typed codes (see above + API-Result list) |
| MR-272 | Retryability | ✅ LOCKED | each error code has `retryable: true|false`; network/timeout/IDEMPOTENCY_CONFLICT(retry same hash) yes; validation/invariant no |
| MR-273 | User action requirement | ✅ LOCKED | `USER_ACTION_REQUIRED` error code + `actionHint` payload |
| MR-274 | Idempotency conflict behavior | ✅ LOCKED | same commandHash → return original operationId (no double post) |

Money/qty always decimal **string**. Dates ISO. No UI-only fields in domain API.
