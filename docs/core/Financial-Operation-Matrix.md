# Financial Operation Matrix (P0)

هر ردیف: یک نوع Operation و اثرهای اجباری آن.

| Operation | Domain Ledger | Cash | Journal | Audit | Snapshot |
|-----------|---------------|------|---------|-------|----------|
| Bank Deposit | Account | ✓ | ✓ | ✓ | rebuild |
| Bank Withdrawal | Account | ✓ | ✓ | ✓ | rebuild |
| Transfer | Account | ✓ | ✓ | ✓ | rebuild |
| Income | Income | ✓ | ✓ | ✓ | rebuild |
| Expense | Expense | ✓ | ✓ | ✓ | rebuild |
| Loan Disbursement | Loan | ✓ | ✓ | ✓ | rebuild |
| Loan Payment | Loan | ✓ | ✓ | ✓ | rebuild |
| Loan Fee | Loan | optional | ✓ | ✓ | rebuild |
| Crypto Buy | Crypto | ✓ | ✓ | ✓ | rebuild |
| Crypto Sell | Crypto | ✓ | ✓ | ✓ | rebuild |
| Crypto C2C | Crypto | optional | ✓ | ✓ | rebuild |
| Crypto Transfer | Crypto | optional | ✓ | ✓ | rebuild |
| Stock Buy | Stock | ✓ | ✓ | ✓ | rebuild |
| Stock Sell | Stock | ✓ | ✓ | ✓ | rebuild |
| Stock Dividend | Stock | ✓ | ✓ | ✓ | rebuild |
| Corporate Action | Stock | optional | ✓ | ✓ | rebuild |
| Fund Buy | Fund | ✓ | ✓ | ✓ | rebuild |
| Fund Sell | Fund | ✓ | ✓ | ✓ | rebuild |
| Fund Dividend / Interest | Fund | ✓ | ✓ | ✓ | rebuild |
| Metal Buy | Metal | ✓ | ✓ | ✓ | rebuild |
| Metal Sell | Metal | ✓ | ✓ | ✓ | rebuild |
| Cheque Issue / Receive | Cheque | — (pending) | optional | ✓ | — |
| Cheque Clear | Cheque + Account | ✓ | ✓ | ✓ | rebuild |
| Opening Balance | Account / Domain | ✓ | ✓ | ✓ | rebuild |
| Reversal / Correction | همان دامنه | ✓ as needed | ✓ | ✓ | rebuild |

**Invariant:** هیچ Operation مالی بدون `operationId` و بدون مسیر journal (وقتی اثر اقتصادی دارد) commit نمی‌شود.

جزئیات اجرا: `Canonical-Financial-Operation.md` · Operation Graph.
