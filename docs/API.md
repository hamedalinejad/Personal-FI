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

## 10. Per-command machine contract (required before freeze)

Every public mutation must document (owner = this file + module):

```
commandId · purpose
requestSchema · field requiredness · type · unit · currency · precision
normalization · default policy · identity · validation · business rules
journal mapping · fees · FX · cost basis · DB writes
transaction boundary · idempotency · reversal
result schema · error codes
query effects · report effects
standalone availability · license capability
fixture · invariants · recovery cases
```

**Rule:** A developer must not need implementation source to know how a financial command works.

## 11. Envelope (canonical)
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
Errors use `errors[].code`; feature-specific codes in `details.featureCode` when needed.

## 12. Standalone editions
| Edition | Entry |
|---------|--------|
| Loan-only | loan public API → Core → local settlement → journal → loan reports |
| Crypto / Stocks / Funds / Metals-only | same pattern |
| Full | all modules |

UI may hide Accounts; kernel remains. Licensing disables capability — **never deletes history**.
Required always: backup, restore, statement, export, reversal, asOf, rebuild.

## Command contract authority (LOCKED)
Per-command request/result economics live in `docs/core/registry/command-catalog.json` cards (OpenAPI-like offline domain contracts).  
Shared JSON schemas only: api-envelope · operation-result · schedule-snapshot.  
Future HTTP OpenAPI is a **projection** of the catalog — not a second business authority.

