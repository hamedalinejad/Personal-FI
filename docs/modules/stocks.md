# Module: Stocks Iran

**Owner:** this file

## SUPPORTED
buy · sell · settle (buy payable + sell receivable) · dividend · tradeDate ≠ settlementDate · T+n policy version field · ISIN unique when present · commission/tax as fee events.

## OPEN / DEFERRED
Full CA runtime engine (split/bonus/rights/…) · full holiday calendar · versioned commission policy table · complete investment reversal suite.

## Cash
Journal + broker payable/receivable accounts — not brokerage cash balance SoT.

## Acceptance
Settle outstanding from journal; no result_json for settlement detection.


## Date semantics
| Field | Meaning |
|-------|---------|
| tradeDate | exchange trade date |
| settlementDate | cash settlement (T+n) |
| businessDate | book/business day of operation |
| marketDate | quote/session date when distinct |

Do not collapse trade and settlement.
