/**
 * Public API command + query registry.
 * Maps command ids to handlers. Host uses this at execute boundary.
 */

import { deposit } from "../features/accounts/commands/deposit.js";
import { createAccount } from "../features/accounts/commands/createAccount.js";
import { queryPresentationBalance } from "../core/accounting/reports/presentationBalance.js";
import { queryAll, queryOne, getMeta } from "../core/persistence/browser/browserSqlAdapter.js";
// Note: paths relative to src/application

export const commandHandlers = {
  "accounts.create": createAccount,
  "accounts.deposit": deposit,
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
