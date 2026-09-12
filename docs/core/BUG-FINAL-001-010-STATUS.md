# BUG-FINAL-001…010 Status

| ID | Status | Evidence |
|----|--------|----------|
| BUG-FINAL-001 | **FIXED** | stocks.buy passes `baseCurrency` (not `currency`); amountInBase required on lines |
| BUG-FINAL-002 | **FIXED** | metals uses `carryingDeltaTx` only for TX pool |
| BUG-FINAL-003 | **FIXED** | base = metalCostBase + carryingDeltaBase once |
| BUG-FINAL-004 | **FIXED** | cash `amountInBase = cashPrincipal × FX` |
| BUG-FINAL-005 | **FIXED** | `carryingDeltaTx` + `carryingDeltaBaseDim`; legacy marked deprecated |
| BUG-FINAL-006 | **FIXED** | applySingleFee passes receivedInstrumentId; mismatch → FEE_UNIT_MISMATCH |
| BUG-FINAL-007 | **FIXED** | transfer persists fee_funding_kind + XOR currency/instrument |
| BUG-FINAL-008 | **FIXED** | crypto buy gross/net > 0, fee ≥ 0 |
| BUG-FINAL-009 | **FIXED** | crypto sell qty/proceeds > 0, fee ≥ 0 |
| BUG-FINAL-010 | **FIXED** | fund redeem → HOLDING_AMBIGUOUS when multi-account |
