import { randomUUID } from "node:crypto";
import { runAtomicFinancialOperation } from "../../../core/domain/operation/operationEngine.js";
import { settle } from "../../../core/domain/cash/settlementAdapter.js";
import { toDecimal } from "../../../core/money/canonicalDecimal.js";
import { bootstrapLoanEditionAccounts } from "../../../core/accounting/chartOfAccounts.js";

export async function recordPayment(input, { dataDir, cashAccountId = "LOC-CASH", receivableAccountId = "LOAN-REC", baseCurrency = "IRR" } = {}) {
  const operationId = input.operationId || randomUUID();
  const p = input.payload || input;
  if (!p.loanId || !p.amount) throw new Error("VALIDATION_ERROR");
  toDecimal(p.amount);
  const businessDate = p.businessDate;
  if (!businessDate) throw new Error("OP_BUSINESS_DATE_REQUIRED");
  const currency = p.currency || baseCurrency;

  bootstrapLoanEditionAccounts(dataDir, currency);

  const settlement = settle({
    finAccountId: cashAccountId,
    counterAccountId: receivableAccountId,
    amount: p.amount,
    side: "debit",
    operationId,
    memo: "loan_payment",
  });
  for (const line of settlement.journalLines) {
    line.currency = currency;
  }

  return runAtomicFinancialOperation({
    operationId,
    type: "loan.recordPayment",
    dataDir,
    businessDate,
    baseCurrency: currency,
    payload: p,
    journalLines: settlement.journalLines,
    domainResult: { loanId: p.loanId, amount: p.amount },
    engineVersions: { loanSchedule: "1.0.0-period_based", money: "1.0.0" },
  });
}
