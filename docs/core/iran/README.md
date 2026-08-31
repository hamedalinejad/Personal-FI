# Iran Core (`docs/core/iran/`)

قواعد ایران **Core** است — داخل Stock/Loan/Cheque **hard-code نمی‌شوند**.

```text
Feature (Stocks, Loan, Cheque, FIF, Tax, …)
        ↓
    Iran Core modules
```

## ماژول‌های Specification

| ماژول | نقش |
|--------|-----|
| `IranCalendar` | تعطیلات رسمی، هفته کاری |
| `IranMarketSession` | ساعات پیش‌گشایش/معامله بورس |
| `IranMarketDate` | business day بازار |
| `IranSettlement` | T+n سهام و قوانین تسویه |
| `IranCurrency` | IRR storage + Toman display |
| `IranNumberFormat` | جداکننده هزارگان، نمایش ریال/تومان |
| `IranBankRules` | قواعد بانکی عمومی |
| `IranChequeRules` | وضعیت و سررسید چک |
| `IranBankFeeRules` | کارمزدهای بانکی رایج |
| `IranLoanConventions` | day count، grace، عرف وام ایرانی |
| `IranStockExchangeRules` | دامنه نوسان، lot، tick |
| `IranBrokerageRules` | کارگزاری، کدها |
| `IranMarketFees` | کارمزد/مالیات نقل‌وانتقال سهام |
| `IranFundRules` | صدور/ابطال، ETF |
| `IranNAVRules` | NAV آماری/صدور/ابطال |
| `IranTaxRules` | (تدریجی) |
| `IranSecurityIdentifiers` | ISIN, Symbol, FirmCode |

پیاده‌سازی کد می‌تواند تدریجی باشد؛ **قرارداد از الان** و Feature فقط از این API می‌خواند.

## IranCurrency — قفل

```text
Stored canonical = IRR only
Toman = display / input convention (×10)
```

Ledger، Loan، Tax، Stock، Report همگی **IRR**؛ UI می‌تواند تومان نشان دهد. دو currency موازی IRR+TOM **ممنوع**.
