import { randomUUID } from "node:crypto";
import { runAtomicFinancialOperation } from "../../../core/domain/operation/operationEngine.js";
import { openDb } from "../../../core/persistence/port.js";
import { assertAccountUsable } from "../../../core/accounting/chartOfAccounts.js";
import { requireOperationId, requirePayload, requirePositiveMoney, requireDate, requireCurrency } from "../../_shared/commandGuard.js";
import { toDecimal } from "../../../core/money/canonicalDecimal.js";

/** accounts.transfer — Dr destination / Cr source */
export async function transfer(input, { dataDir } = {}) {
  const operationId = requireOperationId(input);
  const p = requirePayload(input);
  if (!p.fromAccountId || !p.toAccountId) throw new Error("VALIDATION_ERROR:accounts");
  if (p.fromAccountId === p.toAccountId) throw new Error("VALIDATION_ERROR:sameAccount");
  const amount = requirePositiveMoney(p.amount);
  const currency = requireCurrency(p.currency);
  const businessDate = requireDate(p.businessDate);
  const db = openDb(dataDir);
  const from = db.prepare(`SELECT * FROM acc_accounts WHERE id = ?`).get(p.fromAccountId);
  const to = db.prepare(`SELECT * FROM acc_accounts WHERE id = ?`).get(p.toAccountId);
  if (!from || !to) throw new Error("ACCOUNT_NOT_FOUND");
  if (from.currency !== currency || to.currency !== currency) throw new Error("ACCOUNT_CURRENCY_MISMATCH");
  assertAccountUsable(db, from.fin_account_id, currency);
  assertAccountUsable(db, to.fin_account_id, currency);

  const amt = amount.toFixed();
  const journalLines = [
    { accountId: to.fin_account_id, side: "debit", amount: amt, currency, amountInBase: amt, exchangeRateToBase: "1", lineKind: "other" },
    { accountId: from.fin_account_id, side: "credit", amount: amt, currency, amountInBase: amt, exchangeRateToBase: "1", lineKind: "other" },
  ];
  const txFrom = randomUUID();
  const txTo = randomUUID();
  const now = new Date().toISOString();

  return runAtomicFinancialOperation({
    operationId,
    type: "accounts.transfer",
    dataDir,
    businessDate,
    baseCurrency: currency,
    status: "posted",
    payload: p,
    journalLines,
    withinTransaction(db) {
      db.prepare(
        `INSERT INTO acc_transactions (id, account_id, operation_id, business_date, amount, currency, direction, memo, created_at)
         VALUES (?, ?, ?, ?, ?, ?, 'out', ?, ?)`,
      ).run(txFrom, p.fromAccountId, operationId, businessDate, amt, currency, p.memo || null, now);
      db.prepare(
        `INSERT INTO acc_transactions (id, account_id, operation_id, business_date, amount, currency, direction, memo, created_at)
         VALUES (?, ?, ?, ?, ?, ?, 'in', ?, ?)`,
      ).run(txTo, p.toAccountId, operationId, businessDate, amt, currency, p.memo || null, now);
    },
  });
}
