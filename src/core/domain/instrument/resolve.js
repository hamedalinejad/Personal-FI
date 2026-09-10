/**
 * B-035 / B-036 / R-004: resolve or create instrument with identity validation.
 * Never invent a meaningful symbol; require explicit labels when creating.
 */

export function resolveOrCreateInstrument(db, {
  instrumentId,
  assetClass,
  symbol,
  name,
  networkIdentifier = null,
  contractAddress = null,
  isin = null,
  now = new Date().toISOString(),
  allowCreate = true,
}) {
  if (!instrumentId) throw new Error("INSTRUMENT_ID_REQUIRED");
  if (!assetClass) throw new Error("INSTRUMENT_ASSET_CLASS_REQUIRED");

  const existing = db
    .prepare(
      `SELECT id, asset_class, symbol, name, network_identifier, contract_address, isin
       FROM ref_instruments WHERE id = ?`,
    )
    .get(instrumentId);

  if (existing) {
    if (existing.asset_class !== assetClass) {
      throw new Error(`INSTRUMENT_ASSET_CLASS_MISMATCH:${existing.asset_class}!=${assetClass}`);
    }
    if (networkIdentifier != null && existing.network_identifier != null &&
        existing.network_identifier !== networkIdentifier) {
      throw new Error("INSTRUMENT_NETWORK_MISMATCH");
    }
    if (contractAddress != null && existing.contract_address != null &&
        existing.contract_address !== contractAddress) {
      throw new Error("INSTRUMENT_CONTRACT_MISMATCH");
    }
    if (isin != null && existing.isin != null && existing.isin !== isin) {
      throw new Error("INSTRUMENT_ISIN_MISMATCH");
    }
    // symbol is label — mismatch is warning-level reject if both non-empty and differ
    if (symbol && existing.symbol && existing.symbol !== symbol) {
      throw new Error(`INSTRUMENT_SYMBOL_MISMATCH:${existing.symbol}!=${symbol}`);
    }
    return existing;
  }

  if (!allowCreate) throw new Error("INSTRUMENT_NOT_FOUND");
  if (!symbol || typeof symbol !== "string" || !symbol.trim()) {
    throw new Error("INSTRUMENT_SYMBOL_REQUIRED_ON_CREATE");
  }

  db.prepare(
    `INSERT INTO ref_instruments (
      id, asset_class, symbol, name, network_identifier, contract_address, isin,
      created_at, updated_at, is_active
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
  ).run(
    instrumentId,
    assetClass,
    symbol.trim(),
    name || symbol.trim(),
    networkIdentifier,
    contractAddress,
    isin,
    now,
    now,
  );

  return db.prepare(`SELECT * FROM ref_instruments WHERE id = ?`).get(instrumentId);
}

export function resolveOrCreateNamedMaster(db, {
  table,
  id,
  name,
  insertSql,
  insertArgs,
  existingSelect,
  immutableFields = {},
}) {
  if (!id) throw new Error("MASTER_ID_REQUIRED");
  const existing = db.prepare(existingSelect).get(id);
  if (existing) {
    for (const [k, v] of Object.entries(immutableFields)) {
      if (v != null && existing[k] != null && String(existing[k]) !== String(v)) {
        throw new Error(`MASTER_FIELD_MISMATCH:${table}.${k}`);
      }
    }
    return existing;
  }
  db.prepare(insertSql).run(...insertArgs);
  return db.prepare(existingSelect).get(id);
}
