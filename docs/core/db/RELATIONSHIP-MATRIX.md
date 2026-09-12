# Relationship Matrix (B-004 / OPEN-002 / REL-001…005)

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

---

## REL-001 — Stocks brokerage cash (OPEN residual → contract)

```text
inv_stocks_iran_transactions
  → operation_id → fin_operations
  → CashSettlementPort.settle(operation)
  → fin_journal_lines on broker fin_accounts.id
  → inv_stocks_iran_brokerages.fin_account_id (FK)

Ownership:
  Feature: stock domain qty/price legs
  Core: cash balance SoT (journal)
  brokerage.cashBalance: SNAPSHOT only
```

| Edge | Rule |
|------|------|
| brokerage.fin_account_id | → fin_accounts.id RESTRICT |
| stock tx.operation_id | → fin_operations.id RESTRICT |
| settlement_date cash move | journal lines only; no second broker ledger SoT |

**Status:** Documented contract; enforce in schema freeze + engine.

## REL-002 — Metals delivery → physical assets (OPEN residual → contract)

```text
inv_metals_physical_deliveries.operation_id → fin_operations.id
pa_assets.source_operation_id → fin_operations.id
pa_assets.source_feature = 'metals'
delivery delivered ⇒ metals holding ↓ + pa_assets row with lineage
```

| Edge | Rule |
|------|------|
| pa_assets.source_operation_id | FK fin_operations RESTRICT |
| delivery.metals_holding_id | → inv_metals_holdings |
| cancellation after economic transfer | Core reverse of delivery operation |

**Status:** FK present in schema.sql; lineage semantics must stay in Metals + PA docs.

## REL-003 — Bills occurrence → operation (OPEN residual → contract)

```text
UNIQUE (br_items.id as item_id, occurrence_key)  -- already br_occurrences
Executed pay: exactly one fin_operations.id per occurrence (operation_id)
Reversal: reverse operation; occurrence may return unpaid/scheduled per policy
```

| Edge | Rule |
|------|------|
| br_occurrences.operation_id | → fin_operations nullable until paid |
| uniqueness | (item_id, occurrence_key) |
| no double pay | second pay same occurrence → IDEMPOTENCY_CONFLICT / CONFLICT |

## REL-004 — Tax event linkage (OPEN residual → contract)

```text
Investment / income ops that create tax:
  tax_events.operation_id → fin_operations.id
  domain tx.linkedTaxEventId → tax_events.id  (or only operation_id group)

Payment of tax: separate payTax operation; does not rewrite liability provenance
```

| Edge | Rule |
|------|------|
| tax_events.operation_id | source liability op |
| linkedTaxEventId | optional on investment rows; new writes canonical |
| legacy tax fields | read-only |

## REL-005 — Budget → operation (OPEN residual → contract)

```text
bg_transaction_links.operation_id → fin_operations.id
UNIQUE (envelope_id, operation_id)
spent_snapshot DERIVED from links
Expense reverse → reverse link effect (restore envelope)
```

| Edge | Rule |
|------|------|
| link.operation_id | FK RESTRICT |
| reverse | releases consumption for that operationId |
| budget never blocks ledger | advisory only |

---

## CA / Fees / Import (summary)

| Edge | Rule |
|------|------|
| CA.instrument_id | → ref_instruments |
| CA.operation_id | → fin_operations |
| fee → CanonicalFeeEvent | one economic effect per fee |
| import_dedupe_keys.operation_id | → fin_operations when linked |

## Residual checklist

- [x] REL-001…005 **contracts written** (this file)
- [x] P0-010 **operation_id nullability rule documented** (draft vs posted)
- [ ] Runtime engines enforce all edges
- [ ] Drift test schema ↔ matrix = 0
- [ ] Field inventory complete for related tables

## Income / Expense (2026-09-05)

| From | To | FK / rule | ON DELETE |
|------|-----|-----------|-----------|
| inc_transactions.operation_id | fin_operations.id | FK | RESTRICT |
| inc_transactions.account_id | acc_accounts.id | FK | RESTRICT |
| inc_transactions.category_id | cat_categories.id | FK | SET NULL |
| inc_transactions.account_transaction_id | acc_transactions.id | FK | SET NULL |
| inc_transactions.reversed_income_id | inc_transactions.id | FK | RESTRICT |
| inc_recurring.account_id | acc_accounts.id | FK | RESTRICT |
| exp_transactions.* | (symmetric to Income) | | |
| ln_loan_fee_tiers.loan_id | ln_loans.id | FK | RESTRICT |

**Ownership:** Domain rows for UX/metadata/recurring; Journal + fin_operations for accounting truth. Standalone feature use allowed (operation_id nullable only if pure draft; posted requires it).

**Cash:** never stored in inc/exp tables; always via CashSettlementPort → journal lines.

## Tax Events vs Tax Records (P0-012)

| From | To | FK / rule | ON DELETE | Cardinality | Owner |
|------|-----|-----------|-----------|-------------|-------|
| tax_events.operation_id | fin_operations.id | FK | RESTRICT | N:1 | Core |
| tax_events.linked_tax_event_id | tax_events.id | FK | SET NULL | 1:1 | Tax |
| tax_events.id | tax_records.linked_tax_event_id | FK | SET NULL | 1:1 (optional) | Tax |

**Ownership:**
- `tax_events`: **ledger SoT** for individual tax events (capital gain, income, withholding, adjustment)
- `tax_records`: **reporting container** for grouped tax events (filing, submission, payment tracking)

