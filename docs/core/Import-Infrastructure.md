# Import Infrastructure (Core — نه Feature جدا)

ورود تاریخچه طولانی (مثلاً ۵ سال Binance/Wallet/بانک) دستی نیست.

## Pipeline مشترک

```text
Raw file (CSV / JSON / exchange export)
  → Parse
  → Normalize (به Command/Domain DTO)
  → Preview (UI)
  → Duplicate detection (hash / externalId / txHash+network)
  → Mapping (account, instrument, party)
  → Atomic Commit (batch of operations یا یک import operation + many legs)
  → Audit (fin_audit_log)
```

## اصول

| قانون | |
|--------|--|
| Offline | فایل محلی؛ بدون اجبار به API صرافی در لحظه import |
| Idempotent | همان فایل/همان external ids → duplicate skip |
| Atomic | یا batch موفق یا rollback؛ partial فقط با policy صریح کاربر |
| Adapter | `CryptoExchangeImportAdapter`, `BankCsvAdapter`, … فقط normalize می‌کنند |
| SoT | بعد از commit همان مسیر Operation → Domain → Journal |

## Out of Scope v1.0 کد

- Auto-connect API صرافی برای pull history (شبکه)  
- Merge دو DB کامل (restore = replace)

## Scope تدریجی

| فاز | |
|-----|--|
| v1.1+ | CSV بانک + CSV crypto ساده |
| v1.2+ | قالب‌های کارگزاری / FIF |
| v2 | connectorهای بیشتر |

ماژول: `core/import/` — Featureها فقط adapter می‌دهند.

---

## نگهداری Raw Input (ایران / کارگزاری)

قبل از Domain:

```text
Import batch
  → Imported raw row (تمام ستون‌های فایل: تاریخ، نماد، ISIN، تعداد، قیمت، ناخالص، کارمزد، مالیات، خالص، …)
  → Normalize / Map
  → Financial Operation
```

**ممنوع:** CSV مستقیم → Journal بدون raw staging و بدون `sourceType=import` + `sourceReference`.

گزارش معاملات کارگزاری باید فیلدهای خام قابل audit بمانند حتی بعد از normalize.
