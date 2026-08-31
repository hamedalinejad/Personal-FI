# Loan Component Classification (Core)

مبالغ وام هرگز فقط داخل یک `installmentAmount` دفن نمی‌شوند.

| Component | Accounting (نمونه) |
|-----------|-------------------|
| Principal | Loan Liability / Receivable |
| Interest | Interest Expense / Income |
| Fee | Fee Expense / Income |
| Penalty | Penalty Expense / Income |
| Cash | Cash / Bank account |

```text
ln_transactions: principalPortion + interestPortion + feePortion + penaltyPortion
journal lines: جدا per component وقتی material
```

Feature Loan فقط map می‌کند؛ classification از این سند است.
