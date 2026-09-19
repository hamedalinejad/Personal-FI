import { randomUUID } from "node:crypto";
import { runAtomicFinancialOperation } from "../../../core/domain/operation/operationEngine.js";
import { openDb } from "../../../core/persistence/port.js";
import { ensureAccount, scopedAccountId, assertAccountUsable } from "../../../core/accounting/chartOfAccounts.js";
import { requireOperationId, requirePayload, requireDate } from "../../_shared/commandGuard.js";

/**
 * cheque.clear — cash effect at clear point only.
 * receivable: Dr cash / Cr cheque_receivable (or income if no AR account)
 * payable: Dr cheque_payable / Cr cash
 */
export async function clearCheque(input, { dataDir } = {}) {
  const operationId = requireOperationId(input);
  const p = requirePayload(input);
  if (!p.chequeId) throw new Error("VALIDATION_ERROR:chequeId");
  const businessDate = requireDate(p.businessDate);
  const db = openDb(dataDir);
  const row = db.prepare(`SELECT * FROM chk_cheques WHERE id = ?`).get(p.chequeId);
  if (!row) throw new Error("CHEQUE_NOT_FOUND");
  if (row.status !== "deposited" && row.status !== "issued") throw new Error("CHEQUE_INVALID_TRANSITION");
  if (!row.account_id) throw new Error("VALIDATION_ERROR:accountId");
  const acc = db.prepare(`SELECT * FROM acc_accounts WHERE id = ?`).get(row.account_id);
  if (!acc) throw new Error("ACCOUNT_NOT_FOUND");
  assertAccountUsable(db, acc.fin_account_id, row.currency);

  const currency = row.currency;
  const amt = row.amount;
  let journalLines;
  if (row.direction === "receivable") {
    const incomeId = scopedAccountId("cheque_receivable_income", currency);
    ensureAccount(db, {
      id: incomeId,
      name: `Cheque receivable income (${currency})`,
      accountKind: "income",
      currency,
      systemRole: "cheque_receivable_income",
    });
    journalLines = [
      { accountId: acc.fin_account_id, side: "debit", amount: amt, currency, amountInBase: amt, exchangeRateToBase: "1", lineKind: "other" },
      { accountId: incomeId, side: "credit", amount: amt, currency, amountInBase: amt, exchangeRateToBase: "1", lineKind: "other" },
    ];
  } else {
    const expId = scopedAccountId("cheque_payable_expense", currency);
    ensureAccount(db, {
      id: expId,
      name: `Cheque payable expense (${currency})`,
      accountKind: "expense",
      currency,
      systemRole: "cheque_payable_expense",
    });
    journalLines = [
      { accountId: expId, side: "debit", amount: amt, currency, amountInBase: amt, exchangeRateToBase: "1", lineKind: "other" },
      { accountId: acc.fin_account_id, side: "credit", amount: amt, currency, amountInBase: amt, exchangeRateToBase: "1", lineKind: "other" },
    ];
  }

  const now = new Date().toISOString();
  return runAtomicFinancialOperation({
    operationId,
    type: "cheque.clear",
    dataDir,
    businessDate,
    baseCurrency: currency,
    status: "posted",
    payload: p,
    journalLines,
    withinTransaction(db) {
      db.prepare(
        `UPDATE chk_cheques SET status = 'cleared', cleared_date = ?, effective_cash_date = ?, operation_id = ? WHERE id = ?`,
      ).run(businessDate, businessDate, operationId, p.chequeId);
    },
  });
}
