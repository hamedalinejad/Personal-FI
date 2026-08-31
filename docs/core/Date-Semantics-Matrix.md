# Date Semantics Matrix

گزارش‌ها نباید از هر Feature یک «تاریخ» متفاوت بردارند بدون قرارداد.

| عملیات / دامنه | تاریخ اصلی (SoT گزارش کسب‌وکار) | سایر تاریخ‌های مرتبط |
|----------------|----------------------------------|----------------------|
| Expense / Income | `businessDate` | `createdAt`, `eventAt` |
| Bank / acc_transactions | `businessDate` یا event date ثبت | `createdAt` |
| Cheque | `issueDate` / `dueDate` / `clearingDate` بر حسب سؤال | status transitions |
| Stock trade | `tradeDate` / `businessDate` | `settlementDate` (T+n) |
| Stock settlement cash | `settlementDate` | |
| Fund subscription/redemption | date معامله صدور/ابطال | NAV `marketDate` جدا |
| Loan schedule | `dueDate` | `paymentDate` واقعی |
| Loan payment | `paymentDate` | `businessDate` |
| Price quote | `priceAsOf` / `marketDate` | `fetchedAt` ≠ market |
| FX rate | `rateDate` / asOf | `fetchedAt` |
| Tax | `taxPeriod` / tax year bounds | payment date |
| Opening position | `asOf` / `businessDate` | `createdAt` install time |

**Invariant:** `businessDate ≠ createdAt` عادی است.  
Historical P&L از `priceAsOf`+`rateDate` هم‌تراز — نه `fetchedAt` alone.
