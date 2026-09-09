import { randomUUID } from "node:crypto";
import { generateSchedule } from "../domain/scheduleFacade.js";
import { runAtomicFinancialOperation } from "../../../core/domain/operation/operationEngine.js";
import { bootstrapLoanEditionAccounts } from "../../../core/accounting/chartOfAccounts.js";
import { localSettlementAdapter } from "../adapters/localSettlementAdapter.js";
import { insertLoan } from "../ledger/loanRepository.js";
import { insertScheduleSnapshot } from "../ledger/scheduleRepository.js";

/**
 * loan.create
 * Journal: DEBIT receivable / CREDIT cash = principal
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
  if (!p.currency && !baseCurrency) throw new Error("OP_BASE_CURRENCY_REQUIRED");

  const currency = p.currency || baseCurrency;
  const businessDate = p.businessDate || p.startDate;
  const annualRate = p.annualRate != null ? p.annualRate : "0";

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
    side: "credit",
    operationId,
    memo: "loan_disbursement",
  });
  // Convention: credit cash = money out to borrower; debit receivable
  // settle() with side credit on cash → other side debit on receivable ✓
  for (const line of settlement.journalLines) line.currency = currency;

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
    engineVersions: { loanSchedule: "1.0.0-period_based-equal-principal", money: "1.0.0" },
  });

  if (!result.idempotentReplay) {
    const now = new Date().toISOString();
    insertLoan(dataDir, {
      id: loanId,
      calculation_method: p.method,
      principal: p.principal,
      currency,
      interest_rate: annualRate,
      status: "active",
      created_at: now,
      start_date: p.startDate,
    });
    try {
      insertScheduleSnapshot(dataDir, {
        loanId,
        version: 1,
        rows: schedule.rows,
        effectiveFrom: p.startDate,
        operationId,
      });
    } catch {
      /* ignore unique */
    }
  }

  return { ...result, loanId };
}
