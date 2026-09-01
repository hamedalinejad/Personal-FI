# Field Write Contract (P0) — یک حقیقت اجرایی

مفهومی کافی نیست؛ هر فیلد مالی باید **غیرقابل تفسیر** باشد.

## پنج حالت

| Kind | معنی | مثال |
|------|------|------|
| **RAW** | حقیقت ثبت‌شده کاربر/import | amount, quantity, price, feeAmount |
| **DERIVED** | محاسبه از RAW + engine | realizedPL از trades |
| **SNAPSHOT** | cache مشتق | currentBalance, averageBuyPrice, portfolioValue |
| **EXTERNAL_REPORTED** | عدد بیرونی | broker reported profit |
| **SYSTEM_METADATA** | فنی | createdAt, schemaVersion, importBatchId |

## قرارداد per-field (در Data Dictionary / schema notes)

```text
kind: RAW | DERIVED | SNAPSHOT | EXTERNAL_REPORTED | SYSTEM_METADATA
writable: true | false          // آیا API/Domain مستقیم می‌نویسد؟
rebuildable: true | false
userEditable: true | false      // فرم کاربر
sourceTable: ...
calculationEngine: ... | null
```

### نمونه‌های ممنوع برای writable مستقیم

| فیلد | kind | writable | مسیر درست |
|------|------|----------|-----------|
| currentBalance | SNAPSHOT | **false** | acc_transactions → rebuild |
| balanceAfterTransaction | SNAPSHOT | false | از ledger |
| remainingBalance | SNAPSHOT | false | ln_transactions → rebuild |
| averageBuyPrice | SNAPSHOT/DERIVED | false | CostBasisEngine |
| totalInvested | DERIVED | false | از acquisitions |
| portfolioValue | SNAPSHOT | false | ValuationEngine |

## ممنوع در API

```text
updateLoanRemainingBalance()
updateCurrentBalance()
updateHoldingAverageCost()
setPortfolioValue()
```

فقط:

```text
recordFinancialOperation / runAtomicFinancialOperation
→ Domain ledger + Journal + Cash (via Port)
→ projection / rebuild snapshots
```

مرجع: `Field-Level-SoT.md` · `Raw-vs-Derived-Data.md` · `Source-of-Truth-Matrix.md`

---

## Snapshot metadata

هر projection/snapshot:

`projectionVersion` · `sourceLastOperationId` · `sourceHash` · `rebuiltAt`

Estimated vs Actual هرگز قاطی نشوند: predictedProfit · reportedProfit · calculatedProfit · realized · unrealized.

---
## P0-004 — Prose must not call snapshot «موجودی جاری SoT»

در Feature docs، عباراتی مثل «موجودی فعلی حساب = فیلد currentBalance» **غلط**اند مگر بگویند derived/rebuild.
SoT = ledger events + journal؛ snapshot = projection.
