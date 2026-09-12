---
id: DOC-AUTH-PRICE-HISTORY
title: Price history observation contract
status: locked
version: 1.0
---

# P1-PRICE-004 / 005

- `quote_type` **NOT NULL**: `last|close|nav|manual|imported|bid|ask`
- Prefer `source_id` pointing to `price_sources` row with kind `manual` or `import`
- `source_id IS NULL` only for ad-hoc; pair with `is_manual=1`
- Uniqueness: `(instrument_id, market_date, source_id, quote_type)` + partial null-source index

# P1-PRICE-006 — valuation/report context (mandatory on historical results)

```json
{
  "asOf": "YYYY-MM-DD",
  "priceAsOf": "YYYY-MM-DD",
  "fxAsOf": "YYYY-MM-DD",
  "engineVersions": {},
  "staleStatus": "fresh|stale|missing"
}
```
