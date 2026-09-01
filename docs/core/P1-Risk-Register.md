# P1 Risk Register — قبل از MVP کامل

| # | ریسک | اثر | وضعیت مستند | سند کنترل | قانون یک‌خطی |
|---|------|-----|-------------|-----------|--------------|
| 1 | نماد به‌عنوان شناسه اصلی | اشتباه با تغییر نماد | ✅ | `Instrument-Identity.md` | SoT = `instrumentId` (+ ISIN attribute)؛ symbol فقط نمایش |
| 2 | نداشتن Lot | P&L اشتباه | ✅ / تقویت FIFO | `Cost-Basis-Engine.md` | WAC پیش‌فرض v1؛ FIFO/lots با rebuild از ledger |
| 3 | نبود Corporate Action | خراب شدن موجودی بلندمدت | ✅ | `Corporate-Actions-Spec.md` | CA = Operation + تعدیل quantity/cost؛ fixture الزامی |
| 4 | صندوق مثل سهام | NAV/کارمزد غلط | ✅ | FIF docs | Fund domain مستقل؛ NAV ≠ transactionPrice |
| 5 | نبود Fee Rule عمومی | محدودیت وام/سرمایه | ✅ | `Fee-Treatment-Matrix.md` | Core Fee Engine + policy versioned per feature |
| 6 | نبود تاریخچه نرخ ارز | گزارش چندارزی غلط | ✅ | Currency-CrossRate | Historical FX + asOf؛ lock روی operation |
| 7 | نبود دوره مالی بسته | تغییر گزارش قبلی | ⚠️ → ✅ قفل | `Fiscal-Period-Lock.md` | Period close → no new ops in closed range without reopen+audit |
| 8 | نداشتن Source Reference | عدم پیگیری | ✅ | Feature-API · Import-Lineage | sourceType + sourceReference/Id/batch |
| 9 | اتصال مستقیم جداول ماژول‌ها | وابستگی اسپاگتی | ✅ | Capability-API · Independence · ESLint | فقط Public/Capability API |
| 10 | نبود Migration Version | شکست ارتقا | ✅ | `db/06-migration-backup-audit.md` | schema_version + migrations شماره‌دار |
| 11 | نبود Audit Log | ناتوانی بررسی خطا | ✅ | Audit-vs-Financial-Event | Actor, Time, Before, After, Why, Source |

**P1 = قبل از MVP کامل باید در کد هم پوشش داده شود** (برخلاف P2 مثل Cloud/License پیشرفته).
