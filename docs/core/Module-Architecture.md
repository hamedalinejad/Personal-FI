# Module Architecture (P0)

هدف: سیستم **ماژولار**، آفلاین، قابل لایسنس جزئی — بدون پیچیدگی غیرضروری و بدون حذف هسته مالی.

## لایه Core

```text
                    PERSONAL-FI CORE
                          │
            ┌─────────────┼─────────────┐
            │             │             │
       Accounting      Money/FX      Operations
            │
       ┌────┴─────┐
       │          │
   Event/Audit   Documents
```

| Core block | نقش |
|------------|-----|
| **Accounting** | `fin_accounts`, `fin_journal_*`, trial projection — **Core نه UI** |
| **Money/FX** | Decimal, rates, base currency, cross rate |
| **Operations** | `runAtomicFinancialOperation`, persist, reconcile |
| **Event/Audit** | audit trail غیرمالی / مالی |
| **Documents** | پیوست‌ها (اختیاری per feature) |
| **CashSettlementPort** | interface اتصال نقدی فیچرها به Accounts یا Local Settlement — **بدون وابستگی مستقیم** |

همچنین در Core (اشتراکی):

- `CostBasisEngine` + policies
- `Instrument` registry (`ref_instruments`)
- `Canonical Cash` model
- Day count / shared pure engines
- `CashSettlementPort` + Adapterها (`AccountsCashAdapter` / `LocalSettlementAdapter`)

جزئیات کامل Adapter: **`Cash-Settlement-Adapter.md`** (P0).

## Feature modules

```text
         ┌─────────┬─────────┬─────────┬─────────┬─────────┐
         ↓         ↓         ↓         ↓         ↓
       Loans    Crypto     Stocks    Funds     Metals
       (+ Banking, Cheque, Income/Expense, …)
```

هر Feature:

```text
Feature
 ├── Domain          entities + invariants
 ├── Ledger          *_transactions SoT تخصصی
 ├── API             Feature API contract (تنها ورودی UI)
 ├── Queries         read models
 ├── UI              pages/sheets ماژول — قابل خاموش شدن
 ├── Reports         گزارش‌های همان دامنه
 └── Tests          fixtures عددی همان دامنه
```

```text
UI → Feature API → Domain → db
هرگز: UI → SQL
```

### اتصال نقدی (اجباری)

```text
Loan / Crypto / Stock / Fund / Metal
         ↓
  CashSettlementPort
         ↓
  AccountsCashAdapter  یا  LocalSettlementAdapter
```

- اگر Accounts فعال باشد → `AccountsCashAdapter` → Accounts
- اگر نباشد (Loan-only و مشابه) → `LocalSettlementAdapter` → Local Settlement Account
- **ممنوع:** وابستگی مستقیم Domain فیچر به UI یا جداول داخلی Accounts

## استقلال در برابر یکپارچگی

| استقلال | یکپارچگی اجباری |
|---------|------------------|
| UI فقط Loan | Journal lines برای همان loan ops |
| تست/پیاده‌سازی جدا per feature | یک CostBasisEngine، یک Decimal policy، یک CashSettlementPort |
| گزارش تخصصی Feature | Net worth اختیاری از ترکیب engines |

**Standalone UI ≠ Standalone truth بدون Core.**

## Accounting UI (اختیاری)

صفحات Chart of Accounts / Journal / Trial Balance / Ledger browser:

- در `Pages-IA` می‌توانند پشت flag «حسابداری پیشرفته» باشند
- خاموش بودن UI ≠ خاموش بودن نوشتن journal در atomic ops

## پیاده‌سازی تدریجی

1. Core (db, decimal, atomic, journal, instruments, CashSettlementPort)
2. یک Feature (مثلاً Loan) end-to-end با LocalSettlementAdapter
3. Feature بعدی با همان Core — بدون کپی موتور cost/journal
4. روشن کردن AccountsCashAdapter وقتی ماژول Accounts فعال است

مرجع: `Cash-Settlement-Adapter.md` · `Feature-Independence-Contract.md` · `Accounting-Core.md` · `Cost-Basis-Engine.md` · `Feature-API-Contract.md`


---

## Code boundary enforce (P0)

`no-restricted-imports` (ESLint) + در صورت امکان path aliases فقط به `public-api`.

UI → Feature public API → Capability → Domain → db همان فیچر/core shared helpers.

جزئیات استقلال: `Feature-Independence-Contract.md`.
