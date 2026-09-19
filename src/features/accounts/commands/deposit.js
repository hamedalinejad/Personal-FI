import { randomUUID } from "node:crypto";
import { runAtomicFinancialOperation } from "../../../core/domain/operation/operationEngine.js";
import { openDb } from "../../../core/persistence/port.js";
import { ensureAccount, scopedAccountId, assertAccountUsable } from "../../../core/accounting/chartOfAccounts.js";
import { requireOperationId, requirePayload, requirePositiveMoney, requireDate, requireCurrency } from "../../_shared/commandGuard.js";

/** accounts.deposit — Dr cash / Cr equity (opening) or income per policy */
export async function deposit(input, { dataDir } = {}) {
  const operationId = requireOperationId(input);
  const p = requirePayload(input);
  if (!p.accountId) throw new Error("VALIDATION_ERROR:accountId");
  const amount = requirePositiveMoney(p.amount);
  const currency = requireCurrency(p.currency);
  const businessDate = requireDate(p.businessDate);
  const policy = p.creditPolicy || "opening_equity"; // opening_equity | income
  const db = openDb(dataDir);
  const acc = db.prepare(`SELECT * FROM acc_accounts WHERE id = ?`).get(p.accountId);
  if (!acc) throw new Error("ACCOUNT_NOT_FOUND");
  if (acc.currency !== currency) throw new Error("ACCOUNT_CURRENCY_MISMATCH");
  assertAccountUsable(db, acc.fin_account_id, currency);

  const creditId =
    policy === "income"
      ? scopedAccountId("misc_income", currency)
      : scopedAccountId("opening_balances_equity", currency);
  ensureAccount(db, {
    id: creditId,
    name: policy === "income" ? `Misc income (${currency})` : `Opening equity (${currency})`,
    accountKind: policy === "income" ? "income" : "equity",
    currency,
    systemRole: policy === "income" ? "misc_income" : "opening_balances_equity",
  });

  const amt = amount.toFixed();
  const journalLines = [
    { accountId: acc.fin_account_id, side: "debit", amount: amt, currency, amountInBase: amt, exchangeRateToBase: "1", lineKind: "other" },
    { accountId: creditId, side: "credit", amount: amt, currency, amountInBase: amt, exchangeRateToBase: "1", lineKind: "other" },
  ];
  const txId = randomUUID();
  const now = new Date().toISOString();
  return runAtomicFinancialOperation({
    operationId,
    type: "accounts.deposit",
    dataDir,
    businessDate,
    baseCurrency: currency,
    status: "posted",
    payload: p,
    journalLines,
    withinTransaction(db) {
      db.prepare(
        `INSERT INTO acc_transactions (id, account_id, operation_id, business_date, amount, currency, direction, memo, created_at)
         VALUES (?, ?, ?, ?, ?, ?, 'in', ?, ?)`,
      ).run(txId, p.accountId, operationId, businessDate, amt, currency, p.memo || null, now);
    },
  });
}
