# Semantic relationships (P0-SCHEMA-006)

FK coverage ≠ product relationship proof. These must appear in RELATIONSHIP-MATRIX and be tested:

| Relationship | Proof |
|--------------|-------|
| CA → instrument/holding | FK + CA fixture |
| Fee event → source operation + economic role | operation_id + lastFeeEvent / CanonicalFeeEvent |
| Import → raw + normalized operation | import_raw_records + operation_id |
| Valuation → price/FX observation | price_history + fxAsOf in context |
| Reconciliation → repair operation | fin_reconcile_runs → operation |
| Correction → original/reversed | corrects_operation_id / reverses_operation_id |
| Report snapshot → watermark | rpt_snapshots.calculation_context_hash |

Gate B residual: automate matrix ↔ FK parity; Gate H residual: API/fixture columns on inventory.
