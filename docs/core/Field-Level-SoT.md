# Field-Level Source of Truth

Entity-level کافی نیست. هر فیلد مهم:

| attribute | |
|-----------|--|
| entity.field | |
| sourceType | RAW / DERIVED / SNAPSHOT / EXTERNAL_REPORTED |
| owner | feature/engine |
| editable? | |
| calculatedBy | engine name if derived |
| canBeDeleted? | |
| replacementField | if migrated |

## نمونه‌ها

| Field | Kind | Notes |
|-------|------|-------|
| `inv_crypto_transactions.quantity` | **RAW** | SoT |
| `inv_crypto_transactions.feeAmount` | **RAW** | preserved |
| `inv_crypto_transactions.feeAsset` | **RAW** | |
| `inv_crypto_holdings.quantity` | **DERIVED** | from txs |
| `inv_crypto_holdings.avgCost` / averageBuyPrice | **DERIVED** | CostBasisEngine |
| holding.currentPrice | **DERIVED** | from price_history |
| `currentBalance` | **SNAPSHOT** | cache of ledger |
| fund `externalReportedProfit` / statement profit | **EXTERNAL_REPORTED** | نه = calculatedProfit سیستم |
| `calculatedProfit` / realizedPL engine | **DERIVED** | قوانین داخلی |

```text
EXTERNAL_REPORTED ≠ DERIVED system profit
```

Provider ممکن است روش/کارمزد/تاریخ متفاوت داشته باشد — هرگز silent overwrite روی calculated.
