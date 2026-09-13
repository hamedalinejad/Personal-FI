# BUG-CUR-001…029 re-verify (2026-09-13)

| ID | Verdict | Notes |
|----|---------|-------|
| 001–009 | FIXED | as prior register |
| 010 | FIXED at display scale | residual last row; conservation assert in scheduleEngine |
| 011–013 | FIXED | |
| 014 | FIXED | stocks.buy passes `baseCurrency` variable (not transaction currency) |
| 015 | FIXED | metals uses carryingDeltaTx + carryingDeltaBase separately |
| 016 | FIXED | bare `carryingDelta` removed; only Tx/BaseDim |
| 017 | FIXED | fee_from_received requires receivedInstrumentId |
| 018–019 | FIXED field | fee_funding_kind; fee_quantity = asset fee qty only when asset-funded |
| 020 | BY CONTRACT | draft nullable; posted domain rejects |
| 021–023 | LOCKED/FIXED | |
| 024 | FIXED | mappingConflict.js + mappingConflict.test.js |
| 025–027 | LOCKED | |
| 028 | PARTIAL | relational replay preferred; result_hash written |
| 029 | FIXED | |

Stale "NOT FULLY FIXED" for 014/015 superseded by BUG-FINAL-001/002 and this re-verify.