**Relationship:**
- Each tax_event can optionally link to a tax_record via `linked_tax_event_id`
- One tax_record can aggregate multiple tax_events (via summary_json)
- Payment of tax (payTax operation) updates tax_records.status → 'paid'
- Reversal/correction: tax_events.status → 'void' or 'amended'; tax_records.status → 'amended'

**Flow:**
```
Investment sale → tax_event (capital_gain) → [optional] tax_record (for filing)
Tax payment → payTax operation → tax_records.status = 'paid'

---

## Completeness note 2026-09-05

Core, instruments, accounts, loan, cheque, income/expense, metals delivery edges documented.  
Remaining edges (CA full graph, fee funding, import batch → operation) tracked under OPEN-002; schema FKs present for all created tables.  
Status: **residual edges documented 2026-09-07**.

## P0-010 — operation_id nullability (draft vs posted)

| Table | operation_id NULL allowed? | Condition |
|-------|---------------------------|-----------|
| acc_transactions | **yes** | draft only (if cash event not yet linked to operation) |
| chk_cheques | **yes** | draft only (cheque not yet issued) |
| tax_events | **yes** | draft only OR is_manual_adjustment=1 |
| inc_transactions | **yes** | draft only |
| exp_transactions | **yes** | draft only |
| ln_loans | **yes** | draft only |
| br_occurrences | **yes** | unpaid/draft only |
| fg_contributions | **yes** | voluntary contribution (not tied to operation) |
| inv_crypto_transactions | **no** | posted path only |
| inv_stocks_iran_transactions | **no** | posted path only |
| inv_fif_transactions | **no** | posted path only |
| inv_metals_transactions | **no** | posted path only |
| ln_transactions | **no** | posted path only |
| pa_transactions | **no** | posted path only |
| pa_valuations | **no** | posted path only |
| inv_metals_physical_deliveries | **no** | posted path only |
| inv_stocks_iran_corporate_actions | **no** | posted path only |
| bg_transaction_links | **no** | always tied to operation |
| import_dedupe_keys | **yes** | optional link to operation |
| ln_schedule_snapshots | **yes** | optional for snapshot-only entries |

**Rule:** Every financial mutation that affects accounting MUST eventually have operation_id → fin_operations when posted. Draft records may temporarily lack operation_id only if explicitly allowed per domain contract.


## Corporate Actions (OPEN-002 residual)

| From | To | FK / rule | ON DELETE | Cardinality | Owner |
|------|-----|-----------|-----------|-------------|-------|
| inv_stocks_iran_corporate_actions.instrument_id | ref_instruments.id | FK | RESTRICT | N:1 | Stocks |
| inv_stocks_iran_corporate_actions.operation_id | fin_operations.id | FK NOT NULL | RESTRICT | N:1 | Core |
| inv_stocks_iran_instruments.instrument_id | ref_instruments.id | FK UNIQUE + CHECK id=instrument_id | RESTRICT | 1:1 | Stocks |

## Fee funding

| From | To | FK / rule | ON DELETE | Cardinality | Owner |
|------|-----|-----------|-----------|-------------|-------|
| inv_crypto_transactions.fee_instrument_id | ref_instruments.id | FK nullable | RESTRICT | N:1 | Crypto |
| ln_loan_fees.loan_id | ln_loans.id | FK | RESTRICT | N:1 | Loan |
| ln_loan_fee_tiers.loan_id | ln_loans.id | FK | RESTRICT | N:1 | Loan |
| inv_metals_transactions (fee_amount) | — | amount on tx; journal via operation_id | — | — | Metals |

## Import lineage

| From | To | FK / rule | ON DELETE | Cardinality | Owner |
|------|-----|-----------|-----------|-------------|-------|
| import_raw_records.source_document_id | docs_documents.id | soft/ref | SET NULL | N:1 | Import |
| import_dedupe_keys → import batch | import_raw_records | provider+external_ref UNIQUE | — | N:1 | Import |
| domain txs.operation_id | fin_operations.id | FK | RESTRICT | N:1 | Core |

## Metals

| From | To | FK / rule | ON DELETE | Cardinality | Owner |
|------|-----|-----------|-----------|-------------|-------|
| inv_metals_holdings.instrument_id | ref_instruments.id | FK | RESTRICT | N:1 | Metals |
| inv_metals_transactions.holding_id | inv_metals_holdings.id | FK | RESTRICT | N:1 | Metals |
| inv_metals_transactions.operation_id | fin_operations.id | FK | RESTRICT | N:1 | Core |
| inv_metals_physical_deliveries.metals_holding_id | inv_metals_holdings.id | FK | RESTRICT | N:1 | Metals |
| inv_metals_physical_deliveries.pa_asset_id | pa_assets.id | FK | SET NULL | N:1 | PA |

## Budget

| From | To | FK / rule | ON DELETE | Cardinality | Owner |
|------|-----|-----------|-----------|-------------|-------|
| bg_envelopes.budget_id | bg_budgets.id | FK | RESTRICT | N:1 | Budget |
| bg_transaction_links.envelope_id | bg_envelopes.id | FK | RESTRICT | N:1 | Budget |
| bg_transaction_links.operation_id | fin_operations.id | FK | RESTRICT | N:1 | Core |

## Correction / reverse

| From | To | FK / rule | ON DELETE | Cardinality | Owner |
|------|-----|-----------|-----------|-------------|-------|
| fin_operations.reverses_operation_id | fin_operations.id | FK | RESTRICT | N:1 | Core |
| fin_operations.corrects_operation_id | fin_operations.id | FK | RESTRICT | N:1 | Core |

**Status 2026-09-07:** residual edges closed in matrix; schema FKs already present.
