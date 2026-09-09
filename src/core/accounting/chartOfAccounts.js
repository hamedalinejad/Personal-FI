import { openDb } from "../persistence/port.js";

export function ensureAccount(db, { id, name, accountKind, currency, systemRole = null }) {
  if (!id || !name || !accountKind || !currency) {
    throw new Error("ACCOUNT_INVALID");
  }
  if (!["asset", "liability", "equity", "income", "expense"].includes(accountKind)) {
    throw new Error("ACCOUNT_INVALID");
  }
  const existing = db.prepare(`SELECT id, currency FROM fin_accounts WHERE id = ?`).get(id);
  if (existing && existing.currency !== currency) {
    throw new Error(`ACCOUNT_CURRENCY_CONFLICT:${id}:${existing.currency}!=${currency}`);
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

/** Stable account id: systemRole + currency (never cross-currency reuse). */
export function scopedAccountId(systemRole, currency) {
  if (!systemRole || !currency) throw new Error("ACCOUNT_SCOPE_INVALID");
  return `${systemRole}:${currency}`;
}

export function ensureLocalSettlementAccounts(db, currency = "IRR") {
  return ensureAccount(db, {
    id: scopedAccountId("local_settlement_cash", currency),
    name: `Local settlement cash (${currency})`,
    accountKind: "asset",
    currency,
    systemRole: "local_settlement_cash",
  });
}

export function ensureFeatureInventoryAccount(db, { featureKey, currency, displayName }) {
  const role = `${featureKey}_inventory`;
  return ensureAccount(db, {
    id: scopedAccountId(role, currency),
    name: displayName || `${featureKey} investment (${currency})`,
    accountKind: "asset",
    currency,
    systemRole: role,
  });
}

export function ensureLoanAccounts(db, currency = "IRR") {
  const defs = [
    { role: "loan_receivable", name: "Loans receivable", accountKind: "asset" },
    { role: "loan_interest_income", name: "Interest income", accountKind: "income" },
    { role: "loan_fee_income", name: "Fee income", accountKind: "income" },
    { role: "loan_penalty_income", name: "Penalty income", accountKind: "income" },
  ];
  const ids = [];
  for (const d of defs) {
    const acc = ensureAccount(db, {
      id: scopedAccountId(d.role, currency),
      name: `${d.name} (${currency})`,
      accountKind: d.accountKind,
      currency,
      systemRole: d.role,
    });
    ids.push(acc.id);
  }
  return ids;
}

/** @deprecated Loan-only; prefer ensureLoanAccounts + ensureLocalSettlementAccounts */
export function bootstrapLoanEditionAccounts(dataDir, currency = "IRR") {
  const db = openDb(dataDir);
  ensureLocalSettlementAccounts(db, currency);
  ensureLoanAccounts(db, currency);
  return [
    scopedAccountId("local_settlement_cash", currency),
    scopedAccountId("loan_receivable", currency),
    scopedAccountId("loan_interest_income", currency),
    scopedAccountId("loan_fee_income", currency),
    scopedAccountId("loan_penalty_income", currency),
  ];
}
