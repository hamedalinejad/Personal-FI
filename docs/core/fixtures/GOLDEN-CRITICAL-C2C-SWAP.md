# GOLDEN-CRITICAL-C2C-SWAP

```json
{
  "id": "CRITICAL-C2C-SWAP",
  "engineVersions": { "costBasis": "1" },
  "input": {
    "economicKind": "economic_trade_or_swap",
    "btcCarryingReleased": "100000000",
    "btcSwapConsideration": "140000000",
    "saleFee": "2000000",
    "currency": "IRR"
  },
  "expected": {
    "domain": {},
    "journal": [],
    "cash": {},
    "holding": {},
    "costBasis": {
      "ethDestinationCost": "140000000"
    },
    "realizedPnl": {
      "btc": "38000000"
    },
    "unrealizedPnl": {},
    "attribution": {},
    "wealthDelta": {}
  }
}
```

```text
BTC realized = 140m − 100m − 2m = 38m
ETH dest cost = 140m + capitalized destination fees (0 in this vector)
NOT dest cost = 100m
```
