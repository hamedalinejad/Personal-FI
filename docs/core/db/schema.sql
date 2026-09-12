-- Personal-FI canonical schema
-- Authority: SCHEMA-FREEZE-REQUIREMENTS.md + 01-schema-tables.md + identity/cash locks
-- content: advanced (tables/columns/CHECKs present)
-- freeze: FREEZE_PROVEN via field-inventory STRICT + schema load (RELEASE-PROVEN still open) (Gate B / OPEN-001 — drift scripts help; full freeze evidence pending)
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
  account_kind TEXT NOT NULL CHECK (account_kind IN ('asset','liability','equity','income','expense')), -- ACCOUNTING CLASS (not operational cashAccountKind)
  currency     TEXT NOT NULL,
  parent_id    TEXT REFERENCES fin_accounts(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  is_archived  INTEGER NOT NULL DEFAULT 0 CHECK (is_archived IN (0, 1)),
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','closed')),
  role TEXT,
  reconciliation_status TEXT CHECK (reconciliation_status IS NULL OR reconciliation_status IN ('unreconciled','matched','partial','stale')),
  external_ref_json TEXT
);
-- ACCOUNTING-001: code is ledger-facing identifier; unique when present (single-user local book scope)
CREATE UNIQUE INDEX IF NOT EXISTS uq_fin_accounts_code ON fin_accounts(code) WHERE code IS NOT NULL;


