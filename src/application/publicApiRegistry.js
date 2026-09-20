/**
 * Public API command + query registry.
 */

import { deposit } from "../features/accounts/commands/deposit.js";
import { createAccount } from "../features/accounts/commands/createAccount.js";
import { withdraw } from "../features/accounts/commands/withdraw.js";
import { transfer } from "../features/accounts/commands/transfer.js";
import { createIncome } from "../features/income/commands/create.js";
import { createExpense } from "../features/expense/commands/create.js";
import { createLoan } from "../features/loan/commands/createLoan.js";
import { queryPresentationBalance } from "../core/accounting/reports/presentationBalance.js";
import { queryAll, queryOne, getMeta } from "../core/persistence/browser/browserSqlAdapter.js";

export const commandHandlers = {
  "accounts.create": createAccount,
  "accounts.deposit": deposit,
  "accounts.withdraw": withdraw,
  "accounts.transfer": transfer,
  "income.create": createIncome,
  "expense.create": createExpense,
  "loan.create": createLoan,
};

export const queryHandlers = {
  "accounts.list": async ({ db }) => {
    const rows = queryAll(
      db,
      `SELECT id, code, name, account_kind, currency, is_archived, created_at, updated_at
       FROM fin_accounts WHERE is_archived = 0 ORDER BY name`
    );
    return rows.map((r) => ({
      ...r,
      presentationBalance: queryPresentationBalance(db, r.id, r.account_kind),
    }));
  },
  "accounts.get": async ({ db, params }) => {
    const r = queryOne(db, `SELECT * FROM fin_accounts WHERE id = ?`, [params.accountId]);
    if (!r) return null;
    return {
      ...r,
      presentationBalance: queryPresentationBalance(db, r.id, r.account_kind),
    };
  },
  "accounts.options": async ({ db }) => {
    return queryAll(
      db,
      `SELECT id, name, currency, account_kind FROM fin_accounts WHERE is_archived = 0 ORDER BY name`
    );
  },
  "meta.book": async ({ db }) => ({
    bookId: getMeta(db, "book_id"),
    baseCurrency: getMeta(db, "book_base_currency"),
    schemaVersion: getMeta(db, "schemaVersion"),
  }),
};

export function getCommandHandler(id) {
  return commandHandlers[id] || null;
}

export function getQueryHandler(id) {
  return queryHandlers[id] || null;
}
