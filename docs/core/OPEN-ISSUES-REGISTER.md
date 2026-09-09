# Open Issues Register — LIVE

## Resolved this pass

- Loan create: journal + ln_loans + schedule in **one** SQLite transaction (`withinTransaction`)
- Loan payment: writes `ln_transactions` in same transaction
- Formula lock: declining_balance v1 = equal-principal
- ln_loans columns: operation_id, total_installments, day_count, schedule_engine_version
- Idempotency: SQLite primary; idempotency.json only for json test mode
- Persistence port surface: `src/core/persistence/port.js`

## Still open

| ID | Item |
|----|------|
| FX-full | Multi-hop historical resolver + source priority |
| Price-full | price_history policy persistence complete |
| Manifest-CHECK | Full CHECK/predicate semantic equality |
| PWA-SQLite | WASM+IDB adapter behind same port |
| Loan-annuity | Separate engine version if product switches |
| CI-public | Confirm GitHub Actions green on public npm |

## Production

**NO-GO**
