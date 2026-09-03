# مستندات Personal-FI — راهنمای توسعه‌دهنده

این پوشه **منبع حقیقت مشخصات** است. قبل از پیاده‌سازی هر فیچر، سند همان فیچر + قراردادهای `core/` را بخوانید.

## ترتیب پیشنهادی مطالعه

1. `Project-Blueprint.md` — اصول محصول
2. `Technical-Architecture.md` — آفلاین، شبکه، لایه‌ها
3. `00-Product/Pages-IA.md` — ۹ صفحه و Sheet نه Route انبوه
4. `core/FINAL-THINK-TANK-AUDIT-2026-09-03.md` — ممیزی فعلی و تناقض‌های کشف‌شده
5. `core/db/db.md` — sql.js، persist، journal، reconcile، migration، backup
6. `core/types/types.md` — Decimal string، enumها، Eventها
7. `core/rounding/Rounding-Policy.md` — گرد کردن پول
8. فیچرها به ترتیب وابستگی:
   - `00-Accounts-Banking` → `01-Income` / `02-Expense` → `03-Cheque` → `04-Debt-Loan`
   - `17-Currency-CrossRate` → `19-Price-Fetching` → `05-Investment/*`
   - `14-Tax`، `13-Portfolio`، `11-Reports`، `12-Dashboard`
   - `16-Settings-Tools`، `18-Security-Privacy`

## قوانین سراسری (خلاصه)

| موضوع | قانون |
|--------|--------|
| پول | همیشه decimal **string** + `decimal.js`؛ نه `number` |
| ثبت مالی | `runAtomicFinancialOperation` → journal + دامنه + snapshot → persist → بعد UI موفقیت |
| Cash SoT | `fin_accounts + fin_journal_lines`; `acc_transactions` فقط event/UX log |
| Ledger | Domain `*_transactions` برای داده تخصصی؛ Journal برای حسابداری؛ snapshot مشتق |
| شبکه | پیش‌فرض آفلاین؛ فقط opt-in برای قابلیت‌های مجاز |
| صفحات | ۹ Nav؛ عمل‌ها Sheet/state |
| مرز کد | UI → Feature API → Domain → db؛ بدون SQL مستقیم از UI |
| ماژول مستقل | Loan/Crypto/Fund/Metal/Stocks باید بدون Accounts UI قابل استفاده باشند |

## نقشه فیچر → مسیر

جدول کامل در `Product-Map-FA.md` / `Product-Map-EN.md`.

## بخش «راهنمای پیاده‌سازی»

تقریباً همه فیچرهای `docs/features/*` یک بخش پایانی **راهنمای پیاده‌سازی** دارند: APIهای atomic، invariants، و تست حداقل. اول همان را بخوان، بعد Domain Entities و فرمول‌های همان فایل.

## محاسبات و تست

- `core/Cost-Basis-Engine.md` — الگوریتم مشترک
- fixtureهای عددی اجباری در `db.md`؛ بدون CI سبز روی آن‌ها release مالی معتبر نیست

## Specification در برابر Implementation

حجم مستندات فعلاً از کد جلوتر است. **SoT رفتار runtime = کد + تست CI وقتی موجود شد.**

تا زمان وجود کد و تست، هر تعارض در مستندات باید با این اولویت حل شود:

1. `FINAL-THINK-TANK-AUDIT-2026-09-03.md` برای تناقض‌های شناخته‌شده تا زمان ادغام آن‌ها در سند اصلی
2. قراردادهای canonical در `core/`، مخصوصاً Accounting Calculation Invariants / Canonical Cash / Source of Truth
3. Feature spec و سپس Product/UX docs

مسیر مالی «تأییدشده» فقط پس از سبز بودن fixtureهای عددی در CI.

## Release مالی

بدون CI `financial-fixtures` سبز (فهرست کامل در `core/db/db.md`) هیچ tag release مالی معتبر نیست.

## نقاط ورود اجباری برای Developer

