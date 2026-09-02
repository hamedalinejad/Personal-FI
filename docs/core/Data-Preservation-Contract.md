> **Constitution پروژه:** Never silently discard financial data.

# Data Preservation Contract

**Never silently discard financial data.**

هر فیلد هنگام migration یکی از:

| وضعیت | معنی |
|--------|------|
| `preserved` | بدون تغییر معنا |
| `migrated` | به ستون/جدول جدید منتقل |
| `mapped` | معنای معادل در مدل جدید |
| `deprecated` | خواندنی؛ write جدید ممنوع |
| `archived` | فقط در backup/legacy store |
| `derived` | قابل rebuild؛ می‌تواند از DB UI حذف شود |
| `intentionally_removed` | **فقط با ADR** |

نمونه Stocks: `feeAmount` حتی با breakdown جدید **حفظ** می‌شود.

Repair ≠ silent rewrite. Reconcile فقط detect.

## Data Provenance (مکمل Preservation)

حفظ فیلد کافی نیست؛ **منشأ** هم باید بماند:

`sourceType` + `sourceReference` + لینک document/import batch.

Migration نباید provenance را null کند مگر ADR.

## Financial Data Non-Destruction Rule

DROP COLUMN مالی بدون migration policy ممنوع. intentionally_removed فقط ADR.

## Attachments / Documents

```text
Document → Metadata → Blob → Checksum → Source
```

- `relativePath` / `blobId` — نه absolute path
- اگر blob گم شد، **metadata حفظ** می‌ماند + integrity flag
- Backup package: db + attachments + checksums + manifest

---

## Field Lifecycle Status (Schema-level contract) (P0)

برای هر فیلد مالی (حداقل در Data Dictionary / migration notes):

| Status | معنی |
|--------|------|
| **ACTIVE** | SoT جاری؛ write جدید مجاز |
| **LEGACY** | خوانده می‌شود؛ write جدید ترجیحاً canonical |
| **DEPRECATED** | فقط dual-read؛ migration به replacement |
| **MIGRATED** | داده منتقل شده؛ ستون ممکن است بعداً drop شود |
| **UNKNOWN** | نیاز به بررسی قبل از هر تغییر |

### DROP COLUMN

فقط وقتی **هر سه** موجود باشد:

1. `replacementField` (یا تأیید صریح «داده دیگر لازم نیست»)
2. `migrationRule` مستند و تست‌شده
3. `dataVerification` (checksum / row count / fixture)

بدون این‌ها: **DROP ممنوع**.

این از policy متنی به **قرارداد schema/migration** ارتقا یافته است.
مرجع: `Migration-Data-Preservation.md` · `Raw-vs-Derived-Data.md`

## Legacy vs canonical (X-017)

New writes → canonical only; legacy read-only; raw import preserved. Roundtrip field loss target = 0.

