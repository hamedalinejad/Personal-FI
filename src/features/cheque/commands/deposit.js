import { openDb } from "../../../core/persistence/port.js";
import { requirePayload } from "../../_shared/commandGuard.js";

/** cheque.deposit — state transition only */
export async function depositCheque(input, { dataDir } = {}) {
  const p = requirePayload(input);
  if (!p.chequeId) throw new Error("VALIDATION_ERROR:chequeId");
  const db = openDb(dataDir);
  const row = db.prepare(`SELECT * FROM chk_cheques WHERE id = ?`).get(p.chequeId);
  if (!row) throw new Error("CHEQUE_NOT_FOUND");
  if (row.status !== "issued") throw new Error("CHEQUE_INVALID_TRANSITION");
  db.prepare(`UPDATE chk_cheques SET status = 'deposited' WHERE id = ?`).run(p.chequeId);
  return { chequeId: p.chequeId, status: "deposited" };
}
