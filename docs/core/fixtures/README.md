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
