import { randomUUID } from "node:crypto";
import { openDb } from "../../../core/persistence/port.js";
import { ensureAccount, scopedAccountId } from "../../../core/accounting/chartOfAccounts.js";
import { requireOperationId, requirePayload, requireCurrency } from "../../_shared/commandGuard.js";

const OP_KINDS = new Set([
  "cash","bank_account","card","wallet","brokerage_cash","crypto_exchange_cash","cash_equivalent","credit_account",
]);

/** accounts.create — master data; journal only if openingBalance explicit */
export async function createAccount(input, { dataDir } = {}) {
  const operationId = requireOperationId(input);
  const p = requirePayload(input);
  if (!p.name) throw new Error("VALIDATION_ERROR:name");
  const currency = requireCurrency(p.currency);
  if (!p.accountKind || !OP_KINDS.has(p.accountKind)) throw new Error("VALIDATION_ERROR:accountKind");
  if (p.openingBalance != null && p.openingBalance !== "") {
    throw new Error("ACCOUNTS_OPENING_BALANCE_USE_DEPOSIT"); // force explicit deposit path
  }
  const db = openDb(dataDir);
  const finId = p.finAccountId || scopedAccountId(`user_cash_${p.accountKind}`, currency) + ":" + randomUUID().slice(0, 8);
  ensureAccount(db, {
    id: finId,
    name: p.name,
    accountKind: p.accountKind === "credit_account" ? "liability" : "asset",
    currency,
    systemRole: "user_operational_cash",
  });
  const accId = p.id || randomUUID();
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO acc_accounts (
      id, fin_account_id, name, currency, account_kind, status, is_archived, current_balance, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, 'active', 0, '0', ?, ?)`,
  ).run(accId, finId, p.name, currency, p.accountKind, now, now);
  return { operationId, accountId: accId, finAccountId: finId, status: "posted" };
}
