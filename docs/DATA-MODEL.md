# DATA-MODEL (sole data / field owner)

**Status:** CURRENT

## 1. Field Kind vocabulary (locked — only set)
```
RAW | DERIVED | SNAPSHOT | EXTERNAL_REPORTED | LABEL | SYSTEM_INDEX | REFERENCE | STATUS
```
No document may invent alternate kind enums.

| Kind | Meaning |
|------|---------|
| RAW | Observed/input fact |
| DERIVED | Rebuildable from RAW + engine version |
| SNAPSHOT | Cached projection |
| EXTERNAL_REPORTED | Provider data + provenance |
| LABEL | Display only |
| SYSTEM_INDEX | System id/index; never financial SoT |
| REFERENCE | FK / pointer |
| STATUS | Lifecycle enum |

## 2. No-field-loss
Every documented field needs: source · kind · owner · schema column or VIRTUAL/DERIVED/DEFERRED · nullable · unit · currency · formula · migration · export · reversal policy.

## 3. Identity (canonical)
| Id | Owner |
|----|--------|
| operationId | Financial operation envelope |
| instrumentId | ref_instruments |
| accountId | fin_accounts / acc_accounts (scoped) |
| holdingId | feature holding tables |
| partyId | parties (when present) |
| featureId | package id |

**Provider symbol is never instrument identity.**

## 4. Money / quantity
Decimal **strings** in DB and API for money, qty, rates, prices.

## 5. deletedAt
**Forbidden** on posted financial ledger rows. Soft-delete only on non-financial metadata when policy allows.

## 6. Machine artifacts (GENERATED)
- `docs/core/db/schema.sql`
- field-inventory.checklist.tsv
- schema.manifest.json

Prose authority is **this file**; SQL is structural truth for columns.

## 7. RelatedFeature enum
Single source values: accounts, income, expense, cheque, loan, investment.crypto|stocks|funds|metals, physical_assets, budget, goals, bills, tax.

## 8. Absorbed
Field-Level-SoT · Ownership-Matrix · PRICE-IDENTITY · RELATED-FEATURE-ENUM docs.

## 9. Entity catalog (from schema.sql)

| Table | Domain hint |
|-------|-------------|
| `acc_accounts` | Accounts |
| `acc_transaction_links` | Accounts |
| `acc_transactions` | Accounts |
| `bg_budgets` | Planning |
| `bg_envelopes` | Planning |
| `bg_transaction_links` | Planning |
| `br_items` | Planning |
| `br_occurrences` | Planning |
| `cat_categories` | Categories |
| `chk_cheques` | Cheque |
| `cur_currencies` | Currency |
| `cur_currency_preferences` | Currency |
| `cur_exchange_rates` | Currency |
| `dash_layouts` | Portfolio/UI |
| `dash_widget_configs` | Portfolio/UI |
| `db_meta` | Other |
| `docs_documents` | Documents |
| `docs_links` | Documents |
| `exp_recurring` | Income/Expense |
| `exp_transactions` | Income/Expense |
| `fg_contributions` | Planning |
| `fg_goals` | Planning |
| `fin_accounts` | Core accounting |
| `fin_audit_log` | Core accounting |
| `fin_journal_entries` | Core accounting |
| `fin_journal_lines` | Core accounting |
| `fin_operations` | Core accounting |
| `fin_reconcile_runs` | Core accounting |
| `import_batches` | Import |
| `import_dedupe_keys` | Import |
| `import_raw_records` | Import |
| `inc_recurring` | Income/Expense |
| `inc_transactions` | Income/Expense |
| `instrument_price_mappings` | Prices |
| `inv_crypto_cash` | Crypto |
| `inv_crypto_exchanges` | Crypto |
| `inv_crypto_holdings` | Crypto |
| `inv_crypto_transactions` | Crypto |
| `inv_crypto_wallet_addresses` | Crypto |
| `inv_crypto_wallet_networks` | Crypto |
| `inv_fif_funds` | Funds |
| `inv_fif_holdings` | Funds |
| `inv_fif_transactions` | Funds |
| `inv_metals_holdings` | Metals |
| `inv_metals_physical_deliveries` | Metals |
| `inv_metals_platforms` | Metals |
| `inv_metals_transactions` | Metals |
| `inv_stocks_iran_brokerages` | Stocks |
| `inv_stocks_iran_corporate_actions` | Stocks |
| `inv_stocks_iran_holdings` | Stocks |
| `inv_stocks_iran_instruments` | Stocks |
| `inv_stocks_iran_transactions` | Stocks |
| `ln_loan_collateral` | Loan |
| `ln_loan_fee_tiers` | Loan |
| `ln_loan_fees` | Loan |
| `ln_loans` | Loan |
| `ln_rate_history` | Loan |
| `ln_schedule_snapshots` | Loan |
| `ln_transactions` | Loan |
| `not_custom_reminders` | Security/Notify |
| `not_notifications` | Security/Notify |
| `not_settings` | Security/Notify |
| `pa_assets` | Physical |
| `pa_transactions` | Physical |
| `pa_valuations` | Physical |
| `port_settings` | Portfolio/UI |
| `port_snapshots` | Portfolio/UI |
| `price_history` | Prices |
| `price_sources` | Prices |
| `price_sync_settings` | Prices |
| `ref_instruments` | Reference |
| `ref_integrity_queue` | Reference |
| `ref_parties` | Reference |
| `rpt_net_worth_snapshots` | Reporting |
| `rpt_presets` | Reporting |
| `rpt_snapshots` | Reporting |
| `sec_access_log` | Security/Notify |
| `sec_encryption_meta` | Security/Notify |
| `sec_session_logs` | Security/Notify |
| `sec_settings` | Security/Notify |
| `stg_backup_logs` | Other |
| `stg_settings` | Other |
| `tax_categories` | Tax |
| `tax_events` | Tax |
| `tax_records` | Tax |
| `usr_settings` | Other |

Cash SoT remains `fin_journal_*`. Feature `inv_*_cash` if present is projection-only.

## 10. Holding identity patterns
| Feature | Scope keys |
|---------|------------|
| Crypto | instrumentId + venue/network |
| Stocks | instrumentId + brokerage/account |
| Funds | instrumentId + account |
| Metals | instrumentId + platform/account |

## 11. Import lineage
import_batches + import_raw_records + import_dedupe_keys. Preserve sourceReference, provider ids, unknown fields JSON.

## 12. price_history
quote_type NOT NULL; prefer source_id; null source only with is_manual; uniqueness partial indexes as in schema.
