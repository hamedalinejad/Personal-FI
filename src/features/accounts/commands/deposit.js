/**
 * accounts.deposit — explicit source classification required (P1-29).
 * No silent default for inflowKind.
 * Uses resolveMoneyOperationFx; journal is SoT.
 */

import { resolveMoneyOperationFx, journalPair } from "../../_shared/operationFx.js";
import { assertDbPassed } from "../../_shared/atomicDb.js";

const ALLOWED_INFLOW_KINDS = Object.freeze([
  "opening_equity",
  "external_income",
  "internal_transfer",
  "loan_disbursement",
  "investment_proceeds",
  "other",
]);

/**
 * @param {{ db: any, payload: object, baseCurrency: string, bookId: string }} ctx
 */
export async function deposit({ db, payload, baseCurrency }) {
  assertDbPassed(db, "accounts.deposit");

  const {
    accountId,
    amount,
    currency,
    fxRate = null,
    businessDate,
    inflowKind,
    memo = null,
    operationId = null,
  } = payload || {};

  if (!accountId) throw Object.assign(new Error("ACCOUNT_ID_REQUIRED"), { code: "VALIDATION_ERROR" });
  if (amount == null || amount === "") throw Object.assign(new Error("AMOUNT_REQUIRED"), { code: "VALIDATION_ERROR" });
  if (!businessDate || !/^\d{4}-\d{2}-\d{2}$/.test(businessDate)) {
    throw Object.assign(new Error("BUSINESS_DATE_REQUIRED"), { code: "VALIDATION_ERROR" });
  }
  if (!inflowKind || !ALLOWED_INFLOW_KINDS.includes(inflowKind)) {
    throw Object.assign(
      new Error(`INFLOW_KIND_REQUIRED: one of ${ALLOWED_INFLOW_KINDS.join(", ")}`),
      { code: "VALIDATION_ERROR" }
    );
  }

  const txnCcy = currency || baseCurrency;
  const fx = resolveMoneyOperationFx({
    bookBaseCurrency: baseCurrency,
    transactionCurrency: txnCcy,
    fxRate,
    amount,
  });

  const acctStmt = db.prepare("SELECT id, currency, is_archived FROM fin_accounts WHERE id = ?");
  acctStmt.bind([accountId]);
  if (!acctStmt.step()) {
    acctStmt.free();
    throw Object.assign(new Error("ACCOUNT_NOT_FOUND"), { code: "ACCOUNT_NOT_FOUND" });
  }
  const acct = acctStmt.getAsObject();
  acctStmt.free();
  if (acct.is_archived === 1) {
    throw Object.assign(new Error("ACCOUNT_ARCHIVED"), { code: "ACCOUNT_ARCHIVED" });
  }
  if (acct.currency !== txnCcy) {
    throw Object.assign(new Error("ACCOUNT_CURRENCY_MISMATCH"), { code: "VALIDATION_ERROR" });
  }

  const opId =
    operationId ||
    (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `op-${Date.now()}`);
  const entryId =
    typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `je-${Date.now()}`;
  const now = new Date().toISOString();

  const offsetAccountId = ensureSystemAccount(
    db,
    inflowKind === "opening_equity" ? "equity.opening" : "income.external",
    baseCurrency,
    now
  );

  const pair = journalPair({
    debitAccountId: accountId,
    creditAccountId: offsetAccountId,
    amountInBase: fx.amountInBase,
    memo: memo || `deposit:${inflowKind}`,
  });

  db.run("BEGIN IMMEDIATE");
  try {
    db.run(
      `INSERT INTO fin_operations (
        id, command_hash, operation_type, status, durability_state,
        business_date, base_currency, source, created_at, posted_at
      ) VALUES (?, ?, ?, 'posted', 'committed', ?, ?, 'ui', ?, ?)`,
      [opId, null, "accounts.deposit", businessDate, baseCurrency, now, now]
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
        `deposit:${inflowKind}`,
        opId,
        "fin_accounts",
        accountId,
        "accounts.deposit",
        now,
        JSON.stringify({
          accountId,
          amount: fx.amountInTxn,
          amountInBase: fx.amountInBase,
          currency: txnCcy,
          fxRate: fx.fxRate,
          inflowKind,
          operationId: opId,
        }),
      ]
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
    data: {
      operationId: opId,
      accountId,
      amount: fx.amountInTxn,
      amountInBase: fx.amountInBase,
      currency: txnCcy,
      fxRate: fx.fxRate,
      inflowKind,
      businessDate,
    },
  };
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
  const kind = code.startsWith("equity") ? "equity" : "income";
  db.run(
    `INSERT INTO fin_accounts (id, code, name, account_kind, currency, is_archived, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 0, ?, ?)`,
    [id, code, code, kind, currency, now, now]
  );
  return id;
}

export const DEPOSIT_INFLOW_KINDS = ALLOWED_INFLOW_KINDS;
