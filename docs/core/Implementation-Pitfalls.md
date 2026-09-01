# Implementation Pitfalls (زمان کدنویسی)

این‌ها **هشدار اجباری**اند تا فیلد/محاسبه خراب نشود.

## الف) SUM / CHECK عددی روی TEXT در SQLite (P0)

مبالغ/qty/price/rate به‌صورت **TEXT decimal** ذخیره می‌شوند.

**ممنوع:**
- `SUM(quantity)` / `SUM(amount)` / هر aggregation مالی در SQL روی ستون‌های مالی
- اتکا به `CHECK (quantity >= 0)` روی TEXT به‌عنوان صحت Decimal
- محاسبه مانده نقد با SQL به‌جای Decimal Engine روی `fin_journal_lines`

**الزام:**
```text
API validate → Domain Decimal.parse + canonical → persist TEXT
خواندن: fetch strings → decimal.js فقط در Domain
مانده نقد: sum journal lines در Decimal Engine (Canonical-Cash-Model)
```

ورودی‌های رد‌شده نمونه: `"abc"`, `"1..2"`, `"--10"`, `" 10 "` (فضای غیرمجاز), خالی.

سه لایه: `API → Domain Decimal → SQLite structural` — ببین `db/05-constraints-polymorphic.md`.

## ب) قسط آخر وام (Residual Fix)

به دلیل rounding اقساط قبلی، فرمول عمومی روی قسط آخر ممکن است 1–2 ریال مانده یا منفی بگذارد.

```text
if (isLastInstallment) {
  principalPortion = remainingBalance  // دقیق
  // installmentAmount از principal + interest + fee/penalty همان قسط بازتعریف
}
```

در `payLoan` / allocation Engine صریح باشد.

## ج) قرض‌الحسنه — Net Disbursement

کارمزد از **اصل تعهد (liability)** کسر نمی‌شود؛ کاربر معمولاً **خالص** دریافت می‌کند.

یک تراکنش واریز تنها → تراز غلط.

در همان `operationId` / createLoan:

```text
Dr  Cash (net received)
Dr  Fee expense (fee amount)
Cr  Loan liability (full principal)
```

## د) Valuation آفلاین

Price Fetching opt-in است.

**ممنوع:** null/0 به‌جای قیمت وقتی API نیست → پرتفوی صفر/شکست.

**الزام:** همیشه `lastKnownPrice` از `price_history` / cache؛ UI: «قیمت به‌روز نیست» / isStale — محاسبه متوقف **نشود**.

## Persist پس از Operation

بعد از SQL COMMIT موفق: `persist()` async (IDB/OPFS debounced) طبق storage state machine — UI «ثبت شد» فقط پس از durability policy پروژه.
