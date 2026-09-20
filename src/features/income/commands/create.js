/**
 * income.create — posts income with explicit category metadata (analytical).
 * Category does not create a second ledger; journal uses income account.
 */

import { resolveMoneyOperationFx, journalPair } from "../../_shared/operationFx.js";
import { assertDbPassed } from "../../_shared/atomicDb.js";

/**
 * @param {{ db: any, payload: object, baseCurrency: string }} ctx
 */
export async function createIncome({ db, payload, baseCurrency }) {
  assertDbPassed(db, "income.create");
  const {
    accountId,
    amount,
    currency,
    fxRate = null,
    businessDate,
    categoryId = null,
    memo = null,
    operationId = null,
  } = payload || {};

  if (!accountId) throw Object.assign(new Error("ACCOUNT_ID_REQUIRED"), { code: "VALIDATION_ERROR" });
  if (amount == null || amount === "") throw Object.assign(new Error("AMOUNT_REQUIRED"), { code: "VALIDATION_ERROR" });
  if (!businessDate || !/^\d{4}-\d{2}-\d{2}$/.test(businessDate)) {
    throw Object.assign(new Error("BUSINESS_DATE_REQUIRED"), { code: "VALIDATION_ERROR" });
  }

  const txnCcy = currency || baseCurrency;
  const fx = resolveMoneyOperationFx({
    bookBaseCurrency: baseCurrency,
    transactionCurrency: txnCcy,
    fxRate,
    amount,
  });

  const acct = loadAccount(db, accountId, txnCcy);
  const incomeAcctId = ensureSystemAccount(db, "income.general", baseCurrency, new Date().toISOString());

  const pair = journalPair({
    debitAccountId: accountId,
    creditAccountId: incomeAcctId,
    amountInBase: fx.amountInBase,
    memo: memo || "income",
  });

  const opId =
    operationId ||
    (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `op-${Date.now()}`);
  const entryId =
    typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `je-${Date.now()}`;
  const now = new Date().toISOString();

  db.run("BEGIN IMMEDIATE");
  try {
    db.run(
      `INSERT INTO fin_operations (
        id, command_hash, operation_type, status, durability_state,
        business_date, base_currency, source, created_at, posted_at
      ) VALUES (?, ?, ?, 'posted', 'committed', ?, ?, 'ui', ?, ?)`,
      [opId, null, "income.create", businessDate, baseCurrency, now, now]
    );
    db.run(
      `INSERT INTO fin_journal_entries (id, operation_id, business_date, memo, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [entryId, opId, businessDate, memo, now]
    );
    for (const line of pair.lines) {
      const lineId =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `jl-${Math.random().toString(36).slice(2)}`;
      db.run(
        `INSERT INTO fin_journal_lines (
          id, entry_id, account_id, side, amount, currency,
          amount_in_base, exchange_rate_to_base, memo
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          lineId,
          entryId,
          line.accountId,
          line.side,
          fx.amountInTxn,
          txnCcy,
          line.amount,
          fx.fxRate,
          pair.memo,
        ]
      );
    }
    // Analytical category stored in audit payload only (P1-28: category ≠ ledger account)
    if (categoryId) {
      const auditId =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `aud-${Date.now()}`;
      db.run(
        `INSERT INTO fin_audit_log (
          id, actor, source, reason, operation_id, entity_type, entity_id, action, at, payload_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          auditId,
          "user",
          "ui",
          "income.category",
          opId,
          "category",
          categoryId,
          "income.create",
          now,
          JSON.stringify({ categoryId, operationId: opId }),
        ]
      );
    }
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
    data: {
      operationId: opId,
      accountId,
      amount: fx.amountInTxn,
      amountInBase: fx.amountInBase,
      currency: txnCcy,
      categoryId,
      businessDate,
    },
  };
}

function loadAccount(db, id, expectedCcy) {
  const stmt = db.prepare("SELECT id, currency, is_archived FROM fin_accounts WHERE id = ?");
  stmt.bind([id]);
  if (!stmt.step()) {
    stmt.free();
    throw Object.assign(new Error("ACCOUNT_NOT_FOUND"), { code: "ACCOUNT_NOT_FOUND" });
  }
  const row = stmt.getAsObject();
  stmt.free();
  if (row.is_archived === 1) throw Object.assign(new Error("ACCOUNT_ARCHIVED"), { code: "ACCOUNT_ARCHIVED" });
  if (row.currency !== expectedCcy) {
    throw Object.assign(new Error("ACCOUNT_CURRENCY_MISMATCH"), { code: "VALIDATION_ERROR" });
  }
  return row;
}

function ensureSystemAccount(db, code, currency, now) {
  const stmt = db.prepare("SELECT id FROM fin_accounts WHERE code = ? AND currency = ?");
  stmt.bind([code, currency]);
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return row.id;
  }
  stmt.free();
  const id =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `sys-${code}-${Date.now()}`;
  db.run(
    `INSERT INTO fin_accounts (id, code, name, account_kind, currency, is_archived, created_at, updated_at)
     VALUES (?, ?, ?, 'income', ?, 0, ?, ?)`,
    [id, code, code, currency, now, now]
  );
  return id;
}
