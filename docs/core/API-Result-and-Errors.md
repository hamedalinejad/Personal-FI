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
