# Feature Independence Contract

هر Feature مشخص می‌کند:

| | |
|--|--|
| **Required** | بدون آن Feature کار نمی‌کند |
| **Optional** | غنی‌سازی |
| **Integration** | وصل به چه Featureهایی |
| **Can operate without** | لیست صریح |

## نمونه Loan

| | |
|--|--|
| Required | Core, Loan Ledger |
| Optional | Accounts, Parties, Documents, Notifications, Accounting Reports UI |
| Without | Investments, Budget, Goals, Crypto |

## نمونه Fund

| | |
|--|--|
| Required | Core, Fund Ledger, Instrument Registry |
| Optional | Bank, Portfolio, Price, Accounting UI |

```text
Standalone UI ≠ Standalone Ledger
Journal از Core همیشه قابل تولید است.
```
