# Audit Trail vs Financial Event

این دو یکی نیستند.

| | Financial Event | Audit |
|--|-----------------|-------|
| معنی | چه اتفاق اقتصادی/حسابداری افتاد | چه کسی/چه سیستمی چه تغییری اعمال کرد |
| مثال | Operation X posted; Y reversed | User approved repair; User corrected X |
| ذخیره | `fin_operations` + domain + journal | `fin_audit_log` |
| SoT مالی | بله (به‌همراه ledger) | خیر — observability و compliance |

```text
Audit: "User corrected transaction X"
Financial: "Operation X voided/reversed; Operation Y posted"
```

---

## Audit Log — غیرقابل‌ابهام (P0)

برای سیستم مالی، Audit فقط `createdAt` / `updatedAt` نیست.

حتی در نسخه **Single User** باید بتوان فهمید:

| بعد | معنی |
|-----|------|
| **Who** | actor — local user / device / system / future multi-user id |
| **When** | timestamp UTC |
| **Which Operation** | `operationId` در صورت مرتبط بودن |
| **Before** | خلاصه یا snapshot قبل (beforeSummary / beforeJson) |
| **After** | خلاصه یا snapshot بعد |
| **Why** | reason / memo / action code (مثلاً repair, void, import) |
| **Source** | manual / import / system / restore / migration |
| **Reference** | sourceReference (فایل، statement id، …) |

### حداقل فیلدهای `fin_audit_log`

```text
id
at                    // UTC
action                // void | reversal | repair | import | restore | setting_change | …
actor                 // local user/device؛ آماده برای multi-user
operationId?          // اگر به operation مالی وصل است
entityType
entityId
beforeSummary         // متن یا JSON فشرده
afterSummary
why? / reason?
source?
sourceReference?
calculationVersion?
```

**Invariant:**
- انقضای لایسنس یا تغییر UI، ردیف‌های audit را پاک نمی‌کند.
- Audit جایگزین journal نیست؛ journal SoT مالی است.
- مدل از الان multi-user-ready است حتی اگر v1 تک‌کاربره باشد (مثلاً «User A changed loan fee»).
