# Canonical Financial Operation Catalog (P0)

هر عملیات رسمی محصول یک کد دارد. پیاده‌سازی بدون ردیف در این کاتالوگ ممنوع است.

## قرارداد هر Operation

```text
code
name
inputs / preconditions
domain mutations
cash effects
journal effects
audit
fees / FX / rounding versions
sourceType
reversal policy
idempotency
reports affected
creates: [operation, domain rows, cash?, journal, audit, snapshot rebuild]
```

## فهرست (هسته v1 + توسعه)

| Code | Operation |
|------|-----------|
| OP-001 | CASH_EXPENSE |
| OP-002 | CASH_INCOME |
| OP-003 | ACCOUNT_TRANSFER |
| OP-004 | SPLIT_EXPENSE |
| OP-005 | REFUND / PARTIAL_REFUND |
| OP-006 | OPENING_BALANCE |
| OP-010 | LOAN_DISBURSEMENT |
| OP-011 | LOAN_PAYMENT |
| OP-012 | LOAN_EARLY_PAYMENT |
| OP-013 | LOAN_FEE |
| OP-014 | LOAN_PENALTY |
| OP-020 | CRYPTO_BUY |
| OP-021 | CRYPTO_SELL |
| OP-022 | CRYPTO_TRANSFER |
| OP-023 | CRYPTO_DEPOSIT |
| OP-024 | CRYPTO_WITHDRAWAL |
| OP-025 | CRYPTO_C2C |
| OP-026 | CRYPTO_AIRDROP |
| OP-030 | STOCK_BUY |
| OP-031 | STOCK_SELL |
| OP-032 | STOCK_DIVIDEND |
| OP-033 | STOCK_SPLIT |
| OP-034 | STOCK_BONUS |
| OP-035 | STOCK_RIGHTS_* |
| OP-040 | FUND_BUY |
| OP-041 | FUND_REDEMPTION |
| OP-042 | FUND_DIVIDEND |
| OP-043 | FUND_REINVEST |
| OP-050 | METAL_BUY |
| OP-051 | METAL_SELL |
| OP-052 | METAL_TRANSFER |
| OP-053 | METAL_PHYSICAL_DELIVERY |
| OP-060 | CHEQUE_* (issued/cleared/bounced/…) |
| OP-090 | REVERSAL / CORRECTION |

جزئیات side effects: `Side-Effect-Matrix.md` · Accounting mapping: `Accounting-Event-Mapping-Matrix.md`
