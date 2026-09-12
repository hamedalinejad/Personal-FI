# Crypto Cash Flow Pattern — P0-004 Resolution

**Status:** PROPOSED (requires doc updates)

---

## Problem Statement

`inv_crypto_exchange_transactions` table is **intentionally omitted** in canonical schema:

```
⚠️ INTENTIONAL OMISSION (no ghost cash ledger)
```

Yet Crypto docs repeatedly reference it.

---

## Canonical Cash Flow Pattern

```
Crypto command (deposit/withdraw)
  ↓
CashSettlementPort(route='crypto_exchange', venue='exchange/wallet')
  ↓
LocalSettlementAdapter OR AccountsCashAdapter
  ↓
Core journal (fin_journal_lines)
  ↓
optional acc_transactions projection
```

**The Crypto domain keeps only crypto-specific asset facts.**

---

## Replacements

| Old (withdrawn) | New |
|----------------|-----|
| `inv_crypto_exchange_transactions` table | **NOT CREATED** — use Core journal |
| `relatedFeature = 'crypto_exchange'` | `relatedFeature = 'investment.crypto'` |
| Direct cash table writes | `CashSettlementPort` adapter |
| `relatedId = inv_crypto_exchange_transactions.id` | `relatedId` → domain entity ID |

---

## Domain Structure

### SoT (Source of Truth)
- `inv_crypto_holdings` — crypto asset quantities + cost basis
- `inv_crypto_cash` — cash position projection (rebuild from journal)
- `fin_accounts` + `fin_journal_lines` — **canonical cash ledger**

### Projected (caches)
- `inv_crypto_holdings.quantity` — derived from ledger
- `inv_crypto_cash.balance` — derived from journal

---

## Implementation Pattern

### Deposit from Bank → Exchange

```typescript
// 1. Crypto domain: create deposit command
const plan = await cashSettlementPort.deposit({
  route: 'crypto_exchange',
  venue: exchangeId,
  currency: 'IRR' | 'USDT',
  amount: '1000000',
  operationId,
});

// 2. Core: journal lines (Dr cash account, Cr bank account)
// 3. Projection: inv_crypto_cash.balance updated
// 4. Optional: acc_transactions row (projection)
```

### Withdraw from Exchange → Bank

```typescript
const plan = await cashSettlementPort.withdraw({
  route: 'crypto_exchange',
  venue: exchangeId,
  currency: 'IRR' | 'USDT',
  amount: '500000',
  operationId,
});

// Same flow: journal → projection
```

---

## Key Rules

1. **No `inv_crypto_exchange_transactions` table** — it's a projection-only concept
2. **Cash SoT = `fin_journal_lines`** — never a domain table
3. **Domain keeps only crypto facts** — quantity, instrumentId, network, location
4. **Cash flow via `CashSettlementPort`** — not direct table writes
5. **Optional `acc_transactions`** — for UI/UX only (event log)

---

## Migration Steps

1. Remove all references to `inv_crypto_exchange_transactions`
2. Replace with `CashSettlementPort` pattern
3. Update `relatedFeature` values to canonical enum
4. Remove `inv_crypto_exchange_transactions` from schema (if exists)