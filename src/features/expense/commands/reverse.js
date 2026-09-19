import { randomUUID } from "node:crypto";
import { runAtomicFinancialOperation } from "../../../core/domain/operation/operationEngine.js";
import { openDb } from "../../../core/persistence/port.js";
import { requireOperationId, requirePayload, requireDate } from "../../_shared/commandGuard.js";

export async function reverseExpense(input, { dataDir } = {}) {
  const operationId = requireOperationId(input);
  const p = requirePayload(input);
  if (!p.originalOperationId) throw new Error("VALIDATION_ERROR:originalOperationId");
  const businessDate = requireDate(p.businessDate);
  const db = openDb(dataDir);
  const orig = db.prepare(`SELECT * FROM fin_operations WHERE id = ?`).get(p.originalOperationId);
  if (!orig || orig.status !== "posted") throw new Error("REVERSAL_NOT_ALLOWED");
  const lines = db.prepare(
    `SELECT jl.* FROM fin_journal_lines jl
     JOIN fin_journal_entries je ON je.id = jl.entry_id
     WHERE je.operation_id = ? ORDER BY jl.line_number`,
  ).all(p.originalOperationId);
  if (!lines.length) throw new Error("REVERSAL_NOT_ALLOWED");

  const journalLines = lines.map((l) => ({
    accountId: l.account_id,
    side: l.side === "debit" ? "credit" : "debit",
    amount: l.amount,
    currency: l.currency,
    amountInBase: l.amount_in_base || l.amount,
    exchangeRateToBase: l.exchange_rate_to_base || "1",
    lineKind: "adjustment",
  }));

  const exp = db.prepare(`SELECT * FROM exp_transactions WHERE operation_id = ?`).get(p.originalOperationId);
  const revId = randomUUID();
  const now = new Date().toISOString();

  return runAtomicFinancialOperation({
    operationId,
    type: "expense.reverse",
    dataDir,
    businessDate,
    baseCurrency: orig.base_currency,
    status: "posted",
    reversesOperationId: p.originalOperationId,
    payload: p,
    journalLines,
    withinTransaction(db) {
      if (exp) {
        db.prepare(
          `INSERT INTO exp_transactions (
            id, operation_id, business_date, amount, currency, account_id, description,
            is_voided, reversed_expense_id, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`,
        ).run(revId, operationId, businessDate, exp.amount, exp.currency, exp.account_id, "reversal", exp.id, now, now);
        db.prepare(`UPDATE exp_transactions SET is_voided = 1, voided_at = ?, updated_at = ? WHERE id = ?`)
          .run(now, now, exp.id);
      }
    },
  });
}
