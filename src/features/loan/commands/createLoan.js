import { randomUUID } from "node:crypto";
import { buildSchedule } from "../../../core/domain/loan/scheduleEngine.js";
import { runAtomicFinancialOperation } from "../../../core/domain/operation/operationEngine.js";
import { settle } from "../../../core/domain/cash/settlementAdapter.js";

/**
 * loan.create — requires startDate, principal, periods, method
 */
export async function createLoan(input, { dataDir, cashAccountId = "LOC-CASH", receivableAccountId = "LOAN-REC" } = {}) {
  const operationId = input.operationId || randomUUID();
  const p = input.payload || input;
  if (!p.startDate) throw new Error("LOAN_START_DATE_REQUIRED");
  if (!p.principal || !p.periods || !p.method) throw new Error("VALIDATION_ERROR");

  const schedule = buildSchedule(p.method, {
    principal: p.principal,
    annualRate: p.annualRate || "0",
    periods: p.periods,
    startDate: p.startDate,
    feePercent: p.feePercent,
    dayCount: p.dayCount || "period_based",
  });

  const settlement = settle({
    finAccountId: cashAccountId,
    counterAccountId: receivableAccountId,
    amount: p.principal,
    side: "credit",
    operationId,
    memo: "loan_disbursement",
  });

  const result = await runAtomicFinancialOperation({
    operationId,
    type: "loan.create",
    dataDir,
    payload: p,
    journalLines: settlement.journalLines,
    domainResult: { schedule, loan: { principal: p.principal, startDate: p.startDate, method: p.method } },
    engineVersions: { loanSchedule: "1.0.0-period_based", money: "1.0.0" },
  });

  return result;
}
