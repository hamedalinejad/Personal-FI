import { randomUUID } from "node:crypto";
import { runAtomicFinancialOperation } from "../../../core/domain/operation/operationEngine.js";
import { openDb } from "../../../core/persistence/port.js";
import { requireOperationId, requirePayload, requireDate } from "../../_shared/commandGuard.js";

/** cheque.bounce — reverse prior clear cash effect if cleared; else state-only */
export async function bounceCheque(input, { dataDir } = {}) {
  const operationId = requireOperationId(input);
  const p = requirePayload(input);
  if (!p.chequeId) throw new Error("VALIDATION_ERROR:chequeId");
  const businessDate = requireDate(p.businessDate);
  const db = openDb(dataDir);
  const row = db.prepare(`SELECT * FROM chk_cheques WHERE id = ?`).get(p.chequeId);
  if (!row) throw new Error("CHEQUE_NOT_FOUND");
  if (!["deposited", "cleared"].includes(row.status)) throw new Error("CHEQUE_INVALID_TRANSITION");

  if (row.status === "deposited") {
    db.prepare(
      `UPDATE chk_cheques SET status = 'bounced', bounced_date = ?, bounced_reason = ? WHERE id = ?`,
    ).run(businessDate, p.reason || null, p.chequeId);
    return { chequeId: p.chequeId, status: "bounced", cashEffect: false };
  }

  // cleared → reverse original clear operation
  const lines = db.prepare(
    `SELECT jl.* FROM fin_journal_lines jl
     JOIN fin_journal_entries je ON je.id = jl.entry_id
     WHERE je.operation_id = ? ORDER BY jl.line_number`,
  ).all(row.operation_id);
  if (!lines.length) throw new Error("CHEQUE_CLEAR_JOURNAL_MISSING");
  const journalLines = lines.map((l) => ({
    accountId: l.account_id,
    side: l.side === "debit" ? "credit" : "debit",
    amount: l.amount,
    currency: l.currency,
    amountInBase: l.amount_in_base || l.amount,
    exchangeRateToBase: l.exchange_rate_to_base || "1",
    lineKind: "other",
  }));
  const now = new Date().toISOString();
  return runAtomicFinancialOperation({
    operationId,
    type: "cheque.bounce",
    dataDir,
    businessDate,
    baseCurrency: row.currency,
    status: "posted",
    reversesOperationId: row.operation_id,
    payload: p,
    journalLines,
    withinTransaction(db) {
      db.prepare(
        `UPDATE chk_cheques SET status = 'bounced', bounced_date = ?, bounced_reason = ? WHERE id = ?`,
      ).run(businessDate, p.reason || null, p.chequeId);
    },
  });
}
