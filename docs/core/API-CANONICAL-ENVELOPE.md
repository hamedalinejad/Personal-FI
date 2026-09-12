# Canonical API Envelope (API-001 FINAL)

**Authority for response shape.** Supersedes conflicting prose in API-Requirements.md / Feature-API-Contract.md.

## Success

```json
{
  "success": true,
  "data": {},
  "errors": [],
  "meta": {
    "request_id": "uuid-or-correlation",
    "operation_id": "uuid-when-mutation",
    "api_version": "1",
    "schema_version": "1"
  },
  "engine_versions": {
    "money": "x.y",
    "costBasis": "x.y",
    "loan": "x.y"
  }
}
```

`engine_versions` present on financial mutations and rebuildable queries; optional on pure UI lookups.

## Error

```json
{
  "success": false,
  "data": null,
  "errors": [
    {
      "code": "VALIDATION_ERROR",
      "message": "human readable",
      "details": { "featureCode": "LOAN_PERIODS", "field": "periods" }
    }
  ],
  "meta": {
    "request_id": "...",
    "api_version": "1",
    "schema_version": "1"
  }
}
```

**API-002:** canonical field is `errors[].code` (not `errorCode`). Feature-specific codes live in `details.featureCode`.

## Pagination (API-003)

```json
{
  "cursor": "opaque",
  "limit": 50,
  "sort": ["businessDate", "createdAt", "id"]
}
```

Stable total order for financial lists: **`businessDate ASC, createdAt ASC, id ASC`** (or documented inverse).  
Cursor must encode **all** order keys.

Offset is allowed only as a convenience on non-critical lists; financial ledgers prefer cursor.

## Feature minimum surface (API-004)

| Method | Required |
|--------|----------|
| `capabilities()` | yes |
| `getById` / domain get | yes |
| `list` | yes |
| `reconcile` | when domain has projection vs ledger |
| `rebuild` | when domain has rebuildable derived state |

Checklist: Crypto, Stocks, Funds, Metals, Loan, Accounts, Tax, Physical Assets, Budget, Goals, Bills.
