/**
 * B-035 / B-036 / BUG-001: resolve or create instrument with identity validation.
 * Immutable identity fields: null vs non-null is a mismatch unless explicit enrichment.
 */

function assertImmutableIdentityField(fieldName, existingVal, inputVal) {
  const a = existingVal == null || existingVal === "" ? null : existingVal;
  const b = inputVal == null || inputVal === "" ? null : inputVal;
  if (a === null && b === null) return;
  if (a === null && b !== null) {
    throw new Error(`INSTRUMENT_${fieldName}_MISMATCH:null_to_value`);
  }
  if (a !== null && b === null) {
    throw new Error(`INSTRUMENT_${fieldName}_MISMATCH:value_to_null`);
  }
  if (a !== b) {
    throw new Error(`INSTRUMENT_${fieldName}_MISMATCH:${a}!=${b}`);
  }
}

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
  /** Only migration/enrichment path may pass true to fill previously-null identity */
  allowIdentityEnrichment = false,
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

    if (allowIdentityEnrichment) {
      // Enrich only null → value; still reject conflicts
      for (const [name, existingVal, inputVal] of [
        ["NETWORK", existing.network_identifier, networkIdentifier],
        ["CONTRACT", existing.contract_address, contractAddress],
        ["ISIN", existing.isin, isin],
      ]) {
        const a = existingVal == null || existingVal === "" ? null : existingVal;
        const b = inputVal == null || inputVal === "" ? null : inputVal;
        if (a !== null && b !== null && a !== b) {
          throw new Error(`INSTRUMENT_${name}_MISMATCH:${a}!=${b}`);
        }
        if (a !== null && b === null) {
          throw new Error(`INSTRUMENT_${name}_MISMATCH:value_to_null`);
        }
      }
      if (networkIdentifier != null && !existing.network_identifier) {
        db.prepare(`UPDATE ref_instruments SET network_identifier = ?, updated_at = ? WHERE id = ?`).run(
          networkIdentifier,
          now,
          instrumentId,
        );
      }
      if (contractAddress != null && !existing.contract_address) {
        db.prepare(`UPDATE ref_instruments SET contract_address = ?, updated_at = ? WHERE id = ?`).run(
          contractAddress,
          now,
          instrumentId,
        );
      }
      if (isin != null && !existing.isin) {
        db.prepare(`UPDATE ref_instruments SET isin = ?, updated_at = ? WHERE id = ?`).run(isin, now, instrumentId);
      }
    } else {
      assertImmutableIdentityField("NETWORK", existing.network_identifier, networkIdentifier);
      assertImmutableIdentityField("CONTRACT", existing.contract_address, contractAddress);
      assertImmutableIdentityField("ISIN", existing.isin, isin);
    }

    if (symbol && existing.symbol && existing.symbol !== symbol) {
      throw new Error(`INSTRUMENT_SYMBOL_MISMATCH:${existing.symbol}!=${symbol}`);
    }
    return db.prepare(`SELECT * FROM ref_instruments WHERE id = ?`).get(instrumentId);
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
