# Feature Capability Matrix (P0)

| Feature | Required | Optional | Independent | licenseable | requiresNetwork |
|---------|----------|----------|-------------|-------------|-----------------|
| Loans | Core | Accounts, Docs, Notif | ✅ | ✅ | false |
| Crypto | Core, Instrument | Accounts | ✅ | ✅ | false (price opt-in) |
| Funds | Core, Instrument | Accounts | ✅ | ✅ | false |
| Stocks | Core, Instrument | Brokerage | ✅ | ✅ | false |
| Metals | Core, Instrument | Physical Assets | ✅ | ✅ | false |
| Accounts | Core | — | ✅ | ✅ | false |
| Income/Expense | Core, Accounts* | Party | ✅ | ✅ | false |

\* Accounts optional در حالت settlement external برای برخی flows؛ cash leg از Port.

`canDisable = true` بدون حذف داده.
