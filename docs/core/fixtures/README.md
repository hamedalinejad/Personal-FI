# Golden fixtures

## Specified

| ID | Path |
|----|------|
| CRYPTO-BTC-USDT-IRR-PNL | `GOLDEN-CRYPTO-BTC-USDT-IRR-PNL.md` |

## Required pack (inventory)

See `docs/core/P1-IRAN-PERFORMANCE-FIXTURES-ACCEPTANCE.md` §27 for full Core / Crypto / Stocks / Funds / Metals / Loan lists.

Add new fixtures here or under `docs/features/<feature>/fixtures/` and link from `Mandatory-Test-Vectors.md`.

## CA / C2C / Opening (specified in locks)

Numeric vectors live in `Financial-Invariants.md` (P0 locks consolidated 2026-09-04) until split into individual fixture files.

---

## Final Mathematical Golden Set (12 vectors — before first feature code)

Each vector **must** define expected: domain · journal · cash · holding · cost basis · realized/unrealized · attribution · wealth delta.

| # | ID | Scope |
|---|-----|--------|
| 1 | CORE-INCOME | income + cash + journal |
| 2 | CORE-EXPENSE | expense + cash + journal |
| 3 | CORE-TRANSFER-FEE | bank transfer + fee neutral PL |
| 4 | CORE-REVERSAL-EXACT | reverse returns exact prior state |
| 5 | CORE-MULTI-CURRENCY | FX path + amountInBase |
| 6 | CRYPTO-BTC-USDT-IRR-PRICE-DOWN-FX-UP | valuation attribution |
| 7 | CRYPTO-BTC-USDT-IRR-REVERSE-FX-OFFSET | reverse FX offset |
| 8 | CRYPTO-FEE-SAME-ASSET | fee from base asset qty |
| 9 | CRYPTO-C2C-SWAP | ETH→BTC legs + cost |
| 10 | STOCK-TRADE-Tn-DIVIDEND-CA | T+n, dividend, corporate action |
| 11 | FUND-NAV-DISTRIBUTION-REINVEST | NAV ≠ price, reinvest two legs |
| 12 | LOAN-VARIABLE-RATE-PARTIAL-PAYMENT-FX | variable rate + partial + FX |

Standalone (P1-FINAL-047): `STANDALONE-CRYPTO` · `STANDALONE-LOAN` · `STANDALONE-FUND`

**Gate C:** all release-scope goldens green in harness before feature implementation beyond core.

## P0-FINAL-018

Harness: `HARNESS.md`. Skeletons `GOLDEN-CORE-*` / `GOLDEN-CRYPTO-*`. Gate C blocked until green CI.

**Gate doc:** `GOLDEN-GATE.md` · critical vectors filled · families listed.
