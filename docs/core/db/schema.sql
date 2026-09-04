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
