import { openDb } from "../../../core/persistence/port.js";
import { requirePayload, requirePositiveMoney } from "../../_shared/commandGuard.js";

/** tax.adjust — assessment adjustment with reason; cannot silently set paid */
export async function adjustTax(input, { dataDir } = {}) {
  const p = requirePayload(input);
  if (!p.taxRecordId) throw new Error("VALIDATION_ERROR:taxRecordId");
  if (!p.reason) throw new Error("VALIDATION_ERROR:reason");
  const db = openDb(dataDir);
  const rec = db.prepare(`SELECT * FROM tax_records WHERE id = ?`).get(p.taxRecordId);
  if (!rec) throw new Error("TAX_RECORD_NOT_FOUND");
  if (rec.status === "paid") throw new Error("TAX_ADJUST_PAID_FORBIDDEN");
  if (p.status === "paid") throw new Error("TAX_PAID_ONLY_VIA_PAY");
  const now = new Date().toISOString();
  let amountDue = rec.amount_due;
  if (p.amountDue != null) {
    amountDue = requirePositiveMoney(p.amountDue).toFixed();
  }
  const status = p.status && p.status !== "paid" ? p.status : rec.status;
  db.prepare(
    `UPDATE tax_records SET amount_due = ?, status = ?, summary_json = ?, updated_at = ? WHERE id = ?`,
  ).run(amountDue, status, JSON.stringify({ adjustReason: p.reason }), now, p.taxRecordId);
  return { taxRecordId: p.taxRecordId, status, amountDue };
}
