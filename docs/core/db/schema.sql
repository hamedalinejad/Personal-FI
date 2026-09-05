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
  account_kind TEXT NOT NULL CHECK (account_kind IN ('asset','liability','equity','income','expense')),
  currency     TEXT NOT NULL,
  parent_id    TEXT REFERENCES fin_accounts(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  is_archived  INTEGER NOT NULL DEFAULT 0 CHECK (is_archived IN (0, 1)),
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','closed'))
);

CREATE TABLE IF NOT EXISTS fin_operations (
  id                TEXT PRIMARY KEY, -- operationId
  command_hash      TEXT,
  operation_type    TEXT NOT NULL,
  status            TEXT NOT NULL CHECK (status IN ('draft', 'posted', 'reversed')),
  durability_state  TEXT CHECK (durability_state IS NULL OR durability_state IN ('pending','temp_written','committed','swapped','failed')),
  business_date     TEXT NOT NULL, -- DATE-only
  event_at          TEXT,
  settlement_date   TEXT,
  base_currency     TEXT NOT NULL,
  engine_versions   TEXT, -- JSON
  attribution_algorithm_version TEXT,
  reverses_operation_id TEXT REFERENCES fin_operations(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  source            TEXT CHECK (source IS NULL OR source IN ('ui','api','import','migration','system')),
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
  line_number INTEGER NOT NULL DEFAULT 1,
  line_kind       TEXT CHECK (line_kind IS NULL OR line_kind IN ('principal','fee','tax','fx','adjustment','other')),
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
  id             TEXT PRIMARY KEY,
  scope          TEXT NOT NULL,
  as_of          TEXT,
  status         TEXT NOT NULL CHECK (status IN ('running','completed','failed','cancelled')),
  result_json    TEXT,
  reconciled_by  TEXT,
  created_at     TEXT NOT NULL
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
  updated_at           TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1))
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
  account_kind TEXT NOT NULL CHECK (account_kind IN ('bank','cash','investment','loan','credit','wallet','other')),
  currency        TEXT NOT NULL,
  iban            TEXT,
  bank_name       TEXT,
  branch_name     TEXT,
  is_archived     INTEGER NOT NULL DEFAULT 0 CHECK (is_archived IN (0, 1)),
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','closed'))
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
  id       TEXT PRIMARY KEY,
  name     TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 100, -- lower = higher priority (MR-216)
  kind     TEXT, -- manual|csv_import|online_adapter|local_cache
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT
);

