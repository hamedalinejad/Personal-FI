# ساختار دیتابیس پروژه (Core Level) — `docs/core/db/db.md`

**این فایل SoT ورودی دیتابیس است** (فهرست + قراردادهای کلیدی). جزئیات در زیرفایل‌ها.

| فایل | محتوا |
|------|--------|
| [00-overview.md](./00-overview.md) | Overview، PWA، لایه‌ها، نام‌گذاری |
| [01-schema-tables.md](./01-schema-tables.md) | **لیست مرکزی همه جداول** |
| [02-storage-persistence.md](./02-storage-persistence.md) | Amount storage، persist، Worker |
| [03-journal-sot-reporting.md](./03-journal-sot-reporting.md) | Journal، SoT، گزارش |
| [04-reconciliation-integrity.md](./04-reconciliation-integrity.md) | Reconcile، integrity pipeline |
| [05-constraints-polymorphic.md](./05-constraints-polymorphic.md) | CHECK، FK، polymorphic، instruments |
| [06-migration-backup-audit.md](./06-migration-backup-audit.md) | Migration، backup، audit، multi-tab |
| [07-fixtures-release-gate.md](./07-fixtures-release-gate.md) | Fixtures، CI gate |

مرتبط: `Canonical-Financial-Operation.md` · `Accounting-Core.md` · `Storage-Abstraction.md`

---

## معماری ذخیره‌سازی (خلاصه)

```text
Domain / Repository
       ↓
sql.js (SQLite in WASM, RAM)
       ↓
Write-to-temp-then-swap → IndexedDB (db_main / db_pending / db_backup)
```

- Amount / quantity / rate = **TEXT decimal string** (نه INTEGER minor-unit به‌عنوان مدل اصلی)
- بعد از SQL COMMIT: persist async طبق state machine — UI «ثبت شد» طبق durability policy
- Desktop آینده: native SQLite file از طریق همان `FinancialRepository`

جزئیات: `02-storage-persistence.md`

## Migration / Backup

- `schemaVersion` + migration chain با audit row (`migrationId`, from/to, checksum, success)
- Backup package: manifest + database + attachments + checksums
- Restore: validate → temp DB → integrity_check → migrate → swap

جزئیات: `06-migration-backup-audit.md`

## Journal (چهار جدول)

`fin_accounts` · `fin_operations` · `fin_journal_entries` (سند) · `fin_journal_lines` (مبالغ)

| فیلد خط | نقش |
|---------|-----|
| `accountId` | FK حساب واقعی — اجباری |
| `accountClass` | WHAT (کش/گزارش) |
| `lineKind` | WHY (fee, fx_rounding, …) |

`entryKind` منسوخ است.

## Atomic operation

همه رویدادهای مالی از `runAtomicFinancialOperation` با `operationId` + `commandHash` (idempotent).

## Fixtures / CI

حداقل: BTC خرد+کارمزد · سهام+CA · قرض‌الحسنه · چک برگشتی — `07-fixtures-release-gate.md` و `fixtures/README.md`

---

## Migration Strategy (خلاصه اجرایی)

جزئیات کامل: [06-migration-backup-audit.md](./06-migration-backup-audit.md)

| جزء | |
|-----|--|
| Version store | `schema_version` / `db_meta` — version, appliedAt |
| Scripts | `migrations/` — `001_….sql` زنجیره‌ای |
| Upgrade | Backup → apply next → integrity_check → activate |
| Rollback | ترجیحاً restore از backup قبل از migration؛ down-script فقط اگر امن و تست‌شده |
| Data preservation | ALTER / copy — **DROP COLUMN مالی بدون policy ممنوع** |
| CI | fixture DB از v1 → latest migration باید سبز شود |

App جدید روی schema قدیمی **بدون** migration کنترل‌شده اجرا نمی‌شود.
