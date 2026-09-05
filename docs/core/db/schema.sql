-- Personal-FI canonical schema skeleton (docs-first)
-- Authority: SCHEMA-FREEZE-REQUIREMENTS.md + 01-schema-tables.md + P0-FINAL identity/cash locks
-- Status: B-001 IN PROGRESS — core tables present; Feature columns expand until OPEN-001 CLOSED
-- Money: TEXT decimal strings. IDs: TEXT UUID.
-- PK policy: UUID only; never (symbol, network) as PK.

PRAGMA foreign_keys = ON;

-- ─── Infrastructure ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS db_meta (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- ─── Core chart + operations + journal (cash/accounting SoT) ─
CREATE TABLE IF NOT EXISTS fin_accounts (
  id           TEXT PRIMARY KEY,
  code         TEXT,
  name         TEXT NOT NULL,
  account_kind TEXT NOT NULL,
  currency     TEXT NOT NULL,
  parent_id    TEXT REFERENCES fin_accounts(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  is_archived  INTEGER NOT NULL DEFAULT 0 CHECK (is_archived IN (0, 1)),
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS fin_operations (
  id                TEXT PRIMARY KEY, -- operationId
  command_hash      TEXT,
  operation_type    TEXT NOT NULL,
  status            TEXT NOT NULL CHECK (status IN ('draft', 'posted', 'reversed')),
  durability_state  TEXT,
  business_date     TEXT NOT NULL, -- DATE-only
  event_at          TEXT,
  settlement_date   TEXT,
  base_currency     TEXT NOT NULL,
  engine_versions   TEXT, -- JSON
  attribution_algorithm_version TEXT,
  reverses_operation_id TEXT REFERENCES fin_operations(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  source            TEXT, -- ui|api|import|migration|system
  created_at        TEXT NOT NULL,
  posted_at         TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_fin_operations_command_hash
  ON fin_operations(command_hash) WHERE command_hash IS NOT NULL;

CREATE TABLE IF NOT EXISTS fin_journal_entries (
  id            TEXT PRIMARY KEY,
  operation_id  TEXT NOT NULL REFERENCES fin_operations(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  business_date TEXT NOT NULL,
  memo          TEXT,
  created_at    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS fin_journal_lines (
  id              TEXT PRIMARY KEY,
  entry_id        TEXT NOT NULL REFERENCES fin_journal_entries(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  account_id      TEXT NOT NULL REFERENCES fin_accounts(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  side            TEXT NOT NULL CHECK (side IN ('debit', 'credit')),
  amount          TEXT NOT NULL, -- decimal string in line currency / book
  currency        TEXT NOT NULL,
  amount_in_base  TEXT,
  exchange_rate_to_base TEXT,
  conversion_path TEXT, -- JSON when hops > 1
  memo            TEXT
);

CREATE TABLE IF NOT EXISTS fin_audit_log (
  id            TEXT PRIMARY KEY,
  actor         TEXT,
  source        TEXT,
  reason        TEXT,
  operation_id  TEXT REFERENCES fin_operations(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  entity_type   TEXT,
  entity_id     TEXT,
  action        TEXT NOT NULL,
  at            TEXT NOT NULL,
  payload_json  TEXT
);

CREATE TABLE IF NOT EXISTS fin_reconcile_runs (
  id           TEXT PRIMARY KEY,
  scope        TEXT NOT NULL,
  as_of        TEXT,
  status       TEXT NOT NULL,
  result_json  TEXT,
  created_at   TEXT NOT NULL
);

-- ─── Instrument registry (BUG-D03 / B-001 identity) ──────────
CREATE TABLE IF NOT EXISTS ref_instruments (
  id                   TEXT PRIMARY KEY,
  asset_class          TEXT NOT NULL, -- crypto|stock|fund|metal|…
  symbol               TEXT NOT NULL, -- LABEL only
  name                 TEXT,
  network_identifier   TEXT,          -- TRC20/ERC20/… nullable
  contract_address     TEXT,
  isin                 TEXT,
  cost_currency_default TEXT,
  meta_json            TEXT,
  created_at           TEXT NOT NULL,
  updated_at           TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_ref_instr_chain_contract
  ON ref_instruments(network_identifier, contract_address)
  WHERE contract_address IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_ref_instr_chain_native_symbol
  ON ref_instruments(network_identifier, symbol)
  WHERE contract_address IS NULL AND network_identifier IS NOT NULL AND asset_class = 'crypto';

CREATE TABLE IF NOT EXISTS ref_parties (
  id         TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  party_kind TEXT,
  created_at TEXT NOT NULL
);

-- ─── Accounts banking (event log — not cash SoT) ─────────────
CREATE TABLE IF NOT EXISTS acc_accounts (
  id              TEXT PRIMARY KEY,
  fin_account_id  TEXT REFERENCES fin_accounts(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  name            TEXT NOT NULL,
  account_kind    TEXT NOT NULL,
  currency        TEXT NOT NULL,
  iban            TEXT,
  bank_name       TEXT,
  branch_name     TEXT,
  is_archived     INTEGER NOT NULL DEFAULT 0 CHECK (is_archived IN (0, 1)),
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_acc_iban_active
  ON acc_accounts(iban) WHERE iban IS NOT NULL AND is_archived = 0;

CREATE TABLE IF NOT EXISTS acc_transactions (
  id             TEXT PRIMARY KEY,
  account_id     TEXT NOT NULL REFERENCES acc_accounts(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  operation_id   TEXT REFERENCES fin_operations(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  business_date  TEXT NOT NULL,
  amount         TEXT NOT NULL,
  currency       TEXT NOT NULL,
  direction      TEXT,
  memo           TEXT,
  created_at     TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS acc_transaction_links (
  id               TEXT PRIMARY KEY,
  transaction_id   TEXT NOT NULL REFERENCES acc_transactions(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  related_feature  TEXT NOT NULL,
  related_id       TEXT NOT NULL,
  UNIQUE (transaction_id, related_feature, related_id)
);

-- ─── Prices ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS price_sources (
  id   TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 100
);

CREATE TABLE IF NOT EXISTS price_history (
  id              TEXT PRIMARY KEY,
  instrument_id   TEXT NOT NULL REFERENCES ref_instruments(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  source_id       TEXT REFERENCES price_sources(id) ON DELETE SET NULL ON UPDATE CASCADE,
  market_date     TEXT NOT NULL,
  price           TEXT NOT NULL,
  currency        TEXT NOT NULL,
  quote_basis     TEXT,
  quote_type      TEXT, -- last|close|nav|manual|…
  fetched_at      TEXT,
  UNIQUE (instrument_id, market_date, source_id, quote_type)
);

-- ─── Crypto holdings (projection of ledger events) ───────────
CREATE TABLE IF NOT EXISTS inv_crypto_holdings (
  id              TEXT PRIMARY KEY,
  exchange_id     TEXT NOT NULL,
  network_id      TEXT, -- null = venue_offchain
  instrument_id   TEXT NOT NULL REFERENCES ref_instruments(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  quantity        TEXT NOT NULL, -- net
  total_invested  TEXT NOT NULL,
  cost_currency   TEXT NOT NULL,
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_crypto_holding_venue
  ON inv_crypto_holdings(exchange_id, instrument_id) WHERE network_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_crypto_holding_wallet
  ON inv_crypto_holdings(exchange_id, network_id, instrument_id) WHERE network_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS inv_crypto_transactions (
  id              TEXT PRIMARY KEY,
  operation_id    TEXT NOT NULL REFERENCES fin_operations(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  holding_id      TEXT REFERENCES inv_crypto_holdings(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  instrument_id   TEXT NOT NULL REFERENCES ref_instruments(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  tx_type         TEXT NOT NULL,
  business_date   TEXT NOT NULL,
  gross_quantity  TEXT,
  fee_quantity    TEXT,
  net_quantity    TEXT NOT NULL,
  fee_currency    TEXT,
  fee_instrument_id TEXT REFERENCES ref_instruments(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  economic_kind   TEXT,
  created_at      TEXT NOT NULL
);

-- ─── Loans ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ln_loans (
  id                 TEXT PRIMARY KEY,
  party_id           TEXT REFERENCES ref_parties(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  role               TEXT NOT NULL, -- borrowed|lent
  calculation_method TEXT NOT NULL, -- declining_balance|flat_rate|qarz_al_hasaneh|bullet|…
  principal          TEXT NOT NULL,
  currency           TEXT NOT NULL,
  interest_rate      TEXT,
  status             TEXT NOT NULL,
  created_at         TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ln_schedule_snapshots (
  id              TEXT PRIMARY KEY,
  loan_id         TEXT NOT NULL REFERENCES ln_loans(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  version         INTEGER NOT NULL,
  snapshot_json   TEXT NOT NULL,
  effective_from  TEXT NOT NULL,
  operation_id    TEXT REFERENCES fin_operations(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  UNIQUE (loan_id, version)
);

CREATE TABLE IF NOT EXISTS ln_loan_fees (
  id          TEXT PRIMARY KEY,
  loan_id     TEXT NOT NULL REFERENCES ln_loans(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  fee_kind    TEXT NOT NULL,
  amount_due  TEXT NOT NULL,
  amount_paid TEXT NOT NULL DEFAULT '0',
  amount_waived TEXT NOT NULL DEFAULT '0',
  currency    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ln_transactions (
  id            TEXT PRIMARY KEY,
  loan_id       TEXT NOT NULL REFERENCES ln_loans(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  operation_id  TEXT NOT NULL REFERENCES fin_operations(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  tx_type       TEXT NOT NULL,
  business_date TEXT NOT NULL,
  amount        TEXT NOT NULL,
  currency      TEXT NOT NULL,
  created_at    TEXT NOT NULL
);

-- ─── Cheques ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chk_cheques (
  id              TEXT PRIMARY KEY,
  account_id      TEXT REFERENCES acc_accounts(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  direction       TEXT NOT NULL, -- payable|receivable
  amount          TEXT NOT NULL,
  currency        TEXT NOT NULL,
  due_date        TEXT,
  sayadi_id       TEXT,
  cheque_number   TEXT,
  status          TEXT NOT NULL,
  cleared_date    TEXT,
  effective_cash_date TEXT,
  bounced_date    TEXT,
  operation_id    TEXT REFERENCES fin_operations(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  created_at      TEXT NOT NULL
);

-- ─── Import preservation envelope (P0-FINAL-039) ─────────────
CREATE TABLE IF NOT EXISTS import_raw_records (
  id                   TEXT PRIMARY KEY,
  source_provider      TEXT NOT NULL,
  source_schema_version TEXT,
  raw_record_hash      TEXT NOT NULL,
  unknown_fields_json  TEXT,
  payload_json         TEXT NOT NULL,
  imported_at          TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS import_dedupe_keys (
  id              TEXT PRIMARY KEY,
  source_provider TEXT NOT NULL,
  provider_tx_id  TEXT,
  tx_hash         TEXT,
  log_index       TEXT,
  external_ref    TEXT,
  command_hash    TEXT,
  operation_id    TEXT REFERENCES fin_operations(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_import_provider_tx
  ON import_dedupe_keys(source_provider, provider_tx_id)
  WHERE provider_tx_id IS NOT NULL;


-- ═══════════════════════════════════════════════════════════
-- BUG-001 expansion + BUG-035…050 column/table gaps (2026-09-04)
-- Domain still validates decimal; SQLite stores TEXT
-- ═══════════════════════════════════════════════════════════

INSERT OR IGNORE INTO db_meta(key, value) VALUES ('schemaVersion', '1');
INSERT OR IGNORE INTO db_meta(key, value) VALUES ('schemaId', 'personal-fi-v1');

-- Extend notes: fin_operations.durability_state domain values:
-- pending | temp_written | committed | swapped | failed

CREATE TABLE IF NOT EXISTS inv_crypto_exchanges (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  venue_kind TEXT, -- exchange|wallet
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS inv_crypto_wallet_networks (
  id TEXT PRIMARY KEY,
  exchange_id TEXT NOT NULL REFERENCES inv_crypto_exchanges(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  network TEXT NOT NULL,
  chain_id TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS inv_crypto_wallet_addresses (
  id TEXT PRIMARY KEY,
  network_id TEXT NOT NULL REFERENCES inv_crypto_wallet_networks(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  address TEXT NOT NULL,
  is_primary INTEGER NOT NULL DEFAULT 0 CHECK (is_primary IN (0, 1)),
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS inv_crypto_cash (
  id TEXT PRIMARY KEY,
  exchange_id TEXT NOT NULL REFERENCES inv_crypto_exchanges(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  currency TEXT NOT NULL,
  fin_account_id TEXT REFERENCES fin_accounts(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  balance TEXT NOT NULL DEFAULT '0', -- SNAPSHOT only
  updated_at TEXT NOT NULL,
  UNIQUE (exchange_id, currency)
);

CREATE TABLE IF NOT EXISTS inv_stocks_iran_brokerages (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  fin_account_id TEXT REFERENCES fin_accounts(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS inv_stocks_iran_instruments (
  id TEXT PRIMARY KEY, -- may equal ref_instruments.id or map 1:1
  instrument_id TEXT NOT NULL UNIQUE REFERENCES ref_instruments(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  isin TEXT,
  lot_size TEXT,
  price_tick TEXT,
  firm_code TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS inv_stocks_iran_holdings (
  id TEXT PRIMARY KEY,
  brokerage_id TEXT NOT NULL REFERENCES inv_stocks_iran_brokerages(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  instrument_id TEXT NOT NULL REFERENCES ref_instruments(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  quantity TEXT NOT NULL,
  total_invested TEXT NOT NULL,
  cost_currency TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (brokerage_id, instrument_id)
);

CREATE TABLE IF NOT EXISTS inv_stocks_iran_transactions (
  id TEXT PRIMARY KEY,
  operation_id TEXT NOT NULL REFERENCES fin_operations(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  holding_id TEXT REFERENCES inv_stocks_iran_holdings(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  instrument_id TEXT NOT NULL REFERENCES ref_instruments(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  brokerage_id TEXT REFERENCES inv_stocks_iran_brokerages(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  tx_type TEXT NOT NULL,
  trade_date TEXT NOT NULL,
  settlement_date TEXT,
  quantity TEXT NOT NULL,
  price TEXT,
  fee_amount TEXT,
  currency TEXT NOT NULL,
  account_id TEXT REFERENCES acc_accounts(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS inv_stocks_iran_corporate_actions (
  id TEXT PRIMARY KEY,
  instrument_id TEXT NOT NULL REFERENCES ref_instruments(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  operation_id TEXT REFERENCES fin_operations(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  ca_type TEXT NOT NULL,
  ex_date TEXT,
  record_date TEXT,
  payment_date TEXT,
  ratio TEXT,
  payload_json TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS inv_fif_funds (
  id TEXT PRIMARY KEY,
  instrument_id TEXT NOT NULL UNIQUE REFERENCES ref_instruments(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  fund_kind TEXT, -- mutual|etf|…
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS inv_fif_holdings (
  id TEXT PRIMARY KEY,
  instrument_id TEXT NOT NULL REFERENCES ref_instruments(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  quantity TEXT NOT NULL,
  total_invested TEXT NOT NULL,
  cost_currency TEXT NOT NULL,
  account_id TEXT REFERENCES acc_accounts(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS inv_fif_transactions (
  id TEXT PRIMARY KEY,
  operation_id TEXT NOT NULL REFERENCES fin_operations(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  instrument_id TEXT NOT NULL REFERENCES ref_instruments(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  tx_type TEXT NOT NULL, -- subscribe|redeem|distribution|reinvest|…
  trade_date TEXT NOT NULL,
  settlement_date TEXT,
  quantity TEXT,
  nav TEXT,
  transaction_price TEXT,
  amount TEXT,
  currency TEXT NOT NULL,
  account_id TEXT REFERENCES acc_accounts(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS inv_metals_platforms (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  fin_account_id TEXT REFERENCES fin_accounts(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS inv_metals_holdings (
  id TEXT PRIMARY KEY,
  platform_id TEXT REFERENCES inv_metals_platforms(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  instrument_id TEXT NOT NULL REFERENCES ref_instruments(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  quantity_mg TEXT NOT NULL, -- SoT mass
  total_invested TEXT NOT NULL,
  cost_currency TEXT NOT NULL,
  purity_code TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS inv_metals_transactions (
  id TEXT PRIMARY KEY,
  operation_id TEXT NOT NULL REFERENCES fin_operations(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  holding_id TEXT REFERENCES inv_metals_holdings(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  instrument_id TEXT NOT NULL REFERENCES ref_instruments(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  tx_type TEXT NOT NULL,
  quantity_mg TEXT NOT NULL,
  amount TEXT,
  currency TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS inv_metals_physical_deliveries (
  id TEXT PRIMARY KEY,
  operation_id TEXT NOT NULL REFERENCES fin_operations(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  metals_holding_id TEXT REFERENCES inv_metals_holdings(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  pa_asset_id TEXT,
  status TEXT NOT NULL, -- requested|processing|delivered|cancelled
  quantity_mg TEXT NOT NULL,
  fee_amount TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS pa_assets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  asset_kind TEXT,
  currency TEXT NOT NULL,
  source_feature TEXT,
  source_operation_id TEXT REFERENCES fin_operations(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS pa_transactions (
  id TEXT PRIMARY KEY,
  asset_id TEXT NOT NULL REFERENCES pa_assets(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  operation_id TEXT NOT NULL REFERENCES fin_operations(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  tx_type TEXT NOT NULL,
  amount TEXT NOT NULL,
  currency TEXT NOT NULL,
  business_date TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS pa_valuations (
  id TEXT PRIMARY KEY,
  asset_id TEXT NOT NULL REFERENCES pa_assets(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  as_of TEXT NOT NULL,
  value TEXT NOT NULL,
  currency TEXT NOT NULL,
  source TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS bg_budgets (
  id TEXT PRIMARY KEY,
  period_key TEXT NOT NULL,
  currency TEXT NOT NULL,
  income_source_mode TEXT, -- calculated|manual
  total_income TEXT,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE (period_key)
);

CREATE TABLE IF NOT EXISTS bg_envelopes (
  id TEXT PRIMARY KEY,
  budget_id TEXT NOT NULL REFERENCES bg_budgets(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  category_id TEXT,
  assigned TEXT NOT NULL,
  spent_snapshot TEXT, -- DERIVED
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS bg_transaction_links (
  id TEXT PRIMARY KEY,
  envelope_id TEXT NOT NULL REFERENCES bg_envelopes(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  operation_id TEXT NOT NULL REFERENCES fin_operations(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  amount TEXT NOT NULL,
  UNIQUE (envelope_id, operation_id)
);

CREATE TABLE IF NOT EXISTS fg_goals (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  currency TEXT NOT NULL,
  target_amount TEXT NOT NULL,
  current_amount_snapshot TEXT, -- DERIVED
  target_date TEXT,
  funding_mode TEXT, -- earmark|segregated_cash
  status TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS fg_contributions (
  id TEXT PRIMARY KEY,
  goal_id TEXT NOT NULL REFERENCES fg_goals(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  operation_id TEXT REFERENCES fin_operations(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  amount TEXT NOT NULL,
  currency TEXT NOT NULL,
  business_date TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS br_items (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  amount TEXT NOT NULL,
  currency TEXT NOT NULL,
  recurrence_rule TEXT,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS br_occurrences (
  id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL REFERENCES br_items(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  occurrence_key TEXT NOT NULL,
  due_date TEXT NOT NULL,
  scheduled_amount TEXT NOT NULL,
  paid_amount TEXT,
  status TEXT NOT NULL,
  operation_id TEXT REFERENCES fin_operations(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  UNIQUE (item_id, occurrence_key)
);

CREATE TABLE IF NOT EXISTS tax_events (
  id TEXT PRIMARY KEY,
  operation_id TEXT REFERENCES fin_operations(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  tax_kind TEXT NOT NULL,
  amount TEXT NOT NULL,
  currency TEXT NOT NULL,
  period_key TEXT,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS cur_currencies (
  code TEXT PRIMARY KEY,
  name TEXT,
  minor_units INTEGER NOT NULL DEFAULT 2,
  is_active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS cur_exchange_rates (
  id TEXT PRIMARY KEY,
  from_currency TEXT NOT NULL,
  to_currency TEXT NOT NULL,
  rate TEXT NOT NULL,
  as_of TEXT NOT NULL,
  source TEXT,
  source_priority INTEGER NOT NULL DEFAULT 100,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS cur_currency_preferences (
  id TEXT PRIMARY KEY,
  base_currency TEXT NOT NULL,
  is_toman_display INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS cat_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  kind TEXT, -- income|expense|…
  parent_id TEXT REFERENCES cat_categories(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  is_active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS not_notifications (
  id TEXT PRIMARY KEY,
  dedupe_key TEXT NOT NULL UNIQUE,
  category TEXT,
  title TEXT NOT NULL,
  body TEXT,
  is_read INTEGER NOT NULL DEFAULT 0,
  dismissed_at TEXT,
  snooze_until TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS rpt_snapshots (
  id TEXT PRIMARY KEY,
  report_kind TEXT NOT NULL,
  as_of TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  ledger_watermark TEXT,
  price_as_of TEXT,
  fx_as_of TEXT,
  engine_versions TEXT,
  calculation_context_hash TEXT,
  rebuilt_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS usr_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ln_loan_collateral (
  id TEXT PRIMARY KEY,
  loan_id TEXT NOT NULL REFERENCES ln_loans(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  description TEXT,
  value TEXT,
  currency TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ln_rate_history (
  id TEXT PRIMARY KEY,
  loan_id TEXT NOT NULL REFERENCES ln_loans(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  effective_from TEXT NOT NULL,
  annual_rate TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_acc_tx_links_related ON acc_transaction_links(related_id);
CREATE INDEX IF NOT EXISTS idx_fin_journal_lines_entry ON fin_journal_lines(entry_id);
CREATE INDEX IF NOT EXISTS idx_price_history_instr_date ON price_history(instrument_id, market_date);

-- Note: additive columns for existing tables (SQLite migration style on implementation):
-- fin_journal_lines.line_number INTEGER
-- fin_operations durability CHECK domain
-- ref_instruments.is_active
-- price_history.is_manual / quote_type already partial
-- chk_cheques.bounced_reason
-- ln_loans.start_date, maturity_date
-- import_raw_records.source_file_name
-- created_by/updated_by on major tables via migration v2



CREATE TABLE IF NOT EXISTS sec_encryption_meta (
  id TEXT PRIMARY KEY,
  scheme TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sec_access_log (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  created_at TEXT NOT NULL,
  detail TEXT
);


-- ═══════════════════════════════════════════════════════════
-- BUG-036..050 schema apply (2026-09-05)
-- SQLite cannot easily ALTER CHECK on existing tables; additive tables + notes for migrate
-- ═══════════════════════════════════════════════════════════

-- BUG-040
-- import_raw_records.source_file_name (if table exists from expansion)

-- Ensure price_history has is_manual (recreate-safe: new table shape documented)
-- Existing price_history may lack columns — migration runner adds in implementation DB.
-- Documented expected columns:
-- is_manual INTEGER NOT NULL DEFAULT 0
-- quote_type TEXT

-- fin_reconcile_runs.reconciled_by
