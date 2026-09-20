/**
 * accounts.create — create a financial account.
 */

import { assertDbPassed } from "../../_shared/atomicDb.js";

const ALLOWED_KINDS = Object.freeze([
  "asset.cash",
  "asset.bank",
  "asset.receivable",
  "liability.payable",
  "liability.loan",
  "equity",
  "income",
  "expense",
]);

/**
 * @param {{ db: any, payload: object, baseCurrency: string }} ctx
 */
export async function createAccount({ db, payload, baseCurrency }) {
  assertDbPassed(db, "accounts.create");
  const { name, accountKind, currency, code = null } = payload || {};
  if (!name || typeof name !== "string") {
    throw Object.assign(new Error("NAME_REQUIRED"), { code: "VALIDATION_ERROR" });
  }
  if (!accountKind || !ALLOWED_KINDS.includes(accountKind)) {
    throw Object.assign(
      new Error(`ACCOUNT_KIND_REQUIRED: one of ${ALLOWED_KINDS.join(", ")}`),
      { code: "VALIDATION_ERROR" }
    );
  }
  const ccy = currency || baseCurrency;
  if (!/^[A-Z]{3}$/.test(ccy)) {
    throw Object.assign(new Error("CURRENCY_INVALID"), { code: "VALIDATION_ERROR" });
  }

  const id =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `acct-${Date.now()}`;
  const now = new Date().toISOString();

  db.run("BEGIN IMMEDIATE");
  try {
    db.run(
      `INSERT INTO fin_accounts (id, code, name, account_kind, currency, is_archived, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 0, ?, ?)`,
      [id, code, name, accountKind, ccy, now, now]
    );
    db.run("COMMIT");
  } catch (e) {
    try {
      db.run("ROLLBACK");
    } catch {
      /* ignore */
    }
    throw e;
  }

  return {
    success: true,
    data: { accountId: id, name, accountKind, currency: ccy },
  };
}

export const ACCOUNT_KINDS = ALLOWED_KINDS;
