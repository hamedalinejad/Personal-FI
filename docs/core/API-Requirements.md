# الزامات API (P0/P1)

هر ماژول API مستقل و مستند دارد (Feature Public API + Capability API).

v1: TypeScript in-process (همان contract).  
آینده: REST/IPC با پیشوند منطقی `/api/v1` یا `apiVersion: 1`.

## قواعد ضروری

| # | قاعده |
|---|--------|
| 1 | API **نسخه‌گذاری** شود (`schema_version` / api v1) |
| 2 | تمام عملیات **نوشتن Idempotent** (`operationId` / idempotency key) |
| 3 | خطاها **code** مشخص داشته باشند |
| 4 | **Validation** قبل از ثبت |
| 5 | **Pagination و Filtering** روی list/query |
| 6 | ثبت تراکنش‌ها **Atomic** (`runAtomicFinancialOperation`) |
| 7 | عملیات حساس **Optimistic Locking** (version / updatedAt) |
| 8 | **Response envelope واحد و ثابت** طبق `API-Reference.md` |
| 9 | شناسه‌ها **پایدار** (UUID/ULID) — نه symbol |
| 10 | **حذف فیزیکی** داده مالی ممنوع (soft delete / archive policy) |
| 11 | هر API **منبع و نسخه Schema** خود را مشخص کند |
| 12 | رویدادهای بین ماژول‌ها **قابل ردیابی** (`operationId` / correlationId) |
| 13 | Import/Export **نسخه‌دار** |
| 14 | API **بدون اینترنت** روی محیط محلی کار کند |

## Canonical Response Envelope

تمام APIها، چه in-process و چه REST/IPC آینده، از یک مدل معنایی استفاده می‌کنند:

```json
{
  "success": true,
  "data": {},
  "errors": [],
  "meta": {
    "request_id": "...",
    "operation_id": "...",
    "schema_version": "1.0"
  }
}
```

برای خطا:

```json
{
  "success": false,
  "data": null,
  "errors": [
    {
      "code": "POSTED_DOCUMENT_IMMUTABLE",
      "message": "Posted documents cannot be edited.",
      "field": null
    }
  ],
  "meta": {
    "request_id": "...",
    "operation_id": "...",
    "schema_version": "1.0"
  }
}
```

### شناسه‌ها

- `request_id`: شناسه request/trace است.
- `operation_id`: برای Command مالی و idempotency اجباری است؛ برای Query لازم نیست.
- این دو **نباید** در قرارداد API یکی فرض شوند، حتی اگر implementation در بعضی Commandها یک مقدار تولید کند.

### Standalone Module API (P0)

Feature Public API باید بدون وابستگی به route، UI یا فعال بودن Accounts قابل استفاده باشد:

```text
Standalone:
  Feature API → Core → LocalSettlementAdapter → local DB

Integrated:
  Feature API → Core → AccountsCashAdapter → local DB
```

ماژول Loan / Crypto / Stocks / Funds / Metals نباید برای صحت Domain وجود `acc_accounts` یا `acc_transactions` را شرط کند.

## خطا و رفتار مالی

- خطاهای validation قبل از mutation مالی برگردند.
- خطای commit نباید به‌عنوان موفقیت گزارش شود.
- retry با همان `operation_id` باید همان نتیجه قبلی را بدهد یا `IDEMPOTENCY_CONFLICT` برگرداند.
- Queryها write ندارند.

مرجع: `Feature-API-Contract.md` · `Capability-API.md` · `API-Reference.md` · `Canonical-Financial-Operation.md`