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

همچنین در Core (اشتراکی):

- `CostBasisEngine` + policies
- `Instrument` registry (`ref_instruments`)
- `Canonical Cash` model
- Day count / shared pure engines

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

## استقلال در برابر یکپارچگی

| استقلال | یکپارچگی اجباری |
|---------|------------------|
| UI فقط Loan | Journal lines برای همان loan ops |
| تست/پیاده‌سازی جدا per feature | یک CostBasisEngine، یک Decimal policy |
| گزارش تخصصی Feature | Net worth اختیاری از ترکیب engines |

**Standalone UI ≠ Standalone truth بدون Core.**

## Accounting UI (اختیاری)

صفحات Chart of Accounts / Journal / Trial Balance / Ledger browser:

- در `Pages-IA` می‌توانند پشت flag «حسابداری پیشرفته» باشند
- خاموش بودن UI ≠ خاموش بودن نوشتن journal در atomic ops

## پیاده‌سازی تدریجی

1. Core (db, decimal, atomic, journal, instruments)
2. یک Feature (مثلاً Loan) end-to-end
3. Feature بعدی با همان Core — بدون کپی موتور cost/journal

مرجع: `Feature-Independence-Contract.md` · `Accounting-Core.md` · `Cost-Basis-Engine.md` · `Feature-API-Contract.md`
