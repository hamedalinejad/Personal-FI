> **این فقط فهرست ID برای رفرنس سریع است؛ شرح کامل در [`Financial-Invariants.md`](./Financial-Invariants.md) است.**

# Financial Invariant Catalog (P0)

| ID | Invariant |
|----|-----------|
| INV-001 | Journal balances (Σ debit = Σ credit per op) |
| INV-002 | No negative holdings unless short enabled |
| INV-003 | Transfer preserves net worth (ex fee policy) |
| INV-004 | Reversal is exact economic inverse |
| INV-005 | Snapshot equals rebuild from ledger |
| INV-006 | Cost basis preserved on custody transfer |
| INV-007 | Loan balance = transaction-derived |
| INV-008 | Historical valuation reproducible (op + calcVersion + priceAsOf + FX) |
| INV-009 | No duplicate operation (same id+hash) |
| INV-010 | No orphan domain/journal link |
| INV-011 | Posted not mutated |
| INV-012 | Soft delete only for financial rows |
| INV-013 | Currency conservation on same-currency transfer (± fee) |
| INV-014 | Asset quantity conservation on custody transfer |
| INV-015 | Current price does not change historical valuation |
| INV-016 | Offline core requires no external API |
| INV-017 | foreign_keys=ON per connection |
| INV-018 | Buy/Sell: cash + asset + journal coherent |

Golden fixtures + property tests برای این invariants اجباری‌اند قبل از release مالی.