CREATE TABLE IF NOT EXISTS price_history (
  id              TEXT PRIMARY KEY,
  instrument_id   TEXT NOT NULL REFERENCES ref_instruments(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  source_id       TEXT REFERENCES price_sources(id) ON DELETE SET NULL ON UPDATE CASCADE,
  market_date     TEXT NOT NULL, -- as-of date (never "latest" without as-of)
  price           TEXT NOT NULL,
  currency        TEXT NOT NULL,
  quote_basis     TEXT, -- per_unit|per_coin|per_mg|nav|... (MR-211)
  quote_type TEXT CHECK (quote_type IS NULL OR quote_type IN ('last','close','nav','manual','imported','bid','ask')), -- last|close|nav|manual|imported
  is_manual       INTEGER NOT NULL DEFAULT 0 CHECK (is_manual IN (0, 1)), -- MR-221 / MR-224
  is_stale        INTEGER NOT NULL DEFAULT 0 CHECK (is_stale IN (0, 1)), -- MR-218
  is_degraded     INTEGER NOT NULL DEFAULT 0 CHECK (is_degraded IN (0, 1)), -- MR-220 DEGRADED mode
  provenance_json TEXT, -- instrument, market, price type, currency, timestamp, stale, override (MR-228)
  fetched_at      TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (instrument_id, market_date, source_id, quote_type)
);

-- ─── Crypto holdings (projection of ledger events) ───────────
CREATE TABLE IF NOT EXISTS inv_crypto_holdings (
  id              TEXT PRIMARY KEY,
  exchange_id     TEXT NOT NULL,
  network_id      TEXT, -- null = venue_offchain
  instrument_id   TEXT NOT NULL REFERENCES ref_instruments(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  quantity        TEXT NOT NULL, -- net
  total_invested TEXT NOT NULL, -- DERIVED carrying; rebuild on tx/reversal by cost-basis engine
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
  tx_type TEXT NOT NULL CHECK (tx_type IN ('buy','sell','transfer_in','transfer_out','deposit','withdraw','fee','adjustment','swap')),
  business_date   TEXT NOT NULL,
  gross_quantity  TEXT,
  fee_quantity    TEXT,
  net_quantity    TEXT NOT NULL,
  fee_currency    TEXT,
  fee_instrument_id TEXT REFERENCES ref_instruments(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  economic_kind TEXT CHECK (economic_kind IS NULL OR economic_kind IN ('acquisition','disposal','transfer','fee','income','adjustment','swap')),
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
  status TEXT CHECK (status IN ('draft','active','paid_off','defaulted','restructured','cancelled')) NOT NULL,
  created_at         TEXT NOT NULL
,
  start_date TEXT,
  maturity_date TEXT
);

CREATE TABLE IF NOT EXISTS ln_schedule_snapshots (
  id              TEXT PRIMARY KEY,
  loan_id         TEXT NOT NULL REFERENCES ln_loans(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  version         INTEGER NOT NULL,
  -- snapshot_json schema (BUG-D18): owned by Loan-Schedule-Engine
  -- Required keys: installments[], dayCount, rate, residual, currency, generatedAt, engineVersion
  -- Each installment: { seq, dueDate, principal, interest, fee, total, status }
  -- Domain validates JSON shape before persist; SQLite stores TEXT only.
  snapshot_json   TEXT NOT NULL,
  effective_from  TEXT NOT NULL,
  operation_id    TEXT REFERENCES fin_operations(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  UNIQUE (loan_id, version)
);

CREATE TABLE IF NOT EXISTS ln_loan_fees (
  id            TEXT PRIMARY KEY,
  loan_id       TEXT NOT NULL REFERENCES ln_loans(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  fee_kind      TEXT NOT NULL,
  amount_due    TEXT NOT NULL, -- decimal string
  amount_paid   TEXT NOT NULL DEFAULT '0',
  amount_waived TEXT NOT NULL DEFAULT '0',
  currency      TEXT NOT NULL
  -- DOMAIN INVARIANT (BUG-D17): decimal.js enforce amount_paid + amount_waived <= amount_due
  -- SQLite cannot reliably CHECK decimal TEXT arithmetic; engine validates before persist.
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
  status TEXT NOT NULL CHECK (status IN ('draft','issued','deposited','cleared','bounced','cancelled','returned')) NOT NULL,
  cleared_date    TEXT,
  effective_cash_date TEXT,
  bounced_date    TEXT,
  operation_id    TEXT REFERENCES fin_operations(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  created_at      TEXT NOT NULL,
  bounced_reason TEXT);

-- ─── Import preservation envelope (P0-FINAL-039) ─────────────
CREATE TABLE IF NOT EXISTS import_raw_records (
  id                    TEXT PRIMARY KEY,
  batch_id              TEXT NOT NULL, -- import batch (MR-230)
  source_provider       TEXT NOT NULL,
  source_schema_version TEXT,
  source_type           TEXT, -- csv|json|api|manual|broker_export (MR-231)
  source_reference      TEXT, -- file name / URL / batch label (MR-232)
  source_document_id    TEXT, -- link to docs_documents (MR-233)
  raw_record_hash       TEXT NOT NULL, -- never destroy source identity (MR-241)
  unknown_fields_json   TEXT,
  payload_json          TEXT NOT NULL, -- original raw amount/date/time preserved (MR-235/236)
  normalization_status  TEXT NOT NULL DEFAULT 'raw', -- raw|normalized|mapped|rejected (MR-237)
  mapping_decision_json TEXT, -- mapping log (MR-238)
  user_override_json    TEXT, -- user override + reason (MR-239)
  reconciliation_status TEXT NOT NULL DEFAULT 'unreconciled', -- unreconciled|matched|partial|ignored (MR-240)
  imported_at           TEXT NOT NULL,
  created_at            TEXT NOT NULL DEFAULT (datetime('now')),
  source_file_name TEXT);

CREATE INDEX IF NOT EXISTS idx_import_raw_batch ON import_raw_records(batch_id);
CREATE INDEX IF NOT EXISTS idx_import_raw_hash ON import_raw_records(raw_record_hash);


CREATE TABLE IF NOT EXISTS import_dedupe_keys (
  id              TEXT PRIMARY KEY,
  source_provider TEXT NOT NULL,
  provider_tx_id  TEXT, -- external transaction id (MR-234)
  tx_hash         TEXT,
  log_index       TEXT,
  external_ref    TEXT,
  command_hash    TEXT,
  operation_id    TEXT REFERENCES fin_operations(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  raw_record_id   TEXT REFERENCES import_raw_records(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
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
  venue_kind TEXT CHECK (venue_kind IN ('cex','dex','wallet','other')), -- exchange|wallet
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
  -- fin_account_id NULLABLE: standalone crypto edition may omit Core bank account link;
  -- cash SoT remains journal when linked; when null, balance is local projection only (rebuild from domain txs).
  fin_account_id TEXT REFERENCES fin_accounts(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  balance TEXT NOT NULL, -- SNAPSHOT only; NO default — must be written by rebuild from journal
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
  id TEXT PRIMARY KEY, -- MUST equal instrument_id (same UUID as ref_instruments.id)
  instrument_id TEXT NOT NULL UNIQUE REFERENCES ref_instruments(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  isin TEXT,
  lot_size TEXT,
  price_tick TEXT,
  firm_code TEXT,
  created_at TEXT NOT NULL,
  CHECK (id = instrument_id)
);

CREATE TABLE IF NOT EXISTS inv_stocks_iran_holdings (
  id TEXT PRIMARY KEY,
  brokerage_id TEXT NOT NULL REFERENCES inv_stocks_iran_brokerages(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  instrument_id TEXT NOT NULL REFERENCES ref_instruments(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  quantity TEXT NOT NULL,
  total_invested TEXT NOT NULL, -- DERIVED carrying; rebuild on tx/reversal by cost-basis engine
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
  tx_type TEXT NOT NULL CHECK (tx_type IN ('buy','sell','dividend','corporate_action','fee','adjustment')),
  trade_date TEXT NOT NULL, -- synonym of market_date (invariant §11); business/market event date for the trade,
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
  operation_id TEXT NOT NULL REFERENCES fin_operations(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  ca_type TEXT NOT NULL CHECK (ca_type IN ('split','reverse_split','dividend','rights','bonus','merger','other')),
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
  total_invested TEXT NOT NULL, -- DERIVED carrying; rebuild on tx/reversal by cost-basis engine
  cost_currency TEXT NOT NULL,
  account_id TEXT REFERENCES acc_accounts(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS inv_fif_transactions (
  id TEXT PRIMARY KEY,
  operation_id TEXT NOT NULL REFERENCES fin_operations(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  instrument_id TEXT NOT NULL REFERENCES ref_instruments(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  tx_type TEXT NOT NULL CHECK (tx_type IN ('subscribe','redeem','distribution','reinvest','fee','adjustment'))
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
  quantity_mg TEXT NOT NULL, -- SoT mass (gross weight, mg canonical)
  purity_code TEXT, -- e.g. 24k, 18k, 750, 999, emami, bahar
  purity_ratio TEXT, -- decimal 0-1 for fine weight derivation: quantity_mg * purity_ratio
  total_invested TEXT NOT NULL, -- DERIVED carrying; rebuild on tx/reversal by cost-basis engine
  cost_currency TEXT NOT NULL,
  average_cost_per_mg TEXT, -- DERIVED: cost-basis engine rebuild only, -- derived / maintained by cost-basis engine
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS inv_metals_transactions (
  id TEXT PRIMARY KEY,
  operation_id TEXT NOT NULL REFERENCES fin_operations(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  holding_id TEXT REFERENCES inv_metals_holdings(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  instrument_id TEXT NOT NULL REFERENCES ref_instruments(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  tx_type TEXT NOT NULL CHECK (tx_type IN ('buy','sell','deposit_cash','withdraw_cash','physical_delivery','adjustment')), -- buy|sell|deposit_cash|withdraw_cash|physical_delivery|adjustment
  business_date TEXT NOT NULL,
  quantity_mg TEXT NOT NULL, -- gross weight moved; for partial sell <= holding.quantity_mg
  metal_price_per_mg TEXT, -- pure metal unit price (ex-premium)
  premium_amount TEXT, -- fabrication / maker / premium separate from metal price (MR-174)
  fee_amount TEXT, -- brokerage/dealer fee
  fee_currency TEXT,
  amount TEXT, -- total consideration (metal + premium ± fees as signed by policy)
  currency TEXT NOT NULL,
  exchange_rate_to_base TEXT,
  is_partial INTEGER NOT NULL DEFAULT 0 CHECK (is_partial IN (0, 1)), -- MR-179 partial sales
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS inv_metals_physical_deliveries (
  id TEXT PRIMARY KEY,
  operation_id TEXT NOT NULL REFERENCES fin_operations(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  metals_holding_id TEXT REFERENCES inv_metals_holdings(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  pa_asset_id TEXT REFERENCES pa_assets(id) ON DELETE SET NULL ON UPDATE CASCADE,
  status TEXT NOT NULL, -- requested|processing|delivered|cancelled
  quantity_mg TEXT NOT NULL,
  fee_amount TEXT, -- delivery/logistics fee (separate from trade fee)
  fee_currency TEXT,
  delivery_address TEXT,
  invoice_ref TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS pa_assets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  asset_kind TEXT CHECK (asset_kind IS NULL OR asset_kind IN ('gold','coin','vehicle','real_estate','electronics','other')),
  currency TEXT NOT NULL,
  purchase_date TEXT,
  acquisition_cost TEXT,
  location TEXT,
  serial_number TEXT,
  model TEXT,
  owner TEXT,
  depreciation_policy TEXT,
  quantity TEXT,
  average_buy_price TEXT, -- DERIVED: rebuild on every tx change by cost-basis engine,
  source_feature TEXT CHECK (source_feature IS NULL OR source_feature IN ('metals','manual','import','delivery')),
  source_operation_id TEXT REFERENCES fin_operations(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  is_disposed INTEGER NOT NULL DEFAULT 0 CHECK (is_disposed IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS pa_transactions (
  id TEXT PRIMARY KEY,
  asset_id TEXT NOT NULL REFERENCES pa_assets(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  operation_id TEXT NOT NULL REFERENCES fin_operations(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  tx_type TEXT NOT NULL CHECK (tx_type IN ('purchase','sale','valuation_adj','maintenance','disposal')), -- purchase|sale|valuation_adj|maintenance|disposal
  business_date TEXT NOT NULL,
  amount TEXT NOT NULL, -- consideration
  currency TEXT NOT NULL,
  quantity TEXT, -- portion sold (partial disposal)
  realized_gain_loss TEXT, -- calculated on disposal/sale (MR-195)
  exchange_rate_to_base TEXT,
  fee_amount TEXT,
  note TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS pa_valuations (
  id TEXT PRIMARY KEY,
  asset_id TEXT NOT NULL REFERENCES pa_assets(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  as_of TEXT NOT NULL, -- valuation date (MR-188)
  value TEXT NOT NULL, -- estimated market value (MR-187)
  currency TEXT NOT NULL,
  exchange_rate_to_base TEXT,
  source TEXT, -- manual|price_feed|appraisal
  note TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS bg_budgets (
  id TEXT PRIMARY KEY,
  period_key TEXT NOT NULL,
  currency TEXT NOT NULL,
  income_source_mode TEXT CHECK (income_source_mode IS NULL OR income_source_mode IN ('calculated','manual')), -- calculated|manual
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
  spent_snapshot TEXT, -- DERIVED: budget engine only; never user-direct UPDATE
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
  current_amount_snapshot TEXT, -- DERIVED: goals engine only; rebuild from contributions; never user-direct UPDATE
  target_date TEXT,
  funding_mode TEXT CHECK (funding_mode IS NULL OR funding_mode IN ('manual','auto','roundup','earmark','segregated_cash'))
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
  status TEXT NOT NULL CHECK (status IN ('pending','due','paid','skipped','cancelled')) NOT NULL,
  operation_id TEXT REFERENCES fin_operations(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  UNIQUE (item_id, occurrence_key)
);

CREATE TABLE IF NOT EXISTS tax_events (
  id TEXT PRIMARY KEY,
  operation_id TEXT REFERENCES fin_operations(id) ON DELETE RESTRICT ON UPDATE CASCADE, -- source investment/realized op (MR-202)
  tax_kind TEXT NOT NULL, -- capital_gain|income|withholding|adjustment|...
  amount TEXT NOT NULL, -- tax amount (decimal string)
  currency TEXT NOT NULL,
  period_key TEXT NOT NULL, -- tax year / period e.g. 1404 or 2025-IR (MR-197)
  jurisdiction TEXT, -- denormalized from category or override (MR-198)
  rule_version TEXT, -- tax rule version applied (MR-199)
  basis_amount TEXT, -- cost basis used for this tax event (MR-201)
  holding_period_days INTEGER, -- for short vs long-term (MR-204)
  is_deductible INTEGER NOT NULL DEFAULT 0 CHECK (is_deductible IN (0, 1)), -- fee/expense deductible flag (MR-203)
  is_manual_adjustment INTEGER NOT NULL DEFAULT 0 CHECK (is_manual_adjustment IN (0, 1)),
  adjustment_reason TEXT, -- required when manual (MR-207)
  document_id TEXT, -- link to docs_documents evidence (MR-206)
  status TEXT NOT NULL CHECK (status IN ('draft','posted','amended','void')), -- draft|posted|amended|void
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (operation_id IS NOT NULL OR is_manual_adjustment = 1)
);

CREATE TABLE IF NOT EXISTS cur_currencies (
  code TEXT PRIMARY KEY,
  name TEXT,
  minor_units INTEGER NOT NULL DEFAULT 2,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1))
);

CREATE TABLE IF NOT EXISTS cur_exchange_rates (
  id TEXT PRIMARY KEY,
  from_currency TEXT NOT NULL REFERENCES cur_currencies(code) ON DELETE RESTRICT ON UPDATE CASCADE,
  to_currency TEXT NOT NULL REFERENCES cur_currencies(code) ON DELETE RESTRICT ON UPDATE CASCADE,
  rate TEXT NOT NULL, -- always store direct; inverse = 1/rate deterministic (MR-213)
  as_of TEXT NOT NULL, -- observation date/time (MR-215)
  source TEXT,
  source_priority INTEGER NOT NULL DEFAULT 100,
  conversion_path TEXT, -- JSON multi-hop when used (MR-214)
  is_manual INTEGER NOT NULL DEFAULT 0 CHECK (is_manual IN (0, 1)),
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS cur_currency_preferences (
  id TEXT PRIMARY KEY,
  base_currency TEXT NOT NULL REFERENCES cur_currencies(code) ON DELETE RESTRICT ON UPDATE CASCADE,
  is_toman_display INTEGER NOT NULL DEFAULT 0 CHECK (is_toman_display IN (0, 1)),
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS cat_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  kind TEXT, -- income|expense|…
  parent_id TEXT REFERENCES cat_categories(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1))
);

CREATE TABLE IF NOT EXISTS not_notifications (
  id TEXT PRIMARY KEY,
  dedupe_key TEXT NOT NULL UNIQUE,
  category TEXT,
  title TEXT NOT NULL,
  body TEXT,
  is_read INTEGER NOT NULL DEFAULT 0 CHECK (is_read IN (0, 1)),
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
  event_type TEXT NOT NULL CHECK (event_type IN ('login','logout','unlock','export','backup','settings_change','denied')),
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

-- ═══════════════════════════════════════════════════════════
-- Schema audit fix 2026-09-05 — Missing domain tables (Income/Expense/Loan tiers)
-- Modular: each feature domain table links to fin_operations for accounting SoT.
-- Cash always through Core journal; domain for specialized UX/metadata.
-- No duplicate CREATE; additive only. Namespace: not_ notifications, rpt_ reports.
-- ═══════════════════════════════════════════════════════════

-- Income domain (01-Income) — standalone usable without full accounting UI
CREATE TABLE IF NOT EXISTS inc_transactions (
  id                      TEXT PRIMARY KEY,
  operation_id            TEXT REFERENCES fin_operations(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  business_date           TEXT NOT NULL, -- DATE-only
  amount                  TEXT NOT NULL, -- decimal string
  currency                TEXT NOT NULL,
  exchange_rate_to_base   TEXT,
  account_id              TEXT REFERENCES acc_accounts(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  description             TEXT,
  category_id             TEXT REFERENCES cat_categories(id) ON DELETE SET NULL ON UPDATE CASCADE,
  has_attachment          INTEGER NOT NULL DEFAULT 0 CHECK (has_attachment IN (0, 1)),
  attachment_path         TEXT,
  recurring_id TEXT REFERENCES inc_recurring(id) ON DELETE SET NULL ON UPDATE CASCADE, -- FK added after table
  account_transaction_id  TEXT REFERENCES acc_transactions(id) ON DELETE SET NULL ON UPDATE CASCADE,
  is_voided               INTEGER NOT NULL DEFAULT 0 CHECK (is_voided IN (0, 1)),
  reversed_income_id      TEXT REFERENCES inc_transactions(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  source_type             TEXT, -- ui|import|recurring|api
  source_reference        TEXT,
  import_batch_id         TEXT,
  created_at              TEXT NOT NULL,
  updated_at              TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS inc_recurring (
  id              TEXT PRIMARY KEY,
  title           TEXT NOT NULL,
  amount          TEXT NOT NULL,
  currency        TEXT NOT NULL,
  account_id      TEXT REFERENCES acc_accounts(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  category_id     TEXT REFERENCES cat_categories(id) ON DELETE SET NULL ON UPDATE CASCADE,
  description     TEXT,
  interval_kind   TEXT NOT NULL, -- monthly|weekly|yearly|custom
  interval_value  INTEGER, -- for custom
  start_date      TEXT NOT NULL,
  end_date        TEXT,
  next_occurrence TEXT,
  is_active       INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_inc_tx_date ON inc_transactions(business_date);
CREATE INDEX IF NOT EXISTS idx_inc_tx_voided ON inc_transactions(is_voided);
CREATE INDEX IF NOT EXISTS idx_inc_recurring_next ON inc_recurring(next_occurrence) WHERE is_active = 1;

-- Expense domain (02-Expense) — symmetric to Income for modularity
CREATE TABLE IF NOT EXISTS exp_transactions (
  id                      TEXT PRIMARY KEY,
  operation_id            TEXT REFERENCES fin_operations(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  business_date           TEXT NOT NULL,
  amount                  TEXT NOT NULL,
  currency                TEXT NOT NULL,
  exchange_rate_to_base   TEXT,
  account_id              TEXT REFERENCES acc_accounts(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  description             TEXT,
  category_id             TEXT REFERENCES cat_categories(id) ON DELETE SET NULL ON UPDATE CASCADE,
  has_attachment          INTEGER NOT NULL DEFAULT 0 CHECK (has_attachment IN (0, 1)),
  attachment_path         TEXT,
  recurring_id TEXT REFERENCES exp_recurring(id) ON DELETE SET NULL ON UPDATE CASCADE,
  account_transaction_id  TEXT REFERENCES acc_transactions(id) ON DELETE SET NULL ON UPDATE CASCADE,
  is_voided               INTEGER NOT NULL DEFAULT 0 CHECK (is_voided IN (0, 1)),
  reversed_expense_id     TEXT REFERENCES exp_transactions(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  source_type             TEXT,
  source_reference        TEXT,
  import_batch_id         TEXT,
  created_at              TEXT NOT NULL,
  updated_at              TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS exp_recurring (
  id              TEXT PRIMARY KEY,
  title           TEXT NOT NULL,
  amount          TEXT NOT NULL,
  currency        TEXT NOT NULL,
  account_id      TEXT REFERENCES acc_accounts(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  category_id     TEXT REFERENCES cat_categories(id) ON DELETE SET NULL ON UPDATE CASCADE,
  description     TEXT,
  interval_kind   TEXT NOT NULL,
  interval_value  INTEGER,
  start_date      TEXT NOT NULL,
  end_date        TEXT,
  next_occurrence TEXT,
  is_active       INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_exp_tx_date ON exp_transactions(business_date);
CREATE INDEX IF NOT EXISTS idx_exp_tx_voided ON exp_transactions(is_voided);

-- Loan fee tiers (documented, missing) — ordered effective ranges for calculation
CREATE TABLE IF NOT EXISTS ln_loan_fee_tiers (
  id              TEXT PRIMARY KEY,
  loan_id         TEXT NOT NULL REFERENCES ln_loans(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  fee_kind        TEXT NOT NULL, -- origination|late|prepayment|service|...
  tier_order      INTEGER NOT NULL DEFAULT 0,
  effective_from  TEXT NOT NULL, -- DATE
  effective_to    TEXT, -- nullable = open
  rate_or_amount  TEXT NOT NULL, -- decimal string; interpretation by fee_kind
  is_percentage   INTEGER NOT NULL DEFAULT 0 CHECK (is_percentage IN (0, 1)),
  min_amount      TEXT,
  max_amount      TEXT,
  day_count       TEXT, -- actual/365|30/360|...
  calculation_base TEXT, -- principal|outstanding|installment
  created_at      TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ln_fee_tiers_loan ON ln_loan_fee_tiers(loan_id, tier_order);

-- Budget transfers: journal-linked, no separate SoT cash table
-- (bg_transfers concept resolved as operation + bg_transaction_links; no ghost table)

-- Notifications: canonical not_notifications already present; docs notif_* migrated to not_
-- Reports: canonical rpt_snapshots; docs rep_* → rpt_

-- Crypto/Stocks/Metals cash: inv_crypto_cash present as projection;
-- stocks/metals cash modeled via Core fin_accounts + CashSettlementPort (no ghost table)

-- Tax: tax_events is event ledger; configuration stays in settings or separate tax_categories if needed later
CREATE TABLE IF NOT EXISTS tax_categories (
  id           TEXT PRIMARY KEY,
  code         TEXT NOT NULL UNIQUE,
  name         TEXT NOT NULL,
  jurisdiction TEXT NOT NULL, -- IR|US|... (MR-198)
  rule_version TEXT, -- active rule set version (MR-199)
  policy_json  TEXT, -- policy-driven rules, never hard-coded rates (MR-196)
  is_active    INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL
);

-- Field no-loss: all domain tables carry operation_id, source_*, import_*, exchange_rate_to_base,
-- original amount/currency as TEXT decimal, reversal chain via reversed_*_id + fin_operations.reverses_operation_id

-- ═══════════════════════════════════════════════════════════
-- Schema freeze completion 2026-09-05 — missing domain tables
-- Cash projection tables intentionally OMITTED (Core journal SoT)
-- Naming: not_ notifications, rpt_ reports (canonical)
-- ═══════════════════════════════════════════════════════════

-- Documents (MR-192 evidence links)
CREATE TABLE IF NOT EXISTS docs_documents (
  id           TEXT PRIMARY KEY,
  title        TEXT,
  mime_type    TEXT,
  storage_path TEXT NOT NULL,
  checksum     TEXT,
  size_bytes   INTEGER,
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS docs_links (
  id          TEXT PRIMARY KEY,
  document_id TEXT NOT NULL REFERENCES docs_documents(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  entity_type TEXT NOT NULL, -- pa_asset|tax_event|loan|cheque|import_raw|...
  entity_id   TEXT NOT NULL,
  created_at  TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_docs_links_entity ON docs_links(entity_type, entity_id);

-- Notifications settings (canonical not_ prefix)
CREATE TABLE IF NOT EXISTS not_settings (
  id         TEXT PRIMARY KEY,
  key        TEXT NOT NULL UNIQUE,
  value_json TEXT,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS not_custom_reminders (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  due_at      TEXT NOT NULL,
  recurrence  TEXT,
  is_active   INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at  TEXT NOT NULL
);

-- Reports presets / net-worth history (canonical rpt_ prefix)
CREATE TABLE IF NOT EXISTS rpt_presets (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  report_kind TEXT NOT NULL,
  params_json TEXT,
  created_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS rpt_net_worth_snapshots (
  id           TEXT PRIMARY KEY,
  as_of        TEXT NOT NULL,
  total_assets TEXT NOT NULL,
  total_liabilities TEXT NOT NULL,
  net_worth    TEXT NOT NULL,
  currency     TEXT NOT NULL,
  payload_json TEXT,
  created_at   TEXT NOT NULL
);

-- Portfolio / Dashboard UI state (never financial SoT)
CREATE TABLE IF NOT EXISTS port_snapshots (
  id           TEXT PRIMARY KEY,
  as_of        TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  created_at   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS port_settings (
  id         TEXT PRIMARY KEY,
  key        TEXT NOT NULL UNIQUE,
  value_json TEXT,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS dash_layouts (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  layout_json TEXT NOT NULL,
  is_default INTEGER NOT NULL DEFAULT 0 CHECK (is_default IN (0, 1)),
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS dash_widget_configs (
  id         TEXT PRIMARY KEY,
  layout_id  TEXT REFERENCES dash_layouts(id) ON DELETE CASCADE ON UPDATE CASCADE,
  widget_kind TEXT NOT NULL,
  config_json TEXT,
  created_at TEXT NOT NULL
);

-- Tax records (config/reporting companion to tax_events ledger)
CREATE TABLE IF NOT EXISTS tax_records (
  id           TEXT PRIMARY KEY,
  period_key   TEXT NOT NULL,
  jurisdiction TEXT NOT NULL,
  summary_json TEXT,
  status       TEXT NOT NULL CHECK (status IN ('draft','filed','amended')),
  created_at   TEXT NOT NULL
);

-- Settings
CREATE TABLE IF NOT EXISTS stg_settings (
  id         TEXT PRIMARY KEY,
  key        TEXT NOT NULL UNIQUE,
  value_json TEXT,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS stg_backup_logs (
  id            TEXT PRIMARY KEY,
  backup_path   TEXT,
  checksum      TEXT,
  status        TEXT NOT NULL CHECK (status IN ('started','completed','failed','verified')),
  created_at    TEXT NOT NULL
);

-- Security
CREATE TABLE IF NOT EXISTS sec_settings (
  id         TEXT PRIMARY KEY,
  key        TEXT NOT NULL UNIQUE,
  value_json TEXT,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sec_session_logs (
  id         TEXT PRIMARY KEY,
  event_type TEXT NOT NULL CHECK (event_type IN ('start','end','lock','unlock','timeout')),
  at         TEXT NOT NULL,
  detail     TEXT
);

-- Price sync settings (opt-in online)
CREATE TABLE IF NOT EXISTS price_sync_settings (
  id         TEXT PRIMARY KEY,
  source_id  TEXT REFERENCES price_sources(id) ON DELETE SET NULL ON UPDATE CASCADE,
  enabled    INTEGER NOT NULL DEFAULT 0 CHECK (enabled IN (0, 1)),
  interval_minutes INTEGER,
  updated_at TEXT NOT NULL
);

-- Integrity queue (async checks)
CREATE TABLE IF NOT EXISTS ref_integrity_queue (
  id         TEXT PRIMARY KEY,
  check_kind TEXT NOT NULL,
  payload_json TEXT,
  status     TEXT NOT NULL CHECK (status IN ('pending','running','done','failed')),
  created_at TEXT NOT NULL,
  finished_at TEXT
);

-- INTENTIONAL OMISSIONS (no ghost cash ledgers):
-- inv_crypto_exchange_transactions / inv_stocks_iran_brokerage_transactions /
-- inv_metals_platform_transactions / bg_transfers
-- Cash moves only through Core fin_journal_lines + CashSettlementPort.
-- Domain tables remain specialized qty/price/fee; cash balance is journal SoT.


-- ═══════════════════════════════════════════════════════════
-- STANDALONE MODE (BUG-D20)
-- Feature UI independence ≠ remove Accounting Core.
-- Domain tables may have operation_id NULL only while status=draft.
-- Posted financial events ALWAYS require operation_id → fin_operations.
-- Standalone edition = UI/package may ship without other feature UIs;
-- local settlement still uses CashSettlementPort + journal when cash moves.
-- See Feature-Independence-Contract.md.
-- ═══════════════════════════════════════════════════════════
