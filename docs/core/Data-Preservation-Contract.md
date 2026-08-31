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
