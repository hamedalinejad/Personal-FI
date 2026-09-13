> **SUPERSEDED as independent authority** — use docs/PRODUCT.md, ARCHITECTURE.md, FINANCIAL-CORE.md, DATA-MODEL.md, API.md, REPORTING.md, OFFLINE-RELEASE.md, DEVELOPMENT.md, modules/*.

# Domain Lock — Crypto / Stocks / Funds / Metals

## CRYPTO-001 — Fee funding

```
fee_funding_kind = cash | asset | null (no fee)
cash  → fee_currency REQUIRED, fee_instrument_id NULL
asset → fee_instrument_id REQUIRED, fee_currency NULL
```

Enforced by SQLite CHECK on `inv_crypto_transactions`.

## CRYPTO-002 — Holding identity

Holding uniqueness = `(exchange_id, instrument_id, network_id?)`.

**Moving asset Exchange A → Wallet B creates a new holding identity** (recommended and locked).  
Transfer must set:

```
economic_kind = internal_transfer | bridge | economic_swap
source holding_id
destination holding (resolved/created)
fee_funding_kind + fee source
```

Cost pool key remains `(instrumentId, holdingId, costCurrency, method)`.

## CRYPTO-003 — Address history on transactions

`from_address_id` / `to_address_id` are **supported soft FKs** to `inv_crypto_wallet_addresses` (optional audit).  
Not deferred: columns exist; resolve address rows before write when provided.

---

## STOCK-001 — Date mapping

| Field | Meaning |
|-------|---------|
| tradeDate | exchange trade date (T+0) |
| businessDate | accounting book date (default = tradeDate) |
| marketDate | quote/session date (price observation) |
| settlementDate | cash settlement date (T+n) |

**tradeDate is NOT a global synonym of marketDate.**

## STOCK-002 — T+n settlement

`stocks.settle` must use a **versioned Iran business calendar**, not raw +2 calendar days.  
Weekend/holiday shift fixtures required before RELEASE-PROVEN.

## STOCK-003 — Corporate actions

```
CA source of truth = inv_stocks_iran_corporate_actions
operation_id on CA + effects
inv_stocks_iran_transactions = effect rows (projections)
```

One CA applied exactly once (idempotent operationId).

## STOCK-004 — Price provider mapping

Canonical entity: `instrument_price_mappings`

```
instrument_id, source_id, provider_symbol, market, valid_from, valid_to, status
```

Symbol changes do not rewrite `ref_instruments.id`.

---

## FUND-001 — NAV vs tx price vs external profit

| Concept | Persistence |
|---------|-------------|
| transactionPrice | RAW on `inv_fif_transactions` |
| NAV | SNAPSHOT on holding / valuation observations |
| external_reported_profit | **DEFERRED v2** column present but must not overwrite calculated return |

## FUND-002 — Reinvestment

One operationId:

```
distribution/income leg + subscription/acquisition leg
```

Atomic; no fake external cash.

## FUND-003 — ETF cash

Same CashSettlementPort as stocks — **no** brokerage cash ledger table.

---

## METAL-001 — Platform cash

`inv_metals_platforms` cashBalance (if any) = **derived cache**. Writes only via Operation → Journal.

## METAL-002 — Coin vs bullion

`gold_coin` instruments carry their own unit/valuation basis.  
Fine-weight metal-equivalent valuation is **analytical only**, not default cost basis for coins.

## METAL-003 — Delivery fee vs trade fee

```
trade fee ≠ physical delivery fee
```

Delivery fee does not change metal acquisition cost unless policy explicitly capitalizes it.  
Tables: `inv_metals_transactions.fee_amount` vs `inv_metals_physical_deliveries.fee_amount`.
