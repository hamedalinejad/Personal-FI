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
