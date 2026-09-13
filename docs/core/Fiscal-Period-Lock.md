> **SUPERSEDED as independent authority** — use docs/PRODUCT.md, ARCHITECTURE.md, FINANCIAL-CORE.md, DATA-MODEL.md, API.md, REPORTING.md, OFFLINE-RELEASE.md, DEVELOPMENT.md, modules/*.

# Fiscal Period Lock (P1)

بدون بستن دوره، گزارش‌های «قطعی» ماه/سال بعداً با ثبت عقب‌افتاده عوض می‌شوند.

## مدل

```text
fiscal_periods
  id
  name                 // e.g. 1405-H1 / 2026-Q1
  startDate            // inclusive business/calendar per policy
  endDate
  status               // open | closed | reopened
  closedAt?
  closedByActor?
  reopenReason?
```

## قوانین

1. در دوره **closed** نمی‌توان Operation جدید با `businessDate` داخل بازه ثبت کرد (reject).
2. بازکردن مجدد فقط با **Audit** کامل (Who/When/Why) و وضعیت `reopened` موقت یا policy صریح.
3. Snapshot/گزارش دوره‌های بسته می‌تواند به‌عنوان «نسخه قفل‌شده گزارش» cache شود؛ SoT همچنان ledger است.
4. v1 می‌تواند Period را ساده (ماه تقویمی یا سال مالی کاربر) پیاده کند؛ قرارداد از الان الزامی است.

## ارتباط

- Reports: فیلتر «فقط دوره‌های بسته» برای خروجی رسمی
- Loan/Investment: همان `businessDate` gate
- Migration/import عقب‌افتاده به دوره بسته → نیاز به reopen یا import با flag خاص + audit
