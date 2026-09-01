# Iran Core (`docs/core/iran/`)

قواعد ایران **Core مشترک** است — داخل Stock / Loan / Cheque / Fund **hard-code نمی‌شوند**.

```text
Feature (Stocks, Loan, Cheque, FIF, Tax, …)
        ↓
    IranCore
```

## ساختار IranCore (قفل P0)

```text
IranCore
 ├── Calendar
 ├── MarketDate
 ├── MarketSession
 ├── Holiday
 ├── SettlementRule
 ├── CurrencyDisplay
 ├── Toman/Rial Display
 ├── NumberFormat
 └── Market Specific Rules
```

| ماژول | نقش |
|--------|-----|
| `IranCalendar` | تعطیلات رسمی، هفته کاری |
| `IranMarketSession` | ساعات پیش‌گشایش / معامله بورس |
| `IranMarketDate` | business day بازار |
| `IranSettlement` | T+n و قوانین تسویه |
| `IranCurrencyDisplay` | IRR storage + Toman/Rial display preference |
| `IranNumberFormat` | جداکننده هزارگان، نمایش ریال/تومان |
| `IranBankRules` | قواعد بانکی عمومی |
| `IranChequeRules` | وضعیت و سررسید چک |
| `IranBankFeeRules` | کارمزدهای بانکی رایج |
| `IranLoanConventions` | day count، grace، عرف وام ایرانی |
| `IranStockExchangeRules` | دامنه نوسان، lot، tick |
| `IranBrokerageRules` | کارگزاری، کدها |
| `IranMarketFees` | کارمزد / مالیات نقل‌وانتقال سهام |
| `IranFundRules` | صدور / ابطال، ETF |
| `IranNAVRules` | NAV آماری / صدور / ابطال |
| `IranTaxRules` | (تدریجی) |
| `IranSecurityIdentifiers` | ISIN, Symbol, FirmCode |

Feature فقط از API این ماژول‌ها می‌خواند؛ منطق بازار داخل Feature کپی نمی‌شود.

## Versioned / Configurable — نه hard-code

قواعدی که ممکن است با مقررات یا عرف بازار عوض شوند **نباید** داخل کد Feature یا ثابت‌های پراکنده hard-code شوند:

| قاعده | ذخیره‌سازی پیشنهادی |
|--------|---------------------|
| Settlement (T+n و استثناها) | versioned config / rule table |
| Fee schedules | versioned config + effectiveFrom |
| Tax rates / withholding | versioned config |
| Holiday calendar | versioned calendar data |
| Trading calendar / session hours | versioned config |
| Lot size / tick / price band | instrument + market rule version |

```text
RuleSet
  ruleKind
  version
  effectiveFrom
  effectiveTo?
  payload (JSON structured)
  sourceReference?
```

Engine در هر Operation نسخهٔ قاعدهٔ استفاده‌شده را در `engineVersions` / metadata قفل می‌کند تا گزارش تاریخی با قانون همان روز سازگار بماند.

**Invariant:** تغییر تعطیلات یا کارمزد سال بعد، Operationهای گذشته را بازنویسی نمی‌کند.

## IranCurrency — قفل ریال / تومان

```text
Database canonical currency = IRR only
UI display preference = ریال | تومان
1 Toman = 10 Rial
```

| لایه | قانون |
|------|--------|
| DB / Ledger / Journal / Loan / Tax / Stock | فقط **IRR** |
| UI | ریال یا تومان طبق preference کاربر |
| Input | می‌تواند تومان باشد؛ قبل از persist به IRR نرمال می‌شود |
| Money value | **هرگز بدون Currency** ذخیره یا پاس داده نمی‌شود |

**ممنوع:**
- ارز موازی `TOM` / `IRT` در ledger
- فرض یک‌بار `1000000` به‌عنوان ریال و جای دیگر تومان
- Money بدون فیلد currency در API یا DB

جزئیات بیشتر: `Currency-CrossRate.md` · `Unit-Policy.md`

تاریخ: **ISO Gregorian/UTC در DB** · جلالی فقط نمایش (`jalali_display` helper).

پیاده‌سازی کد می‌تواند تدریجی باشد؛ **قرارداد از الان** است.

---

## IranBusinessCalendar (P1 — قرارداد از الان)

تاریخ‌های due / settlement / business فقط ISO date نیستند؛ به **تقویم کاری** وابسته‌اند.

```text
IranBusinessCalendar
 ├── weekend (پنجشنبه/جمعه — policy)
 ├── officialHolidays
 ├── marketHolidays
 ├── exchangeTradingDays
 └── settlementDays
```

مصرف‌کننده‌ها:

- اقساط وام (dueDate shift)
- بورس ایران (marketDate / settlement T+n)
- صندوق
- چک (سررسید)
- سود / تسویه بانکی

API مفهومی:

```text
isBusinessDay(date, calendarId)
nextBusinessDay(date, calendarId)
addBusinessDays(date, n, calendarId)
```

نسخه‌دار و configurable — hard-code داخل Loan/Stock ممنوع.
اولویت پیاده‌سازی: **P1**؛ قرارداد مستند: **از الان**.
