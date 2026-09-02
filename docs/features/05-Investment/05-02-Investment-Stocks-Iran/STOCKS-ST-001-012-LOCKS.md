# Stocks Iran Locks ST-001 … ST-012 (P0)

در تعارض با prose قدیمی این Feature، این سند برنده است.

---

## ST-001 — TradeDate vs SettlementDate

| Use | Date |
|-----|------|
| Position / trade P&L recognition timing | `tradeDate` (business/trade) |
| Cash leg / brokerage cash availability | `settlementDate` (+ `effectiveCashDate` when distinct) |

Reports must not use a single `date` for both position P&L and cash. See Settlement-Accounting + Date-Semantics-Matrix.

---

## ST-002 — Corporate actions in rebuild

- All supported CA types transform qty/cost **only** via `CorporateActionEngine` (+ CostBasisEngine hooks).
- `rebuildStockHolding` / reconcile must include CA ledger events — not buy/sell only (P0-050).

---

## ST-003 — Rights / fractional / cash-in-lieu

```text
entitlement = f(holdingQty, ratio, instrument precision, market rules)
fractionalPolicy → round_down | round_nearest | cash_in_lieu | …
cashInLieu → explicit cash event/operation leg when policy requires
```

No orphan fractional shares or cash without policy (P0-056).

---

## ST-004 — Symbol change ≠ new identity

- `instrumentId` (UUID → `ref_instruments`) **unchanged** on symbol/ISIN label change.
- Symbol history table or CA metadata records old→new labels.
- Holding unique key remains `(brokerageId, instrumentId)`.

---

## ST-005 — Adjusted vs raw prices

- `price_history` **raw** quotes are immutable.
- Split/CA-adjusted series = **derived** projection (separate series or view), never overwrite raw rows.

---

## ST-006 — feeTax vs tax liability

- `feeTax` on trade = **transaction cost** only (fee breakdown).
- Periodic / capital-gains **tax liability** = Tax Feature (`tax_events` / `linkedTaxEventId`).
- Do not double-count feeTax as tax_records payment (P0-053, P0-084).

---

## ST-007 — Dividend three values

```text
grossDividend
withholdingTaxAmount   // if any
netCash                // what hits cash / brokerage
```

Income recognition uses gross (policy); cash movement uses net. Missing split = invalid dividend event.

---

## ST-008 — Brokerage → brokerage transfer

```text
transfer event / transfer_ca
cost basis carries
realizedPnl = 0
```

Not a sell+buy that realizes gain/loss.

---

## ST-009 — Delisting / worthless

- Explicit **write-off / disposal** operation (qty→0 or residual, carrying cost released, loss recognized per policy).
- Silent zeroing of holding snapshot without operation = forbidden.

---

## ST-010 — Lot / tick / market validation

- Lot size, tick size, market segment constraints from **registry / Iran-Market-Rules** (instrument + market metadata).
- Commands that violate constraints → `VALIDATION_ERROR` (unless explicit override policy for import legacy).

---

## ST-011 — P&L decomposition

When multi-currency or fees material, report like Crypto golden:

```text
assetPriceEffectBase
fxEffectBase          // if applicable
feeEffectBase
externalCashFlowEffectBase
realizedPnlBase
unrealizedPnlBase
```

Opaque single P&L only is insufficient for base≠trade currency paths.

---

## ST-012 — Price provider mapping

```text
priceProviderId + providerSymbol + market
```

**Forbidden** as sole durable mapping: bare internal `symbol` string. Incomplete mapping must be detectable (P0 stocks price mapping rules).

---

## Status

| ID | Status |
|----|--------|
| ST-001 … ST-012 | **LOCKED** 2026-09-02 |
