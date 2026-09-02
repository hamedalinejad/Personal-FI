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


---

**ماتریس کامل مالکیت فیلد (اجباری):** `Field-Level-Data-Ownership-Matrix.md`

---

قرارداد اجرایی نوشتن فیلدها: `Field-Write-Contract.md` (writable/rebuildable؛ ممنوع mutate snapshot).

## Snapshot vs SoT (X-004)

Ledger/journal (and immutable domain events) are SoT. balance/holding/cashBalance fields are projections; reconcile detects drift; rebuild from SoT.

## P1 field matrix (20.1)

Every Feature completes RAW/DERIVED/SNAPSHOT/EXTERNAL_REPORTED/LABEL + Owner + Editable + SoT + Rebuild + Migration per field. See `P1-GLOBAL-CONTRACTS.md`. No field dropped only for being “old”.

