# API (sole API owner)

**Status:** CURRENT

Absorbs: API-Reference, API-Requirements, API-Result-and-Errors, API-CANONICAL-ENVELOPE, Feature-API-Contract, Capability-API, surface checklist, pagination prose.

## Envelope
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
`errors[].code` primary. Money/qty/rate/price = decimal strings.

## Idempotency
operationId + canonical economic hash. Mismatch → OP_COMMAND_HASH_MISMATCH. Replay same hash → idempotent.

## Status vs durability
Business status ≠ durability_state (see FINANCIAL-CORE).

## Pagination
Stable order: businessDate, createdAt, id. Cursor encodes full keyset.

## Query purity
Queries do not post journal.

## Validation order
canonicalize → account/currency → FX/base → balance → domain → commit.

## Command catalog
See modules/* for per-command detail. Families: accounts, income/expense, cheque, loan, crypto, stocks, funds, metals, tax, core ops.

## capabilities()
Lists command ids, edition, entitlements.

## Error families
OP_ ACCOUNT_ LOAN_ CRYPTO_ STOCK_ FUND_ METAL_ TAX_ CHEQUE_ INV_ WRITER_ API_
