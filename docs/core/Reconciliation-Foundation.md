# Reconciliation به‌عنوان Feature Foundation (P0/P1)

مغایرت‌گیری فقط «nice-to-have» نیست؛ قابلیت Foundation است.

## مثال

```text
Bank statement:     1,000,000,000
Internal ledger:      999,800,000
difference:               200,000
```

## وضعیت Match

`matched` · `unmatched` · `missing_internal` · `missing_external` · `amount_mismatch` · `date_mismatch` · `duplicate`

## مدل Import ↔ Reconcile

```text
ImportBatch
ImportRow
RawPayload
NormalizedOperation
MatchResult
ReconciliationResult
```

## قوانین

1. سیستم difference را **محاسبه و گزارش** می‌کند
2. silent auto-fix موجودی داخلی از statement **ممنوع** مگر Repair صریح + audit
3. قبل از گزارش مالی رسمی، unmatchedهای بحرانی باید acknowledged شوند
4. API: `ReconciliationAPI` در Capability layer

مرجع: `db/04-reconciliation-integrity.md` · Import-Infrastructure · Import-Lineage


---

## P0-100 — Repair is explicit

- Repair of mismatches is **permissioned**, creates audit + `repairOperationId` (or equivalent).
- Repair **never** silently rewrites ledger/journal lines; corrections use reverse + new operations when financial truth changes.
- Snapshot-only fix without audit = forbidden. Snapshot may be rebuilt from ledger after an audited repair.

## Snapshot watermark & offline rebuild (CROSS-CUTTING BATCH-4 §2–§3)

Financial snapshots carry source watermark (lastOperationId / sequence / rebuiltAt). Rebuild paths are offline-only and deterministic from local SoT + engineVersions.

## Rebuild path required (X-019)

Every projection has reconcile + rebuildFromLedger. Intentional corruption must surface as mismatch.

