# بررسی کامل پروژه Personal-FI — باگ‌ها، ابهامات، ارتقاها و نواقص

> **این سند به‌صورت زنده و خط‌به‌خط در حین بررسی تکمیل می‌شود.** هر مورد بلافاصله بعد از کشف اضافه می‌شود، نه در پایان.
> **تاریخ شروع بررسی:** ۱۴۰۴ (Session جدید)
> **دامنه:** تمام فایل‌های `docs/` — Blueprint، Technical Architecture، Product Map، Pages-IA، تمام core (db, types, services, hooks, utils, lib, stores, styles, rounding)، و تمام ۲۰ فیچر محصول (شامل Price Fetching با ۴ زیرفیچر).

## ساختار هر مورد

هر مورد شامل سه بخش الزامی است:
1. **باگ / ایراد / ابهام / نیاز به ارتقا / نقص** — دقیقاً چه مشکلی است
2. **محل** — فایل، بخش، و تمام فایل‌های وابسته/متأثر دیگر
3. **راه‌حل** — چطور باید رفع شود

## وضعیت پیشرفت بررسی

- [ ] Project-Blueprint.md
- [ ] Technical-Architecture.md
- [ ] Product-Map-FA.md / Product-Map-EN.md
- [ ] Pages-IA.md
- [ ] core/db/db.md
- [ ] core/types/types.md
- [ ] core/services/services.md
- [ ] core/hooks/hooks.md
- [ ] core/utils/utils.md
- [ ] core/rounding/Rounding-Policy.md
- [ ] lib/lib.md
- [ ] stores/stores.md
- [ ] styles/styles.md
- [ ] 00-Accounts-Banking
- [ ] 01-Income
- [ ] 02-Expense
- [ ] 03-Cheque-Management
- [ ] 04-Debt-Loan-Management
- [ ] 05-01-Investment-Crypto
- [ ] 05-02-Investment-Stocks-Iran
- [ ] 05-03-Fixed-Income-Funds
- [ ] 05-04-Metals
- [ ] 06-Physical-Assets
- [ ] 07-Budget-Management
- [ ] 08-Financial-Goals
- [ ] 09-Bills-Recurring-Transactions
- [ ] 10-Notification-Reminder-System
- [ ] 11-Reports-Analytics
- [ ] 12-Dashboard
- [ ] 13-Portfolio-Wealth-Overview
- [ ] 14-Tax-Management
- [ ] 15-Document-Management
- [ ] 16-Settings-Tools
- [ ] 17-Currency-CrossRate
- [ ] 18-Security-Privacy
- [ ] 19-Price-Fetching (+ ۴ زیرفیچر)
- [ ] 99-Common-Categories
- [ ] بررسی نهایی روابط بین فیچرها (Cross-Feature Consistency)

---

## فهرست موارد

