# Stocks Iran Cash Flow Pattern — P0-005 Resolution

**Status:** PROPOSED (requires doc updates)

---

## Problem Statement

`inv_stocks_iran_brokerage_transactions` table is **intentionally omitted** in canonical schema:

```
⚠️ INTENTIONAL OMISSION (no ghost cash ledger)
```

Yet Stocks-Iran docs describe it as a required cash ledger.

---

## Canonical Cash Flow Pattern

```
Stock trade/settlement
  ↓
CashSettlementPort(route='stocks_iran_brokerage', venue=brokerageId)
  ↓
LocalSettlementAdapter OR AccountsCashAdapter
  ↓
Core journal (fin_journal_lines)
  ↓
optional acc_transactions projection
```

**Brokerage identity remains in `inv_stocks_iran_brokerages`.**

---

## Key Rules

1. **No `inv_stocks_iran_brokerage_transactions` table** — it's a projection-only concept
2. **Cash SoT = `fin_journal_lines`** — never a domain table
3. **Domain keeps only stock facts** — quantity, instrumentId, brokerage, trade dates
4. **Cash flow via `CashSettlementPort`** — not direct table writes
5. **Optional `acc_transactions`** — for UI/UX only (event log)

---

## Domain Structure

### SoT (Source of Truth)
- `inv_stocks_iran_holdings` — stock quantities + cost basis
- `inv_stocks_iran_brokerages` — brokerage identity + metadata
- `fin_accounts` + `fin_journal_lines` — **canonical cash ledger**

### Projected (caches)
- `inv_stocks_iran_holdings.quantity` — derived from ledger
- `inv_stocks_iran_brokerages.cashBalance` — **DERIVED** from journal

---

## Implementation Pattern

### Buy stock via brokerage

```typescript
// 1. Stocks domain: create trade command
const plan = await cashSettlementPort.settle({
  route: 'stocks_iran_brokerage',
  venue: brokerageId,
  currency: 'IRR',
  amount: '5000000',
  operationId,
});

// 2. Core: journal lines (Dr cash account, Cr bank account)
// 3. Projection: update cash balance
```

### Sell stock → brokerage cash

```typescript
const plan = await cashSettlementPort.settle({
  route: 'stocks_iran_brokerage',
  venue: brokerageId,
  currency: 'IRR',
  amount: '3000000',
  operationId,
});
```

---

## Migration Steps

1. Remove all references to `inv_stocks_iran_brokerage_transactions`
2. Replace with `CashSettlementPort(route='stocks_iran_brokerage')` pattern
3. Update `relatedFeature` to `investment.stocks`
4. `inv_stocks_iran_brokerages.cashBalance` = derived/cache only (rebuild from journal)