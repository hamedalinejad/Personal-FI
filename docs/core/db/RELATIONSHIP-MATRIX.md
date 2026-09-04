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
- [ ] Runtime engines enforce all edges
- [ ] Drift test schema ↔ matrix = 0
- [ ] Field inventory complete for related tables
