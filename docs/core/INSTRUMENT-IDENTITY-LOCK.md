# Instrument Identity (BUG-CUR-025)

| Asset class | Canonical identity |
|-------------|-------------------|
| Crypto | ref_instruments.id; uniqueness (chain_id, contract) or (chain_id, native_symbol) as **crypto-scoped** indexes |
| Stocks | ref_instruments.id + ISIN/market context; provider symbols in instrument_price_mappings |
| Funds | ref_instruments.id linked from inv_fif_funds |
| Metals | ref_instruments.id; purity/unit on holdings not as instrument PK |

Duplicate **display** symbols across venues are allowed. Same **economic identity** must not duplicate instrument rows.
