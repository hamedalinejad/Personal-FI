/**
 * accounts.create — create a financial account.
 */

import { assertDbPassed } from "../../_shared/atomicDb.js";
import { stripZwAndSpace, normalizeIban, normalizeAccountNumber } from "../../../core/text/iranNormalize.js";

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
  const pl = payload || {};
  const name = stripZwAndSpace(pl.name);
  const accountKind = pl.accountKind;
  const currency = pl.currency;
  const code = pl.code != null ? stripZwAndSpace(pl.code) : null;
  const iban = pl.iban != null ? normalizeIban(pl.iban) : null;
  const accountNumber = pl.accountNumber != null ? normalizeAccountNumber(pl.accountNumber) : null;
  const bankName = pl.bankName != null ? stripZwAndSpace(pl.bankName) : null;
  const branch = pl.branch != null ? stripZwAndSpace(pl.branch) : null;
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
