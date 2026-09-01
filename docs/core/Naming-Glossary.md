# Naming Glossary (ضد drift)

| نام canonical | معنی | نام‌های deprecated / alias |
|---------------|------|----------------------------|
| `instrumentId` | هویت پایدار دارایی در سیستم | — |
| `assetKey` | هویت crypto (= instrumentId کریپتو) | symbol به‌عنوان id |
| `displaySymbol` | برچسب UI | `symbol` وقتی فقط نمایش است |
| `tradeGroupId` | گروه C2C / چند leg یک trade | `tradeId` (alias مجاز در crypto legacy؛ کد جدید tradeGroupId) |
| `transferGroupId` | جفت transfer_out/in | `transferId` اگر همان معنی group |
| `relatedId` + `relatedFeature` | لینک polymorphic | فقط جایی که FK واقعی ممکن نیست |
| `accountTransactionId` | FK به `acc_transactions.id` | — |
| `operationId` | شناسه atomic financial op | — |
| `costCurrency` | ارز pool هزینه در CostBasis | — |

قوانین:
1. PR جدید نباید `tradeId` و `tradeGroupId` را برای دو مفهوم مختلف استفاده کند.
2. Public API ترجیحاً `id` / `instrumentId` / `operationId` — نه symbol خام.
3. Migration: rename با dual-read طبق Backward Compatibility Contract.

Crypto/Investment docs: write **`transferGroupId` only**; `transferId` = read-only legacy alias.

---

## Conventions

### Table Naming
`{prefix}_{entity}` — prefix مشخص‌کننده فیچر:
- `acc_` Accounts/Cash
- `inc_` Income
- `exp_` Expense
- `ln_` Loans
- `inv_` Investment
- `fin_` Accounting core / journal / operations
- `cur_` Currency
- `tax_` Tax
- `docs_` Documents
- `stg_` Settings
- `ref_` Registry (instruments, parties, …)
- `chk_` / `chq_` Cheque

### Field Naming
- TypeScript / JSON API: **camelCase** (`createdAt`, `operationId`)
- SQL columns: ترجیحاً **camelCase** هم‌تراز با TS در این پروژه (sql.js) مگر ستون legacy
- Enum TS: PascalCase types / string union literals
- PK: UUID v4 به صورت TEXT

### Deprecated aliases
`transferId` → `transferGroupId` · `tradeId` → `tradeGroupId` · `common_categories` → `cat_categories`

---

## FinancialOperation vs DomainTransaction vs DB Transaction

| Term | Meaning |
|------|---------|
| FinancialOperation | واحد اقتصادی اتمیک (`fin_operations`) |
| DomainTransaction | ردیف subledger (ln_*, inv_*, acc_*) |
| JournalEntry/Line | دفترکل |
| DB Transaction | BEGIN/COMMIT فنی SQLite |

استفادهٔ مبهم از کلمه «transaction» در کد/API ممنوع — نام صریح بگذار.
