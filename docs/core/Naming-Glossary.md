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
