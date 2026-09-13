# Accounting Event Mapping Matrix (P0)

| Domain Event | Debit (typical) | Credit (typical) |
|--------------|-----------------|------------------|
| Expense | Expense | Cash |
| Income | Cash | Income |
| Loan borrow | Cash | Liability |
| Loan payment | Liability / Interest / Fee / Penalty | Cash |
| Loan given (lend) | Receivable | Cash |
| Stock buy | Investment asset | Cash |
| Stock sell | Cash | Investment + Realized P&L |
| Fund dividend | Cash/Receivable | Investment income |
| Crypto buy | Crypto asset | Cash |
| Crypto sell | Cash | Crypto + Realized P&L |
| Fee (expense treatment) | Fee expense | Cash/Asset |
| Transfer A→B | Cash B | Cash A |

جزئیات حساب‌های واقعی (`fin_accounts`) per operation در Operation Catalog / fixtures.
