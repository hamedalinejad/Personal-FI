import { randomUUID } from "node:crypto";
import { runAtomicFinancialOperation } from "../../../core/domain/operation/operationEngine.js";
import { settle } from "../../../core/domain/cash/settlementAdapter.js";
import { toDecimal } from "../../../core/money/canonicalDecimal.js";

/**
 * Minimal payment: full amount to receivable for v1 slice; allocation refined later.
 */
export async function recordPayment(input, { dataDir, cashAccountId = "LOC-CASH", receivableAccountId = "LOAN-REC" } = {}) {
  const operationId = input.operationId || randomUUID();
  const p = input.payload || input;
  if (!p.loanId || !p.amount) throw new Error("VALIDATION_ERROR");
  toDecimal(p.amount);

  const settlement = settle({
    finAccountId: cashAccountId,
    counterAccountId: receivableAccountId,
    amount: p.amount,
    side: "debit",
    operationId,
    memo: "loan_payment",
  });

  return runAtomicFinancialOperation({
    operationId,
    type: "loan.recordPayment",
    dataDir,
    payload: p,
    journalLines: settlement.journalLines,
    domainResult: { loanId: p.loanId, amount: p.amount },
    engineVersions: { loanSchedule: "1.0.0-period_based", money: "1.0.0" },
  });
}
