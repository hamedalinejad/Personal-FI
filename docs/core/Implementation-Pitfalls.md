# Implementation Pitfalls (زمان کدنویسی)

این‌ها **هشدار اجباری**اند تا فیلد/محاسبه خراب نشود.

## الف) SUM روی TEXT در SQLite

مبالغ/qty به‌صورت **TEXT decimal** ذخیره می‌شوند.

**ممنوع:** `SUM(quantity)` / `SUM(amount)` در SQL روی ستون‌های مالی — SQLite ممکن است cast اشتباه کند.

**الزام:** Fetch آرایه string → جمع فقط با **decimal.js** در Domain (حلقه).

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
