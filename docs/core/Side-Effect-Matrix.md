# Side Effect Matrix (P0)

| Operation | Domain | Cash | Journal | Audit | Snapshot |
|-----------|--------|------|---------|-------|----------|
| Expense | Expense lines | ↓ | ✓ | ✓ | rebuild |
| Income | Income | ↑ | ✓ | ✓ | rebuild |
| Transfer | Account | A↓ B↑ | ✓ | ✓ | rebuild |
| Crypto Buy | Crypto ↑ | ↓ | ✓ | ✓ | rebuild |
| Crypto Sell | Crypto ↓ | ↑ | ✓ | ✓ | rebuild |
| Crypto Transfer | locations | optional fee | ✓ | ✓ | rebuild |
| Loan Payment | components | ↓ | ✓ | ✓ | rebuild |
| Loan Disburse | principal | ↑/↓ | ✓ | ✓ | rebuild |
| Fund Buy | units ↑ | ↓ | ✓ | ✓ | rebuild |
| Metal Physical Delivery | inv → physical | — | ✓ | ✓ | rebuild |
| Reversal | inverse domain | inverse cash | inverse journal | ✓ | rebuild |

**Net Worth Δ = 0** برای transfer داخلی (بانک↔بانک، exchange↔wallet) بدون fee اقتصادی خالص.

مالکیت / mutator / projection: با Field-Write-Contract و Ownership Matrix تکمیل می‌شود.
