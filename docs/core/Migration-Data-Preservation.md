# Migration & Data Preservation (P0)

**هیچ فیلدی از بین نرود.**

## Database Evolution Policy

هیچ Migration نباید `DROP COLUMN` کند مگر:

1. **Data preservation strategy** صریح تعریف شده باشد
2. mapping کامل به ستون/جدول جدید مستند باشد
3. dual-read در دوره انتقال پشتیبانی شود (در صورت نیاز)

### مثال

```text
old_fee
  → feeAmount + feeBroker + feeTax + …
old_fee یا preserve می‌ماند یا با mapping کامل مهاجرت می‌کند
```

## قبل از Migration

```text
Backup
+ Checksum
+ Row count
+ Migration report (plan)
```

## بعد از Migration

```text
Validation
+ Reconciliation
+ Row count / checksum compare
+ Fixture مالی سبز
```

**ممنوع:**
- overwrite خام معنای فیلد بدون migration سازگار
- حذف داده EXTERNAL_REPORTED
- migration بدون backup قابل rollback

مرجع: `db/06-migration-backup-audit.md` · `Data-Preservation-Contract.md` · `Raw-vs-Derived-Data.md`

---

## Field Lifecycle

قبل از هر migration ستون‌ها را با statusهای ACTIVE / LEGACY / DEPRECATED / MIGRATED / UNKNOWN علامت بزن.
جزئیات: `Data-Preservation-Contract.md` § Field Lifecycle Status.
