import { randomUUID } from "node:crypto";
import { generateSchedule } from "../domain/scheduleFacade.js";
import { runAtomicFinancialOperation } from "../../../core/domain/operation/operationEngine.js";
import { bootstrapLoanEditionAccounts } from "../../../core/accounting/chartOfAccounts.js";
import { localSettlementAdapter } from "../adapters/localSettlementAdapter.js";

/**
 * loan.create — journal + ln_loans + schedule snapshot in ONE SQLite transaction
 * (via persistOperation.withinTransaction)
 *
 * declining_balance v1 = equal-principal (engineVersions lock).
 * Annuity/fixed-PMT = future engine version — never silent swap.
 */
export async function createLoan(
  input,
  {
    dataDir,
    cashAccountId = "LOC-CASH",
    receivableAccountId = "LOAN-REC",
    baseCurrency = "IRR",
  } = {},
) {
  const operationId = input.operationId || randomUUID();
  const p = input.payload || input;
  if (!p.startDate) throw new Error("LOAN_START_DATE_REQUIRED");
  if (!p.principal || !p.periods || !p.method) throw new Error("VALIDATION_ERROR");
  // Master Spec §30: only lent supported until liability COA exists
  const role = p.role || p.direction || "lent";
  if (role === "borrowed") throw new Error("LOAN_ROLE_DEFERRED:borrowed");
  if (role !== "lent") throw new Error("LOAN_ROLE_UNSUPPORTED");

  const currency = p.currency || baseCurrency;
  const businessDate = p.businessDate || p.startDate;
  const annualRate = p.annualRate != null ? p.annualRate : "0";
  const engineVersion = "1.0.0-period_based-equal-principal";

  bootstrapLoanEditionAccounts(dataDir, currency);

  const schedule = generateSchedule({
    method: p.method,
    principal: p.principal,
    annualRate,
    periods: p.periods,
    startDate: p.startDate,
    dayCount: p.dayCount || "period_based",
    feePercent: p.feePercent,
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

  const snapshotId = randomUUID();
  const now = new Date().toISOString();

  const result = await runAtomicFinancialOperation({
    operationId,
    type: "loan.create",
    dataDir,
    businessDate,
    baseCurrency: currency,
    payload: { ...p, loanId, annualRate, currency },
    journalLines: settlement.journalLines,
    domainResult: {
      schedule,
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
        annualRate,
        now,
        p.startDate,
        operationId,
        Number(p.periods),
        p.dayCount || "period_based",
        engineVersion,
        p.notes || null,
      );
      db.prepare(
        `INSERT INTO ln_schedule_snapshots (id, loan_id, version, snapshot_json, effective_from, operation_id)
         VALUES (?, ?, 1, ?, ?, ?)`,
      ).run(snapshotId, loanId, JSON.stringify(schedule.rows), p.startDate, operationId);
    },
  });

  return { ...result, loanId };
}
