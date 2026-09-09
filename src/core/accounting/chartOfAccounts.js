import { openDb } from "../persistence/worker.js";

export function ensureAccount(db, { id, name, accountKind, currency, systemRole = null }) {
  if (!id || !name || !accountKind || !currency) {
    throw new Error("ACCOUNT_INVALID");
  }
  if (!["asset", "liability", "equity", "income", "expense"].includes(accountKind)) {
    throw new Error("ACCOUNT_INVALID");
  }
  const now = new Date().toISOString();
  db.prepare(
    `INSERT OR IGNORE INTO fin_accounts (
      id, name, account_kind, currency, is_archived, created_at, updated_at, status, role
    ) VALUES (?, ?, ?, ?, 0, ?, ?, 'active', ?)`,
  ).run(id, name, accountKind, currency, now, now, systemRole);
  return getAccount(db, id);
}

export function getAccount(db, id) {
  const row = db.prepare(`SELECT * FROM fin_accounts WHERE id = ?`).get(id);
  if (!row) throw new Error("ACCOUNT_NOT_FOUND");
  if (row.is_archived === 1 || row.status === "closed") {
    throw new Error("ACCOUNT_INVALID");
  }
  return row;
}

export function assertAccountUsable(db, accountId, expectedCurrency) {
  const row = getAccount(db, accountId);
  if (expectedCurrency && row.currency !== expectedCurrency) {
    throw new Error("ACCOUNT_CURRENCY_MISMATCH");
  }
  return row;
}

export function bootstrapLoanEditionAccounts(dataDir, currency = "IRR") {
  const db = openDb(dataDir);
  const defs = [
    { id: "LOC-CASH", name: "Local settlement cash", accountKind: "asset", currency, systemRole: "local_settlement_cash" },
    { id: "LOAN-REC", name: "Loans receivable", accountKind: "asset", currency, systemRole: "loan_receivable" },
    { id: "LOAN-INT-INC", name: "Interest income", accountKind: "income", currency, systemRole: "loan_interest_income" },
    { id: "LOAN-FEE-INC", name: "Fee income", accountKind: "income", currency, systemRole: "loan_fee_income" },
    { id: "LOAN-PEN-INC", name: "Penalty income", accountKind: "income", currency, systemRole: "loan_penalty_income" },
  ];
  for (const d of defs) ensureAccount(db, d);
  return defs.map((d) => d.id);
}
