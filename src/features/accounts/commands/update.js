import { openDb } from "../../../core/persistence/port.js";
import { requirePayload } from "../../_shared/commandGuard.js";

/** accounts.update — non-financial metadata only */
export async function updateAccount(input, { dataDir } = {}) {
  const p = requirePayload(input);
  if (!p.accountId) throw new Error("VALIDATION_ERROR:accountId");
  const db = openDb(dataDir);
  const row = db.prepare(`SELECT * FROM acc_accounts WHERE id = ?`).get(p.accountId);
  if (!row) throw new Error("ACCOUNT_NOT_FOUND");
  if (row.is_archived === 1) throw new Error("ACCOUNT_CLOSED");
  const now = new Date().toISOString();
  db.prepare(
    `UPDATE acc_accounts SET name = COALESCE(?, name), bank_name = COALESCE(?, bank_name),
      notes = COALESCE(?, notes), updated_at = ? WHERE id = ?`,
  ).run(p.name ?? null, p.bankName ?? null, p.notes ?? null, now, p.accountId);
  return { accountId: p.accountId, status: "updated" };
}
