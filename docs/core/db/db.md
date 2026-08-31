# ساختار دیتابیس پروژه (Core Level)

این فایل **فهرست** است. جزئیات در زیرفایل‌های هم‌پوشه:

| فایل | محتوا |
|------|--------|
| [00-overview.md](./00-overview.md) | Overview، PWA، لایه‌ها، نام‌گذاری |
| [01-schema-tables.md](./01-schema-tables.md) | **لیست مرکزی همه جداول** |
| [02-storage-persistence.md](./02-storage-persistence.md) | Amount storage، persist، Worker |
| [03-journal-sot-reporting.md](./03-journal-sot-reporting.md) | Journal، SoT، گزارش |
| [04-reconciliation-integrity.md](./04-reconciliation-integrity.md) | Reconcile، integrity pipeline |
| [05-constraints-polymorphic.md](./05-constraints-polymorphic.md) | CHECK، FK، polymorphic، instruments |
| [06-migration-backup-audit.md](./06-migration-backup-audit.md) | Migration، backup، audit، multi-tab |
| [07-fixtures-release-gate.md](./07-fixtures-release-gate.md) | Fixtures، CI gate، checklist |

**SoT نام فایل قدیمی:** لینک‌های خارجی به `db.md` همچنان معتبرند؛ این فایل به زیرفایل‌ها ارجاع می‌دهد.

## Journal — فقط دو فیلد طبقه‌بندی (نه سه)

مدل canonical چهار جدول:
`fin_accounts` · `fin_operations` · `fin_journal_entries` (سند) · `fin_journal_lines` (خطوط).

`fin_journal_entries` **ندارد** `entryKind` و **ردیف مبلغ نیست**.


| فیلد | نقش |
|------|-----|
| `accountClass` | **WHAT** — طبقه حساب (cash, expense, crypto_asset, …) — **SoT گزارش‌گیری** |
| `lineKind` | **WHY** — علت خط (fee, fx_rounding, fx_gain, asset, …) |

نمونه‌ها:
| رویداد | accountClass | lineKind |
|--------|--------------|----------|
| هزینه بانکی | expense | expense |
| کارمزد شبکه | expense یا trading_fee | fee |
| خرید BTC | crypto_asset | asset |
| پرداخت USDT | cash | cash |
| باقیمانده گرد کردن | equity یا other | fx_rounding |
| سود تسعیر صریح | income | fx_gain |

گزارش: فیلتر/گروه روی `accountClass`؛ `lineKind` برای تحلیل و جلوگیری از اشتباه گرفتن rounding با gain.

## Chart of accounts

`fin_accounts` + journal `accountId`: `docs/core/Accounting-Core.md`.
