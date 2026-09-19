/**
 * Phase 7 — Reporting surface. TWR/MWR deferred.
 */
import {
  generalLedger,
  trialBalance,
  balanceSheet,
  incomeStatement,
  cashFlow,
  accountActivity,
} from "./statements.js";
import { investmentHoldings, investmentRealizedPnl } from "./investment.js";
import { getStatement as loanStatement } from "../../../features/loan/reports/statement.js";

export {
  generalLedger,
  trialBalance,
  balanceSheet,
  incomeStatement,
  cashFlow,
  accountActivity,
  investmentHoldings,
  investmentRealizedPnl,
  loanStatement,
};

export function reportPack(dataDir, opts = {}) {
  const {
    asOf = null,
    fromDate = null,
    toDate = null,
    bookBaseCurrency = null,
    valuationContext = null,
    prices = {},
    loanId = null,
  } = opts;
  const periodEnd = toDate || asOf;
  const periodStart = fromDate;
  return {
    asOf: asOf || periodEnd,
    generalLedger: generalLedger(dataDir, { fromDate: periodStart, toDate: periodEnd }),
    trialBalance: trialBalance(dataDir, { asOf: periodEnd, bookBaseCurrency }),
    balanceSheet: balanceSheet(dataDir, { asOf: periodEnd, bookBaseCurrency }),
    incomeStatement: incomeStatement(dataDir, { fromDate: periodStart, toDate: periodEnd }),
    cashFlow: cashFlow(dataDir, { fromDate: periodStart, toDate: periodEnd }),
    investment:
      valuationContext || Object.keys(prices).length
        ? investmentHoldings(dataDir, {
            prices,
            valuationContext: valuationContext || { asOf: periodEnd },
          })
        : null,
    realizedPnl: investmentRealizedPnl(dataDir, { fromDate: periodStart, toDate: periodEnd }),
    loanStatement: loanId ? loanStatement(loanId, { dataDir, asOf: periodEnd }) : null,
    deferred: { TWR: "DEFERRED", MWR: "DEFERRED" },
  };
}
