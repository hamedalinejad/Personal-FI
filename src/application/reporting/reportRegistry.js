/**
 * Report registry — single /more/reports surface (BUG/REQ-P1-17).
 * No new pages; one viewer driven from this list.
 * TWR/MWR/IRR remain DEFERRED.
 */

export const REPORT_REGISTRY = Object.freeze([
  {
    id: "trialBalance",
    label: "تراز آزمایشی",
    labelEn: "Trial Balance",
    queryId: "reports.trialBalance",
    filters: ["asOf"],
    supportsAsOf: true,
    supportsDateRange: false,
    supportsReportCurrency: true,
    format: "table",
  },
  {
    id: "balanceSheet",
    label: "ترازنامه",
    labelEn: "Balance Sheet",
    queryId: "reports.balanceSheet",
    filters: ["asOf", "reportCurrency"],
    supportsAsOf: true,
    supportsDateRange: false,
    supportsReportCurrency: true,
    format: "statement",
  },
  {
    id: "incomeStatement",
    label: "سود و زیان",
    labelEn: "Income Statement",
    queryId: "reports.incomeStatement",
    filters: ["fromDate", "toDate", "reportCurrency"],
    supportsAsOf: false,
    supportsDateRange: true,
    supportsReportCurrency: true,
    format: "statement",
  },
  {
    id: "cashFlow",
    label: "جریان وجوه نقد",
    labelEn: "Cash Flow",
    queryId: "reports.cashFlow",
    filters: ["fromDate", "toDate"],
    supportsAsOf: false,
    supportsDateRange: true,
    supportsReportCurrency: true,
    format: "statement",
  },
  {
    id: "generalLedger",
    label: "دفتر کل",
    labelEn: "General Ledger",
    queryId: "reports.generalLedger",
    filters: ["accountId", "fromDate", "toDate"],
    supportsAsOf: false,
    supportsDateRange: true,
    supportsReportCurrency: false,
    format: "table",
  },
  {
    id: "netWorth",
    label: "ارزش خالص",
    labelEn: "Net Worth",
    queryId: "reports.netWorth",
    filters: ["asOf", "reportCurrency"],
    supportsAsOf: true,
    supportsDateRange: false,
    supportsReportCurrency: true,
    format: "summary",
  },
  {
    id: "investmentHoldings",
    label: "موجودی سرمایه‌گذاری",
    labelEn: "Investment Holdings",
    queryId: "reports.investmentHoldings",
    filters: ["asOf", "reportCurrency"],
    supportsAsOf: true,
    supportsDateRange: false,
    supportsReportCurrency: true,
    format: "table",
  },
  {
    id: "realizedPnl",
    label: "سود/زیان تحقق‌یافته",
    labelEn: "Realized P&L",
    queryId: "investments.realizedPnl",
    filters: ["fromDate", "toDate", "reportCurrency"],
    supportsAsOf: false,
    supportsDateRange: true,
    supportsReportCurrency: true,
    format: "table",
  },
  {
    id: "unrealizedPnl",
    label: "سود/زیان تحقق‌نیافته",
    labelEn: "Unrealized P&L",
    queryId: "investments.valuation",
    filters: ["asOf", "reportCurrency"],
    supportsAsOf: true,
    supportsDateRange: false,
    supportsReportCurrency: true,
    format: "table",
  },
  // DEFERRED: twr, mwr, irr — not listed as working reports
]);

export function getReportById(id) {
  return REPORT_REGISTRY.find((r) => r.id === id) || null;
}

export function listReportIds() {
  return REPORT_REGISTRY.map((r) => r.id);
}
