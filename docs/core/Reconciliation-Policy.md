# Reconciliation Policy

**Status:** LOCKED (docs)

## Kinds (MR-028…033)

| Kind | Match |
|------|--------|
| Bank | journal lines vs bank statement import |
| Brokerage | holdings + txs vs brokerage statement |
| Cash | journal cash balance = expected (accounts + standalone) |
| Holdings | Σ domain txs = holding snapshot (rebuild) |
| Imported statement | import_raw → normalized → journal link |
| Price/valuation | price_history sources vs expected as-of |

All runs recorded in `fin_reconcile_runs` with `result_json`, `base_currency`, `valuation_context_json`.

## Correction (MR-036…041)

| Rule | Behavior |
|------|----------|
| Corrected replacement | new `fin_operations` with `corrects_operation_id` after reverse |
| Void before posting | draft may be deleted; no journal |
| Failed operation | `durability_state='failed'`; status stays draft; retry allowed |
| Stale data conflict | check `db_meta` version / watermark before post |
| Locked fiscal period | reject with error `FISCAL_PERIOD_LOCKED` |

## Iran money (MR-048)

Persian/Arabic digits normalized to ASCII before decimal parse (۶→6). See OPEN P1-FIX-006.

## Dates (MR-058)

Iran business calendar: holidays + TSE sessions + T+N settlement shifts documented in feature/engine; settlement_date may move off trade_date.

## Missing rate (MR-219)

Never silently zero FX/price; fail with explicit error or require manual override (`is_manual`).
