---
id: DOC-AUTH-PRICE-IDENTITY
title: Instrument vs provider price identity
status: locked
version: 1.0
---

# P0-PRICE-003

| Identity | Location | Role |
|----------|----------|------|
| **Financial instrument** | `ref_instruments.id` | SoT identity for holdings, journal, reports |
| **Provider mapping** | `instrument_price_mappings` | Adapter: providerSymbol ↔ instrument_id for a validity window |
| **Price observation** | `price_history` | (instrument_id, market_date, source_id, quote_type) |

`providerSymbol` is **never** financial SoT.  
`quote_type` is **NOT NULL** (`last|close|nav|manual|imported|bid|ask`).
