# GOLDEN-CRITICAL-TOMAN-INPUT

```json
{
  "id": "CRITICAL-TOMAN-INPUT",
  "engineVersions": { "money": "1" },
  "input": {
    "uiUnit": "toman",
    "uiAmount": "1000000"
  },
  "expected": {
    "commandAmountIRR": "10000000",
    "domain": { "amount": "10000000", "currency": "IRR" },
    "journal": [],
    "cash": {},
    "holding": {},
    "costBasis": {},
    "realizedPnl": {},
    "unrealizedPnl": {},
    "attribution": {},
    "wealthDelta": {}
  }
}
```

**Acceptance:** UI `1,000,000` Toman → Command `"10000000"` IRR. No scale inside Operation.
