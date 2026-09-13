# Stocks Iran (module owner)

**Status:** CURRENT

Shared: FINANCIAL-CORE · DATA-MODEL · API · REPORTING.

## 1. Purpose

Iran equity trades with T+n settlement, dividends, corporate actions path.

## 2. Scope

buy, sell, settle, dividend; CA versioned events.

## 3. Non-Goals

Non-Iran multi-exchange OMS.

## 4. User Stories

N/A or DEFERRED — do not invent.


## 5. Pages / Sheets / Drawers

N/A or DEFERRED — do not invent.


## 6. Entities

inv_stocks_* holdings/transactions, broker payable accounts.

## 7. Fields

N/A or DEFERRED — do not invent.


## 8. Field Kinds

N/A or DEFERRED — do not invent.


## 9. Field Ownership

N/A or DEFERRED — do not invent.


## 10. Commands

stocks.buy, sell, settle, dividend.

## 11. Queries

N/A or DEFERRED — do not invent.


## 12. API Input

N/A or DEFERRED — do not invent.


## 13. API Output

N/A or DEFERRED — do not invent.


## 14. Normalization

N/A or DEFERRED — do not invent.


## 15. Validation

N/A or DEFERRED — do not invent.


## 16. State Machine

Order intent → posted trade → open payable → settled.

## 17. Accounting Effects

N/A or DEFERRED — do not invent.


## 18. Journal Effects

N/A or DEFERRED — do not invent.


## 19. Cash Effects

T+0: Dr stock / Cr payable; settle: Dr payable / Cr cash.

## 20. Fee Effects

Commission as fee event; tax withhold separate from feeTax confusion.

## 21. Tax Effects

Dividend withholding as tax_event optional.

## 22. FX Effects

N/A or DEFERRED — do not invent.


## 23. Date Semantics

tradeDate ≠ settlementDate ≠ businessDate ≠ marketDate. Position on tradeDate; cash on settlementDate.

## 24. Identity

instrumentId + brokerage/account scope.

## 25. Reversal / Correction

Reversal operation linked; CA reverse policy versioned.

## 26. Rebuild

N/A or DEFERRED — do not invent.


## 27. Reports

N/A or DEFERRED — do not invent.


## 28. Offline Behavior

Posted trades offline; prices may be stale flagged.

## 29. Standalone Edition

Stocks-only edition + Core.

## 30. Licensing / Capabilities

N/A or DEFERRED — do not invent.


## 31. Edge Cases

N/A or DEFERRED — do not invent.


## 32. Errors

N/A or DEFERRED — do not invent.


## 33. Golden / Recovery Fixtures

STOCK-* fixtures; empty = DEFERRED.

## 34. Acceptance Criteria

settle clears payable; CA single event id; no tradeDate overwrite of settlementDate.

### Extra edge
Weekend/holiday settlement uses Iran business calendar policy version when implemented.

## T+n journal pattern

**Trade (T+0):**
- Dr Stock inventory (transaction currency / base as policy)
- Cr Broker payable

**Settle (T+n):**
- Dr Broker payable
- Cr Cash / settlement account

Dividend: income recognition + optional tax withhold leg.
