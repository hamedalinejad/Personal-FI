# relatedFeature Enum — P0-003 Resolution

**Status:** PROPOSED (requires schema and document alignment)

---

## Problem Statement

Different `relatedFeature` values across documents:

| Document | Values |
|----------|--------|
| `schema.sql` | `crypto`, `stocks`, `funds`, `metals`, `loans`, `income`, `expense`, `cheque`, `budget`, `goals`, `bills`, `tax`, `physical_assets`, `accounts` |
| `Investment-Crypto.md` | `crypto_exchange` |
| `Investment-Stocks-Iran.md` | `stocks_iran` |
| `Fixed-Income-Funds.md` | `fif` |

---

## Risk

Polymorphic links via `acc_transaction_links.related_feature` will fail validation or silently create multiple taxonomies.

---

## Solution: Single Core Enum Owner

### Recommended Canonical Enum

Use feature IDs based on project structure:

```
accounts
income
expense
cheque
loan
investment.crypto
investment.stocks
investment.funds
investment.metals
physical_assets
budget
goals
bills
tax
```

### Mapping Table

| Feature Folder | Recommended value | Current in Docs | Current in Schema |
|----------------|-------------------|-----------------|-------------------|
| `00-Accounts-Banking` | `accounts` | - | `accounts` ✓ |
| `01-Income` | `income` | - | `income` ✓ |
| `02-Expense` | `expense` | - | `expense` ✓ |
| `03-Cheque-Management` | `cheque` | - | `cheque` ✓ |
| `04-Debt-Loan-Management` | `loan` | - | `loans` ✗ → `loan` |
| `05-Investment/05-01` | `investment.crypto` | `crypto_exchange` | `crypto` ✗ → `investment.crypto` |
| `05-Investment/05-02` | `investment.stocks` | `stocks_iran` | `stocks` ✗ → `investment.stocks` |
| `05-Investment/05-03` | `investment.funds` | `fif` | `funds` ✗ → `investment.funds` |
| `05-Investment/05-04` | `investment.metals` | `metals` | `metals` ✓ |
| `06-Physical-Assets` | `physical_assets` | - | `physical_assets` ✓ |
| `07-Budget-Management` | `budget` | - | `budget` ✓ |
| `08-Financial-Goals` | `goals` | - | `goals` ✓ |
| `09-Bills-Recurring-Transactions` | `bills` | - | `bills` ✓ |
| `14-Tax-Management` | `tax` | - | `tax` ✓ |

---

## Implementation Steps

1. **Update `schema.sql`** to use canonical enum values:
   ```sql
   CHECK (related_feature IN ('accounts','income','expense','cheque','loan',
   'investment.crypto','investment.stocks','investment.funds',
   'investment.metals','physical_assets','budget','goals','bills','tax'))
   ```

2. **Update feature docs** to use canonical enum:
   - `crypto_exchange` → `investment.crypto`
   - `stocks_iran` → `investment.stocks`
   - `fif` → `investment.funds`

3. **Document in** `types/types.md` (or new `core/types/related-feature.ts`)

4. **Add migration guide** in `db/schema-migration-notes-v1.md`

---

## Notes

If `relatedFeature` is used only for presentation/UI, consider:
- Separate `domainFeatureId` (canonical, stable) from `displayLabel`
- But current usage in `acc_transaction_links` suggests it's used for routing/logic