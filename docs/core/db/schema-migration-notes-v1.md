# Schema migration notes v1 → v2 (BUG-035…050)

Apply on implementation branch as ordered migrations:

| Change | SQL intent |
|--------|------------|
| schemaVersion seed | INSERT db_meta schemaVersion=1 |
| durability_state domain | app validate: pending\|temp_written\|committed\|swapped\|failed |
| fin_journal_lines.line_number | INTEGER NOT NULL |
| ref_instruments.is_active | INTEGER DEFAULT 1 |
| price_history.is_manual | INTEGER DEFAULT 0 |
| chk_cheques.bounced_reason | TEXT |
| ln_loans.start_date / maturity_date | TEXT |
| import_raw_records.source_file_name | TEXT |
| acc_transaction_links related index | idx_acc_tx_links_related |
| created_by / updated_by | major tables |
| fin_reconcile_runs.reconciled_by | TEXT |

Domain (not SQLite): interest_rate required unless qarz; fee_quantity required when fee tx; avg cost derived not stored as SoT.
