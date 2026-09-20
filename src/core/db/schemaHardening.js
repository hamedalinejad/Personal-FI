/**
 * Schema hardening helpers (REL-P1-01..04, BUG-P1-13).
 * SQLite cannot easily ADD FK to existing tables; greenfield uses schema.sql.
 * Runtime ensures payload table + documents expected FKs.
 */

/**
 * Ensure fin_operation_payloads exists (BUG-P1-13 Option B).
 * @param {any} db
 */
export function ensureOperationPayloadTable(db) {
  db.run(`
    CREATE TABLE IF NOT EXISTS fin_operation_payloads (
      operation_id   TEXT PRIMARY KEY REFERENCES fin_operations(id) ON DELETE RESTRICT ON UPDATE CASCADE,
      schema_version TEXT NOT NULL DEFAULT '1',
      payload_json   TEXT NOT NULL,
      canonical_hash TEXT,
      created_at     TEXT NOT NULL
    )
  `);
}

/**
 * Persist immutable RAW command payload (not result_json).
 * @param {any} db
 * @param {string} operationId
 * @param {object} payload
 * @param {{ schemaVersion?: string, hash?: string }} [opts]
 */
export function writeOperationPayload(db, operationId, payload, opts = {}) {
  ensureOperationPayloadTable(db);
  const now = new Date().toISOString();
  const json = JSON.stringify(payload);
  db.run(
    `INSERT OR REPLACE INTO fin_operation_payloads
      (operation_id, schema_version, payload_json, canonical_hash, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [operationId, opts.schemaVersion || "1", json, opts.hash || null, now]
  );
}

/**
 * Expected FK matrix for documentation + orphan checks.
 * Domain validators remain authoritative until migration rebuild.
 */
export const EXPECTED_FK = Object.freeze({
  "inv_crypto_holdings.exchange_id": {
    references: "inv_crypto_exchanges(id)",
    onDelete: "RESTRICT",
    status: "REQUIRED_REL_P1_01",
  },
  "inv_crypto_holdings.network_id": {
    references: "inv_crypto_wallet_networks(id)",
    nullable: true,
    nullMeans: "venue_offchain",
    status: "REQUIRED_REL_P1_03",
  },
  "inv_crypto_transactions.from_address_id": {
    references: "inv_crypto_wallet_addresses(id)",
    nullable: true,
    status: "REQUIRED_REL_P1_02",
  },
  "inv_crypto_transactions.to_address_id": {
    references: "inv_crypto_wallet_addresses(id)",
    nullable: true,
    status: "REQUIRED_REL_P1_02",
  },
  "inv_stocks_iran_holdings.account_id": {
    references: "acc_accounts(id)",
    nullable: true,
    status: "REQUIRED_REL_P1_04",
  },
});

/**
 * Orphan check for crypto holdings without exchange master (test helper).
 * @param {any} db
 * @returns {string[]} orphan exchange ids
 */
export function findOrphanCryptoExchangeIds(db) {
  try {
    const stmt = db.prepare(`
      SELECT DISTINCT h.exchange_id AS id
      FROM inv_crypto_holdings h
      LEFT JOIN inv_crypto_exchanges e ON e.id = h.exchange_id
      WHERE e.id IS NULL
    `);
    const orphans = [];
    while (stmt.step()) orphans.push(stmt.getAsObject().id);
    stmt.free();
    return orphans;
  } catch {
    return [];
  }
}
