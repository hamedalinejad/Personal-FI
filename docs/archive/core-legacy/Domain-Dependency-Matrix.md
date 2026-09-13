# Domain-Dependency-Matrix

| From → To | reads | writes | creates-operation |
|-----------|-------|--------|-------------------|
| Income → Accounts | via CashSettlementPort only | via Core/Port only | Y (cash) |
| Expense → Accounts | via CashSettlementPort only | via Core/Port only | Y |
| Cheque → Accounts | via CashSettlementPort only | via Core/Port only | Y |
| Loan → Accounts | via CashSettlementPort only | via Core/Port only | Y |
| Crypto → Accounts | via CashSettlementPort only (when integrated) | via Core/Port only | Y |
| Stocks → Accounts | via CashSettlementPort only (when integrated) | via Core/Port only | Y |
| Funds → Accounts | via CashSettlementPort only (when integrated) | via Core/Port only | Y |
| Metals → Accounts | via CashSettlementPort only (when integrated) | via Core/Port only | Y |
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

## Feature Dependency Matrix (خلاصه)

| Feature | Core | Accounts | Currency | Parties | Docs | Price |
|---------|------|----------|----------|---------|------|-------|
| Loan | ✓ | Optional | Optional | Optional | Optional | — |
| Crypto | ✓ | Optional | ✓ | — | Optional | Optional |
| Stocks | ✓ | Optional | ✓ | — | Optional | Optional |
| Funds | ✓ | Optional | ✓ | — | Optional | Optional |
| Metals | ✓ | Optional | ✓ | — | Optional | Optional |
| Expense | ✓ | Optional for standalone; integrated via adapter | ✓ | Optional | Optional | — |

**Accounts Optional** یعنی هیچ Domain feature نباید `acc_accounts` یا `acc_transactions` را برای correctness خود mandatory فرض کند. اگر Accounts فعال باشد، اتصال فقط با `CashSettlementPort` و `AccountsCashAdapter` است؛ در غیر این صورت `LocalSettlementAdapter`.

Circular dependency ممنوع. جزئیات استقلال: `Feature-Independence-Contract.md`

---

## Cash path (P0)

Writes نقدی از Loan / Crypto / Stocks / Funds / Metals به Accounts **فقط** از طریق:

```text
Feature → CashSettlementPort → AccountsCashAdapter | LocalSettlementAdapter
```

`Feature A → Feature B tables` برای Accounts همچنان **N**.  
جزئیات: `Cash-Settlement-Adapter.md`.