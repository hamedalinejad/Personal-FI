# API (sole API owner)

**Status:** CURRENT

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
Primary error field: `errors[].code`. Feature-specific codes in `errors[].details.featureCode` when needed.

## 2. Idempotency & hash
- Client `operationId` (UUID).
- Server recomputes SHA-256 over canonical economic identity.
- Mismatch → `OP_COMMAND_HASH_MISMATCH`.
- Same id + same hash → idempotent replay.

## 3. Status vs durability
| status | draft \| posted \| voided \| failed |
| durability_state | pending \| sql_committed \| persisted \| persist_failed |

## 4. Pagination
Order: `businessDate ASC, createdAt ASC, id ASC`. Cursor encodes full keyset.

## 5. Query purity
Queries never post journal lines.

## 6. Validation order (writes)
canonicalize → account/currency → FX/base → balance → domain → commit.

## 7. Command catalog (module-owned details)
| Area | Commands |
|------|----------|
| Accounts | create, update, archive, deposit, withdraw, transfer |
| Income/Expense | income.create/reverse, expense.create/reverse |
| Cheque | issue, receive, deposit, clear, bounce, cancel, return |
| Loan | create, recordPayment, reversePayment |
| Crypto | buy, sell, transfer |
| Stocks | buy, sell, settle, dividend |
| Funds | subscribe, redeem, distribution |
| Metals | buy, sell, delivery |
| Tax | recordEvent, payTax |
| Core | capabilities, health, backup/restore (ops) |

Exact request schemas live with module docs; envelope always as above.

## 8. Capabilities
`capabilities()` lists command ids + edition entitlement.

## 9. Implementation refs
`src/core/api/*`, `operationEngine.js`, feature `public-api/`.

## 10. Supersedes
API-Reference and docs/core API micro-docs as authority.

## Error code families
| Prefix | Domain |
|--------|--------|
| OP_ | Operation engine |
| ACCOUNT_ | Accounts |
| LOAN_ | Loan |
| CRYPTO_ | Crypto |
| STOCK_ | Stocks |
| FUND_ | Funds |
| METAL_ | Metals |
| TAX_ | Tax |
| CHEQUE_ | Cheque |
| INV_ | Inventory/journal invariants |
| WRITER_ | Multi-tab |

## Cursor encoding
Base64url JSON: `{"businessDate":"...","createdAt":"...","id":"..."}` matching sort keys. Invalid cursor → API_CURSOR_INVALID.
