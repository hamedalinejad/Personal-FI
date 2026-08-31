# Financial Golden Fixtures

**قبل از coding آماده شوند.** Implementation فقط expected را پاس می‌کند.

```text
fixtures/
  crypto/buy-with-fee.json
  crypto/transfer-fee-in-asset.json
  stocks/weighted-average.json
  loan/declining-balance.json
  fx/cross-rate.json
  cheque/bounce.json
```

هر فایل:

```json
{
  "id": "S-CRYPTO-BUY",
  "input": { },
  "expected": {
    "domain": {},
    "journal": {},
    "balances": {},
    "holding": {},
    "pl": {},
    "netWorthDelta": {}
  }
}
```

CI: بدون سبز شدن goldenهای مالی، مسیر مالی release نیست.

## چهار تست اجباری قبل از release مالی

1. خرید `0.0000001` BTC + فروش جزئی با کارمزد  
2. خرید سهام + افزایش سرمایه / bonus  
3. وام قرض‌الحسنه ۴٪ + کارمزد (journal net disbursement)  
4. چک برگشتی (status bounce + گزارش)
