# تست‌های اجباری (قبل/همراه کد — مستند Test Vector)

برای هر فرمول حداقل یک Test Vector عددی در fixtures.

## سناریوها

| # | سناریو |
|---|--------|
| 1 | ثبت هزینه + کنترل تراز بدهکار/بستانکار |
| 2 | خرید دارایی با کارمزد |
| 3 | فروش بخشی از یک Lot |
| 4 | خرید چندمرحله‌ای با قیمت‌های متفاوت |
| 5 | دریافت سود نقدی |
| 6 | افزایش سرمایه / Split |
| 7 | انتقال کریپتو بین دو کیف پول شخصی |
| 8 | انتقال کریپتو با کارمزد در دارایی دیگر |
| 9 | Swap رمزارز |
| 10 | Staking Reward |
| 11 | صدور صندوق با NAV صدور |
| 12 | ابطال با NAV ابطال |
| 13 | کارمزد ثابت و پلکانی صندوق |
| 14 | وام اقساط مساوی (flat) |
| 15 | وام اصل مساوی (declining) |
| 16 | دوره تنفس |
| 17 | پرداخت ناقص |
| 18 | پرداخت زودهنگام |
| 19 | جریمه دیرکرد |
| 20 | تغییر برنامه وام |
| 21 | تبدیل ریال/تومان (display) |
| 22 | اعشار طولانی (decimal) |
| 23 | Import با فیلد ناشناخته (unmapped حفظ) |
| 24 | Export/Import round-trip بدون از دست رفتن فیلد |
| 25 | ثبت کامل offline |
| 26 | خرابی برنامه هنگام ثبت (WAL/recover) |
| 27 | Restore از Backup |
| 28 | فقط ماژول وام (standalone) |
| 29 | فقط صندوق (standalone) |
| 30 | فعال‌کردن بعدی Accounts و اتصال settlement |

## Invariants حیاتی

```text
Debit = Credit
Posted transaction cannot be mutated
Deleted financial transaction does not physically disappear
Cash balance equals ledger-derived balance
Quantity cannot become negative unless short-selling is enabled
Loan schedule total equals principal + applicable fees/interest
Import/export round-trip preserves all fields
Offline mode does not require external API
```

مرجع: `db/07-fixtures-release-gate.md` · Financial-Invariants · Financial-Scenario-Catalog

## Golden: Crypto BTC/USDT/IRR P&L attribution (P0)

Full fixture: `docs/core/fixtures/GOLDEN-CRYPTO-BTC-USDT-IRR-PNL.md`

- costAtBookBase = 1_000_000_000 IRR; valueAtAsOfBase = 1_350_000_000 IRR; pnlBase = +350_000_000
- assetPriceEffectBase = -100_000_000; fxEffectBase = +450_000_000
- Acceptance cases 1–6 in that file are mandatory for Crypto valuation release.

## P1 Golden Fixture Pack

Full inventory (Core, Crypto, Stocks, Funds, Metals, Loan): `P1-IRAN-PERFORMANCE-FIXTURES-ACCEPTANCE.md` §27.  
Acceptance matrix before SPEC freeze: §28 same doc.

