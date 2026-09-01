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

---

## Raw Payload و Unmapped Fields (P0 Risk #6)

```text
Import
  → rawPayload (متن/JSON کامل ردیف یا فایل)
  → mapped fields → Domain
  → unmappedFields (JSON): هر ستونی که mapper نشناخت
```

**ممنوع:** دور انداختن ستون‌های ناشناخته فایل بانک/کارگزاری.
گزارش/mapper بعدی باید بتواند از staging همان raw را دوباره بخواند.

---

## Import Pipeline (P2 Risk)

```text
Select file
  → Preview (نمونه ردیف‌ها + mapping)
  → Validation (خطاها، duplicate، تاریخ، decimal)
  → User Confirm
  → Commit (batch operations + lineage)
```

**ممنوع:** Commit بدون Preview/Validation موفق.  
ردیف‌های نامعتبر در گزارش validation می‌مانند؛ silent skip بدون log ممنوع.
