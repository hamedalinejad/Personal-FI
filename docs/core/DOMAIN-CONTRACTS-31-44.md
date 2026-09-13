> **SUPERSEDED as independent authority** — use docs/PRODUCT.md, ARCHITECTURE.md, FINANCIAL-CORE.md, DATA-MODEL.md, API.md, REPORTING.md, OFFLINE-RELEASE.md, DEVELOPMENT.md, modules/*.

# Domain Contracts — FINAL (investment, cash, FX, reports)

**Status:** SPECIFIED for non-Loan domains.  
**Code packages:** only after Loan RELEASE-PROVEN (`CODING-GATE`).  
**Loan math/role:** `LOAN-V1-RESOLUTIONS.md` + `LOAN-V1-SCHEMA-DISPOSITION.md`.

---

## 26 Cost basis fees & C2C

- Fee roles explicit: `feeInCost` | `feeFromProceeds` | `feeBurnQuantity` — never hidden in price.
- Economic C2C: realize source P&L; dest cost = consideration + capitalized fee (not source carrying).
- Internal transfer/bridge: `realizedPL = 0`, cost moves, acquisition date preserved.
- Asset fee burn: `gross = net + feeQuantity`; cost released **once**.
- Engine home: `Cost-Basis-Engine.md` · `Fee-Treatment-Matrix.md`.

## 27 Instrument identity

- Canonical: `ref_instruments.id` only.
- symbol = label. USDT-TRC20 ≠ USDT-ERC20.
- Stocks: preserve ISIN + brokerage context.
- Home: `Instrument-Identity.md`.

## 28 Cash settlement port

```text
CashSettlementPort.settle(req) → plan
  cash account, counter, currency, amount,
  amountInBase + FX evidence when needed, operationId
```

- Plan persisted only via atomic operation journal — never feature `cashBalance` mutation.
- Home: `Cash-Settlement-Adapter.md` · runtime `cashSettlementPort.js`.

## 29 FX

Layers: observation → source priority → asOf → stale → inverse → path → conversion → provenance → contextHash.

- Path tie-break: fewest hops → source priority → lexical path.
- Missing rate → `MISSING_RATE` (never 0).
- Rates = decimal **strings** only.
- contextHash uses `stableStringify` (same as operation hash).

## 30 Price

Precedence: manual > local cache > online (policy).  
Observation: instrumentId, price, currency, quoteType, asOf, fetchedAt, source, isStale, provenance.  
`price_history` = persistence truth; provider ≠ transaction truth.  
Public API rejects numeric price.

## 31 Crypto v1

In: spot buy/sell, C2C, deposit/withdraw, internal transfer, trade/network/transfer fees, airdrop, opening.  
Out: futures, margin, staking, DeFi, NFT, options.  
Raw fields: instrumentId, exchangeId, networkId, gross/fee/net qty, feeRole, cost*, price, priceAsOf, FX, externalTxId, source*.

## 32 Stocks Iran v1

instrumentId, ISIN, brokerageId, qty, price, **tradeDate ≠ settlementDate**, commission/tax/otherFee, currency.  
T+2 two stages. CA owned by Corporate Action Engine.

## 33 Fixed-income funds

`NAV != transactionPrice`. Subscribe cost uses tx price; valuation may use NAV.  
Reinvest = one operation (income leg + subscription leg); no fake external cash.

## 34 Metals

grossWeight, unit, purityCode, purityRatio, fineWeight (= gross×purity), metalPrice, **premium separate**, fee, currency, platform, physicalDelivery.

## 35 Cheque

draft → issued → deposited → cleared | bounced.  
sayadiId, chequeNumber, due/cleared/bounced*, operationId.  
Correction = reversal. Partial clear rejected v1.

## 36 Physical assets

Not market instruments. Capex vs maintenance explicit. Disposal = carrying + proceeds. Metals delivery preserves lineage.

## 37 Planning (budget/goals/bills/notifications)

Not alternate ledgers. Notification never mutates finance. Recurring occurrences idempotent.

## 38 Reports

Accounting: GL, TB, activity, BS, IS, CF, opening, reconciliation.  
Investment: holdings, cost basis, realized/unrealized P&L, price/FX effect, fees, external flows, wealth bridge.  
Historical requires full ValuationContext. External contribution ≠ P&L.

## 39 Rebuild determinism

```text
same ledger + engineVersions + ValuationContext + dataset = same result
order: business/effective date → createdAt → stable ID
```

Snapshots discardable/rebuildable. No wall-clock/random order dependence.

---

## Implementation order

```text
Loan RELEASE-PROVEN → Crypto → Funds → Stocks → Metals → Cheque → Reports UI
```
