# PrecisionPolicy (Domain-specific)

**ممنوع:** یک scale سراسری (مثلاً همیشه 2 رقم) برای همه دارایی‌ها.

| دامنه | scale نمونه | notes |
|--------|-------------|--------|
| IRR | 0 | ریال بدون اعشار |
| USD / EUR | 2 | |
| USDT | 2–6 طبق registry | |
| BTC | 8 | satoshi-level qty |
| ETH | تا 18 | از asset.decimals |
| Gold mg | 3+ | |
| Fund units | قرارداد صندوق | |
| Stock qty | lotSize / tick | |

هر Currency / Instrument:

```text
scale, roundingMode, minimumStep
```

Round فقط در مرز نمایش یا طبق `Rounding-Policy.md` — نه وسط زنجیره محاسبه.
ارجاع: `Financial-Invariants` §5 · `Rounding-Policy.md`

---

## Precision per Instrument (نه فقط Currency)

روی `ref_instruments` (یا metadata):

| Field | مثال |
|-------|------|
| `quantityScale` | BTC 8, ETH 18 |
| `priceScale` | BTC-USDT 2–8 |
| `moneyScale` | برای settlement currency |
| `minimumQuantityStep` | lotSize سهام، step توکن |
| `minimumPriceStep` | priceTick |
| `roundingMode` | per domain |

| نوع مقدار | Contract جدا |
|-----------|----------------|
| Money Amount | CurrencyRecord.scale + HALF_UP برای IRR |
| Asset Quantity | instrument.quantityScale |
| Unit Price | instrument.priceScale |
| Rate (FX/interest) | rate precision (مثلاً 12 store) |
| Percentage | جدا |

Registry = منبع precision؛ Feature نباید hard-code کند.
