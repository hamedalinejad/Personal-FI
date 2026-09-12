import { randomUUID } from "node:crypto";
import { generateSchedule } from "../domain/scheduleFacade.js";
import { runAtomicFinancialOperation } from "../../../core/domain/operation/operationEngine.js";
import { bootstrapLoanEditionAccounts, scopedAccountId } from "../../../core/accounting/chartOfAccounts.js";
import { localSettlementAdapter } from "../adapters/localSettlementAdapter.js";
import { buildScheduleSnapshot } from "../domain/scheduleSnapshot.js";
import { normalizeRatePercentage } from "../../../core/domain/loan/scheduleEngine.js";

/** Integer period count only (not a money amount). */
function parsePeriods(v) {
  if (v == null || v === "") throw new Error("VALIDATION_ERROR:periods");
  const s = String(v).trim();
  if (!/^[0-9]+$/.test(s)) throw new Error("VALIDATION_ERROR:periods");
  const n = Number(s);
  if (!Number.isFinite(n) || n <= 0) throw new Error("VALIDATION_ERROR:periods");
  return n;
}

/**
 * loan.create — no silent defaults; all domain writes inside one SQLite txn.
 */
export async function createLoan(
  input,
  {
    dataDir,
    cashAccountId = null,
    receivableAccountId = null,
    operationBaseCurrency,
  } = {},
) {
  if (!input || typeof input !== "object") throw new Error("VALIDATION_ERROR");
  if (!input.operationId || typeof input.operationId !== "string") {
    throw new Error("OP_OPERATION_ID_REQUIRED");
  }
  const operationId = input.operationId;
  const p = input.payload || input;

  if (!p.role) throw new Error("LOAN_ROLE_REQUIRED");
  if (p.role === "borrowed") throw new Error("LOAN_ROLE_DEFERRED:borrowed");
  if (p.role !== "lent") throw new Error("LOAN_ROLE_UNSUPPORTED");
  if (!p.principal) throw new Error("LOAN_PRINCIPAL_REQUIRED");
  if (!p.currency) throw new Error("LOAN_CURRENCY_REQUIRED");
  if (p.annualRate == null || p.annualRate === "") throw new Error("LOAN_RATE_REQUIRED");
  if (!p.periods) throw new Error("LOAN_PERIODS_REQUIRED");
  if (!p.method) throw new Error("LOAN_METHOD_REQUIRED");
  if (!p.startDate) throw new Error("LOAN_START_DATE_REQUIRED");
  if (!p.businessDate) throw new Error("OP_BUSINESS_DATE_REQUIRED");
  if (!p.dayCount) throw new Error("LOAN_DAY_COUNT_REQUIRED");
  if (p.dayCount !== "period_based") throw new Error("LOAN_DAY_COUNT_UNSUPPORTED");

  const currency = p.currency;
  const baseCurrency = operationBaseCurrency || p.baseCurrency || currency;
  if (currency !== baseCurrency) {
    throw new Error("LOAN_MULTI_CURRENCY_DEFERRED");
  }

  const engineVersion = "1.0.0-period_based-equal-principal";
  const rateFractional = normalizeRatePercentage(p.annualRate).toFixed();

  bootstrapLoanEditionAccounts(dataDir, currency);
  if (!cashAccountId) cashAccountId = scopedAccountId("local_settlement_cash", currency);
  if (!receivableAccountId) receivableAccountId = scopedAccountId("loan_receivable", currency);


  const schedule = generateSchedule({
    method: p.method,
    principal: p.principal,
    annualRate: p.annualRate,
    periods: p.periods,
    startDate: p.startDate,
    dayCount: p.dayCount,
    feePercent: p.feePercent,
  });

  const snapshot = buildScheduleSnapshot({
    schedule,
    rateInput: p.annualRate,
    rateFractional,
    currency,
    engineVersion,
  });

  const loanId = p.loanId || randomUUID();
  const settlement = localSettlementAdapter.settle({
    finAccountId: cashAccountId,
    counterAccountId: receivableAccountId,
    amount: p.principal,
    currency,
    side: "credit",
    operationId,
    memo: "loan_disbursement",
  });
  for (const line of settlement.journalLines) {
    line.lineKind = "principal";
    line.amountInBase = line.amount;
    line.exchangeRateToBase = "1";
  }

  const snapshotId = randomUUID();
  const now = new Date().toISOString();

  const result = await runAtomicFinancialOperation({
    operationId,
    type: "loan.create",
    dataDir,
    businessDate: p.businessDate,
    baseCurrency,
    payload: { ...p, loanId },
    journalLines: settlement.journalLines,
    domainResult: {
      schedule: snapshot,
      loan: { id: loanId, principal: p.principal, startDate: p.startDate, method: p.method },
    },
    engineVersions: { loanSchedule: engineVersion, money: "1.0.0" },
    withinTransaction(db) {
      db.prepare(
        `INSERT INTO ln_loans (
          id, role, calculation_method, principal, currency, interest_rate, status, created_at,
          start_date, operation_id, total_installments, day_count, schedule_engine_version, notes
        ) VALUES (?, 'lent', ?, ?, ?, ?, 'active', ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        loanId,
        p.method,
        p.principal,
        currency,
        p.annualRate,
        now,
        p.startDate,
        operationId,
        parsePeriods(p.periods),
        p.dayCount,
        engineVersion,
        p.notes || null,
      );
      db.prepare(
        `INSERT INTO ln_schedule_snapshots (id, loan_id, version, snapshot_json, effective_from, operation_id)
         VALUES (?, ?, 1, ?, ?, ?)`,
      ).run(snapshotId, loanId, JSON.stringify(snapshot), p.startDate, operationId);
    },
  });

  return { ...result, loanId };
}
