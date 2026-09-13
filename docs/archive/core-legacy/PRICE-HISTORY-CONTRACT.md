> **SUPERSEDED as independent authority** — use docs/PRODUCT.md, ARCHITECTURE.md, FINANCIAL-CORE.md, DATA-MODEL.md, API.md, REPORTING.md, OFFLINE-RELEASE.md, DEVELOPMENT.md, modules/*.

# price_history Contract — P0-008 Resolution

**Status:** PROPOSED (requires doc updates)

---

## Problem Statement

`Price-Fetching.md` describes composite keys:
- Crypto: `assetKey`
- FIF: `fundId`
- Metals: `{metalType}_{purity}`
- Stocks: `symbol` / `instrumentId`

But `schema.sql` defines:
```sql
price_history.instrument_id REFERENCES ref_instruments(id)
```

and does NOT have `assetCategory`.

---

## Canonical Rule

```
Every priceable economic instrument has ref_instruments.id.
price_history.instrument_id always points to ref_instruments.id.
```

For Funds, Metals and Stocks, create/resolve the instrument first.

Do NOT store composite identity strings in `price_history.instrument_id`.

`assetCategory` is unnecessary because it is derivable from `ref_instruments.asset_class`; if retained for denormalized querying it must be explicitly DERIVED.

---

## Implementation Pattern

### Step 1: Create Instrument First

```typescript
// Before storing price, ensure instrument exists:
const instrumentId = await ensureInstrument({
  assetClass: 'crypto' | 'stock' | 'fund' | 'metal' | 'currency',
  symbol: 'BTC', // label only
  network_identifier: 'TRC20' | 'ERC20' | null, // for crypto
  contract_address: '0x...' | null, // for crypto
  isin: string | null, // for stock
});

// Then store price:
await storePrice({
  instrument_id: instrumentId,
  price: '50000000',
  currency: 'IRR',
  market_date: '2026-09-12',
  source_id: 'coinbase',
  quote_type: 'last',
});
```

### Step 2: Derive assetCategory from asset_class

```typescript
const assetCategory = {
  crypto: 'crypto',
  stock: 'stock',
  fund: 'fif',
  metal: 'metal',
  currency: 'currency',
}[ref_instruments.asset_class];
```

---

## Schema Updates (Optional for Denormalization)

If `assetCategory` is needed for performance, add it as a DERIVED column:

```sql
-- Add derived column (optional, for query performance)
ALTER TABLE price_history ADD COLUMN asset_category TEXT;

-- Update trigger or app logic to populate from ref_instruments.asset_class
```

But **soT remains**: `instrument_id → ref_instruments.asset_class`

---

## Migration Steps

1. Ensure all `price_history` rows have valid `instrument_id` pointing to `ref_instruments`
2. Update `price_history` to remove composite key strings (assetKey, fundId, metalType_purity)
3. For Crypto: map `assetKey` → `instrument_id` via `ref_instruments`
4. For FIF: map `fundId` → `instrument_id` via `ref_instruments`
5. For Metals: map `{metalType}_{purity}` → `instrument_id` via `ref_instruments`
6. Update `Price-Fetching.md` to remove references to composite keys and `assetCategory` as primary key

---

## Key Rules

1. **Single canonical identity**: `ref_instruments.id`
2. **No composite keys in `instrument_id`**: never `assetKey`, `fundId`, `metalType_purity`
3. **`assetCategory` derivable**: from `ref_instruments.asset_class`
4. **Domain mapping**: each feature maps its local ID (fundId, assetKey) → `ref_instruments.id`