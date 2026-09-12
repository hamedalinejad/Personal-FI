# Metals Cash Flow Pattern — P0-006 Resolution

**Status:** PROPOSED (requires doc updates)

---

## Problem Statement

`inv_metals_platform_transactions` table is **intentionally omitted** in canonical schema:

```
⚠️ INTENTIONAL OMISSION (no ghost cash ledger)
```

Yet Metals docs require it and treat platform cash balance as a truth-like journal.

---

## Canonical Cash Flow Pattern

```
Metals command (deposit/withdraw/physical_delivery)
  ↓
CashSettlementPort(route='metals_platform', venue=platformId)
  ↓
LocalSettlementAdapter OR AccountsCashAdapter
  ↓
Core journal (fin_journal_lines)
  ↓
optional acc_transactions projection
```

**Platform cash is NEVER an independent cash SoT.**

---

## Domain Structure

### SoT (Source of Truth)
- `inv_metals_holdings` — metal quantities + cost basis
- `inv_metals_platforms` — platform identity + metadata
- `fin_accounts` + `fin_journal_lines` — **canonical cash ledger**

### Projected (caches)
- `inv_metals_holdings.quantity_mg` — derived from ledger
- `inv_metals_platforms.cashBalance` — **DERIVED ONLY**, rebuild from journal

---

## Key Rules

1. **No `inv_metals_platform_transactions` table** — it's a projection-only concept
2. **Cash SoT = `fin_journal_lines`** — never a domain table
3. **Domain keeps only metal facts** — quantity_mg, purity, platform, price, premium
4. **Cash flow via `CashSettlementPort`** — not direct table writes
5. **`inv_metals_platforms.cashBalance` = derived/cache only** — never authoritative

---

## Implementation Pattern

### Deposit from Bank → Platform

```typescript
const plan = await cashSettlementPort.deposit({
  route: 'metals_platform',
  venue: platformId,
  currency: 'IRR',
  amount: '1000000',
  operationId,
});
```

### Withdraw from Platform → Bank

```typescript
const plan = await cashSettlementPort.withdraw({
  route: 'metals_platform',
  venue: platformId,
  currency: 'IRR',
  amount: '500000',
  operationId,
});
```

### Physical Delivery

```typescript
const plan = await cashSettlementPort.settle({
  route: 'metals_platform',
  venue: platformId,
  currency: 'IRR',
  amount: 'delivery_fee',
  operationId,
});
```

---

## Migration Steps

1. Remove all references to `inv_metals_platform_transactions`
2. Replace with `CashSettlementPort(route='metals_platform')` pattern
3. Update domain docs to reflect: `inv_metals_platforms.cashBalance = derived/cache`
4. Platform cash balance must be rebuildable from `fin_journal_lines`