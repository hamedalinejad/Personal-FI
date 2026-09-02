# Feature Package Architecture (P0)

هر Feature فقط folder نیست؛ **بسته با قرارداد ثابت**:

```text
feature/
  manifest
  domain
  application
  api
  db
  projections
  reports
  ui
  fixtures
  tests
```

## manifest اعلام می‌کند

```text
requiredCapabilities:
  - core.financialOperation
  - core.money
  - core.calendar

optionalCapabilities:
  - accounts
  - documents
  - notifications

providedCapabilities:
  - loan.ledger
  - loan.schedule
  - loan.reports

publicApi:
  - loans.commands.*
  - loans.queries.*
```

این پایه **License تک‌ماژولی** (فقط Loan) است.

## سه سطح Standalone

| Level | نام | معنی |
|-------|-----|------|
| **1** | Fully standalone | فقط آن Feature + Core؛ UI و گزارش همان دامنه کامل کار می‌کند |
| **2** | Optional integration | مثلاً Loan + Accounts از طریق SettlementPort |
| **3** | Full integration | + Accounting UI + Documents + Reports سراسری |

```text
Standalone UI ≠ بدون Sub-ledger / Journal
```

مرجع: `Feature-Independence-Contract.md` · `Cash-Settlement-Adapter.md`

## No circular feature dependencies (CROSS-CUTTING BATCH-5 §7–§8)

Feature packages must not circularly depend. Cross-feature **writes** only via Financial Operation adapters / CashSettlementPort / public commands — never direct foreign feature repository access.

