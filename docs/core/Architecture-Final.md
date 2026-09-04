# معماری نهایی (خلاصه قفل)

**Canonical routes (P1-003):** `docs/00-Product/Pages-IA.md` only.

```text
/  /accounts  /transactions  /investments  /loans
/planning  /reports  /documents  /settings
```

**No top-level `/assets`.** Physical assets live under Planning/Investments/Documents per IA — not a 9th alternate name.

```text
UI (9 pages) + Feature Public APIs
        ↓
Feature Layer (domain features)
        ↓
Financial Core (Operation · Journal · Audit · Engines)
        ↓
Domain ledgers + projections
        ↓
SQLite/sql.js → IndexedDB
```

| | |
|--|--|
| Cash SoT | `fin_accounts` + `fin_journal_lines` |
| `acc_transactions` | operational/event view only |
| Price API | valuation only |
| Internet | optional |
| License | outside financial DB |
| Report | Ledger → calculation → report |
| Snapshot | cache only |
| Mutation path | Command → Builder → Core → Journal/Cash → projection |

## Scope authority

**Product-Map-FA.md** = sole release scope. This file mirrors Product Map; does not invent alternate phase lists.

## Engines

Canonical list: **`Calculation-Engines.md`**. `Calculation-Engines.md` is a pointer only.

## Legacy note

Any older “Module Sub-ledger → Optional Main Accounting” narrative is **LEGACY — not authority**.
