# Relationship Matrix (B-004 / OPEN-002)

**Authority with:** `schema.sql` + `05-constraints-polymorphic.md`  
Expand until Schema Freeze CLOSED.

## Core

| From | To | FK / rule | ON DELETE |
|------|-----|-----------|-----------|
| fin_journal_entries.operation_id | fin_operations.id | FK | RESTRICT |
| fin_journal_lines.entry_id | fin_journal_entries.id | FK | RESTRICT |
| fin_journal_lines.account_id | fin_accounts.id | FK | RESTRICT |
| fin_operations.reverses_operation_id | fin_operations.id | FK | RESTRICT |
| fin_audit_log.operation_id | fin_operations.id | FK | RESTRICT |
| fin_accounts.parent_id | fin_accounts.id | FK | RESTRICT |

## Instruments / prices

| From | To | FK / rule | ON DELETE |
|------|-----|-----------|-----------|
| price_history.instrument_id | ref_instruments.id | FK | RESTRICT |
| price_history.source_id | price_sources.id | FK | SET NULL |
| inv_crypto_holdings.instrument_id | ref_instruments.id | FK | RESTRICT |
| inv_crypto_transactions.instrument_id | ref_instruments.id | FK | RESTRICT |
| inv_crypto_transactions.holding_id | inv_crypto_holdings.id | FK | RESTRICT |
| inv_crypto_transactions.operation_id | fin_operations.id | FK | RESTRICT |
| inv_crypto_transactions.fee_instrument_id | ref_instruments.id | FK | RESTRICT |

## Accounts

| From | To | FK / rule | ON DELETE |
|------|-----|-----------|-----------|
| acc_accounts.fin_account_id | fin_accounts.id | FK | RESTRICT |
| acc_transactions.account_id | acc_accounts.id | FK | RESTRICT |
| acc_transactions.operation_id | fin_operations.id | FK | RESTRICT |
| acc_transaction_links.transaction_id | acc_transactions.id | FK | RESTRICT |

## Loan

| From | To | FK / rule | ON DELETE |
|------|-----|-----------|-----------|
| ln_loans.party_id | ref_parties.id | FK | RESTRICT |
| ln_schedule_snapshots.loan_id | ln_loans.id | FK | RESTRICT |
| ln_schedule_snapshots.operation_id | fin_operations.id | FK | RESTRICT |
| ln_loan_fees.loan_id | ln_loans.id | FK | RESTRICT |
| ln_transactions.loan_id | ln_loans.id | FK | RESTRICT |
| ln_transactions.operation_id | fin_operations.id | FK | RESTRICT |

## Cheque

| From | To | FK / rule | ON DELETE |
|------|-----|-----------|-----------|
| chk_cheques.account_id | acc_accounts.id | FK | RESTRICT |
| chk_cheques.operation_id | fin_operations.id | FK | RESTRICT |

## CA / Stocks / Funds (logical — expand columns at freeze)

| Edge | Rule |
|------|------|
| inv_stocks_iran_corporate_actions.instrument_id | → ref_instruments.id RESTRICT |
| CA event → fin_operations | operation_id RESTRICT |
| CA fee legs | CanonicalFeeEvent via operation; not orphan fee rows |
| Fund NAV observation | → ref_instruments + price_history quote_type=nav |
| Fund tx → operation | operation_id RESTRICT |

## Import

| From | To | Rule |
|------|-----|------|
| import_dedupe_keys.operation_id | fin_operations.id | RESTRICT when linked |
| import_raw_records | no calc dependency | preservation only |
| Provider tx id hierarchy | provider_tx_id → tx_hash+logIndex → external_ref → command_hash | P0-FINAL-040 |

## Fee edges (anti double-count)

| Edge | Rule |
|------|------|
| Domain fee fields | → one CanonicalFeeEvent / operation fee leg |
| fee_instrument_id XOR fee_currency | P0-FINAL-018 |
| Journal fee expense | same operationId as domain fee |

## Residual gaps (OPEN-002)

- [ ] Full stocks brokerage cash fin_account link table
- [ ] Metals delivery → pa_assets source_operation_id FK
- [ ] Bills occurrence → operation unique
- [ ] Tax_events.linked from investment tx
- [ ] Budget links operationId



## P1-DOC-006 — Expanded edges (freeze fill)

### Corporate actions
| From | To | Rule |
|------|-----|------|
| inv_stocks_iran_corporate_actions.instrument_id | ref_instruments.id | RESTRICT |
| inv_stocks_iran_corporate_actions.operation_id | fin_operations.id | RESTRICT |
| CA entitlement/exercise legs | same operation_id group | no orphan rights qty |
| cash-in-lieu leg | fin_journal_lines via operation | cash SoT journal |

### Fees
| From | To | Rule |
|------|-----|------|
| domain tx fee_* | CanonicalFeeEvent / operation fee metadata | 1:1 economic |
| fee_instrument_id | ref_instruments.id | RESTRICT when set |
| fee journal lines | fin_journal_lines.operation via entry | same operationId |

### Import
| From | To | Rule |
|------|-----|------|
| import_raw_records | (none for calc) | preservation only |
| import_dedupe_keys.operation_id | fin_operations.id | RESTRICT when linked |
| import_dedupe_keys hierarchy | provider_tx_id → tx_hash+logIndex → external_ref → command_hash | P0-FINAL-040 |

### Metals → Physical
| From | To | Rule |
|------|-----|------|
| pa_assets.source_operation_id | fin_operations.id | RESTRICT |
| delivery reduces metals holding | inv metals tx + operation | lineage required |

### Budget / Bills
| From | To | Rule |
|------|-----|------|
| bg_transaction_links.operation_id | fin_operations.id | reverse restores envelope |
| br_occurrences unique | (br_item_id, occurrence_key) | BR-001 |
