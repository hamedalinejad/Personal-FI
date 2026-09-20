/**
 * Mirrored QUERY_CATALOG membership for the web package.
 * Must stay in sync with src/application/queryCatalog.js (P1-21).
 * Exact membership only — no prefix heuristics.
 */

const QUERY_IDS = new Set([
  "accounts.list",
  "accounts.get",
  "accounts.options",
  "money.totals",
  "operations.list",
  "operations.get",
  "operations.search",
  "loans.list",
  "loans.get",
  "loans.statement",
  "investments.holdings",
  "investments.realizedPnl",
  "investments.valuation",
  "reports.trialBalance",
  "reports.balanceSheet",
  "reports.incomeStatement",
  "reports.cashFlow",
  "reports.generalLedger",
  "reports.netWorth",
  "reports.investmentHoldings",
  "cheques.list",
  "cheques.get",
  "tax.events",
  "planning.budgets",
  "planning.goals",
  "planning.bills",
  "meta.book",
  "meta.license",
]);

export function isQueryId(id: string): boolean {
  return typeof id === "string" && QUERY_IDS.has(id);
}

export function listQueryIds(): string[] {
  return [...QUERY_IDS];
}