CREATE TABLE IF NOT EXISTS fin_operations (
  id                TEXT PRIMARY KEY, -- operationId
  command_hash      TEXT,
  operation_type    TEXT NOT NULL,
  status            TEXT NOT NULL CHECK (status IN ('draft', 'posted', 'voided', 'failed')),
  -- reversal is relationship via reverses_operation_id / corrects_operation_id, not a status value (P0-SCHEMA-001)
  -- LEGACY compatibility: prefer db_meta keys durability.* — do not treat as business status
  durability_state  TEXT CHECK (durability_state IS NULL OR durability_state IN ('pending','sql_committed','persisted','persist_failed')),
  -- transport-only states (temp_written/swapped) live in persistence layer, not public schema (P0-SCHEMA-002)
  business_date     TEXT NOT NULL, -- DATE-only
  event_at          TEXT,
  settlement_date   TEXT,
  base_currency     TEXT NOT NULL,
  engine_versions   TEXT, -- JSON schema: {"money":"x.y","costBasis":"x.y","fx":"x.y","loanSchedule":"x.y","rounding":"x.y"} -- JSON
  attribution_algorithm_version TEXT,
  reverses_operation_id TEXT REFERENCES fin_operations(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  -- P0-011 provenance split:
  -- source_channel = interface (ui|api|import|migration|system)
  -- source_type = business provenance (manual|bank_statement|broker_statement|exchange_api|opening|correction|…)
  -- source_reference = external id / file / batch label
  source_channel    TEXT CHECK (source_channel IS NULL OR source_channel IN ('ui','api','import','migration','system')),
  source_type       TEXT, -- business provenance; not the same as source_channel
  source_reference  TEXT,
  -- LEGACY alias column: prefer source_channel; kept for migration compatibility
  source            TEXT CHECK (source IS NULL OR source IN ('ui','api','import','migration','system')),
  created_at        TEXT NOT NULL,
  posted_at         TEXT,
  failed_at TEXT,
  voided_at TEXT,
  corrects_operation_id TEXT REFERENCES fin_operations(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  result_json TEXT, -- idempotent replay snapshot ONLY; not accounting SoT
  result_schema_version TEXT, -- PRES-002
  result_hash TEXT, -- PRES-002 sha256 of canonical result payload
  CHECK (status != 'posted' OR command_hash IS NOT NULL)
);

-- P0-004: command_hash is NOT globally unique (only compared within operationId)
CREATE INDEX IF NOT EXISTS idx_fin_operations_command_hash
  ON fin_operations(command_hash);

-- BUG-FINAL-026: post_state is CACHE of fin_operations.status; writers must not set independently.
-- Integrity: post_state must match linked operation status (enforced in domain + optional audit query).
CREATE TABLE IF NOT EXISTS fin_journal_entries (

  id            TEXT PRIMARY KEY,
  operation_id  TEXT NOT NULL REFERENCES fin_operations(id) ON DELETE RESTRICT ON UPDATE CASCADE, -- entry exists only for posted path; status is on operation
  business_date TEXT NOT NULL,
  memo          TEXT,
  created_at    TEXT NOT NULL,
  reference_number TEXT,
  fiscal_period_id TEXT,
  -- post_state: DERIVED/CACHE only (P0-014)
  -- - Mirrors fin_operations.status for read performance and UI convenience
  -- - MUST match operation.status at all times; never independently writable
  -- - On create: set post_state = 'posted' if operation.status='posted', else 'draft'
  -- - On void: set post_state = 'void' only via Core.reverseOperation
  -- - Read-only view of operation status; write-only via canonical Core paths
  post_state TEXT CHECK (post_state IS NULL OR post_state IN ('draft','posted','void'))  -- mirrors operation; entry exists for posted path
);

-- BUG-CUR-021 LOCKED: operation_id is NOT on lines; derive via entry_id → fin_journal_entries.operation_id only
CREATE TABLE IF NOT EXISTS fin_journal_lines (

  id              TEXT PRIMARY KEY,
  entry_id        TEXT NOT NULL REFERENCES fin_journal_entries(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  account_id      TEXT NOT NULL REFERENCES fin_accounts(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  side            TEXT NOT NULL CHECK (side IN ('debit', 'credit')),
  amount          TEXT NOT NULL, -- decimal string in line currency / book
  currency        TEXT NOT NULL,
  amount_in_base TEXT, -- P0-009: REQUIRED when posted; =amount if currency=base else rate+amount_in_base required
  exchange_rate_to_base TEXT,
  conversion_path TEXT, -- JSON when hops > 1
  line_number INTEGER NOT NULL DEFAULT 1,
  line_kind       TEXT CHECK (line_kind IS NULL OR line_kind IN ('principal','interest','fee','tax','fx','fx_gain','fx_loss','adjustment','other')),
  memo            TEXT,
  reference TEXT,
  -- source_type: business provenance of the journal line
  -- - 'ui': user action via UI
  -- - 'api': API request
  -- - 'import': imported from external source (via Import module)
  -- - 'migration': one-time migration data
  -- - 'system': automated system operation (reconciliation, tax calc, rebuild)
  -- - 'reconciliation': manual reconciliation adjustment
  -- sourceChannel (deprecated): use source_type instead
  source_type TEXT CHECK (source_type IS NULL OR source_type IN ('ui','api','import','migration','system','reconciliation')),
  -- sourceReference: external reference for audit trail (file name, URL, batch label)
  source_reference TEXT
);

CREATE TABLE IF NOT EXISTS fin_audit_log (
  id            TEXT PRIMARY KEY,
  actor         TEXT,
  source TEXT CHECK (source IS NULL OR source IN ('ui','api','import','migration','system','user')),
  reason        TEXT,
  operation_id  TEXT REFERENCES fin_operations(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  entity_type TEXT CHECK (entity_type IS NULL OR entity_type IN ('operation','journal_entry','journal_line','account','instrument','loan','cheque','import','settings')),
  entity_id     TEXT,
  action TEXT NOT NULL CHECK (action IN ('create','update','delete','void','reverse','rebuild','repair','import','export','login','logout','post')),
  at            TEXT NOT NULL,
  payload_json  TEXT
);

CREATE TABLE IF NOT EXISTS fin_reconcile_runs (
  id             TEXT PRIMARY KEY,
  scope          TEXT NOT NULL,
  as_of          TEXT,
  status         TEXT NOT NULL CHECK (status IN ('running','completed','failed','cancelled')),
  result_json    TEXT, -- schema: {matched:n, unmatched:n, differences:[], asOf, baseCurrency}
  reconciled_by  TEXT,
  created_at     TEXT NOT NULL,
  base_currency TEXT,
  valuation_context_json TEXT
);

-- ─── Instrument registry (BUG-D03 / B-001 identity) ──────────
CREATE TABLE IF NOT EXISTS ref_instruments (
  id                   TEXT PRIMARY KEY,
  asset_class          TEXT NOT NULL CHECK (asset_class IN ('crypto','stock','fund','metal','currency','other')), -- crypto|stock|fund|metal|…
  symbol               TEXT NOT NULL, -- LABEL only; NOT unique (same ticker can exist across networks/venues)
  name                 TEXT, -- optional display name
  network_identifier   TEXT,          -- TRC20/ERC20/… nullable
  contract_address     TEXT,
  isin                 TEXT,
  cost_currency_default TEXT REFERENCES cur_currencies(code) ON DELETE SET NULL ON UPDATE CASCADE,
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
  party_kind TEXT CHECK (party_kind IS NULL OR party_kind IN ('individual','company','bank','brokerage','government','other')),
  created_at TEXT NOT NULL
);

-- ─── Accounts banking (event log — not cash SoT) ─────────────
CREATE TABLE IF NOT EXISTS acc_accounts (
  -- operational cashAccountKind lives in account_kind (P0-CASH-001/002)
  id TEXT PRIMARY KEY,
  fin_account_id TEXT REFERENCES fin_accounts(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  -- identity (RAW):
  name TEXT NOT NULL, -- **غیریکتا** — برچسب نمایشی کاربر
  account_number TEXT, -- (P0-020)
  iban TEXT,
  card_last4 TEXT, -- فقط ۴ رقم آخر (P0-020)
  card_token TEXT, -- توکن اختیاری — **نه PAN** (P0-020)
  -- bank metadata (RAW):
  branch_name TEXT,
  bank_name TEXT,
  currency TEXT NOT NULL,
  account_kind TEXT NOT NULL CHECK (account_kind IN ('cash','bank_account','card','wallet','brokerage_cash','crypto_exchange_cash','cash_equivalent','credit_account')), -- BUG-CUR-023: no legacy bank|investment|loan|credit|other
  bank_product_type TEXT CHECK (bank_product_type IS NULL OR bank_product_type IN ('current','qarz','savings','sep','term_deposit','modat','jame','other')), -- Iran-specific (P0-020)
  -- account classification (RAW):
  role TEXT CHECK (role IS NULL OR role IN ('checking','savings','brokerage','credit_card','wallet','cash_box','other')),
  -- snapshot (RAW - cached, rebuildable from ledger):
  current_balance TEXT, -- snapshot (P0-020)
  -- provenance (RAW):
  notes TEXT, -- (P0-020)
  external_ref_json TEXT,
  -- status:
  is_archived INTEGER NOT NULL DEFAULT 0 CHECK (is_archived IN (0, 1)),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','closed')),
  reconciliation_status TEXT CHECK (reconciliation_status IS NULL OR reconciliation_status IN ('unreconciled','matched','partial','stale')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_acc_iban_active
  ON acc_accounts(iban) WHERE iban IS NOT NULL AND is_archived = 0;

CREATE TABLE IF NOT EXISTS acc_transactions (
  id             TEXT PRIMARY KEY,
  account_id     TEXT NOT NULL REFERENCES acc_accounts(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  -- BUG-CUR-022: NULL only for draft; domain MUST reject posted path without operation_id
  -- BUG-FINAL-028: v1 requires operation_id for all cash event rows written by Core commands.
  -- NULL only allowed for explicit draft tooling outside production write path.
  operation_id   TEXT REFERENCES fin_operations(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  business_date  TEXT NOT NULL,
  amount         TEXT NOT NULL,
  currency       TEXT NOT NULL,
  direction      TEXT CHECK (direction IS NULL OR direction IN ('in','out')),
  memo           TEXT,
  created_at     TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS acc_transaction_links (
  id               TEXT PRIMARY KEY,
  transaction_id   TEXT NOT NULL REFERENCES acc_transactions(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  related_feature  TEXT NOT NULL CHECK (related_feature IN ('accounts','income','expense','cheque','loan','investment.crypto','investment.stocks','investment.funds','investment.metals','physical_assets','budget','goals','bills','tax')),
  related_id       TEXT NOT NULL,
  UNIQUE (transaction_id, related_feature, related_id)
);

-- ─── Prices ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS price_sources (
  id       TEXT PRIMARY KEY,
  name     TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 100 CHECK (priority >= 0), -- lower = higher priority (MR-216)
  kind     TEXT, -- NULL = unknown/legacy; else manual|csv_import|online_adapter|local_cache, -- manual|csv_import|online_adapter|local_cache
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
  quote_type TEXT NOT NULL DEFAULT 'last' CHECK (quote_type IN ('last','close','nav','manual','imported','bid','ask')), -- P0-PRICE-001 NOT NULL
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

-- CRYPTO-002: Holding identity is explicit and includes venue
-- - Exchange → Wallet transfer creates NEW holding identity (not same holding)
-- - Same asset moved from Exchange A to Wallet B = two holdings: (A, null, asset) and (B, network, asset)
-- - Transfer provenance is recorded in inv_crypto_transactions via transfer_in/out pairs with same operation_id
CREATE UNIQUE INDEX IF NOT EXISTS uq_price_history_key ON price_history(instrument_id, market_date, source_id, quote_type);
-- OFFLINE-003: SQLite allows multiple NULLs in UNIQUE; partial index for manual/null source
CREATE UNIQUE INDEX IF NOT EXISTS uq_price_history_null_source
  ON price_history(instrument_id, market_date, quote_type) WHERE source_id IS NULL;
-- P1-PRICE-005: prefer source_id = canonical 'manual' / 'import' rows in price_sources;
-- NULL source_id only for true ad-hoc; is_manual=1 required when source is manual.

-- ─── Price Provider Mapping (STOCK-004) ─────────────────────
-- Preserves symbol-change history and prevents provider identity from leaking into core instrument identity.
CREATE TABLE IF NOT EXISTS instrument_price_mappings (
  id              TEXT PRIMARY KEY,
  instrument_id   TEXT NOT NULL REFERENCES ref_instruments(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  source_id       TEXT NOT NULL REFERENCES price_sources(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  provider_symbol TEXT NOT NULL, -- symbol at the provider (may change over time)
  market          TEXT CHECK (market IS NULL OR market IN ('bourse','fara_bourse','base_market','other')),
  valid_from      TEXT NOT NULL, -- start of validity (inclusive)
  valid_to        TEXT, -- end of validity (exclusive, nullable for current)
  status TEXT NOT NULL CHECK (status IN ('active','archived')),
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_ipm_instrument_source ON instrument_price_mappings(instrument_id, source_id);
CREATE INDEX IF NOT EXISTS idx_ipm_provider_symbol ON instrument_price_mappings(provider_symbol);
CREATE INDEX IF NOT EXISTS idx_ipm_active ON instrument_price_mappings(instrument_id, source_id) WHERE status = 'active';

-- ─── Crypto holdings (projection of ledger events) ───────────

-- ─── Crypto Transactions ─────────────────────────────────────
-- Field Mapping (CRYPTO-001, P0-019):
-- | feature field                 | SQL column                   | kind     | constraints                                    |
-- |-------------------------------|------------------------------|----------|------------------------------------------------|
-- | id                            | id                           | RAW      | PK                                             |
-- | operation_id                  | operation_id                 | RAW      | FK fin_operations (required for posted txs)   |
-- | holding_id                    | holding_id                   | RAW      | FK inv_crypto_holdings (nullable)             |
-- | instrument_id                 | instrument_id                | RAW      | FK ref_instruments (required)                 |
-- | tx_type                       | tx_type                      | RAW      | enum                                           |
-- | business_date                 | business_date                | RAW      | required                                       |
-- | gross_quantity                | gross_quantity               | RAW      | nullable (buy/sell)                            |
-- | fee_quantity                  | fee_quantity                 | RAW      | nullable                                       |
-- | net_quantity                  | net_quantity                 | RAW      | required (always > 0)                          |
-- | feeFundingKind                | feeFundingKind               | RAW      | 'cash'|'asset' (required)                      |
-- | fee_currency                  | fee_currency                 | RAW      | XOR with fee_instrument_id                     |
-- | fee_instrument_id             | fee_instrument_id            | RAW      | XOR with fee_currency                          |
-- | economic_kind                 | economic_kind                | RAW      | optional                                       |

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
  -- CRYPTO-001: exactly one funding source when fee present
  fee_funding_kind  TEXT CHECK (fee_funding_kind IS NULL OR fee_funding_kind IN ('cash','asset')),
  fee_currency    TEXT,
  fee_instrument_id TEXT REFERENCES ref_instruments(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  -- CRYPTO-003: optional address audit FKs
  from_address_id TEXT, -- soft FK → inv_crypto_wallet_addresses.id (table defined later; CRYPTO-003)
  to_address_id   TEXT, -- soft FK → inv_crypto_wallet_addresses.id
  -- CRYPTO-002 / MATH-008
  economic_kind TEXT CHECK (economic_kind IS NULL OR economic_kind IN (
    'acquisition','disposal','transfer','internal_transfer','bridge','economic_swap','fee','income','adjustment','swap'
  )),
  created_at      TEXT NOT NULL,
  CHECK (
    fee_funding_kind IS NULL
    OR (fee_funding_kind = 'cash' AND fee_currency IS NOT NULL AND fee_instrument_id IS NULL)
    OR (fee_funding_kind = 'asset' AND fee_currency IS NULL AND fee_instrument_id IS NOT NULL)
  )
);

-- ─── Loans ───────────────────────────────────────────────────
-- Field Mapping (P0-018):
-- | feature field                 | SQL column                   | kind     | formula                                          | migration           |
-- |-------------------------------|------------------------------|----------|--------------------------------------------------|---------------------|
-- | name                          | name                         | RAW      | -                                                | migrate directly    |
-- | loanType                      | loan_type                    | RAW      | -                                                | enum map            |
-- | direction                     | direction                    | RAW      | -                                                | enum map            |
-- | principalAmount               | principal                    | RAW      | -                                                | preserve            |
-- | dayCountConvention            | day_count_convention         | RAW      | -                                                | enum map            |
-- | dayCountDenominator           | day_count_denominator        | RAW      | -                                                | preserve nullable   |
-- | disbursementDate              | disbursement_date            | RAW      | -                                                | datetime parse      |
-- | firstPaymentDate              | first_payment_date           | RAW      | -                                                | datetime parse      |
-- | endDate                       | end_date                     | RAW      | -                                                | datetime parse      |
-- | irregularFirstPeriod          | irregular_first_period       | RAW      | boolean → int                                    | cast                |
-- | firstPeriodEndDate            | first_period_end_date        | RAW      | -                                                | datetime parse      |
-- | paymentHolidayCalendarId      | payment_holiday_calendar_id  | RAW      | -                                                | FK nullable         |
-- | interestType                  | interest_type                | RAW      | -                                                | enum map            |
-- | interestRate                  | interest_rate                | RAW      | % (18 for 18%)                                   | preserve            |
-- | interestRatePeriod            | interest_rate_period         | RAW      | -                                                | enum map            |
-- | installmentFrequency          | installment_frequency        | RAW      | -                                                | enum map            |
-- | customIntervalDays            | custom_interval_days         | RAW      | -                                                | int                 |
-- | calculatedInstallment         | calculated_installment       | RAW      | from schedule engine                             | computed            |
-- | fixedInstallmentAmount        | fixed_installment_amount     | RAW      | user-entered or computed                         | preserve            |
-- | recalculateOnEarlyPayment     | recalculate_on_early_payment | RAW      | boolean → int                                    | cast                |
-- | penaltyRate                   | penalty_rate                 | RAW      | % (6 for 6%)                                     | preserve            |
-- | penaltyBasis                  | penalty_basis                | RAW      | -                                                | enum map            |
-- | calculationMethod             | calculation_method           | RAW      | -                                                | enum map            |
-- | totalInstallments             | total_installments           | RAW      | -                                                | int                 |
-- | dayCount                      | day_count                    | RAW      | legacy alias (deprecated, use day_count_convention) | rename → copy    |
-- | start_date                    | start_date                   | RAW      | alias for disbursement_date                      | copy                |
-- | maturity_date                 | maturity_date                | RAW      | alias for end_date                               | copy                |
-- | operation_id                  | operation_id                 | RAW      | FK fin_operations                              | preserve            |
-- | status                        | status                       | RAW      | -                                                | enum map            |
-- | schedule_engine_version       | schedule_engine_version      | RAW      | -                                                | JSON                |
-- | notes                         | notes                        | RAW      | -                                                | preserve            |

CREATE TABLE IF NOT EXISTS ln_loans (
  id TEXT PRIMARY KEY,
  -- identity and metadata (RAW):
  name TEXT, -- نام وام (P0-018)
  loan_type TEXT CHECK (loan_type IS NULL OR loan_type IN ('bank_installment','qarz_al_hasaneh','facility','friendly_loan','credit_card','mortgage','leasing','bond','other')), -- (P0-018)
  direction TEXT CHECK (direction IS NULL OR direction IN ('borrowed','lent')), -- (P0-018)
  party_id TEXT REFERENCES ref_parties(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('borrower','lender')), -- LOAN-001: map borrowed→borrower, lent→lender
  -- amounts and currency (RAW):
  principal TEXT NOT NULL, -- مبلغ اصلی
  currency TEXT NOT NULL,
  -- day count (RAW):
  day_count_convention TEXT CHECK (day_count_convention IS NULL OR day_count_convention IN ('period_based','monthly')), -- P0-LOAN-005 v1 only; other conventions require DayCountEngine
  day_count_denominator TEXT, -- فقط وقتی custom_days (P0-018)
  exchange_rate_to_base TEXT, -- نرخ ارز وام/قسط → baseCurrency (P0-018)
  -- dates (RAW):
  disbursement_date TEXT, -- تاریخ دریافت/واریز وام (P0-018)
  first_payment_date TEXT, -- تاریخ اولین قسط (P0-018)
  end_date TEXT, -- تاریخ پایان وام (P0-018)
  irregular_first_period INTEGER NOT NULL DEFAULT 0 CHECK (irregular_first_period IN (0, 1)), -- (P0-018)
  first_period_end_date TEXT, -- وقتی irregular first (P0-018)
  payment_holiday_calendar_id TEXT, -- لینک به تقویم (P0-018)
  -- account (RAW):
  account_id TEXT REFERENCES acc_accounts(id) ON DELETE RESTRICT ON UPDATE CASCADE, -- فقط حالت Integrated (P0-018)
  account_transaction_id TEXT, -- لینک cash leg (P0-018)
  -- calculation (RAW):
  calculation_method TEXT NOT NULL CHECK (calculation_method IN ('declining_balance','flat_rate','bullet','qarz_al_hasaneh')),
  interest_type TEXT CHECK (interest_type IS NULL OR interest_type IN ('none','fixed','variable')), -- (P0-018)
  interest_rate TEXT, -- درصد کامل (P0-018)
  interest_rate_period TEXT CHECK (interest_rate_period IS NULL OR interest_rate_period IN ('annual','monthly')), -- (P0-018)
  installment_frequency TEXT CHECK (installment_frequency IS NULL OR installment_frequency IN ('monthly','weekly','quarterly','custom')), -- (P0-018)
  custom_interval_days INTEGER, -- اجباری اگر frequency=custom (P0-018)
  total_installments INTEGER,
  -- grace (RAW):
  grace_mode TEXT CHECK (grace_mode IS NULL OR grace_mode IN ('none','periods','date_range')), -- (P0-018)
  grace_periods INTEGER, -- وقتی graceMode=periods (P0-018)
  grace_period_unit TEXT CHECK (grace_period_unit IS NULL OR grace_period_unit IN ('installment')), -- deprecated 'month' (P0-018)
  grace_start_date TEXT, -- وقتی graceMode=date_range (P0-018)
  grace_end_date TEXT, -- وقتی graceMode=date_range (P0-018)
  grace_interest_policy TEXT CHECK (grace_interest_policy IS NULL OR grace_interest_policy IN ('interest_only','payment_holiday')), -- (P0-018)
  -- installment (RAW):
  calculated_installment TEXT, -- محاسبه‌شده برای Declining/Bullet (P0-018)
  fixed_installment_amount TEXT, -- ثابت برای Flat Rate/Qarz (P0-018)
  -- early payment (RAW):
  recalculate_on_early_payment INTEGER NOT NULL DEFAULT 0 CHECK (recalculate_on_early_payment IN (0, 1)), -- فقط declining_balance (P0-018)
  penalty_rate TEXT, -- نرخ جریمه دیرکرد سالانه (P0-018)
  penalty_basis TEXT CHECK (penalty_basis IS NULL OR penalty_basis IN ('overdue_installment','remaining_balance')), -- (P0-018)
  -- operation and status:
  -- operation_id: NULLABLE only for draft loans (not yet posted)
  -- All posted loan actions MUST have operation_id → fin_operations
  status TEXT NOT NULL CHECK (status IN ('draft','active','paid_off','defaulted','restructured','cancelled')),
  created_at TEXT NOT NULL,
  updated_at TEXT,
  -- legacy aliases (for backward compatibility):
  start_date TEXT, -- alias for disbursement_date
  maturity_date TEXT, -- alias for end_date
  operation_id TEXT REFERENCES fin_operations(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  -- legacy:
  day_count TEXT DEFAULT 'period_based', -- deprecated, use day_count_convention
  schedule_engine_version TEXT,
  notes TEXT
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
  currency      TEXT NOT NULL,
  fee_timing TEXT CHECK (fee_timing IS NULL OR fee_timing IN ('upfront','per_installment','on_default','on_early_settlement','other'))
  -- DOMAIN: amount_paid + amount_waived <= amount_due enforced in engine
);

CREATE TABLE IF NOT EXISTS ln_transactions (
  id            TEXT PRIMARY KEY,
  loan_id       TEXT NOT NULL REFERENCES ln_loans(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  operation_id  TEXT NOT NULL REFERENCES fin_operations(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  tx_type       TEXT NOT NULL CHECK (tx_type IN ('disbursement','payment','fee','penalty','adjustment','reversal')),
  business_date TEXT NOT NULL,
  amount        TEXT NOT NULL,
  currency      TEXT NOT NULL,
  created_at    TEXT NOT NULL,
  payment_date TEXT,
  exchange_rate_to_base TEXT,
  principal_portion TEXT NOT NULL DEFAULT '0',
  interest_portion TEXT NOT NULL DEFAULT '0',
  fee_portion TEXT NOT NULL DEFAULT '0',
  penalty_portion TEXT NOT NULL DEFAULT '0',
  reverses_transaction_id TEXT REFERENCES ln_transactions(id) ON DELETE RESTRICT ON UPDATE CASCADE
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
  -- operation_id: NULLABLE only for draft cheques (not yet issued/paid)
  -- Issued/Paid cheques MUST have operation_id → fin_operations
  operation_id    TEXT REFERENCES fin_operations(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  created_at      TEXT NOT NULL,
  bounced_reason TEXT);

-- ─── Import preservation envelope (P0-FINAL-039) ─────────────

-- DATA-002: explicit import batch header (batch_id on import_raw_records references this)
CREATE TABLE IF NOT EXISTS import_batches (
  id                    TEXT PRIMARY KEY,
  source_provider       TEXT NOT NULL,
  source_type           TEXT, -- csv|json|api|manual|broker_export
  source_reference      TEXT,
  source_schema_version TEXT,
  document_id           TEXT REFERENCES docs_documents(id) ON DELETE SET NULL ON UPDATE CASCADE,
  status                TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','processing','completed','failed','cancelled')),
  record_count          INTEGER,
  content_hash          TEXT,
  created_at            TEXT NOT NULL,
  completed_at          TEXT
);

CREATE TABLE IF NOT EXISTS import_raw_records (
  id                    TEXT PRIMARY KEY,
  batch_id              TEXT NOT NULL, -- import batch (MR-230)
  source_provider       TEXT NOT NULL, -- provider name (e.g., 'mellat', 'tsetmc', 'coinbase')
  source_schema_version TEXT, -- schema version of source data
  -- source_type: type of source data format (not interface channel)
  -- - 'csv': CSV file
  -- - 'json': JSON file
  -- - 'api': API response (structured)
  -- - 'manual': manually entered data
  -- - 'broker_export': broker/export-specific format
  -- This is the BUSINESS provenance format, NOT the interface channel
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
  source_file_name TEXT); -- source file name (MR-242)

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
  -- operation_id: NULLABLE optional link to operation if linked
  -- Many import records never become operations (raw/import-only)
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

-- durability_state: pending | sql_committed | persisted | persist_failed (P0-SCHEMA-002)
-- pending | temp_written | committed | swapped | failed

CREATE TABLE IF NOT EXISTS inv_crypto_exchanges (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL, -- display label; duplicates allowed (user may have multiple accounts at same exchange)
  -- identity/product fields (P0-019):
  type TEXT CHECK (type IS NULL OR type IN ('cex','dex','wallet','other')), -- exchange type
  url TEXT, -- سایت/اپ صرافی (P0-019)
  description TEXT, -- توضیحات (P0-019)
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)), -- active state (P0-019)
  created_at TEXT NOT NULL,
  updated_at TEXT -- updated timestamp (P0-019)
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
  -- address identity (RAW):
  address TEXT NOT NULL,
  -- derivation metadata (P0-019 - historically valuable, should be RAW):
  derivation_path TEXT, -- derivation path (e.g., m/44'/0'/0'/0/0) (P0-019)
  account_index INTEGER, -- account index (BIP44/BIP84) (P0-019)
  address_type TEXT CHECK (address_type IS NULL OR address_type IN ('legacy','p2sh','bech32','eth','other')), -- (P0-019)
  labels TEXT, -- labels/comma-separated tags (P0-019)
  -- core:
  is_primary INTEGER NOT NULL DEFAULT 0 CHECK (is_primary IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT -- (P0-019)
);

-- OFFLINE-004: at most one primary address per network
CREATE UNIQUE INDEX IF NOT EXISTS uq_wallet_primary_per_network
  ON inv_crypto_wallet_addresses(network_id) WHERE is_primary = 1;

CREATE TABLE IF NOT EXISTS inv_crypto_cash (
  id TEXT PRIMARY KEY,
  exchange_id TEXT NOT NULL REFERENCES inv_crypto_exchanges(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  currency TEXT NOT NULL,
  -- fin_account_id: NULLABLE only for non-cash crypto records (e.g., holding snapshot)
  -- for actual cash, Core journal is always SoT even in standalone mode
  fin_account_id TEXT REFERENCES fin_accounts(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  balance TEXT NOT NULL, -- SNAPSHOT only; rebuild from journal (P0-DOC-012)
  updated_at TEXT NOT NULL,
  UNIQUE (exchange_id, currency)
);

CREATE TABLE IF NOT EXISTS inv_stocks_iran_brokerages (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL, -- display label; duplicates allowed (user may have multiple accounts at same brokerage)
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
  -- RAW fields (persisted from trade documents, not derived):
  isin TEXT, -- ISIN رسمی وقتی شناخته شده (P0-015)
  symbol TEXT, -- نماد نمایشی فعلی (فولاد، …)؛ با corporate action قابل تغییر است (P0-015)
  name TEXT, -- نام شرکت/سهم (P0-015)
  provider_symbol TEXT, -- شناسه نزد Provider فعلی (P0-015)
  price_provider_id TEXT REFERENCES price_sources(id) ON DELETE SET NULL ON UPDATE CASCADE, -- FK → price_sources.id (P0-015)
  market TEXT CHECK (market IS NULL OR market IN ('bourse','fara_bourse','base_market','other')), -- context بازار (P0-015)
  -- DERIVED fields (computed from transactions by CostBasisEngine):
  quantity TEXT NOT NULL, -- net quantity (DERIVED; rebuild on tx/reversal/CA)
  total_invested TEXT NOT NULL, -- DERIVED carrying; rebuild on tx/reversal by cost-basis engine
  total_fees_paid_base TEXT, -- total fees in base currency (DERIVED; P0-015)
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
  -- tx_type expanded per P0-016 to support full CA model:
  -- buy/sell/dividend: basic operations
  -- corporate_action: generic CA event (use ca_type in inv_stocks_iran_corporate_actions for details)
  -- capital_increase: افزایش سرمایه (نقدی/از محل مطالبات)
  -- rights_issue: تخصیص حق تقدم
  -- rights_exercise: تبدیل/استفاده حق تقدم
  -- rights_sell: فروش حق تقدم
  -- bonus_share: سهام جایزه
  -- split: تجزیه سهم
  -- reverse_split: تجمیع سهم
  -- symbol_change: تغییر نماد (quantity ثابت؛ metadata)
  -- isin_change: تغییر ISIN/شناسه
  -- transfer_ca: انتقال ناشی از corporate action بین instrumentها
  -- suspension_note: اختیاری ثبت توقف/بازگشایی (معمولاً بدون اثر quantity)
  tx_type TEXT NOT NULL CHECK (
    tx_type IN (
      'buy','sell','dividend','corporate_action',
      'capital_increase','rights_issue','rights_exercise','rights_sell','bonus_share',
      'split','reverse_split','symbol_change','isin_change','transfer_ca','suspension_note',
      'fee','adjustment'
    )
  ),
  trade_date TEXT NOT NULL, -- exchange trade date (T+0); distinct from market_date (quote/session date)
  settlement_date TEXT, -- cash/settlement date (T+2 for Iranian market)
  quantity TEXT,
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
  -- RAW product fields (persisted from fund documentation):
  name TEXT, -- نام صندوق (P0-017)
  symbol TEXT, -- نماد (در صورت ETF، nullable برای issuance_redemption) (P0-017)
  fund_kind TEXT CHECK (fund_kind IS NULL OR fund_kind IN ('mutual','etf','fixed_income','money_market','other')),
  profit_kind TEXT CHECK (profit_kind IS NULL OR profit_kind IN ('distribution','accumulation')), -- distribution یا accumulation (P0-017)
  predicted_annual_rate TEXT, -- سود پیش‌بینی‌شده سالانه (درصد) (P0-017)
  distribution_period TEXT CHECK (distribution_period IS NULL OR distribution_period IN ('monthly','quarterly','none','other')), -- (P0-017)
  base_price TEXT, -- قیمت پایه (nullable) (P0-017)
  platform TEXT, -- سایت صندوق یا کارگزاری (P0-017)
  url TEXT, -- (P0-017)
  description TEXT, -- (P0-017)
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS inv_fif_holdings (
  id TEXT PRIMARY KEY,
  instrument_id TEXT NOT NULL REFERENCES ref_instruments(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  brokerage_id TEXT REFERENCES inv_stocks_iran_brokerages(id) ON DELETE RESTRICT ON UPDATE CASCADE, -- nullable — لینک به کارگزاری برای ETFها (P0-017)
  -- DERIVED fields (computed from transactions by CostBasisEngine):
  quantity TEXT NOT NULL, -- DERIVED: net units (rebuild on tx/reversal/CA)
  total_invested TEXT NOT NULL, -- DERIVED: total cost basis (rebuild on tx/reversal)
  total_fees_paid_base TEXT, -- total fees in base currency (DERIVED; P0-017)
  -- RAW snapshot fields (for pricing/metrics):
  current_nav TEXT, -- آخرین NAV (فقط برای ارزش‌گذاری و Unrealized P&L؛ هرگز با transactionPrice قاطی نشود) (P0-017)
  last_subscription_price TEXT, -- آخرین قیمت صدور دیده‌شده (nullable) (P0-017)
  last_redemption_price TEXT, -- آخرین قیمت ابطال دیده‌شده (nullable) (P0-017)
  -- FUND-002: external_reported_profit is deferred to v2
  -- Never overwrite calculated return with provider-reported return
  external_reported_profit TEXT, -- nullable; v2 observation model (see FUND-002)
  cost_currency TEXT NOT NULL,
  account_id TEXT REFERENCES acc_accounts(id) ON DELETE RESTRICT ON UPDATE CASCADE, -- nullable — برای issuance_redemption (P0-017)
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS inv_fif_transactions (
  id TEXT PRIMARY KEY,
  operation_id TEXT NOT NULL REFERENCES fin_operations(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  instrument_id TEXT NOT NULL REFERENCES ref_instruments(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  -- tx_type expanded per P0-017 to support full fund model:
  -- buy/subscribe: صدور واحد جدید
  -- sell/redeem: ابطال واحد
  -- dividend/distribution: تقسیم سود نقدی
  -- reinvest: سرمایه‌گذاری مجدد سود (خرید واحد جدید)
  -- nav_update: روزشمار NAV (valuation-only, no quantity change)
  -- fee: کارمزد (subscription, redemption, brokerage, management, other)
  -- adjustment: اصلاح دستی
  tx_type TEXT NOT NULL CHECK (
    tx_type IN (
      'subscribe','redeem','distribution','reinvest','nav_update',
      'fee','adjustment'
    )
  ),
  trade_date TEXT NOT NULL,
  settlement_date TEXT,
  quantity TEXT,
  nav TEXT,
  transaction_price TEXT,
  amount TEXT,
  currency TEXT NOT NULL,
  account_id TEXT REFERENCES acc_accounts(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  -- FUND-002: operationRole for multi-leg operations (reinvest, dividend+acquisition)
  operation_role TEXT CHECK (operation_role IS NULL OR operation_role IN ('dividend_income','reinvest_purchase','standalone')),
  -- FUND-002: external_reported_profit is deferred to v2
  -- Never overwrite calculated return with provider-reported return
  external_reported_profit TEXT, -- nullable; v2 observation model
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS inv_metals_platforms (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL, -- display label; duplicates allowed (user may have multiple accounts at same platform)
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
  status TEXT NOT NULL CHECK (status IN ('requested','processing','delivered','cancelled')),
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
  funding_mode TEXT CHECK (funding_mode IS NULL OR funding_mode IN ('manual','auto','roundup','earmark','segregated_cash')),
  status TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS fg_contributions (
  id TEXT PRIMARY KEY,
  goal_id TEXT NOT NULL REFERENCES fg_goals(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  -- operation_id: NULLABLE for voluntary contributions (not tied to operation)
  -- If contribution triggers journal entries, operation_id MUST be present
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
  status TEXT NOT NULL CHECK (status IN ('active','paused','completed','cancelled')),
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
  -- operation_id: NULLABLE only for unpaid/draft occurrences
  -- Paid occurrences MUST have operation_id → fin_operations
  operation_id TEXT REFERENCES fin_operations(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  UNIQUE (item_id, occurrence_key)
);

CREATE TABLE IF NOT EXISTS tax_events (
  id TEXT PRIMARY KEY,
  -- operation_id: NULLABLE only for draft events or manual adjustments
  -- Investment/realized ops that create tax MUST have operation_id → fin_operations
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
  status TEXT NOT NULL CHECK (status IN ('draft','posted','amended','void')),
  -- TAX-002 period semantics (do not infer bounds from bare year)
  tax_year TEXT,
  calendar_system TEXT CHECK (calendar_system IS NULL OR calendar_system IN ('jalali','gregorian')),
  period_start TEXT,
  period_end TEXT,
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
  source_priority INTEGER NOT NULL DEFAULT 100 CHECK (source_priority >= 0),
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
  kind TEXT CHECK (kind IS NULL OR kind IN ('income','expense','transfer','system')), -- income|expense|…
  parent_id TEXT REFERENCES cat_categories(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1))
);

CREATE TABLE IF NOT EXISTS not_notifications (
  id TEXT PRIMARY KEY,
  dedupe_key TEXT NOT NULL UNIQUE,
  category TEXT CHECK (category IS NULL OR category IN ('system','reminder','alert','reconcile','price','loan','bill','tax')),
  title TEXT NOT NULL,
  body TEXT,
  is_read INTEGER NOT NULL DEFAULT 0 CHECK (is_read IN (0, 1)),
  dismissed_at TEXT,
  snooze_until TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS rpt_snapshots (
  id TEXT PRIMARY KEY,
  report_kind TEXT NOT NULL CHECK (report_kind IN ('net_worth','cash_flow','income_statement','balance_sheet','investment_pnl','tax','allocation','fees','category_spending','custom')),
  as_of TEXT NOT NULL,
  payload_json TEXT NOT NULL, -- schema per report_kind: see Essential-Reports.md (net_worth|cash_flow|pnl|balance_sheet|tax|allocation|fees)
  ledger_watermark TEXT, -- opaque hash/version string of ledger state
  price_as_of TEXT,
  fx_as_of TEXT,
  engine_versions TEXT,
  calculation_context_hash TEXT, -- hash of engines+asOf+FX+price context for reproducibility
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
  scheme TEXT NOT NULL CHECK (scheme IN ('aes-256-gcm','aes-256-cbc','none')),
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
  -- operation_id: NULLABLE only for draft income (not yet posted)
  -- All posted income MUST have operation_id → fin_operations
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
  updated_at              TEXT NOT NULL,
  voided_at TEXT
);

CREATE TABLE IF NOT EXISTS inc_recurring (
  id              TEXT PRIMARY KEY,
  title           TEXT NOT NULL,
  amount          TEXT NOT NULL,
  currency        TEXT NOT NULL,
  account_id      TEXT REFERENCES acc_accounts(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  category_id     TEXT REFERENCES cat_categories(id) ON DELETE SET NULL ON UPDATE CASCADE,
  description     TEXT,
  interval_kind TEXT NOT NULL CHECK (interval_kind IN ('daily','weekly','monthly','yearly','custom')), -- monthly|weekly|yearly|custom
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
  -- operation_id: NULLABLE only for draft expense (not yet posted)
  -- All posted expense MUST have operation_id → fin_operations
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
  updated_at              TEXT NOT NULL,
  voided_at TEXT
);

CREATE TABLE IF NOT EXISTS exp_recurring (
  id              TEXT PRIMARY KEY,
  title           TEXT NOT NULL,
  amount          TEXT NOT NULL,
  currency        TEXT NOT NULL,
  account_id      TEXT REFERENCES acc_accounts(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  category_id     TEXT REFERENCES cat_categories(id) ON DELETE SET NULL ON UPDATE CASCADE,
  description     TEXT,
  interval_kind TEXT NOT NULL CHECK (interval_kind IN ('daily','weekly','monthly','yearly','custom')),
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
  effective_from  TEXT NOT NULL,
  effective_to    TEXT,
  -- LOAN-003 formal fee policy (avoid overloaded rate_or_amount alone)
  calculation_method TEXT NOT NULL DEFAULT 'rate_or_fixed' CHECK (
    calculation_method IN ('percentage_of_base','fixed_amount','rate_or_fixed','tiered_lookup')
  ),
  calculation_base TEXT CHECK (calculation_base IS NULL OR calculation_base IN ('principal','outstanding','installment','payment')),
  rate TEXT, -- percentage points as decimal string when percentage_of_base
  fixed_amount TEXT, -- when fixed_amount
  rate_or_amount  TEXT, -- legacy; prefer rate + fixed_amount
  is_percentage   INTEGER NOT NULL DEFAULT 0 CHECK (is_percentage IN (0, 1)),
  min_amount      TEXT,
  max_amount      TEXT,
  period TEXT CHECK (period IS NULL OR period IN ('once','per_installment','per_year','on_event')),
  application_moment TEXT CHECK (application_moment IS NULL OR application_moment IN (
    'origination','per_installment','on_default','on_early_settlement','on_payment','other'
  )),
  priority INTEGER NOT NULL DEFAULT 100,
  day_count TEXT CHECK (day_count IS NULL OR day_count IN ('actual/365','30/360','actual/360','actual/actual','period_based')),
  created_at      TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ln_fee_tiers_loan ON ln_loan_fee_tiers(loan_id, tier_order);

-- Budget transfers: journal-linked, no separate SoT cash table
-- (bg_transfers concept resolved as operation + bg_transaction_links; no ghost table)

-- Notifications: canonical not_notifications already present; docs notif_* migrated to not_
-- Reports: canonical rpt_snapshots; docs rep_* → rpt_

-- Crypto/Stocks/Metals cash: inv_crypto_cash, inv_stocks_iran_brokerages.cashBalance, inv_metals_platforms.cashBalance are projections only;
-- All cash SoT = Core fin_accounts + fin_journal_lines via CashSettlementPort (no ghost table)

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
  -- DATA-001: never absolute OS path as business identity
  relative_path TEXT, -- preferred relative path within vault
  blob_id       TEXT, -- content-addressed / storage key
  storage_kind  TEXT CHECK (storage_kind IS NULL OR storage_kind IN ('relative','blob','external_ref')),
  storage_path  TEXT, -- DEPRECATED alias; prefer relative_path or blob_id
  checksum     TEXT,
  size_bytes INTEGER CHECK (size_bytes IS NULL OR size_bytes >= 0),
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL,
  CHECK (relative_path IS NOT NULL OR blob_id IS NOT NULL OR storage_path IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS docs_links (
  id          TEXT PRIMARY KEY,
  document_id TEXT NOT NULL REFERENCES docs_documents(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('pa_asset','tax_event','loan','cheque','import_raw','operation','instrument','account','goal','budget')), -- pa_asset|tax_event|loan|cheque|import_raw|...
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
  report_kind TEXT NOT NULL CHECK (report_kind IN ('net_worth','cash_flow','income_statement','balance_sheet','investment_pnl','tax','allocation','fees','category_spending','custom')),
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
-- tax_events: individual tax events linked to operations ( ledger SoT )
-- tax_records: reporting containers for grouped tax events (filing)
CREATE TABLE IF NOT EXISTS tax_records (
  id TEXT PRIMARY KEY,
  period_key TEXT NOT NULL, -- tax year / period e.g. 1404 or 2025-IR
  calendar_system TEXT CHECK (calendar_system IS NULL OR calendar_system IN ('jalali','gregorian')),
  period_start TEXT,
  period_end TEXT,
  jurisdiction TEXT NOT NULL, -- IR|US|...
  -- P0-012: user-facing obligation/filing record (not a second event ledger)
  linked_tax_event_id TEXT REFERENCES tax_events(id) ON DELETE SET NULL ON UPDATE CASCADE,
  -- aggregate / obligation amounts (may summarize multiple tax_events)
  amount_due TEXT, -- decimal string total obligation
  amount_paid TEXT, -- decimal string paid to date
  currency TEXT,
  due_date TEXT, -- DATE-only
  -- payment_operation_id set ONLY by payTax path (P0-013)
  payment_operation_id TEXT REFERENCES fin_operations(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  summary_json TEXT, -- JSON aggregation of tax events (total tax, breakdown by kind)
  status TEXT NOT NULL CHECK (status IN ('draft','pending','overdue','filed','paid','amended','cancelled')),
  created_at TEXT NOT NULL,
  updated_at TEXT,
  filed_at TEXT,
  paid_at TEXT,
  amended_to TEXT REFERENCES tax_records(id) ON DELETE SET NULL ON UPDATE CASCADE,
  amended_at TEXT
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
  interval_minutes INTEGER CHECK (interval_minutes IS NULL OR interval_minutes > 0),
  updated_at TEXT NOT NULL
);

-- Integrity queue (async checks)
CREATE TABLE IF NOT EXISTS ref_integrity_queue (
  id         TEXT PRIMARY KEY,
  check_kind TEXT NOT NULL CHECK (check_kind IN ('fk','balance','price_stale','orphan','custom')),
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

CREATE UNIQUE INDEX IF NOT EXISTS uq_import_external_ref ON import_dedupe_keys(source_provider, external_ref) WHERE external_ref IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_dash_default ON dash_layouts(is_default) WHERE is_default = 1;

CREATE INDEX IF NOT EXISTS idx_fin_jl_account ON fin_journal_lines(account_id);
CREATE INDEX IF NOT EXISTS idx_fin_op_date ON fin_operations(business_date);
CREATE INDEX IF NOT EXISTS idx_fin_op_type ON fin_operations(operation_type);
CREATE INDEX IF NOT EXISTS idx_fin_op_status ON fin_operations(status);
CREATE INDEX IF NOT EXISTS idx_fin_op_reverses ON fin_operations(reverses_operation_id);
CREATE INDEX IF NOT EXISTS idx_acc_tx_account ON acc_transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_acc_tx_date ON acc_transactions(business_date);
CREATE INDEX IF NOT EXISTS idx_price_src ON price_history(source_id);
CREATE INDEX IF NOT EXISTS idx_crypto_tx_op ON inv_crypto_transactions(operation_id);
CREATE INDEX IF NOT EXISTS idx_crypto_tx_holding ON inv_crypto_transactions(holding_id);
CREATE INDEX IF NOT EXISTS idx_stocks_tx_op ON inv_stocks_iran_transactions(operation_id);
CREATE INDEX IF NOT EXISTS idx_stocks_tx_holding ON inv_stocks_iran_transactions(holding_id);
CREATE INDEX IF NOT EXISTS idx_fif_tx_op ON inv_fif_transactions(operation_id);
CREATE INDEX IF NOT EXISTS idx_metals_tx_op ON inv_metals_transactions(operation_id);
CREATE INDEX IF NOT EXISTS idx_pa_tx_op ON pa_transactions(operation_id);
CREATE INDEX IF NOT EXISTS idx_ln_tx_op ON ln_transactions(operation_id);
CREATE INDEX IF NOT EXISTS idx_ln_tx_loan ON ln_transactions(loan_id);
CREATE INDEX IF NOT EXISTS idx_chk_op ON chk_cheques(operation_id);
CREATE INDEX IF NOT EXISTS idx_tax_op ON tax_events(operation_id);
CREATE INDEX IF NOT EXISTS idx_fg_goal ON fg_contributions(goal_id);
CREATE INDEX IF NOT EXISTS idx_fg_op ON fg_contributions(operation_id);
CREATE INDEX IF NOT EXISTS idx_br_item ON br_occurrences(item_id);
CREATE INDEX IF NOT EXISTS idx_br_op ON br_occurrences(operation_id);
CREATE INDEX IF NOT EXISTS idx_bg_env ON bg_transaction_links(envelope_id);
CREATE INDEX IF NOT EXISTS idx_bg_op ON bg_transaction_links(operation_id);
CREATE INDEX IF NOT EXISTS idx_fin_acc_parent ON fin_accounts(parent_id);
CREATE INDEX IF NOT EXISTS idx_pa_source_op ON pa_assets(source_operation_id);
CREATE INDEX IF NOT EXISTS idx_metals_del_holding ON inv_metals_physical_deliveries(metals_holding_id);
CREATE INDEX IF NOT EXISTS idx_stocks_ca_instr ON inv_stocks_iran_corporate_actions(instrument_id);
CREATE INDEX IF NOT EXISTS idx_crypto_addr_net ON inv_crypto_wallet_addresses(network_id);
CREATE INDEX IF NOT EXISTS idx_crypto_net_ex ON inv_crypto_wallet_networks(exchange_id);
CREATE INDEX IF NOT EXISTS idx_inc_reversed ON inc_transactions(reversed_income_id);
CREATE INDEX IF NOT EXISTS idx_exp_reversed ON exp_transactions(reversed_expense_id);

-- ═══════════════════════════════════════════════════════════
-- DOMAIN DECIMAL VALIDATORS (SQLite cannot CHECK TEXT arithmetic)
-- Enforced by decimal.js in OperationEngine before persist:
--   amount/qty/price/rate/nav > 0 when required
--   fee/premium/paid/waived >= 0
--   paid + waived <= due (loan fees)
--   net = gross - fee when all present (crypto)
--   realized_gain_loss only on sale/disposal
--   reverse target must be posted / not already voided
--   principal, cheque amount, journal line amount > 0
-- See Financial-Invariants.md + BUG-CODE regression suite.
-- ═══════════════════════════════════════════════════════════


-- Domain validators (NEW-131,133-135,138): at least one is_primary per network;
-- pa quantity/avg/cost > 0 when present; RRULE format for recurrence fields.