| موضوع | مسیر |
|--------|------|
| Architecture constitution | `docs/core/ARCHITECTURE-LOCKED.md` |
| Documentation Audit | `docs/core/FINAL-THINK-TANK-AUDIT-2026-09-03.md` |
| Database | `docs/core/db/db.md` (+ زیرفایل‌ها) |
| Types | `docs/core/types/types.md` |
| Atomic ops | `docs/core/Canonical-Financial-Operation.md` |
| API | `docs/API-Reference.md` + `Feature-API-Contract.md` |
| Investment | `docs/features/05-Investment/README.md` |
| Spec freeze | `docs/core/SPEC-FREEZE.md` |
| Field ownership | `docs/core/Field-Level-Data-Ownership-Matrix.md` |
| Instrument identity | `docs/core/Instrument-Identity.md` |
| Canonical cash (P0) | `docs/core/Canonical-Cash-Model.md` |
| Loan Schedule Engine | `docs/core/Loan-Schedule-Engine.md` |
| Module architecture | `docs/core/Module-Architecture.md` |
| Cash Settlement Adapter | `docs/core/Cash-Settlement-Adapter.md` |
| Iran Core | `docs/core/iran/README.md` |
| Canonical Financial Operation | `docs/core/Canonical-Financial-Operation.md` |
| Feature independence | `docs/core/Feature-Independence-Contract.md` |
| Database Layers | `docs/core/Database-Layers.md` |
| Financial Operation Matrix | `docs/core/Financial-Operation-Matrix.md` |
| Calculation Engines | `docs/core/Calculation-Engines.md` |
| Migration & Data Preservation | `docs/core/Migration-Data-Preservation.md` |
| JSON Policy | `docs/core/JSON-Policy.md` |
| Implementation Priority | `docs/core/Implementation-Priority.md` |
| Capability API | `docs/core/Capability-API.md` |
| Persistence State Machine | `docs/core/Persistence-State-Machine.md` |
| Import Lineage | `docs/core/Import-Lineage.md` |
| Rebuild API | `docs/core/Rebuild-API-Contract.md` |
| Product Principle | `docs/core/Product-Principle.md` |
| Field Write Contract | `docs/core/Field-Write-Contract.md` |
| Reconciliation Foundation | `docs/core/Reconciliation-Foundation.md` |
| Integrity Engine | `docs/core/Integrity-Engine.md` |
| Versioning Policy | `docs/core/Versioning-Policy.md` |
| Operation Catalog | `docs/core/Canonical-Financial-Operation-Catalog.md` |
| Side Effect Matrix | `docs/core/Side-Effect-Matrix.md` |
| Invariant Catalog | `docs/core/Financial-Invariant-Catalog.md` |
| Accounting Event Mapping | `docs/core/Accounting-Event-Mapping-Matrix.md` |
| Feature Capability Matrix | `docs/core/Feature-Capability-Matrix.md` |
| Scenario Catalog | `docs/core/Financial-Scenario-Catalog.md` |
| Layer Separation | `docs/core/Layer-Separation.md` |
| Accounting Calculation Invariants | `docs/core/Accounting-Calculation-Invariants.md` |
| Deletion Policy Matrix | `docs/core/Deletion-Policy-Matrix.md` |
| Offline Modes | `docs/core/Offline-Modes.md` |
| Multi-Tab Writer | `docs/core/Multi-Tab-Writer-Contract.md` |
| API Result & Errors | `docs/core/API-Result-and-Errors.md` |
| Crypto v1 Scope | `docs/features/05-Investment/05-01-Investment-Crypto/Crypto-V1-Scope.md` |
| Feature Package Architecture | `docs/core/Feature-Package-Architecture.md` |
| API Requirements | `docs/core/API-Requirements.md` |
| Offline Requirements | `docs/core/Offline-Requirements.md` |
| Essential Reports | `docs/core/Essential-Reports.md` |
| Mandatory Test Vectors | `docs/core/Mandatory-Test-Vectors.md` |
| Documentation Roadmap | `docs/core/Documentation-Roadmap.md` |
| Fiscal Period Lock | `docs/core/Fiscal-Period-Lock.md` |

| Feature ID Map | `docs/00-Product/feature-id-map.json` |

---

## وضعیت مستندات (2026-09-01)

- Spec Freeze: قراردادهای مالی و UX (۹ صفحه) قفل
- Documentation Audit: cross-document audit انجام شد و تناقض‌های P0 اصلی اصلاح/یکسان‌سازی شدند
- قبل از کد: golden fixtures + ESLint feature boundary + markdown-link-check


## P2 documentation quality

- Naming: [`core/NAMING-GLOSSARY.md`](core/NAMING-GLOSSARY.md)
- Style: [`core/DOCUMENTATION-STYLE-P2.md`](core/DOCUMENTATION-STYLE-P2.md)
- Feature README template: [`features/_FEATURE-README-TEMPLATE.md`](features/_FEATURE-README-TEMPLATE.md)
| Market Data Quality Pipeline | `docs/core/Market-Data-Quality-Pipeline.md` |

## P1 global contracts

See [`core/P1-GLOBAL-CONTRACTS.md`](core/P1-GLOBAL-CONTRACTS.md).

## P1 Iran, fixtures, acceptance

[`core/P1-IRAN-PERFORMANCE-FIXTURES-ACCEPTANCE.md`](core/P1-IRAN-PERFORMANCE-FIXTURES-ACCEPTANCE.md)

