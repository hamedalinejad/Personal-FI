# Domain-Dependency-Matrix

| From → To | reads | writes | creates-operation |
|-----------|-------|--------|-------------------|
| Income → Accounts | Y | via Core only | Y (cash) |
| Expense → Accounts | Y | via Core | Y |
| Cheque → Accounts | Y | via Core | Y |
| Loan → Accounts | Y | via Core | Y |
| Crypto → Accounts | Y bank only | via Core | Y |
| Investment → Currency/Price | Y | N | N |
| All financial → Accounting Core | Y | journal via Op | Y |
| Feature A → Feature B tables | **N** | **N** | — |

```text
Accounting Core
      ↑
All Financial Features
```

Currency/Price → Valuation (read).  
**ممنوع:** import مستقیم repository داخلی Feature دیگر.

```text
COMMON → CORE → DOMAIN FEATURES → UI
```
Feature ❌ depends on Dashboard/Reports UI.
Cross-feature write فقط via Canonical Operation.
