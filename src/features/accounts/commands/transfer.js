/**
 * accounts.transfer — multi-currency aware via resolveMoneyOperationFx per leg when needed.
 * Same-currency transfer is identity FX.
 */

import { resolveMoneyOperationFx, journalPair } from "../../_shared/operationFx.js";
import { assertDbPassed } from "../../_shared/atomicDb.js";

/**
 * @param {{ db: any, payload: object, baseCurrency: string }} ctx
 */
export async function transfer({ db, payload, baseCurrency }) {
  assertDbPassed(db, "accounts.transfer");
  const {
    fromAccountId,
    toAccountId,
    amount,
    currency,
    fxRate = null,
    businessDate,
    memo = null,
    operationId = null,
  } = payload || {};

  if (!fromAccountId || !toAccountId) {
    throw Object.assign(new Error("FROM_AND_TO_REQUIRED"), { code: "VALIDATION_ERROR" });
  }
  if (fromAccountId === toAccountId) {
    throw Object.assign(new Error("SAME_ACCOUNT_TRANSFER"), { code: "VALIDATION_ERROR" });
  }
  if (amount == null || amount === "") {
    throw Object.assign(new Error("AMOUNT_REQUIRED"), { code: "VALIDATION_ERROR" });
  }
  if (!businessDate || !/^\d{4}-\d{2}-\d{2}$/.test(businessDate)) {
    throw Object.assign(new Error("BUSINESS_DATE_REQUIRED"), { code: "VALIDATION_ERROR" });
  }

  const from = loadAccount(db, fromAccountId);
  const to = loadAccount(db, toAccountId);
  const txnCcy = currency || from.currency;

  if (from.currency !== txnCcy) {
    throw Object.assign(new Error("FROM_CURRENCY_MISMATCH"), { code: "VALIDATION_ERROR" });
  }
  if (to.currency !== from.currency) {
    throw Object.assign(
      new Error("CROSS_CURRENCY_TRANSFER_REQUIRES_TWO_LEG"),
      { code: "CROSS_CURRENCY_TRANSFER_REQUIRES_TWO_LEG" }
    );
  }

  const fx = resolveMoneyOperationFx({
    bookBaseCurrency: baseCurrency,
    transactionCurrency: txnCcy,
    fxRate: from.currency === to.currency ? "1" : fxRate,
    amount,
  });

  // For cross-account same book base: credit from, debit to (asset movement)
  // If target currency differs, still post amount_in_base; feature may need second FX later.
  const pair = journalPair({
    debitAccountId: toAccountId,
    creditAccountId: fromAccountId,
    amountInBase: fx.amountInBase,
    memo: memo || "transfer",
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
      [opId, null, "accounts.transfer", businessDate, baseCurrency, now, now]
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
      fromAccountId,
      toAccountId,
      amount: fx.amountInTxn,
      amountInBase: fx.amountInBase,
      currency: txnCcy,
      businessDate,
    },
  };
}

function loadAccount(db, id) {
  const stmt = db.prepare("SELECT id, currency, is_archived FROM fin_accounts WHERE id = ?");
  stmt.bind([id]);
  if (!stmt.step()) {
    stmt.free();
    throw Object.assign(new Error("ACCOUNT_NOT_FOUND"), { code: "ACCOUNT_NOT_FOUND" });
  }
  const row = stmt.getAsObject();
  stmt.free();
  if (row.is_archived === 1) {
    throw Object.assign(new Error("ACCOUNT_ARCHIVED"), { code: "ACCOUNT_ARCHIVED" });
  }
  return row;
}
