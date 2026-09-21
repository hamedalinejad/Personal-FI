/** Exact QUERY_CATALOG membership for browser host bridge */
const QUERY_IDS = [
  "accounts.list",
  "accounts.get",
  "accounts.options",
  "money.totals",
  "investments.holdings",
  "meta.book",
  "meta.license",
  "book.get",
  "loans.list",
  "operations.list",
  "reports.trialBalance",
  "reports.balanceSheet",
  "reports.incomeStatement",
  "reports.cashFlow",
  "reports.generalLedger",
  "reports.netWorth",
  "reports.investmentHoldings",
] as const;

export type QueryId = (typeof QUERY_IDS)[number];

export function isQueryId(id: string): boolean {
  return (QUERY_IDS as readonly string[]).includes(id);
}

export { QUERY_IDS };
