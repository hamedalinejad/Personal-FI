# Golden Fixture Gate

## Mandatory rule

**No financial release is GREEN without executable numeric fixtures.**

Gate C = harness runs scoped fixtures and compares **decimal strings**.

## Fixture shape

```json
{
  "id": "...",
  "engineVersions": {},
  "input": {},
  "expected": {
    "domain": {},
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

All money/qty/rate numbers = **decimal strings**.

## Mandatory executable families

### Core
income · expense · transfer · reversal · correction · fee · multi-currency

### Crypto
IRR buy/USDT mark · BTC down + USDT/IRR up · opposite FX · quote fee · received-asset fee · internal transfer · network fee burn · C2C economic swap · bridge · external gift · airdrop · opening

### Loan
declining balance · variable rate mid-period · grace · partial payment · early payment · penalty · multi-currency repayment · reversal

### Stocks / Funds / Metals
dividend · corporate action · rights/CIL · fund subscription/redemption · distribution/reinvest · metal purity · physical delivery

### Recovery / quality
import unknown field · export/import round-trip · offline posting · crash/persist recovery · backup/restore · standalone module

## Critical numeric fixtures (locked values)

See:
- `GOLDEN-CRYPTO-BTC-USDT-IRR-PNL.md` (existing + reinforced)
- `GOLDEN-CRITICAL-TOMAN-INPUT.md`
- `GOLDEN-CRITICAL-TRANSFER-FEE.md`
- `GOLDEN-CRITICAL-C2C-SWAP.md`
