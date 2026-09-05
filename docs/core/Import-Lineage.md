# Import Lineage & Provenance (P0)

## sourceType عمومی (همه Featureها)

`manual` · `import` · `bank_statement` · `broker_statement` · `exchange_api` · `api` · `system` · `opening` · `correction` · `migration`

همراه با:

- `sourceReference`
- `sourceDocumentId`
- `importBatchId`
- `sourceTransactionId`

## زنجیره Import Lineage

```text
Import Batch
     ↓
Imported Record
     ↓
Financial Operation
     ↓
Journal
     ↓
Domain Event
```

Query معکوس اجباری (قرارداد):

```text
showOrigin(operationId)
→ batch, external id, document, sourceType, sourceReference
```

کاربر باید بتواند بپرسد: «این ۸۵ میلیون از کجا آمد؟»

مرجع: `Feature-API-Contract.md` · `Import-Infrastructure.md`

---

## Requirements Lock (MR-230 … MR-241) — 100% complete 2026-09-05

| # | Requirement | Status | Implementation |
|---|-------------|--------|----------------|
| MR-230 | Import batch | ✅ LOCKED | `import_raw_records.batch_id` |
| MR-231 | Source type | ✅ LOCKED | `source_type` (csv\|json\|api\|manual\|broker_export) |
| MR-232 | Source reference | ✅ LOCKED | `source_reference` (file name / URL / label) |
| MR-233 | Source document | ✅ LOCKED | `source_document_id` → Documents module |
| MR-234 | External transaction id | ✅ LOCKED | `import_dedupe_keys.provider_tx_id` + unique index |
| MR-235 | Original raw amount | ✅ LOCKED | preserved inside `payload_json` (never overwritten) |
| MR-236 | Original raw date/time | ✅ LOCKED | preserved inside `payload_json` |
| MR-237 | Normalization status | ✅ LOCKED | `normalization_status` (raw\|normalized\|mapped\|rejected) |
| MR-238 | Mapping decision | ✅ LOCKED | `mapping_decision_json` (full mapping log) |
| MR-239 | User override | ✅ LOCKED | `user_override_json` + audit trail via fin_audit_log |
| MR-240 | Reconciliation status | ✅ LOCKED | `reconciliation_status` (unreconciled\|matched\|partial\|ignored) |
| MR-241 | Never destroy source identity | ✅ LOCKED | `raw_record_hash` + payload immutable; lineage preserved on re-import |

Source identity and raw payload are append-only. Normalization never mutates the original record.
