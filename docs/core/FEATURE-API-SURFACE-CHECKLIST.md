# Feature API Surface Checklist (API-004)

| Feature | capabilities | getById | list | reconcile | rebuild | Notes |
|---------|--------------|---------|------|-----------|---------|-------|
| Loan | ✅ | ✅ | ✅ | optional | schedule rebuild | v1 reference |
| Crypto | ✅ | holding | txs | optional | cost basis | |
| Stocks | ✅ | holding | txs | settle | CA/cost | |
| Funds | ✅ | holding | txs | optional | cost | |
| Metals | ✅ | holding | txs | optional | cost | |
| Accounts | ✅ | account | txs | yes | balance cache | |
| Tax | ✅ | record/event | list | n/a | n/a | payTax command |
| Physical Assets | ✅ | asset | list | n/a | valuation | |
| Budget | ✅ | budget | list | n/a | n/a | advisory |
| Goals | ✅ | goal | list | n/a | n/a | plan |
| Bills | ✅ | bill | list | n/a | n/a | reminder ≠ ledger |
