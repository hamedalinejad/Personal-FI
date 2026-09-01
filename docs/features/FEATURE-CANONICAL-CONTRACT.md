# Feature Canonical Contract

تاریخ: 2026-09-01
وضعیت: P0/P1 contract برای شروع implementation
Scope: تمام `docs/features/*`

## 1. Feature independence

هر Feature باید بدون فعال بودن UI یا دیتابیس Feature دیگر قابل استفاده باشد، مگر یک capability صریح در قراردادش تعریف شده باشد.

```text
Feature UI
  ↓
Feature Public API
  ↓
Feature Domain / Ledger
  ↓
Core Financial Operation
  ↓
optional CashSettlementPort
```

ممنوع: Feature → repository داخلی Feature دیگر، FK اجباری به جدول Feature دیگر برای مسیر standalone، یا mutation مستقیم snapshot Feature دیگر.

## 2. One financial operation

یک عمل کاربر = یک `operationId` و یک atomic boundary. Domain event، journal و cash settlement viewهای یک operation هستند؛ سه حقیقت مستقل نیستند.

## 3. Source of truth

- ledger/domain events = authoritative
- holdings/balances/summaries = derived projection
- schedule = plan، نه payment event
- price history = valuation input، نه historical transaction value

هر projection باید rebuild/reconcile API داشته باشد.

## 4. Money and quantities

- همه مقدارهای مالی و quantityها DecimalString هستند.
- currency/asset identity از amount جداست.
- FX direction باید با Core Currency-CrossRate یکسان باشد.
- gross/net/fee باید وقتی fee روی quantity یا proceeds اثر دارد جدا ذخیره شوند.
- rounding فقط طبق Rounding Policy انجام شود.

## 5. Identity

برای asset/instrumentهای سرمایه‌گذاری، `ref_instruments.id` canonical identity است. `symbol` label است. `assetKey` convenience/mapping است مگر قرارداد Core برای یک دامنه صریحاً آن را canonical کند.

## 6. Fees

Fee باید حداقل این provenance را حفظ کند:

```text
fee amount
fee currency/asset
fee treatment
historical conversion to base (when required)
operationId
```

Feature نباید fee را بدون policy در principal، quantity یا cost basis مخلوط کند.

## 7. Reversal

Feature-local reversal algorithm ممنوع. مسیر واحد:

```text
core.reverseOperation(operationId)
  → feature adapter reversal plan
  → domain inverse/void
  → journal inverse
  → cash inverse if applicable
  → rebuild projections
```

## 8. Offline-first

ثبت، اصلاح، گزارش و rebuild داده تاریخی باید بدون شبکه کار کند. Network فقط برای optional enrichment/price sync است. نبود network نباید integrity مدل را بشکند.

## 9. Progressive disclosure

Featureها مدل غنی دارند اما UI ساده می‌ماند:

- Core action fields در فرم اصلی
- Advanced details برای network, fee, tax, provenance, FX, external references
- صفحات جدید فقط برای capability مستقل و واقعاً لازم

## 10. Data preservation

هیچ فیلد legacy فقط به‌خاطر canonicalization حذف نمی‌شود. Migration باید آن را map/retain کند و write جدید فقط canonical field را تولید کند. داده خام provider، reference خارجی، quote/original amount و historical FX در صورت امکان باید حفظ شوند.

## 11. API boundary

Public API هر Feature باید:

- input/output schema داشته باشد
- `operationId` را برای mutationهای مالی برگرداند/بپذیرد
- خطاهای validation/business/integrity را از هم جدا کند
- برای standalone بودن وابستگی اختیاری را explicit کند
- مستقیماً DB snapshot را به‌عنوان حقیقت authoritative ارائه نکند

## 12. Required implementation gate

قبل از کدنویسی هر Feature این موارد باید در spec آن وجود داشته باشد:

1. Domain entities + field nullability
2. FK/relationship matrix
3. SoT و projectionهای derived
4. Atomic operation list
5. API contract
6. Calculation/rounding policy
7. Fee/tax treatment
8. FX semantics
9. reversal policy
10. standalone mode
11. rebuild/reconcile strategy
12. minimum golden fixtures
