import { openDb } from "../../../core/persistence/port.js";
import { requirePayload } from "../../_shared/commandGuard.js";

export async function updateAsset(input, { dataDir } = {}) {
  const p = requirePayload(input);
  if (!p.assetId) throw new Error("VALIDATION_ERROR:assetId");
  const db = openDb(dataDir);
  const row = db.prepare(`SELECT * FROM pa_assets WHERE id = ?`).get(p.assetId);
  if (!row) throw new Error("ASSET_NOT_FOUND");
  if (row.is_disposed === 1) throw new Error("ASSET_DISPOSED");
  const now = new Date().toISOString();
  db.prepare(
    `UPDATE pa_assets SET name = COALESCE(?, name), location = COALESCE(?, location),
      model = COALESCE(?, model), owner = COALESCE(?, owner), updated_at = ? WHERE id = ?`,
  ).run(p.name ?? null, p.location ?? null, p.model ?? null, p.owner ?? null, now, p.assetId);
  return { assetId: p.assetId, status: "updated" };
}
