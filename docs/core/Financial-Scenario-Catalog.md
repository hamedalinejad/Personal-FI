# Financial Scenario Catalog (SoT)

فهرست سناریوهای اجباری برای golden fixtures. جزئیات عددی در `fixtures/` و شرح الگوی تست در `Mandatory-Test-Vectors.md`.

**این فایل SoT فهرست سناریوها است.** فایل قدیمی `Financial-Scenarios.md` فقط alias است.

## قرارداد هر سناریو

```text
Input → Domain · Cash · Journal · Cost · Holding · P&L · Net Worth
```

## فهرست SCN (کاتالوگ یکپارچه)

| ID | Scenario | Expected focus |
|----|----------|----------------|
| SCN-001 | Cash Expense | journal bal, cash↓ |
| SCN-002 | Split Expense | multi lines = cash |
| SCN-003 | Refund | new op, not mutate |
| SCN-004 | Bank Transfer | NW Δ=0 |
| SCN-005 / S-CRYPTO-BUY | Crypto Buy | qty, cost, cash, journal |
| SCN-006 | Crypto fee in quote | fee treatment |
| SCN-007 | Crypto fee in asset | net qty |
| SCN-008 / S-CRYPTO-XFER | Crypto Transfer | cost preserved |
| SCN-009 / S-STOCK-BUY | Stock Buy | settlement + Iran fees |
| SCN-010 / S-STOCK-SELL | Stock Sell | realized + tax fee |
| SCN-011 | Dividend | income + cash |
| SCN-012 | Bonus | qty↑ cost/avg |
| SCN-013 | Rights | full lifecycle |
| SCN-014 / S-FIF-SUB | Fund Purchase | units, tx price ≠ NAV |
| SCN-015 | Fund Div Reinvest | two events one op |
| SCN-016 | Fund Redemption | NAV/liquidation |
| SCN-017 | Gold Purchase | mg, purity |
| SCN-018 | Physical Delivery | custody transfer |
| SCN-019 / S-LOAN-DISB | Loan Disbursement | principal/cash |
| SCN-020 / S-LOAN-PAY | Loan Payment | waterfall components |
| SCN-021 | Partial Payment | remaining parts |
| SCN-022 | Early Payment | policy + scheduleVersion |
| SCN-023 | Penalty | component |
| SCN-024 / S-OPEN | Opening Balance | source=opening |
| SCN-025 | Import unknown fields | raw preserved |
| SCN-026 | Offline full record | no network |
| SCN-027 | Crash mid-persist | recover |
| SCN-028 | Loan-only edition | standalone |
| SCN-029 | Fund-only edition | standalone |
| SCN-030 | Reversal exact inverse | INV-004 |
| S-CHQ-CLR | Cheque clear | status + cash |
| S-CHQ-BNC | Bounce | penalty/status |
| S-FX | Multi-currency leg | rate lock |
| S-PA-BUY | Physical asset purchase | asset + cash |
