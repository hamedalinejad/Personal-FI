import { openDb } from "../../../core/persistence/port.js";
import { requirePayload } from "../../_shared/commandGuard.js";

/** cheque.cancel — pre-clear only */
export async function cancelCheque(input, { dataDir } = {}) {
  const p = requirePayload(input);
  if (!p.chequeId) throw new Error("VALIDATION_ERROR:chequeId");
  const db = openDb(dataDir);
  const row = db.prepare(`SELECT * FROM chk_cheques WHERE id = ?`).get(p.chequeId);
  if (!row) throw new Error("CHEQUE_NOT_FOUND");
  if (!["issued", "deposited", "draft"].includes(row.status)) throw new Error("CHEQUE_INVALID_TRANSITION");
  db.prepare(`UPDATE chk_cheques SET status = 'cancelled' WHERE id = ?`).run(p.chequeId);
  return { chequeId: p.chequeId, status: "cancelled" };
}
