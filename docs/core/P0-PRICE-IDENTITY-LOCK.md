> **SUPERSEDED as independent authority** — use docs/PRODUCT.md, ARCHITECTURE.md, FINANCIAL-CORE.md, DATA-MODEL.md, API.md, REPORTING.md, OFFLINE-RELEASE.md, DEVELOPMENT.md, modules/*.

# P0-PRICE Identity Lock

## P0-PRICE-003

| Layer | Role |
|-------|------|
| `ref_instruments.id` | **Financial identity (SoT)** |
| `instrument_price_mappings` | Adapter/provider identity only |
| `provider_symbol` | Never historical SoT |

## P0-PRICE-002

At most one **active** mapping interval per `(instrument_id, source_id, market)`.  
`valid_to > valid_from` when `valid_to` set. Overlaps → `PRICE_MAPPING_OVERLAP`.
