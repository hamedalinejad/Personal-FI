# Naming Glossary (P2 — Canonical Vocabulary)

یک زبان برای کل مستندات و API. در تعارض مثال‌های قدیمی با این واژه‌نامه، **این سند** مبنا است.

---

## Core financial terms

| Term | Meaning | Not the same as |
|------|---------|-------------------|
| **Operation** (`fin_operations`) | واحد atomic تغییر مالی با `operationId`؛ مرز تراکنش کسب‌وکاری | یک ردیف UI؛ یک HTTP request |
| **Transaction** (domain) | ردیف دامنه داخل یک Feature (مثلاً `inv_*_transactions`, `exp_transactions`) که معمولاً به یک operation لینک است | operation کامل؛ journal line |
| **Financial event** | اتفاق اقتصادی/حسابداری ثبت‌شده (عملیات posted، legs، اثر ledger) | audit log entry |
| **Audit** | ردپای چه کسی/چه سیستمی چه کرد (`fin_audit_log`) | financial event / balance SoT |
| **Ledger** | مجموعه آثار مالی قابل‌جمع برای مانده (journal + قوانین حساب) | snapshot؛ UI cache |
| **Journal** (`fin_journal_entries` / lines) | ثبت دوطرفه/چندطرفه حسابداری Core | domain transaction table |
| **Cash** | مانده نقد canonical روی `fin_accounts` + journal (و venue cash با ownership مشخص) | «پول» استعاری در goal earmark |
| **Snapshot / projection** | نمای مشتق برای سرعت؛ قابل rebuild از SoT | Source of Truth |
| **Reconciliation** | مقایسه projection با SoT و گزارش اختلاف | repair خاموش |
| **Rebuild** | بازسازی projection از ledger/ops | rewrite تاریخچه operation |

---

## Lifecycle / status verbs (canonical)

| Term | Use when | Do not use for |
|------|----------|----------------|
| **voided** | عملیات/ردیف مالی باطل شده قبل از یا به‌جای reverse کامل در برخی pathهای مستند؛ معمولاً با flag روی domain + effect خنثی | حذف فیزیکی؛ archive |
| **reversed** | خنثی‌سازی حسابداری از مسیر Core `reverse(operationId)` با operation معکوس | soft-delete UI؛ cancel پیش از post |
| **cancelled** | لغو **قبل از** اثر مالی کامل (مثلاً وام قبل از disbursement، occurrence قبل از pay) | reverse بعد از post |
| **archived** | خروج از لیست فعال بدون خنثی‌سازی مالی؛ داده می‌ماند | void/reverse |
| **deleted** (hard) | حذف فیزیکی فقط طبق Deletion-Policy-Matrix برای entity غیرمالی/unused | posted financial ops |

**قانون:** در docs و API جدید فقط این چهار وضعیت معنایی + `active`/`posted`/`draft` مستند استفاده شود. مترادف‌های پراکنده (`removed`, `dropped`, `killed`, `soft-deleted` به‌جای archived) در canonical examples نیایند.

---

## Legacy aliases

| Legacy / informal | Canonical |
|-------------------|-----------|
| «تراکنش» برای کل عمل مالی | **operation** وقتی منظور atomic مالی است؛ **domain transaction** وقتی ردیف Feature است |
| tx id بدون interop | `operationId` vs domain `id` صریح نوشته شود |
| balance table به‌عنوان SoT | snapshot؛ SoT = journal/ledger |
| delete برای reverse | **reversed** / void path |
| rate تتر به‌عنوان فیلد دامنه | `exchangeRateToBase` (+ quote در UI) |

Legacy فقط در بخش **Migration / Alias** یا پاورقی؛ نه در مثال‌های canonical و نه در امضای API جدید.

---

## Public API types (money)

- مبالغ در public API و JSON examples: **decimal string** (`"1234.56"`).
- `Decimal` object فقط داخل engine/implementation؛ در امضای public TypeScript به‌صورت `string` (یا branded string type) مستند شود.
- نمونه‌های قدیمی با `Decimal` در public surface باید به string به‌روز شوند یا برچسب `implementation-internal` بگیرند.

---

## Related docs

- `Audit-vs-Financial-Event.md`
- `Deletion-Policy-Matrix.md`
- `Canonical-Financial-Operation.md`
- `Canonical-Cash-Model.md`
- `Field-Level-SoT.md`
