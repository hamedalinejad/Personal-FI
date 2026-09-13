> **SUPERSEDED as independent authority** — use docs/PRODUCT.md, ARCHITECTURE.md, FINANCIAL-CORE.md, DATA-MODEL.md, API.md, REPORTING.md, OFFLINE-RELEASE.md, DEVELOPMENT.md, modules/*.

# P0 Schema Vocabulary Lock (FINAL)

**Authority rank:** same as schema.sql for persistence field names.  
**Date:** 2026-09-12  
**Closes:** P0-001 … P0-010

---

## P0-001 — fin_accounts / journal (SQL is canonical)

### fin_accounts columns (only these names)

`id, code, name, account_kind, currency, parent_id, is_archived, status, role, reconciliation_status, external_ref_json, created_at, updated_at`

**Obsolete prose (do not implement):** `type`, `systemRole`, `linkedEntityType`, `linkedEntityId`, `isActive` as column names.  
Use `account_kind`, `role`, `is_archived`/`status` instead. Entity links → `external_ref_json` or dedicated FK tables.

### fin_journal_entries

`id, operation_id, business_date, memo, post_state, reference_number, fiscal_period_id, created_at` (as in schema.sql)

**No** `is_voided` column. Void/reverse = new operation + relationship (`reverses_operation_id`).

### fin_journal_lines

`id, entry_id, account_id, side, amount, currency, amount_in_base, exchange_rate_to_base, conversion_path, line_number, line_kind, memo, reference, source_type, source_reference`

- **No** `operation_id` on the line. Derive: `entry_id → fin_journal_entries.operation_id`.
- **No** `accountClass` on the line; class comes from `fin_accounts.account_kind`.

---

## P0-002 — acc_transactions = projection / event log only

Canonical columns: `id, account_id, operation_id, business_date, amount, currency, direction ('in'|'out'), memo, created_at`

Semantic type lives on **`fin_operations.operation_type`**.  
Fees/FX/relatedFeature → operation + journal + `acc_transaction_links`, not a second cash ledger.

**Option A locked.** Do not expand acc_transactions to a full parallel transaction contract.

---

## P0-003 — related_feature enum (one owner)

Canonical CHECK (schema + `acc_transaction_links.related_feature`):

```
accounts | income | expense | cheque | loan
investment.crypto | investment.stocks | investment.funds | investment.metals
physical_assets | budget | goals | bills | tax
```

**Obsolete:** `crypto_exchange`, `stocks_iran`, `fif`, `metals` as relatedFeature values.  
Display labels are UI-only; domainFeatureId uses the enum above.

---

## P0-004 / 005 / 006 — No ghost cash tables

**Intentionally omitted from SQL (never implement as cash SoT):**

- `inv_crypto_exchange_transactions`
- `inv_stocks_iran_brokerage_transactions`
- `inv_metals_platform_transactions`

Cash path:

```
Feature command → CashSettlementPort → Local|Accounts adapter → fin_journal_* → optional acc_transactions projection
```

Domain tables hold **asset** facts only (holdings, trades, quantities).

---

## P0-007 — inv_crypto_cash

`balance` = **SNAPSHOT only**. Rebuild from journal.  
Standalone still creates **hidden `fin_accounts`** + journal lines.  
`fin_account_id` null only for non-cash rows — **not** a license shortcut to skip Core cash.

---

## P0-008 — price_history identity

Every priceable instrument → `ref_instruments.id`.  
`price_history.instrument_id` always FK to that id.  
No composite string keys (`metalType_purity`, fundId alias, asset key) as PK identity.  
`asset_class` lives on `ref_instruments`; category on price is DERIVED if present.

---

## P0-009 — amount_in_base on posted lines

```
if currency == operation.baseCurrency:
  amount_in_base = amount
  exchange_rate_to_base = "1"
else:
  exchange_rate_to_base REQUIRED
  amount_in_base REQUIRED
```

Enforce in domain **before** COMMIT. Σ debit(amount_in_base) = Σ credit(amount_in_base).

---

## P0-010 — operation_id on domain financial rows

```
Draft  → operation_id may be null only if contract says draft
Posted → operation_id NOT NULL (domain + journal path)
```

One statement in Canonical-Financial-Operation; every domain writer must obey.

---

## Acceptance

- [x] One vocabulary lock document (this file)
- [x] Accounting-Core aligned to SQL names
- [x] Feature cash docs overridden to Port → journal
- [x] related_feature single enum
- [x] Ghost cash tables remain OMISSION
- [x] Price → instrument_id only
- [x] amount_in_base rule documented + tested
