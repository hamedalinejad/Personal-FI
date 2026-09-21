/**
 * Core-owned reporting surface only.
 * Cross-feature composition lives in src/application/reporting/reportPack.js
 * (Core must never import Features — ARCHITECTURE locked).
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

export {
  generalLedger,
  trialBalance,
  balanceSheet,
  incomeStatement,
  cashFlow,
  accountActivity,
  investmentHoldings,
  investmentRealizedPnl,
};

/**
 * Core-only pack (no Loan / feature reports).
 * Prefer application/reporting/reportPack for product surfaces.
 */
export function coreReportPack(dataDir, opts = {}) {
  const {
    asOf = null,
    fromDate = null,
    toDate = null,
    bookBaseCurrency = null,
    valuationContext = null,
    prices = {},
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
    deferred: { TWR: "DEFERRED", MWR: "DEFERRED" },
  };
}
