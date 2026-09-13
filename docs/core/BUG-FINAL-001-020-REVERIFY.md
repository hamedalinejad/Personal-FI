# BUG-FINAL-001…020 Re-verify (HEAD 2026-09-13)

| ID | Verdict | Evidence |
|----|---------|----------|
| 001 | FIXED | stocks.buy `baseCurrency` (local var) + JOURNAL_BASE_REQUIRED |
| 002 | FIXED | metals `carryingDeltaTx` only for TX carrying |
| 003 | FIXED | carryingBase = metalCostBase + feeBase once |
| 004 | FIXED | cash amountInBase = cashPrincipal × rate |
| 005 | FIXED | no bare carryingDelta; Tx + BaseDim only |
| 006 | FIXED | FEE_FROM_RECEIVED_CONTEXT_REQUIRED + mismatch |
| 007 | FIXED | transfer inserts fee_funding_kind + XOR fields |
| 008 | FIXED | CRYPTO_QTY_NONPOSITIVE gross/net |
| 009 | FIXED | sell positive qty/proceeds |
| 010 | FIXED | HOLDING_AMBIGUOUS when multi-holding |
| 011 | FIXED | FUND_*_NONPOSITIVE |
| 012 | FIXED | STOCK_QTY/PRICE/COMMISSION guards |
| 013 | FIXED | METAL_QTY/PROCEEDS_NONPOSITIVE |
| 014 | FIXED | METAL_DELIVERY_QTY_NONPOSITIVE |
| 015 | FIXED | record sourceType/sourceReference |
| 016 | FIXED | normalizedRequest full envelope |
| 017 | FIXED | loadOperationSync relational journal |
| 018 | FIXED | result_hash written on commit |
| 019 | FIXED | JSON path amountInBase + balance |
| 020 | FIXED | frozen operationContext to prepareDomain |

Any external audit listing 001–020 as OPEN against this HEAD is **stale**.
