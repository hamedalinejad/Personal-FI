import { openDb } from "../../../core/persistence/port.js";
import { archiveAccount } from "../../../core/accounting/chartOfAccounts.js";
import { requirePayload } from "../../_shared/commandGuard.js";

/** accounts.archive — zero journal balance required */
export async function archiveAccountCmd(input, { dataDir } = {}) {
  const p = requirePayload(input);
  if (!p.accountId) throw new Error("VALIDATION_ERROR:accountId");
  const db = openDb(dataDir);
  const row = db.prepare(`SELECT * FROM acc_accounts WHERE id = ?`).get(p.accountId);
  if (!row) throw new Error("ACCOUNT_NOT_FOUND");
  if (row.fin_account_id) {
    archiveAccount(db, row.fin_account_id);
  }
  const now = new Date().toISOString();
  db.prepare(`UPDATE acc_accounts SET is_archived = 1, status = 'closed', updated_at = ? WHERE id = ?`)
    .run(now, p.accountId);
  return { accountId: p.accountId, status: "archived" };
}
