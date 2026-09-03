# Documentation Style & Maintenance (P2)

## 1. Naming

- از `NAMING-GLOSSARY.md` برای transaction / operation / event / ledger / journal / cash / snapshot استفاده کنید.
- voided / reversed / cancelled / archived فقط با معانی glossary.

## 2. Legacy aliases

- Alias و نام قدیمی فقط در زیربخش «Legacy / Migration».
- مثال‌های canonical، جداول فیلد، و نمونه‌های API فقط اصطلاحات canonical.

## 3. Feature README

هر Feature (یا زیر‌فیچر سرمایه‌گذاری) یک `README.md` کوتاه دارد:

```markdown
# Feature: <Name>

## Source of Truth
- …

## Projections / snapshots
- …

## Dependencies (Core ports / other features via ports only)
- …

## Key operations
- …

## Out of scope
- …
```

بدون README، Feature از نظر مستندات maintenance ناقص است.

## 4. Formulas

- فرمول‌های طولانی cost basis، schedule، CA، FX در **Engine** docs (`Cost-Basis-Engine`, `Corporate-Action-Engine`, …).
- Feature فقط **contract**، جدول mapping رویداد→engine، و **fixture** عددی کوتاه نگه می‌دارد؛ کپی کامل الگوریتم ممنوع.

## 5. TypeScript & JSON examples

- Public API: money/qty به‌صورت `string` در TS examples.
- JSON examples: `"amount": "1000.00"` نه `1000.00` number برای پول.
- `Decimal` فقط در بلوک‌های مشخص‌شده implementation-internal.

## 6. Dependency diagrams

- نمودار رابطه جداول/ماژول از **Data-Model-Relationship-Matrix** (و در صورت نیاز Domain-Dependency-Matrix) به‌عنوان منبع تولید شود.
- نمودار دستی که با ماتریس در تعارض است باطل است؛ اول ماتریس را به‌روز کنید.

## 7. Cross-cutting batches

- P0 locks: `CROSS-CUTTING-CONTRACTS-BATCH*.md`, `ARCHIVE-NOTE-BATCH-LOCKS.md (was P0-090-100; use Essential-Reports / P0-FINAL)`
- این P2 فقط کیفیت زبان و نگهداری docs است؛ جایگزین قفل‌های P0 نمی‌شود.
