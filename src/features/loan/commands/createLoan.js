/**
 * loan.create — lender path (v1 supported).
 * Uses scheduleEngine; posts opening journal; db-passed only (Wave-2).
 * Schema-aligned with ln_loans / ln_schedule_snapshots.
 */

import { assertDbPassed } from "../../_shared/atomicDb.js";
import { resolveMoneyOperationFx, journalPair } from "../../_shared/operationFx.js";
import { buildSchedule } from "../../../core/domain/loan/scheduleEngine.js";
import { canonicalDecimalString } from "../../../core/money/canonicalDecimal.js";

/**
 * @param {{ db: any, payload: object, baseCurrency: string }} ctx
 */
export async function createLoan({ db, payload, baseCurrency }) {
  assertDbPassed(db, "loan.create");

  const pl = payload || {};
  const name = pl.name || pl.counterpartyName || (pl.role === "borrowed" ? "وام دریافتی" : "وام پرداختی");
  const principal = pl.principal;
  const annualRate = pl.annualRate ?? pl.interestRate ?? "0";
  const periods = pl.periods ?? pl.termPeriods ?? "12";
  const startDate = pl.startDate || pl.businessDate;
  const currency = pl.currency;
  const fxRate = pl.fxRate ?? null;
  const cashAccountId = pl.cashAccountId || pl.accountId || null;
  const memo = pl.memo ?? null;
  const operationId = pl.operationId ?? null;
  const calculationMethod = pl.calculationMethod || "declining_balance";
  const role = pl.role === "borrowed" ? "borrowed" : "lent";

  if (principal == null || principal === "") {
    throw Object.assign(new Error("PRINCIPAL_REQUIRED"), { code: "VALIDATION_ERROR" });
  }
  if (!periods || Number(periods) <= 0) {
    throw Object.assign(new Error("PERIODS_REQUIRED"), { code: "VALIDATION_ERROR" });
  }
  if (!startDate || !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
    throw Object.assign(new Error("START_DATE_REQUIRED"), { code: "VALIDATION_ERROR" });
  }
  if (!cashAccountId) {
    throw Object.assign(new Error("CASH_ACCOUNT_REQUIRED"), { code: "VALIDATION_ERROR" });
  }

  const txnCcy = currency || baseCurrency;
  const fx = resolveMoneyOperationFx({
    bookBaseCurrency: baseCurrency,
    transactionCurrency: txnCcy,
    fxRate,
    amount: principal,
  });

  const schedule = buildSchedule(calculationMethod, {
    principal: fx.amountInTxn,
    annualRate: String(annualRate),
    periods: String(periods),
    startDate,
  });

  const loanId =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `loan-${Date.now()}`;
  const opId =
    operationId ||
    (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `op-${Date.now()}`);
  const entryId =
    typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `je-${Date.now()}`;
  const now = new Date().toISOString();

  const receivableId = ensureLoanReceivableAccount(db, loanId, name, txnCcy, now);

  // Lender: debit loan receivable, credit cash
  const pair = journalPair({
    debitAccountId: receivableId,
    creditAccountId: cashAccountId,
    amountInBase: fx.amountInBase,
    memo: memo || `loan.create:${name}`,
  });

  db.run("BEGIN IMMEDIATE");
  try {
    db.run(
      `INSERT INTO ln_loans (
        id, role, calculation_method, principal, currency, interest_rate, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'active', ?)`,
      [
        loanId,
        role,
        calculationMethod,
        fx.amountInTxn,
        txnCcy,
        canonicalDecimalString(String(annualRate)),
        now,
      ]
    );

    const snapId =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `snap-${Date.now()}`;
    db.run(
      `INSERT INTO ln_schedule_snapshots (
        id, loan_id, version, snapshot_json, effective_from, operation_id
      ) VALUES (?, ?, 1, ?, ?, ?)`,
      [snapId, loanId, JSON.stringify({ name, periods, startDate, schedule }), startDate, opId]
    );

    db.run(
      `INSERT INTO fin_operations (
        id, command_hash, operation_type, status, durability_state,
        business_date, base_currency, source, created_at, posted_at
      ) VALUES (?, ?, ?, 'posted', 'committed', ?, ?, 'ui', ?, ?)`,
      [opId, null, "loan.create", startDate, baseCurrency, now, now]
    );
    db.run(
      `INSERT INTO fin_journal_entries (id, operation_id, business_date, memo, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [entryId, opId, startDate, memo, now]
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
      loanId,
      operationId: opId,
      principal: fx.amountInTxn,
      amountInBase: fx.amountInBase,
      currency: txnCcy,
      periods: Number(periods),
      schedulePreview: Array.isArray(schedule) ? schedule.slice(0, 3) : schedule?.rows?.slice(0, 3) || schedule,
      status: "active",
      role: "lent",
    },
  };
}

function ensureLoanReceivableAccount(db, loanId, name, currency, now) {
  const id =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `ln-recv-${loanId}`;
  db.run(
    `INSERT INTO fin_accounts (id, code, name, account_kind, currency, is_archived, created_at, updated_at)
     VALUES (?, ?, ?, 'asset.receivable', ?, 0, ?, ?)`,
    [id, `loan.${loanId}`, name, currency, now, now]
  );
  return id;
}
