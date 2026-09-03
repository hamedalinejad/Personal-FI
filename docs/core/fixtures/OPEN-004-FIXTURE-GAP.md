# OPEN-004 — Golden Fixture Gate Gap

## Target families (CODING-GATE / P0-FIX-015)

| Family | JSON present | Executable engine assert | Notes |
|--------|--------------|--------------------------|-------|
| CRITICAL-TOMAN-INPUT | YES | PARTIAL (harness load) | needs full operation pipeline |
| CRITICAL-TRANSFER-FEE | YES | YES (transferCost unit) | |
| CRITICAL-C2C-SWAP | YES | YES (applyEconomicSwap unit) | |
| CRYPTO-BTC-USDT-IRR-PNL | YES | PARTIAL | attribution unit exists |
| CRYPTO-BUY-FEE-IN-QUOTE | YES | PARTIAL | |
| CRYPTO-BUY-FEE-FROM-BASE | YES | YES (acquisitionFee helper) | |
| CRYPTO-SELL-FEE | YES | PARTIAL | |
| CRYPTO-BRIDGE-FEE | YES | PARTIAL | |
| STOCK-BUY-SELL-FEE | YES | NO engine yet | |
| STOCK-CORPORATE-ACTION | YES | NO | |
| STOCK-T2-SETTLEMENT | YES | NO | |
| FUND-NAV-VS-TX-PRICE | YES | NO | |
| FUND-DIVIDEND-REINVEST | YES | NO | |
| LOAN-FLAT / QARZ / BULLET | YES | NO loan engine runtime | |
| CORE-OPENING / REVERSAL | YES | NO | |
| STANDALONE-* | YES | structural only | |

## Gate C rule

Feature command implementation for a family is **forbidden** until that family's fixture is green end-to-end (domain + journal + cash + holding + cost + PnL strings).

Core pure helpers may proceed when their unit tests are green.
