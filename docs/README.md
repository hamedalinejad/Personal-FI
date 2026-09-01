# مستندات Personal-FI — راهنمای توسعه‌دهنده

این پوشه **منبع حقیقت مشخصات** است. قبل از پیاده‌سازی هر فیچر، سند همان فیچر + قراردادهای `core/` را بخوانید.

## ترتیب پیشنهادی مطالعه

1. `Project-Blueprint.md` — اصول محصول  
2. `Technical-Architecture.md` — آفلاین، شبکه، لایه‌ها  
3. `00-Product/Pages-IA.md` — ۹ صفحه و Sheet نه Route انبوه  
4. `core/db/db.md` — sql.js، persist، journal، reconcile، migration، backup  
5. `core/types/types.md` — Decimal string، enumها، Eventها  
6. `core/rounding/Rounding-Policy.md` — گرد کردن پول  
7. فیچرها به ترتیب وابستگی:
   - `00-Accounts-Banking` → `01-Income` / `02-Expense` → `03-Cheque` → `04-Debt-Loan`
   - `17-Currency-CrossRate` → `19-Price-Fetching` → `05-Investment/*`
   - `14-Tax`، `13-Portfolio`، `11-Reports`، `12-Dashboard`
   - `16-Settings-Tools`، `18-Security-Privacy`

## قوانین سراسری (خلاصه)

| موضوع | قانون |
|--------|--------|
| پول | همیشه decimal **string** + `decimal.js`؛ نه `number` |
| ثبت مالی | `runAtomicFinancialOperation` → journal + دامنه + snapshot → persist → بعد UI موفقیت |
| Ledger | جداول `*_transactions` + `fin_journal_entries` منبع حقیقت؛ snapshot مشتق |
| شبکه | پیش‌فرض آفلاین؛ فقط opt-in (قیمت، version check) |
| صفحات | ۹ Nav؛ عمل‌ها Sheet/state |
| مرز کد | UI → Feature API → Domain → db؛ بدون SQL مستقیم از UI |

## نقشه فیچر → مسیر

جدول کامل در `Product-Map-FA.md` / `Product-Map-EN.md`.

## بخش «راهنمای پیاده‌سازی»

تقریباً همه فیچرهای `docs/features/*` یک بخش پایانی **راهنمای پیاده‌سازی** دارند: APIهای atomic، invariants، و تست حداقل. اول همان را بخوان، بعد Domain Entities و فرمول‌های همان فایل.

## محاسبات و تست
- `core/Cost-Basis-Engine.md` — الگوریتم مشترک
- fixtureهای عددی اجباری در `db.md`؛ بدون CI سبز روی آن‌ها release مالی معتبر نیست

## Specification در برابر Implementation

حجم مستندات فعلاً از کد جلوتر است. **SoT رفتار runtime = کد + تست CI وقتی موجود شد.**  
تا آن زمان: مستند قرارداد است؛ هر تعارض بین docs با `Naming-Glossary` و جداول SoT در `db.md` / Product-Map حل شود.  
مسیر مالی «تأییدشده» فقط پس از سبز بودن fixtureهای عددی در CI.

## Release مالی
بدون CI `financial-fixtures` سبز (فهرست کامل در `core/db/db.md`) هیچ tag release مالی معتبر نیست.

## نقاط ورود اجباری برای Developer

| موضوع | مسیر |
|--------|------|
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
| Feature independence | `docs/core/Feature-Independence-Contract.md` |
