# Financial-Scenarios (قدم‌به‌قدم)

هر سناریو باید مشخص کند: Domain tx · Cash · Journal · Cost · Holding · PL · Net Worth.

## Template

```text
Input: …
→ Crypto/Stock/Loan Domain
→ Cash (acc) if any
→ Journal lines (accountId…)
→ Cost basis update
→ Holding derived
→ PL / Net Worth impact
```

## فهرست حداقل (قبل از coding fixtures)

| ID | سناریو |
|----|--------|
| S-CRYPTO-BUY | Buy BTC + fee in asset/quote |
| S-CRYPTO-XFER | Transfer + network fee |
| S-STOCK-BUY | Buy + Iran fees |
| S-STOCK-SELL | Sell + tax fee |
| S-FIF-SUB | Subscription ≠ NAV |
| S-LOAN-DISB | Disbursement + fee |
| S-LOAN-PAY | Installment principal+interest+fee |
| S-CHQ-CLR | Cheque clear |
| S-CHQ-BNC | Bounce |
| S-BANK-XFER | Transfer neutral |
| S-FX | Multi-currency leg |
| S-PA-BUY | Physical asset purchase |
| S-OPEN | Opening balance bank+crypto |

جزئیات عددی → `fixtures/` golden (زیر).
