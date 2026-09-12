---
id: DOC-AUTH-COST-POOL
title: Cost Pool Model (Global)
status: approved
version: 1.0
updated: 2026-09-12
authority: binding
---

# Chosen model: **Model A**

```text
cost pool / total_invested = transaction (cost) currency
amountInBase = derived translation for journal / reports
```

## Rules

1. `holding.total_invested` and `holding.cost_currency` must describe the **same** unit.
2. Never store a base-translated amount under a `cost_currency` label of another currency.
3. Inventory **account** currency matches the cost/transaction currency of the feature leg.
4. Journal inventory line `currency` matches that account.
5. `amountInBase = amount × exchangeRateToBase` with `exchangeRateToBase = basePerTransactionUnit`.

## Model B (not selected)

`total_invested_base` only — would require schema rename; deferred unless a future edition mandates base-only cost pools.
