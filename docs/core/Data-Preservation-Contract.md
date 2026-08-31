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
