import { randomUUID } from "node:crypto";
import { buildSchedule } from "../../../core/domain/loan/scheduleEngine.js";
import { runAtomicFinancialOperation } from "../../../core/domain/operation/operationEngine.js";
import { settle } from "../../../core/domain/cash/settlementAdapter.js";
import { bootstrapLoanEditionAccounts } from "../../../core/accounting/chartOfAccounts.js";
import { openDb } from "../../../core/persistence/worker.js";

export async function createLoan(
  input,
  { dataDir, cashAccountId = "LOC-CASH", receivableAccountId = "LOAN-REC", baseCurrency = "IRR" } = {},
) {
  const operationId = input.operationId || randomUUID();
  if (typeof operationId !== "string" || !operationId) throw new Error("OP_OPERATION_ID_REQUIRED");
  const p = input.payload || input;
  if (!p.startDate) throw new Error("LOAN_START_DATE_REQUIRED");
  if (!p.principal || !p.periods || !p.method) throw new Error("VALIDATION_ERROR");
  const businessDate = p.businessDate || p.startDate;
  const currency = p.currency || baseCurrency;

  bootstrapLoanEditionAccounts(dataDir, currency);

  const schedule = buildSchedule(p.method, {
    principal: p.principal,
    annualRate: p.annualRate || "0",
    periods: p.periods,
    startDate: p.startDate,
    feePercent: p.feePercent,
    dayCount: p.dayCount || "period_based",
  });

  const loanId = p.loanId || randomUUID();
  const settlement = settle({
    finAccountId: cashAccountId,
    counterAccountId: receivableAccountId,
    amount: p.principal,
    side: "credit",
    operationId,
    memo: "loan_disbursement",
  });
  for (const line of settlement.journalLines) line.currency = currency;

  const result = await runAtomicFinancialOperation({
    operationId,
    type: "loan.create",
    dataDir,
    businessDate,
    baseCurrency: currency,
    payload: { ...p, loanId },
    journalLines: settlement.journalLines,
    domainResult: {
      schedule,
      loan: { id: loanId, principal: p.principal, startDate: p.startDate, method: p.method },
    },
    engineVersions: { loanSchedule: "1.0.0-period_based", money: "1.0.0" },
  });

  if (!result.idempotentReplay) {
    const db = openDb(dataDir);
    const now = new Date().toISOString();
    db.prepare(
      `INSERT OR IGNORE INTO ln_loans (
        id, role, calculation_method, principal, currency, interest_rate, status, created_at, start_date
      ) VALUES (?, 'borrowed', ?, ?, ?, ?, 'active', ?, ?)`,
    ).run(loanId, p.method, p.principal, currency, p.annualRate || "0", now, p.startDate);
    try {
      db.prepare(
        `INSERT INTO ln_schedule_snapshots (id, loan_id, version, snapshot_json, effective_from, operation_id)
         VALUES (?, ?, 1, ?, ?, ?)`,
      ).run(randomUUID(), loanId, JSON.stringify(schedule.rows), p.startDate, operationId);
    } catch {
      /* optional */
    }
  }

  return { ...result, loanId };
}
