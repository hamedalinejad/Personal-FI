import { randomUUID } from "node:crypto";
import { openDb } from "../../../core/persistence/port.js";
import { requirePayload, requireCurrency } from "../../_shared/commandGuard.js";

/** assets.register — master data; no valuation guessing */
export async function registerAsset(input, { dataDir } = {}) {
  const p = requirePayload(input);
  if (!p.name) throw new Error("VALIDATION_ERROR:name");
  const currency = requireCurrency(p.currency);
  const id = p.id || randomUUID();
  const now = new Date().toISOString();
  const db = openDb(dataDir);
  db.prepare(
    `INSERT INTO pa_assets (
      id, name, asset_kind, currency, purchase_date, acquisition_cost, location, serial_number, model, owner,
      is_disposed, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
  ).run(
    id,
    p.name,
    p.assetKind || null,
    currency,
    p.purchaseDate || null,
    p.acquisitionCost != null ? String(p.acquisitionCost) : null,
    p.location || null,
    p.serialNumber || null,
    p.model || null,
    p.owner || null,
    now,
    now,
  );
  return { assetId: id, status: "registered" };
}
