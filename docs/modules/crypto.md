# Crypto (module owner)

**Status:** CURRENT

Shared: FINANCIAL-CORE · DATA-MODEL · API · REPORTING.

## 1. Purpose

Crypto acquisition, disposal, transfer with dimensional fees and venue-scoped holdings.

## 2. Scope

buy, sell, transfer; economic_kind discrimination; network metadata.

## 3. Non-Goals

On-chain indexer, DeFi LP, NFT.

## 4. User Stories

Buy BTC with IRR/USDT fee; transfer exchange→wallet without taxable disposal when internal.

## 5. Pages / Sheets / Drawers

Under /investments; buy/sell/transfer sheets.

## 6. Entities

inv_crypto_holdings, inv_crypto_transactions, ref_instruments, fee legs via Core.

## 7. Fields

quantity, total_invested, cost_currency, networkId, contractAddress, feeAmount, feeCurrency, feeInstrumentId, feeFundingKind, economic_kind.

## 8. Field Kinds

qty/price RAW; total_invested DERIVED/rebuildable; provider symbol LABEL/EXTERNAL only.

## 9. Field Ownership

Feature owns crypto tables; journal owned by Core.

## 10. Commands

crypto.buy, crypto.sell, crypto.transfer. swap/bridge: document as OPEN if not implemented.

## 11. Queries

listHoldings, getTransaction, listTransactions.

## 12. API Input

operationId, businessDate, instrument, qty, price, fees as decimal strings.

## 13. API Output

Canonical envelope + domainResult holding/tx ids.

## 14. Normalization

Decimal strings; instrument resolve via Core identity.

## 15. Validation

Reject missing purity-equivalent N/A; reject fee without funding kind; currency match.

## 16. State Machine

Holdings rebuild from txs; no parallel cash balance SoT.

## 17. Accounting Effects

Inventory asset vs cash/settlement per buy/sell.

## 18. Journal Effects

Balanced legs via operation engine.

## 19. Cash Effects

CashSettlementPort only — no inv_*_cash ledger SoT.

## 20. Fee Effects

cash|asset funding; conservation on qty when asset fee.

## 21. Tax Effects

Optional tax_event link on disposal; not automatic legal tax.

## 22. FX Effects

exchangeRateToBase locked on post.

## 23. Date Semantics

businessDate required; eventAt optional.

## 24. Identity

instrumentId + venue/network; never symbol alone.

## 25. Reversal / Correction

reverse operation; no in-place mutation of posted amounts.

## 26. Rebuild

Holdings from transaction ledger + cost-basis engine version.

## 27. Reports

Via REPORTING investment performance.

## 28. Offline Behavior

Full offline post when data local.

## 29. Standalone Edition

Crypto-only + Core journal + local settlement.

## 30. Licensing / Capabilities

License disables commands only.

## 31. Edge Cases

Dust qty; fee > proceeds policy explicit reject/allow.

## 32. Errors

CRYPTO_* / OP_* / INV_JOURNAL_*.

## 33. Golden / Recovery Fixtures

fixtures/CRYPTO-*; DEFERRED marked until filled.

## 34. Acceptance Criteria

Gate-H field survival; no feature cash table as SoT; fee dimensions persisted.

### Extra edge
Asset fee reduces qty; cost basis feeCarrying derived not caller-trusted float.

## economic_kind matrix
| kind | Taxable disposal? | Cost basis |
|------|-------------------|------------|
| acquisition | no | opens lot/WAC |
| disposal | yes (policy) | reduces |
| transfer_internal | no | carry |
| swap_economic | yes legs | dispose+acquire |
| fee | per funding | qty or cash |

## Transfer vs bridge
Internal transfer: same economic owner, carry cost. Bridge: may be transfer_internal or swap_economic per venue policy — explicit economic_kind required.

## Sell
disposal economic_kind; WAC/qty reduce; proceeds via settlement; fees dimensional.
