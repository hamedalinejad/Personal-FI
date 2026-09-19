import { randomUUID } from "node:crypto";
import { runAtomicFinancialOperation } from "../../../core/domain/operation/operationEngine.js";
import { openDb } from "../../../core/persistence/port.js";
import { ensureAccount, scopedAccountId, assertAccountUsable } from "../../../core/accounting/chartOfAccounts.js";
import { requireOperationId, requirePayload, requirePositiveMoney, requireDate, requireCurrency } from "../../_shared/commandGuard.js";

/** expense.create — Dr expense / Cr cash */
export async function createExpense(input, { dataDir } = {}) {
  const operationId = requireOperationId(input);
  const p = requirePayload(input);
  if (!p.accountId) throw new Error("VALIDATION_ERROR:accountId");
  const amount = requirePositiveMoney(p.amount);
  const currency = requireCurrency(p.currency);
  const businessDate = requireDate(p.businessDate);
  const db = openDb(dataDir);
  const acc = db.prepare(`SELECT * FROM acc_accounts WHERE id = ?`).get(p.accountId);
  if (!acc) throw new Error("ACCOUNT_NOT_FOUND");
  if (acc.currency !== currency) throw new Error("ACCOUNT_CURRENCY_MISMATCH");
  assertAccountUsable(db, acc.fin_account_id, currency);

  const expenseId = scopedAccountId("expense_general", currency);
  ensureAccount(db, {
    id: expenseId,
    name: `Expense (${currency})`,
    accountKind: "expense",
    currency,
    systemRole: "expense_general",
  });

  const amt = amount.toFixed();
  const expTxId = randomUUID();
  const accTxId = randomUUID();
  const now = new Date().toISOString();
  const journalLines = [
    { accountId: expenseId, side: "debit", amount: amt, currency, amountInBase: amt, exchangeRateToBase: "1", lineKind: "other" },
    { accountId: acc.fin_account_id, side: "credit", amount: amt, currency, amountInBase: amt, exchangeRateToBase: "1", lineKind: "other" },
  ];

  const result = await runAtomicFinancialOperation({
    operationId,
    type: "expense.create",
    dataDir,
    businessDate,
    baseCurrency: currency,
    status: "posted",
    payload: { ...p, expTxId },
    journalLines,
    withinTransaction(db) {
      db.prepare(
        `INSERT INTO acc_transactions (id, account_id, operation_id, business_date, amount, currency, direction, memo, created_at)
         VALUES (?, ?, ?, ?, ?, ?, 'out', ?, ?)`,
      ).run(accTxId, p.accountId, operationId, businessDate, amt, currency, p.description || null, now);
      db.prepare(
        `INSERT INTO exp_transactions (
          id, operation_id, business_date, amount, currency, account_id, description, category_id,
          account_transaction_id, is_voided, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
      ).run(expTxId, operationId, businessDate, amt, currency, p.accountId, p.description || null, p.categoryId || null, accTxId, now, now);
    },
  });
  return { ...result, expTxId };
}
