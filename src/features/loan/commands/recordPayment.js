/**
 * loan.recordPayment — posts payment against active lender loan.
 * Updates status to paid_off when remaining principal reaches zero.
 * db-passed only (Wave-2).
 */

import { assertDbPassed } from "../../_shared/atomicDb.js";
import { resolveMoneyOperationFx, journalPair } from "../../_shared/operationFx.js";
import { toDecimal, canonicalDecimalString } from "../../../core/money/canonicalDecimal.js";

/**
 * @param {{ db: any, payload: object, baseCurrency: string }} ctx
 */
export async function recordPayment({ db, payload, baseCurrency }) {
  assertDbPassed(db, "loan.recordPayment");

  const {
    loanId,
    amount,
    currency,
    fxRate = null,
    businessDate,
    principalPortion = null,
    interestPortion = null,
    cashAccountId,
    memo = null,
    operationId = null,
  } = payload || {};

  if (!loanId) throw Object.assign(new Error("LOAN_ID_REQUIRED"), { code: "VALIDATION_ERROR" });
  if (amount == null || amount === "") {
    throw Object.assign(new Error("AMOUNT_REQUIRED"), { code: "VALIDATION_ERROR" });
  }
  if (!businessDate || !/^\d{4}-\d{2}-\d{2}$/.test(businessDate)) {
    throw Object.assign(new Error("BUSINESS_DATE_REQUIRED"), { code: "VALIDATION_ERROR" });
  }
  if (!cashAccountId) {
    throw Object.assign(new Error("CASH_ACCOUNT_REQUIRED"), { code: "VALIDATION_ERROR" });
  }

  const loanStmt = db.prepare("SELECT id, principal, currency, status, role FROM ln_loans WHERE id = ?");
  loanStmt.bind([loanId]);
  if (!loanStmt.step()) {
    loanStmt.free();
    throw Object.assign(new Error("LOAN_NOT_FOUND"), { code: "LOAN_NOT_FOUND" });
  }
  const loan = loanStmt.getAsObject();
  loanStmt.free();
  if (loan.status === "paid_off") {
    throw Object.assign(new Error("LOAN_ALREADY_PAID_OFF"), { code: "LOAN_ALREADY_PAID_OFF" });
  }

  const txnCcy = currency || loan.currency || baseCurrency;
  const fx = resolveMoneyOperationFx({
    bookBaseCurrency: baseCurrency,
    transactionCurrency: txnCcy,
    fxRate,
    amount,
  });

  const payAmt = toDecimal(fx.amountInTxn);
  let principalPart = principalPortion != null ? toDecimal(String(principalPortion)) : payAmt;
  let interestPart = interestPortion != null ? toDecimal(String(interestPortion)) : toDecimal("0");
  if (principalPortion == null && interestPortion == null) {
    // default: all to principal for simple path
    principalPart = payAmt;
    interestPart = toDecimal("0");
  }

  const opId =
    operationId ||
    (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `op-${Date.now()}`);
  const entryId =
    typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `je-${Date.now()}`;
  const now = new Date().toISOString();

  // Find receivable account by code pattern
  const recvStmt = db.prepare(
    "SELECT id FROM fin_accounts WHERE code = ? AND is_archived = 0 LIMIT 1"
  );
  recvStmt.bind([`loan.${loanId}`]);
  let receivableId = null;
  if (recvStmt.step()) {
    receivableId = recvStmt.getAsObject().id;
  }
  recvStmt.free();
  if (!receivableId) {
    throw Object.assign(new Error("LOAN_RECEIVABLE_ACCOUNT_MISSING"), { code: "LOAN_RECEIVABLE_ACCOUNT_MISSING" });
  }

  // Lender receives cash: debit cash, credit receivable (reduce asset)
  const pair = journalPair({
    debitAccountId: cashAccountId,
    creditAccountId: receivableId,
    amountInBase: fx.amountInBase,
    memo: memo || `loan.payment:${loanId}`,
  });

  db.run("BEGIN IMMEDIATE");
  try {
    db.run(
      `INSERT INTO fin_operations (
        id, command_hash, operation_type, status, durability_state,
        business_date, base_currency, source, created_at, posted_at
      ) VALUES (?, ?, ?, 'posted', 'committed', ?, ?, 'ui', ?, ?)`,
      [opId, null, "loan.recordPayment", businessDate, baseCurrency, now, now]
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

    // Feature payment row if table exists
    try {
      const txId =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `lpt-${Date.now()}`;
      db.run(
        `INSERT INTO ln_transactions (
          id, loan_id, operation_id, tx_type, amount, principal_portion, interest_portion, currency, business_date, created_at
        ) VALUES (?, ?, ?, 'payment', ?, ?, ?, ?, ?, ?)`,
        [
          txId,
          loanId,
          opId,
          fx.amountInTxn,
          canonicalDecimalString(principalPart.toFixed()),
          canonicalDecimalString(interestPart.toFixed()),
          txnCcy,
          businessDate,
          now,
        ]
      );
    } catch {
      /* optional */
    }

    // Simple paid_off heuristic: if payment >= remaining principal snapshot
    const remaining = toDecimal(loan.principal || "0").minus(principalPart);
    if (remaining.lte(0)) {
      db.run(`UPDATE ln_loans SET status = 'paid_off' WHERE id = ?`, [loanId]);
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
      loanId,
      amount: fx.amountInTxn,
      amountInBase: fx.amountInBase,
      principalPortion: canonicalDecimalString(principalPart.toFixed()),
      interestPortion: canonicalDecimalString(interestPart.toFixed()),
      currency: txnCcy,
      businessDate,
      statusHint: remaining.lte(0) ? "paid_off" : "active",
    },
  };
}
