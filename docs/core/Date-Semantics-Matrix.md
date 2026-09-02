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

---

## Date model — دست نخور (تأیید)

فیلدهای زمانی جدا می‌مانند و در implementation به یک date تقلیل **نمی‌یابند**:

`createdAt` · `eventAt` · `businessDate` · `settlementDate` · `marketDate` · `dueDate` · `paymentDate` · `fetchedAt`

تاریخ ثبت نرم‌افزار ≠ تاریخ معامله بورس ≠ تاریخ تسویه ≠ تاریخ پرداخت.

---

## Trade · Settlement · Effective (P0)

| نام | نقش | مثال |
|-----|-----|------|
| **Trade Date** | تاریخ معامله | خرید سهم در تالار |
| **Settlement Date** | تاریخ تسویه | T+n نقد/اوراق |
| **Effective / Payment Date** | اثر روی موجودی یا پرداخت واقعی | paymentDate قسط |

هر سه می‌توانند متفاوت باشند؛ برای موجودی نقد و P&L از فیلد درست استفاده شود نه یک date واحد.

---
## P0-010 — businessDate vs createdAt (all Features)

| Use | Field |
|-----|--------|
| Business reports, P&L period, tax period | **businessDate** (or domain equivalent: tradeDate, paymentDate) |
| Audit «when entered in app» | createdAt |
| Ordering same-day events | businessDate + createdAt + id |

No Feature may use createdAt as the primary axis of historical financial reports.


---

## P0-095 / P0-096 — Price timing

| Field | Use |
|-------|-----|
| priceAsOf / marketDate | **Primary** for historical valuation |
| fetchedAt | Provenance only (download time) |

Provider failure: do not block transaction registration; allow manual or last-known price with stale flag (P0-095). Offline-first preserved.
