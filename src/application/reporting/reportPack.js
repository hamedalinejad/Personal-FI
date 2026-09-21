/**
 * Application reporting composition — may import Core reports + Feature public APIs.
 * Must not import feature internal ledger/commands/repositories.
 */
import { coreReportPack } from "../../core/accounting/reports/index.js";
import { getStatement as loanStatement } from "../../features/loan/public-api/index.js";

/**
 * Full product report pack (Core + Loan statement when loanId provided).
 */
export function reportPack(dataDir, opts = {}) {
  const { loanId = null, asOf = null, toDate = null, ...rest } = opts;
  const periodEnd = toDate || asOf;
  const pack = coreReportPack(dataDir, { asOf, toDate, ...rest });
  return {
    ...pack,
    loanStatement: loanId
      ? loanStatement(loanId, { dataDir, asOf: periodEnd })
      : null,
  };
}

export { coreReportPack };
