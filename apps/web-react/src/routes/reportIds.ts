/** Local mirror of report registry labels for More screen — no new routes */
export const REPORT_IDS = [
  { id: "trialBalance", label: "تراز آزمایشی", queryId: "reports.trialBalance" },
  { id: "balanceSheet", label: "ترازنامه", queryId: "reports.balanceSheet" },
  { id: "incomeStatement", label: "سود و زیان", queryId: "reports.incomeStatement" },
  { id: "cashFlow", label: "جریان وجوه نقد", queryId: "reports.cashFlow" },
  { id: "netWorth", label: "ارزش خالص", queryId: "reports.netWorth" },
  { id: "investmentHoldings", label: "موجودی سرمایه‌گذاری", queryId: "reports.investmentHoldings" },
] as const;
