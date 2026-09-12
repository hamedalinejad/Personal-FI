# Report / Tax / Data / Doc Governance Lock

## REPORT-001

```
Reports → Core journal/query APIs → Feature query APIs → Valuation API
```

Forbidden: Reports → feature snapshot cashBalance.

## REPORT-002

Canonical prefix: **`rpt_`**  
(`rpt_presets`, `rpt_net_worth_snapshots`, `rpt_snapshots`)  
`rep_*` prose is obsolete.

## REPORT-003 — Historical as-of order

```
1 ledger cutoff
2 corporate actions cutoff
3 cost basis rebuild
4 settlement cutoff
5 price selection
6 FX selection
7 valuation
8 report
```

No report invents a different order.

## TAX-001

```
investment transaction → optional tax_events row → tax_records if obligation/filing
```

`feeTax` on trade ≠ tax liability.

## TAX-002

Store on tax_records / tax periods:

```
period_key (tax year label)
calendar_system (jalali|gregorian)
period_start
period_end
```

Do not infer bounds from bare year alone.

## DATA-001

docs_documents: `relative_path` / `blob_id` / `storage_kind` / `checksum` / `size_bytes`  
`storage_path` = **DEPRECATED** alias, not business identity.

## DATA-002

Canonical batch table: **`import_batches`** (not fin_import_batches).  
Fields: provider, type, reference, schema version, document, status, counts, hash, timestamps.

## DATA-003

Imported/reported financial facts should carry:

```
source_type, source_reference, import_batch_id?, source_document_id?
```

plus provider namespace + external id where needed.

## PRES-001

CI: schema.sql ↔ field inventory ↔ Data Dictionary ↔ feature matrices.  
Fail on owner/kind/migration gap.

## PRES-002

```
result_json = replay snapshot only (not accounting SoT)
result_schema_version
result_hash
engine_versions on operation
```

## DOC-001

```
schema content locked = yes
schema freeze evidence = no  (until drift + Gate H green in release CI)
SPEC_LOCKED ≠ freeze proven
```

## DOC-002

Scaffold/domain contract work may proceed in parallel.  
**Production integration / RELEASE-PROVEN remains gated** (Loan vertical first).

## DOC-003

```
DOCUMENTATION-COVERAGE-COMPLETE
CANONICAL-RECONCILIATION-IN-PROGRESS → CLOSED when audit locks merged
```

Coverage ≠ contradiction-free until locks exist.
