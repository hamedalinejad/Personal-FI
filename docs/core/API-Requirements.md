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
| 8 | **Response ساختار ثابت** |
| 9 | شناسه‌ها **پایدار** (UUID/ULID) — نه symbol |
| 10 | **حذف فیزیکی** داده مالی ممنوع (soft delete) |
| 11 | هر API **منبع و نسخه Schema** خود را مشخص کند |
| 12 | رویدادهای بین ماژول‌ها **قابل ردیابی** (`operationId` / correlationId) |
| 13 | Import/Export **نسخه‌دار** |
| 14 | API **بدون اینترنت** روی محیط محلی کار کند |

## Response عمومی

```json
{
  "success": true,
  "data": {},
  "errors": [],
  "meta": {
    "request_id": "..."
  },
  "schema_version": "1.0"
}
```

## خطای مناسب

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
    "request_id": "..."
  }
}
```

`request_id` اغلب همان `operationId` یا correlation id است.

مرجع: `Feature-API-Contract.md` · `Capability-API.md` · `API-Reference.md`
