# GOLDEN-CRITICAL-TRANSFER-FEE

```json
{
  "id": "CRITICAL-TRANSFER-FEE",
  "engineVersions": { "costBasis": "1" },
  "input": {
    "beforeQty": "1",
    "beforeCostIRR": "100000000",
    "gross": "1",
    "feeQty": "0.001",
    "net": "0.999",
    "economicKind": "internal_transfer"
  },
  "expected": {
    "domain": {
      "sourceQtyAfter": "0",
      "destQtyAfter": "0.999"
    },
    "journal": [],
    "cash": {},
    "holding": {},
    "costBasis": {
      "sourceCostReleased": "100000000",
      "destinationCarrying": "99900000",
      "feeCarrying": "100000"
    },
    "realizedPnl": { "base": "0" },
    "unrealizedPnl": {},
    "attribution": {},
    "wealthDelta": {}
  }
}
```

**P0-002:** one release of 100m; 99.9m + 0.1m = 100m.
