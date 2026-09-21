/**
 * Core reverseOperation — posted rows are never updated in place.
 * Creates a new operation with inverse journal + reversesOperationId.
 */

import { runAtomicFinancialOperation, newId } from "../domain/operation/operationRunner.js";
import { debit, credit } from "./journal.js";

function loadJournalLines(db, operationId) {
  const stmt = db.prepare(
    `SELECT jl.account_id as accountId, jl.side, jl.amount, jl.currency,
            jl.amount_in_base as amountInBase, jl.exchange_rate_to_base as exchangeRateToBase, jl.memo
     FROM fin_journal_lines jl
     JOIN fin_journal_entries je ON je.id = jl.entry_id
     WHERE je.operation_id = ?`
  );
  stmt.bind([operationId]);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

function loadOperation(db, operationId) {
  const stmt = db.prepare("SELECT * FROM fin_operations WHERE id = ?");
  stmt.bind([operationId]);
  if (!stmt.step()) {
    stmt.free();
    return null;
  }
  const row = stmt.getAsObject();
  stmt.free();
  return row;
}

/**
 * @param {{ db: any, originalOperationId: string, baseCurrency: string, businessDate?: string, durablePersist?: Function, domainReverse?: Function }} opts
 */
export async function reverseOperation({
  db,
  originalOperationId,
  baseCurrency,
  businessDate = null,
  durablePersist = null,
  domainReverse = null,
}) {
  const original = loadOperation(db, originalOperationId);
  if (!original) {
    throw Object.assign(new Error("REVERSE_ORIGINAL_NOT_FOUND"), { code: "REVERSE_ORIGINAL_NOT_FOUND" });
  }
  if (original.status !== "posted") {
    throw Object.assign(new Error("REVERSE_NOT_POSTED"), { code: "REVERSE_NOT_POSTED" });
  }

  // already reversed?
  const chk = db.prepare(
    `SELECT id FROM fin_operations WHERE reverses_operation_id = ? LIMIT 1`
  );
  try {
    chk.bind([originalOperationId]);
    if (chk.step()) {
      chk.free();
      throw Object.assign(new Error("REVERSE_ALREADY"), { code: "REVERSE_ALREADY" });
    }
    chk.free();
  } catch (e) {
    if (e.code === "REVERSE_ALREADY") throw e;
    try {
      chk.free();
    } catch {
      /* column may not exist — fall through */
    }
  }

  const lines = loadJournalLines(db, originalOperationId);
  if (!lines.length) {
    throw Object.assign(new Error("REVERSE_NO_JOURNAL"), { code: "REVERSE_NO_JOURNAL" });
  }

  const inverse = lines.map((l) => {
    const side = l.side === "debit" ? "credit" : "debit";
    const args = {
      accountId: l.accountId,
      amount: String(l.amount),
      currency: l.currency,
      amountInBase: l.amountInBase != null ? String(l.amountInBase) : String(l.amount),
      exchangeRateToBase: l.exchangeRateToBase != null ? String(l.exchangeRateToBase) : "1",
      memo: `reverse:${l.memo || originalOperationId}`,
    };
    return side === "debit" ? debit(args) : credit(args);
  });

  const reverseId = newId("rev");
  const bDate = businessDate || original.business_date;

  return runAtomicFinancialOperation({
    db,
    commandId: "core.reverse",
    payload: { originalOperationId, reverseId },
    operationId: reverseId,
    businessDate: bDate,
    baseCurrency: baseCurrency || original.base_currency || "IRR",
    sourceFeature: "core",
    durablePersist,
    apply: async () => ({
      journal: { lines: inverse, memo: `reverses:${originalOperationId}` },
      domainWrite: (d) => {
        try {
          d.run(`UPDATE fin_operations SET reverses_operation_id = ? WHERE id = ?`, [
            originalOperationId,
            reverseId,
          ]);
        } catch {
          /* schema may lack column — store only in memo/payload path */
        }
        if (typeof domainReverse === "function") domainReverse(d, originalOperationId, reverseId);
      },
      resultData: { reversesOperationId: originalOperationId, reverseOperationId: reverseId },
    }),
  });
}
